import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

type TeacherData = {
  name: string;
  mobileNumber: string;
  email: string;
  resumeUrl: string;
  primarySubjectId: number;
  substituteSubjectId: number;
  qualifications: number;
  joiningDate: string;
  schoolId: number;
};

const subjects = [
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Science' },
  { id: 3, name: 'English' },
  { id: 4, name: 'Social Studies' }
];

const qualifications = [
  { id: 1, name: 'B.Ed' },
  { id: 2, name: 'M.Ed' },
  { id: 3, name: 'PhD' }
];

const RegisterTeacher: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showQualificationPicker, setShowQualificationPicker] = useState(false);
  
  const [formData, setFormData] = useState<TeacherData>({
    name: '',
    mobileNumber: '',
    email: '',
    resumeUrl: '',
    primarySubjectId: 1,
    substituteSubjectId: 2,
    qualifications: 1,
    joiningDate: new Date().toISOString().split('T')[0],
    schoolId: 1,
  });

  const handleInputChange = (name: keyof TeacherData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.mobileNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });

      if (!result.canceled && result.assets?.[0]) {
        handleInputChange('resumeUrl', result.assets[0].uri);
        Alert.alert('Success', 'Resume uploaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload resume');
    }
  };

  const handleSubmit = async () => {
    console.log('clicked')
    if (!validateForm()){
      console.log('Form is not valid')
      return;
    }
    console.log(formData)
    setIsLoading(true);
    try {
      console.log('clicked')
      const date = new Date(formData.joiningDate);

      const day = date.getDate().toString().padStart(2, '0'); // Get day and pad with leading zero if needed
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get month (0-based, so add 1) and pad
      const year = date.getFullYear(); // Get full year

      const formattedDate = `${day}-${month}-${year}`;
      formData.joiningDate = formattedDate
      const response = await fetch('https://testcode-2.onrender.com/school/addTeacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log(data)
      if (response.ok && data.success) {
        Alert.alert(
          'Success',
          'Teacher registered successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        setIsLoading(false);
        throw new Error('Registration failed');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to register teacher');
    } finally {
      setIsLoading(false);
    }
  };

  const SubjectPickerModal = () => (
    <Modal
      visible={showSubjectPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSubjectPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Subject</Text>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={styles.modalItem}
              onPress={() => {
                handleInputChange('primarySubjectId', subject.id);
                setShowSubjectPicker(false);
              }}
            >
              <Text>{subject.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const QualificationPickerModal = () => (
    <Modal
      visible={showQualificationPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowQualificationPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Qualification</Text>
          {qualifications.map(qualification => (
            <TouchableOpacity
              key={qualification.id}
              style={styles.modalItem}
              onPress={() => {
                handleInputChange('qualifications', qualification.id);
                setShowQualificationPicker(false);
              }}
            >
              <Text>{qualification.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.push('/(tab)')}
              style={styles.backButton}
            >
              <FontAwesome name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Teacher Registration</Text>

            <TouchableOpacity onPress={() => router.push('/screens/listTeacherss')}>
              <FontAwesome name="list" size={24} color="#000" />
              <Text>View All</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            label="Full Name"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Mobile Number"
            value={formData.mobileNumber}
            onChangeText={(text) => handleInputChange('mobileNumber', text)}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
            mode="outlined"
          />

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              label="Joining Date"
              value={formData.joiningDate}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="calendar" />}
            />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(formData.joiningDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  handleInputChange(
                    'joiningDate',
                    selectedDate.toISOString().split('T')[0]
                  );
                }
              }}
            />
          )}

          <TouchableOpacity onPress={() => setShowSubjectPicker(true)}>
            <TextInput
              label="Primary Subject"
              value={subjects.find(s => s.id === formData.primarySubjectId)?.name}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowSubjectPicker(true)}>
            <TextInput
              label="Substitute Subject"
              value={subjects.find(s => s.id === formData.substituteSubjectId)?.name}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowQualificationPicker(true)}>
            <TextInput
              label="Teacher higest qualification"
              value={qualifications.find(s => s.id === formData.qualifications)?.name}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUpload}
          >
            <FontAwesome name="upload" size={20} color="#fff" />
            <Text style={styles.uploadText}>Upload Resume</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <FontAwesome name="spinner" size={20} color="#fff" />
            ) : (
              <Text style={styles.submitText}>Register Teacher</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SubjectPickerModal />
      <QualificationPickerModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default RegisterTeacher;