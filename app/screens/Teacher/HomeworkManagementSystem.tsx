import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
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
import { storage } from '../../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

interface HomeworkStats {
  submitted: number;
  notSubmitted: number;
  total: number;
}

interface Subject {
  id: number;
  name: string;
  description: string;
}

interface FormattedSubject {
  label: string;
  value: string;
}

interface HomeworkResponse {
  id: number;
  description: string;
  teacherId: number;
  homeWorkDate: string;
  imgUrl: string;
  docUrl: string;
  className: string;
  sectionName: string;
  subjectName: string;
}

interface HomeworkStatsResponse {
  sectionId: number;
  sectionName: string;
  className: string;
  totalTeachers: number;
  submittedCount: number;
  pendingCount: number;
  totalStudents: number;
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
  const [homeworkList, setHomeworkList] = useState<HomeworkResponse[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string>('');
  const [showClassPicker, setShowClassPicker] = useState<boolean>(false);
  const [showSectionPicker, setShowSectionPicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<FormattedSubject[]>([]);
  const [homeworkStats, setHomeworkStats] = useState<HomeworkStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );


  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClassesData(),
        loadSubjectsData()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassesData = async () => {
    try {
      setLoading(true);
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) {
        throw new Error('User data not found');
      }

      const { role } = JSON.parse(userData);
      // Get classes based on role
      const classesKey = role === 2 ? 'teacherClasses' : 'schoolClasses';
      const classesData = await SecureStore.getItemAsync(classesKey);

      if (classesData) {
        const parsedData = JSON.parse(classesData);
        setClasses(parsedData || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectsData = async () => {
    try {
      setLoading(true);
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) {
        throw new Error('User data not found');
      }

      const { schoolId } = JSON.parse(userData);

      const response = await fetch(
        `https://13.202.16.149:8080/school/getSchoolSubjects?schoolId=${schoolId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const formattedSubjects: FormattedSubject[] = result.data
          .filter((subject: Subject) => 
            subject && typeof subject.id === 'number' && typeof subject.name === 'string'
          )
          .map((subject: Subject) => ({
            label: subject.name,
            value: String(subject.id)
          }));
        setSubjects(formattedSubjects);
      } else {
        throw new Error(result.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      Alert.alert('Error', 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (): Promise<void> => {
    try {
      setUploadingImage(true);
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const timestamp = Date.now();
        const fileName = uri.split('/').pop() || '';
        const storageRef = ref(storage, `homework/images/${timestamp}_${fileName}`);
        
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);
        
        setImageUri(uri); // For preview
        setImageUrl(downloadUrl); // For API
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const pickDocument = async (): Promise<void> => {
    try {
      setUploadingDoc(true);
      const result = await getDocumentAsync({
        type: '*/*',
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const timestamp = Date.now();
        const fileName = result.assets[0].name;
        const storageRef = ref(storage, `homework/documents/${timestamp}_${fileName}`);
        
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);
        
        setDocumentUri(uri); // For preview
        setDocumentName(fileName);
        setDocUrl(downloadUrl); // For API
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
      console.error(error);
    } finally {
      setUploadingDoc(false);
    }
  };

  const fetchHomeworkList = async () => {
    try {
      setIsLoadingList(true);
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) return;
      
      const { schoolId, teacherId } = JSON.parse(userData);
      const response = await fetch(
        `https://13.202.16.149:8080/school/getHomeWork?schoolId=${schoolId}&sectionId=${selectedSectionId}&teacherId=${teacherId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      if (result.success) {
        setHomeworkList(result.data);
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
      Alert.alert('Error', 'Failed to fetch homework list');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleCreateHomework = async (): Promise<void> => {
    if (!selectedClassId || !selectedSectionId || !selectedSubject || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) return;
      
      let { schoolId, teacherId } = JSON.parse(userData);

      const response = await fetch('https://13.202.16.149:8080/school/createHomeWork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId,
          teacherId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          subjectId: +selectedSubject,
          description,
          imgUrl: imageUrl,
          docUrl: docUrl
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Homework created successfully');
        resetForm();
        fetchHomeworkList();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create homework');
    } finally {
      setLoading(false);
    }
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

  const handleEdit = (homework: HomeworkResponse): void => {
    setEditMode(true);
    setEditingId(homework.id.toString());
    setSelectedClass(homework.className);
    setSelectedSection(homework.sectionName);
    setSelectedSubject(homework.subjectName);
    setDescription(homework.description);
    setImageUri(homework.imgUrl);
    setDocumentUri(homework.docUrl);
  };

  const handleDelete = (id: number): void => {
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

  const fetchHomeworkStats = async () => {
    if (!selectedClassId || !selectedSectionId) {
      return;
    }

    try {
      setStatsLoading(true);
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) {
        return;
      }
      
      const { schoolId } = JSON.parse(userData);
      
      const response = await fetch(
        `https://13.202.16.149:8080/school/getHomeworkStats?schoolId=${schoolId}&sectionId=${selectedSectionId}&classId=${selectedClassId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        const stats = result.data[0];
        setHomeworkStats({
          submitted: stats.submittedCount,
          notSubmitted: stats.pendingCount,
          total: stats.totalStudents
        });
      } else {
        setHomeworkStats({
          submitted: 0,
          notSubmitted: 0,
          total: 0
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch homework statistics');
      setHomeworkStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleClassSelect = (classId: number, className: string): void => {
    setSelectedClassId(classId);
    setSelectedClass(className);
    setSelectedSection('');
    setSelectedSectionId(null);
    setHomeworkStats(null);
    setShowClassPicker(false);
  };

  const handleSectionSelect = (sectionId: number, sectionName: string): void => {
    setSelectedSectionId(sectionId);
    setSelectedSection(sectionName);
    setShowSectionPicker(false);
    setTimeout(() => fetchHomeworkStats(), 100);
  };

  const getSelectedClassSections = () => {
    if (!selectedClassId) return [];
    const selectedClass = classes.find(cls => cls.id === selectedClassId);
    return selectedClass?.sections || [];
  };

  const renderStatsGrid = () => {
    if (!selectedClassId || !selectedSectionId) {
      return (
        <View style={styles.emptyStatsContainer}>
          <Text style={styles.emptyStatsText}>
            Select class and section to view homework statistics
          </Text>
        </View>
      );
    }

    if (statsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      );
    }

    if (!homeworkStats) {
      return (
        <View style={styles.emptyStatsContainer}>
          <Text style={styles.emptyStatsText}>
            No statistics available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsHeader}>
          Homework Statistics for Class {selectedClass} - Section {selectedSection}
        </Text>
        <View style={styles.statsGrid}>
          <Surface style={[styles.statsCard, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statsNumber}>{homeworkStats.submitted}</Text>
            <Text style={styles.statsLabel}>Submitted</Text>
          </Surface>
          <Surface style={[styles.statsCard, { backgroundColor: '#F44336' }]}>
            <Text style={styles.statsNumber}>{homeworkStats.notSubmitted}</Text>
            <Text style={styles.statsLabel}>Pending</Text>
          </Surface>
          <Surface style={[styles.statsCard, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.statsNumber}>{homeworkStats.total}</Text>
            <Text style={styles.statsLabel}>Total Students</Text>
          </Surface>
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (selectedSectionId) {
      fetchHomeworkList();
    }
  }, [selectedSectionId]);

  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      fetchHomeworkStats();
    }
  }, [selectedClassId, selectedSectionId]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
  };

  const renderSubmitButton = () => {
    return (
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleCreateHomework}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Homework</Text>
        )}
      </TouchableOpacity>
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
            {formatDate(selectedDate)}
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
              onValueChange={handleSubjectChange}
              style={styles.picker}
            >
              <Picker.Item label="Select Subject" value="" />
              {subjects.map(subject => (
                <Picker.Item
                  key={subject.value}
                  label={subject.label}
                  value={subject.value}
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

        <View style={styles.formContainer}>
          {renderSubmitButton()}
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Today's Homework</Text>
          {isLoadingList ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading homework...</Text>
            </View>
          ) : homeworkList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No homework assigned yet</Text>
            </View>
          ) : (
            homeworkList.map(homework => (
              <View key={homework.id} style={styles.homeworkCard}>
                <View style={styles.homeworkInfo}>
                  <Text style={styles.homeworkClass}>
                    Class {homework.className} - Section {homework.sectionName}
                  </Text>
                  <Text style={styles.homeworkSubject}>{homework.subjectName}</Text>
                  <Text style={styles.homeworkDescription}>
                    {homework.description}
                  </Text>
                  {homework.imgUrl && (
                    <Image
                      source={{ uri: homework.imgUrl }}
                      style={styles.homeworkImage}
                    />
                  )}
                  {homework.docUrl && (
                    <View style={styles.attachedDocument}>
                      <FontAwesome name="file-text" size={20} color="#4A90E2" />
                      <Text style={styles.attachedDocumentName}>
                        Attached Document
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
            ))
          )}
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
                    key={`class-${cls.id}`}
                    style={styles.pickerItem}
                    onPress={() => handleClassSelect(cls.id, cls.name)}
                  >
                    <Text style={styles.pickerItemText}>Class {cls.name}</Text>
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
                {getSelectedClassSections().map(section => (
                  <TouchableOpacity
                    key={`section-${section.id}`}
                    style={styles.pickerItem}
                    onPress={() => handleSectionSelect(section.id, section.name)}
                  >
                    <Text style={styles.pickerItemText}>Section {section.name}</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    statsContainer: {
      padding: 16,
      backgroundColor: '#fff',
      borderRadius: 12,
      marginBottom: 20,
    },
    statsHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: 16,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
      gap: 12,
    },
    statsCard: {
      flex: 1,
      minWidth: 100,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 2,
    },
    statsNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 4,
    },
    statsLabel: {
      fontSize: 12,
      color: '#fff',
      opacity: 0.9,
    },
    emptyStatsContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      borderRadius: 12,
      marginBottom: 20,
    },
    emptyStatsText: {
      color: '#6b7280',
      fontSize: 14,
      textAlign: 'center',
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
    dateButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
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
    documentName: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    removeDocument: {
        padding: 8,
        borderRadius: 20,
    },
    loadingText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        marginBottom: 24,
    },
    disabledButton: {
        opacity: 0.7,
    },
});

export default TeacherHomeworkManager;