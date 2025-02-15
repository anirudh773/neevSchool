import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { DocumentPickerOptions, getDocumentAsync } from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import { storage } from '../../firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

interface Qualifications {
  id: number;
  name: string;
}
interface Subjects {
  id: number;
  name: string;
}

const RegisterTeacher: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPrimarySubjectPicker, setShowPrimarySubjectPicker] = useState(false);
  const [showSubstituteSubjectPicker, setShowSubstituteSubjectPicker] = useState(false);
  const [showQualificationPicker, setShowQualificationPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [qualifications, setQualifications] = useState<Qualifications[]>([]);
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  
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

  useEffect(() => {
    if(qualifications.length === 0){
      loadExamMaterData();
    }
  }, []);

  const loadExamMaterData = async () => {
    try {
      setLoading(true);
      let [schoolQualification, schoolSubject] = await Promise.all([
        SecureStore.getItemAsync('qualification'),
        SecureStore.getItemAsync('subjectBySchool')
      ]);
      
      if (schoolQualification && schoolSubject) {
        const parsedQualification = JSON.parse(schoolQualification);
        const parsedSubject = JSON.parse(schoolSubject);
        if (parsedQualification.length > 0 && parsedSubject.length > 0) {
          setQualifications(parsedQualification);
          setSubjects(parsedSubject);
          return;
        }
      }

      const response = await fetch(`https://testcode-2.onrender.com/school/getExamMasterData?schoolId=1`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      await Promise.all([
        SecureStore.setItemAsync('qualification', JSON.stringify(data.data.qualification)),
        SecureStore.setItemAsync('subjectBySchool', JSON.stringify(data.data.subjectBySchool))
      ]);
      setQualifications(data.data.qualification);
      setSubjects(data.data.subjectBySchool);
    } catch (err) {
      Alert.alert('Error', 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

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
    if (formData.primarySubjectId === formData.substituteSubjectId) {
      Alert.alert('Error', 'Primary and Substitute subjects cannot be the same');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    try {
      const options = {
        type: ['image/*', 'application/pdf'],
      };
      
      const result = await getDocumentAsync(options);
  
      if (!result.canceled && result.assets?.[0]) {
        setDocLoading(true);
        
        // Get the file name and extension
        const uri = result.assets[0].uri;
        const fileName = uri.split('/').pop();
        const timestamp = Date.now();
        const uniqueFileName = `resumes/${timestamp}_${fileName}`;
  
        // Create a reference to the file location
        const storageRef = ref(storage, uniqueFileName);
  
        // Convert URI to Blob
        const response = await fetch(uri);
        const blob = await response.blob();
  
        // Upload the file
        const snapshot = await uploadBytes(storageRef, blob);
        
        // Get the download URL
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        // Update form data with the download URL
        handleInputChange('resumeUrl', downloadUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload resume. Please try again.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const date = new Date(formData.joiningDate);
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).split('/').join('-');

      const dataToSubmit = {
        ...formData,
        joiningDate: formattedDate
      };

      const response = await fetch('https://testcode-2.onrender.com/school/addTeacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert(
          'Success',
          'Teacher registered successfully!',
          [{ text: 'OK', onPress: () =>  router.push('/screens/listTeacherss')} ]
        );
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to register teacher');
    } finally {
      setIsLoading(false);
    }
  };

  const SubjectPickerModal = ({ 
    visible, 
    onClose, 
    onSelect, 
    title 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    onSelect: (id: number) => void;
    title: string;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={styles.modalItem}
              onPress={() => {
                onSelect(subject.id);
                onClose();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>Loading Master data...</Text>
      </View>
    );
  }

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

          <TouchableOpacity onPress={() => setShowPrimarySubjectPicker(true)}>
            <TextInput
              label="Primary Subject"
              value={subjects.find(s => s.id === formData.primarySubjectId)?.name}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowSubstituteSubjectPicker(true)}>
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
              label="Teacher highest qualification"
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
            {docLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
               <FontAwesome name="upload" size={20} color="#fff" />
               <Text style={styles.uploadText}>Upload Resume</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Register Teacher</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SubjectPickerModal 
        visible={showPrimarySubjectPicker}
        onClose={() => setShowPrimarySubjectPicker(false)}
        onSelect={(id) => handleInputChange('primarySubjectId', id)}
        title="Select Primary Subject"
      />

      <SubjectPickerModal 
        visible={showSubstituteSubjectPicker}
        onClose={() => setShowSubstituteSubjectPicker(false)}
        onSelect={(id) => handleInputChange('substituteSubjectId', id)}
        title="Select Substitute Subject"
      />

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
    marginBottom: 32,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  }
});

export default RegisterTeacher;