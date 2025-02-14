import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { getDocumentAsync } from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityIndicator, Surface } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';

interface HomeworkItem {
  id: string;
  class: string;
  section: string;
  subject: string;
  date: Date;
  description: string;
  imageUri?: string;
  documentUri?: string;
  documentName?: string;
}

interface PickerItemProps {
  label: string;
  value: string;
}

interface Section {
    id: number;
    name: string;
  }

interface Class {
    id: number;
    name: string;
    sections: Section[];
  }

const TeacherHomeworkManager: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [description, setDescription] = useState<string>('');
  const [imageUri, setImageUri] = useState<string>('');
  const [documentUri, setDocumentUri] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string>('');
  const [showClassPicker, setShowClassPicker] = useState<boolean>(false);
  const [showSectionPicker, setShowSectionPicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

//   const classes: PickerItemProps[] = [
//     { label: 'Class 6', value: '6' },
//     { label: 'Class 7', value: '7' },
//     { label: 'Class 8', value: '8' },
//   ];

  const sections: PickerItemProps[] = [
    { label: 'Section A', value: 'A' },
    { label: 'Section B', value: 'B' },
    { label: 'Section C', value: 'C' },
  ];

  const subjects: PickerItemProps[] = [
    { label: 'Mathematics', value: 'math' },
    { label: 'Science', value: 'science' },
    { label: 'English', value: 'english' },
  ];
  useFocusEffect(
    useCallback(() => {
      loadClassesData();
    }, [])
  );


  const loadClassesData = async () => {
    try {
      setLoading(true);
      const classesData = await SecureStore.getItemAsync('schoolClasses');
      if (classesData) {
        const parsedData = JSON.parse(classesData);
        setClasses(parsedData || []);
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (): Promise<void> => {
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickDocument = async (): Promise<void> => {
    try {
      const result = await getDocumentAsync({
        type: '*/*',
        multiple: false,
      });

      if (result.type === 'success') {
        setDocumentUri(result.uri);
        setDocumentName(result.name);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Document picking error:', err);
    }
  };

  const handleCreateHomework = (): void => {
    if (!selectedClass || !selectedSection || !selectedSubject || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const newHomework: HomeworkItem = {
      id: editMode ? editingId : Date.now().toString(),
      class: selectedClass,
      section: selectedSection,
      subject: selectedSubject,
      date: selectedDate,
      description,
      imageUri,
      documentUri,
      documentName,
    };

    if (editMode) {
      setHomeworkList(prevList =>
        prevList.map(item => (item.id === editingId ? newHomework : item))
      );
      setEditMode(false);
      setEditingId('');
    } else {
      setHomeworkList(prevList => [...prevList, newHomework]);
    }

    resetForm();
  };

  const resetForm = (): void => {
    setSelectedClass('');
    setSelectedSection('');
    setSelectedSubject('');
    setSelectedDate(new Date());
    setDescription('');
    setImageUri('');
    setDocumentUri('');
    setDocumentName('');
  };

  const handleEdit = (homework: HomeworkItem): void => {
    setEditMode(true);
    setEditingId(homework.id);
    setSelectedClass(homework.class);
    setSelectedSection(homework.section);
    setSelectedSubject(homework.subject);
    setSelectedDate(homework.date);
    setDescription(homework.description);
    setImageUri(homework.imageUri || '');
    setDocumentUri(homework.documentUri || '');
    setDocumentName(homework.documentName || '');
  };

  const handleDelete = (id: string): void => {
    Alert.alert(
      'Delete Homework',
      'Are you sure you want to delete this homework?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setHomeworkList(prevList => prevList.filter(item => item.id !== id));
          },
        },
      ]
    );
  };

  const renderStatsGrid = () => {
    let homeWorkStats = {
      teacherSubmitHomeWork: 2,
      teacherNotSubmitted: 2
    };

    if (!homeWorkStats) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    const stats = {
      teacherSubmitHomeWork: homeWorkStats.teacherSubmitHomeWork ?? 0,
      teacherNotSubmitted: homeWorkStats.teacherNotSubmitted ?? 0
    };

    return (
      <View style={styles.statsGrid}>
        <Surface style={[styles.statsCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.statsNumber}>{stats.teacherSubmitHomeWork}</Text>
          <Text style={styles.statsLabel}>Teacher's Submited</Text>
        </Surface>
        <Surface style={[styles.statsCard, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.statsNumber}>{stats.teacherNotSubmitted}</Text>
          <Text style={styles.statsLabel}>Teachers's not Submitted</Text>
        </Surface>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>

      {/* <View style={styles.card}> */}
        {renderStatsGrid()}

        <View style={styles.dateContainer}>
        <Text style={styles.label}>Date</Text>
        <View style={styles.dateDisplay}>
            <Text style={styles.dateButtonText}>
            {selectedDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })}
            </Text>
        </View>
        </View>
        {/* {renderHeader()} */}
        <Text style={styles.header}>Create Homework</Text>

        <View style={styles.selectors}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowClassPicker(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedClass ? `Class ${selectedClass}` : 'Select Class'}
            </Text>
            <FontAwesome name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdown, !selectedClass && styles.dropdownDisabled]}
            onPress={() => selectedClass && setShowSectionPicker(true)}
            disabled={!selectedClass}
          >
            <Text style={styles.dropdownText}>
              {selectedSection ? `Section ${selectedSection}` : 'Select Section'}
            </Text>
            <FontAwesome name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Subject</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedSubject}
              onValueChange={setSelectedSubject}
              style={styles.picker}
            >
              <Picker.Item label="Select Subject" value="" />
              {subjects.map(item => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Homework Description</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter homework details..."
          />
        </View>

        <View style={styles.imageContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <FontAwesome name="image" size={24} color="#4A90E2" />
            <Text style={styles.imageButtonText}>Add Image</Text>
          </TouchableOpacity>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => setImageUri('')}
              >
                <FontAwesome name="times" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.documentContainer}>
          <TouchableOpacity style={styles.documentButton} onPress={pickDocument}>
            <FontAwesome name="file" size={24} color="#4A90E2" />
            <Text style={styles.documentButtonText}>Add Document</Text>
          </TouchableOpacity>
          {documentName ? (
            <View style={styles.documentPreview}>
              <FontAwesome name="file-text" size={24} color="#4A90E2" />
              <Text style={styles.documentName}>{documentName}</Text>
              <TouchableOpacity
                style={styles.removeDocument}
                onPress={() => {
                  setDocumentUri('');
                  setDocumentName('');
                }}
              >
                <FontAwesome name="times" size={20} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCreateHomework}
        >
          <Text style={styles.submitButtonText}>
            {editMode ? 'Update Homework' : 'Create Homework'}
          </Text>
        </TouchableOpacity>

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Today's Homework</Text>
          {homeworkList.map(homework => (
            <View key={homework.id} style={styles.homeworkCard}>
              <View style={styles.homeworkInfo}>
                <Text style={styles.homeworkClass}>
                  Class {homework.class} - Section {homework.section}
                </Text>
                <Text style={styles.homeworkSubject}>{homework.subject}</Text>
                <Text style={styles.homeworkDescription}>
                  {homework.description}
                </Text>
                {homework.imageUri && (
                  <Image
                    source={{ uri: homework.imageUri }}
                    style={styles.homeworkImage}
                  />
                )}
                {homework.documentName && (
                  <View style={styles.attachedDocument}>
                    <FontAwesome name="file-text" size={20} color="#4A90E2" />
                    <Text style={styles.attachedDocumentName}>
                      {homework.documentName}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(homework)}
                >
                  <FontAwesome name="edit" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(homework.id)}
                >
                  <FontAwesome name="trash" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <Modal
          visible={showClassPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowClassPicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Select Class</Text>
              <ScrollView>
                {classes.map(cls => (
                  <TouchableOpacity
                    key={cls.name}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedClass(cls.name);
                      setSelectedSection('');
                      setShowClassPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>Class:- {cls.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowClassPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showSectionPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSectionPicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Select Section</Text>
              <ScrollView>
                {sections.map(section => (
                  <TouchableOpacity
                    key={section.value}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedSection(section.value);
                      setShowSectionPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{section.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSectionPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
      },
      content: {
        padding: 20,
      },
      header: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A237E',
        marginVertical: 24,
        textAlign: 'center',
      },
      statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
      },
      statsCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      statsNumber: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
      },
      statsLabel: {
        fontSize: 14,
        color: '#fff',
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '600',
      },
      selectors: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12,
      },
      dropdown: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E3E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      dropdownText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
      },
      dropdownDisabled: {
        opacity: 0.6,
        backgroundColor: '#F5F5F5',
      },
      dateContainer: {
        marginBottom: 20,
        justifyContent: 'center'
      },
      label: {
        fontSize: 16,
        fontWeight: '600',
        justifyContent: 'center',
        color: '#1A237E',
        marginBottom: 8,
      },
      dateDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E3E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0.9 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      pickerContainer: {
        marginBottom: 20,
      },
      pickerWrapper: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E3E8F0',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      picker: {
        height: 50,
      },
      inputContainer: {
        marginBottom: 20,
      },
      textArea: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E3E8F0',
        padding: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      imageContainer: {
        marginBottom: 20,
      },
      imageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E3E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      imageButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#1A237E',
        fontWeight: '600',
      },
      previewContainer: {
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
      },
      preview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
      },
      removeImage: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        padding: 8,
      },
      documentContainer: {
        marginBottom: 20,
      },
      documentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E3E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      documentButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#1A237E',
        fontWeight: '600',
      },
      documentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
      },
      submitButton: {
        backgroundColor: '#1A237E',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 24,
        shadowColor: '#1A237E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
      submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
      },
      listContainer: {
        marginBottom: 24,
      },
      listHeader: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A237E',
        marginBottom: 16,
      },
      homeworkCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
      homeworkInfo: {
        flex: 1,
        marginRight: 16,
      },
      homeworkClass: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A237E',
        marginBottom: 6,
      },
      homeworkSubject: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
      },
      homeworkDescription: {
        fontSize: 15,
        color: '#333',
        marginBottom: 12,
        lineHeight: 22,
      },
      homeworkImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginTop: 12,
      },
      actionButtons: {
        flexDirection: 'row',
        gap: 8,
      },
      actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      editButton: {
        backgroundColor: '#1A237E',
      },
      deleteButton: {
        backgroundColor: '#DC2626',
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      pickerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '85%',
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
      pickerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A237E',
        marginBottom: 16,
        textAlign: 'center',
      },
      pickerItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E3E8F0',
      },
      pickerItemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
      },
      cancelButton: {
        marginTop: 16,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
      },
      cancelButtonText: {
        fontSize: 16,
        color: '#1A237E',
        fontWeight: '600',
      }, 
       attachedDocument: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
      },
      attachedDocumentName: {
        marginLeft: 8,
        fontSize: 14,
        color: '#2C3E50',
        flex: 1,
      },
});

export default TeacherHomeworkManager;