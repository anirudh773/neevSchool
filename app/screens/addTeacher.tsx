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

const truncateFileName = (fileName: string, maxLength: number = 25) => {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  
  const truncatedName = nameWithoutExt.substring(0, maxLength - 5); // -5 for "..." and some of extension
  return `${truncatedName}...${extension}`;
};

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
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
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
      // Get user data for schoolId
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }
      
      // Parse user data and get schoolId
      const userData: { schoolId: number } = JSON.parse(userDataStr);
      if (!userData.schoolId) {
        throw new Error('School ID not found');
      }

      // Check if we already have cached data
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

      // If no cached data, fetch from API
      const response = await fetch(
        `http://13.202.16.149:8080/school/getExamMasterData?schoolId=${userData.schoolId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();

      if (data.success) {
        await Promise.all([
          SecureStore.setItemAsync('qualification', JSON.stringify(data.data.qualification)),
          SecureStore.setItemAsync('subjectBySchool', JSON.stringify(data.data.subjectBySchool))
        ]);
        setQualifications(data.data.qualification);
        setSubjects(data.data.subjectBySchool);
      } else {
        throw new Error(data.message || 'Failed to load master data');
      }
    } catch (err) {
      console.error('Error loading master data:', err);
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
        setShowResumeModal(true);
        setSelectedFileName(result.assets[0].name);
        setUploadStatus('uploading');
        
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
        setUploadStatus('success');
        
        // Close modal after 2 seconds on success
        setTimeout(() => {
          setShowResumeModal(false);
          setUploadStatus('idle');
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      Alert.alert('Error', 'Failed to upload resume. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }
      const userData = JSON.parse(userDataStr);

      const date = new Date(formData.joiningDate);
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).split('/').join('-');

      const dataToSubmit = {
        ...formData,
        joiningDate: formattedDate,
        schoolId: userData.schoolId // Use dynamic schoolId here
      };

      const response = await fetch('http://13.202.16.149:8080/school/addTeacher', {
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {subjects.map(subject => (
              <TouchableOpacity
                key={subject.id}
                style={styles.modalItem}
                onPress={() => {
                  onSelect(subject.id);
                  onClose();
                }}
              >
                <Text style={styles.modalItemText}>{subject.name}</Text>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Qualification</Text>
            <TouchableOpacity 
              onPress={() => setShowQualificationPicker(false)} 
              style={styles.closeButton}
            >
              <FontAwesome name="times" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {qualifications.map(qualification => (
              <TouchableOpacity
                key={qualification.id}
                style={styles.modalItem}
                onPress={() => {
                  handleInputChange('qualifications', qualification.id);
                  setShowQualificationPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{qualification.name}</Text>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const ResumeUploadModal = () => (
    <Modal
      visible={showResumeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowResumeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.resumeModalContent}>
          <View style={styles.resumeModalHeader}>
            <Text style={styles.modalTitle}>Resume Upload</Text>
            {uploadStatus !== 'uploading' && (
              <TouchableOpacity 
                onPress={() => setShowResumeModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={24} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.resumeModalBody}>
            <FontAwesome 
              name={uploadStatus === 'success' ? 'check-circle' : 'file-pdf-o'} 
              size={40} 
              color={uploadStatus === 'success' ? '#4CAF50' : '#666'} 
            />
            <Text style={styles.fileName}>{selectedFileName}</Text>
            {uploadStatus === 'uploading' && (
              <ActivityIndicator size="large" color="#007AFF" style={styles.uploadingIndicator} />
            )}
            {uploadStatus === 'success' && (
              <Text style={styles.successText}>Upload Successful!</Text>
            )}
            {uploadStatus === 'error' && (
              <Text style={styles.errorText}>Upload Failed. Please try again.</Text>
            )}
          </View>
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
            {/* <TouchableOpacity 
              onPress={() => router.push('/(tab)')}
              style={styles.backButton}
            >
              <FontAwesome name="arrow-left" size={24} color="#000" />
            </TouchableOpacity> */}
            {/* <Text style={styles.headerText}>Teacher Registration</Text> */}

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

          <TouchableOpacity 
            onPress={() => setShowPrimarySubjectPicker(true)}
            style={styles.dropdownContainer}
          >
            <TextInput
              label="Primary Subject"
              value={subjects.find(s => s.id === formData.primarySubjectId)?.name}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon 
                  icon="chevron-down" 
                  onPress={() => setShowPrimarySubjectPicker(true)}
                />
              }
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowSubstituteSubjectPicker(true)}
            style={styles.dropdownContainer}
          >
            <TextInput
              label="Substitute Subject"
              value={subjects.find(s => s.id === formData.substituteSubjectId)?.name}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon 
                  icon="chevron-down" 
                  onPress={() => setShowSubstituteSubjectPicker(true)}
                />
              }
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowQualificationPicker(true)}
            style={styles.dropdownContainer}
          >
            <TextInput
              label="Teacher highest qualification"
              value={qualifications.find(s => s.id === formData.qualifications)?.name}
              editable={false}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon 
                  icon="chevron-down" 
                  onPress={() => setShowQualificationPicker(true)}
                />
              }
            />
          </TouchableOpacity>

          {formData.resumeUrl && (
            <View style={styles.selectedFileContainer}>
              <View style={styles.selectedFileContent}>
                <FontAwesome name="file-pdf-o" size={20} color="#666" />
                <View style={styles.fileNameContainer}>
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {truncateFileName(selectedFileName)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.removeFileButton}
                onPress={() => {
                  handleInputChange('resumeUrl', '');
                  setSelectedFileName('');
                }}
              >
                <FontAwesome name="times-circle" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUpload}
          >
            {docLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
               <FontAwesome name="upload" size={20} color="#fff" />
               <Text style={styles.uploadText}>
                 {formData.resumeUrl ? 'Change Resume' : 'Upload Resume'}
               </Text>
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
      <ResumeUploadModal />
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
    backgroundColor: '#555',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalScroll: {
    maxHeight: '70%',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItem: {
    backgroundColor: '#f0f9ff',
  },
  selectedItemText: {
    color: '#007AFF',
    fontWeight: '500',
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
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  resumeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  resumeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  resumeModalBody: {
    alignItems: 'center',
    padding: 20,
  },
  fileName: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadingIndicator: {
    marginTop: 16,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxWidth: '100%',
  },
  selectedFileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  fileNameContainer: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  selectedFileName: {
    fontSize: 14,
    color: '#333',
    width: '100%',
  },
  removeFileButton: {
    padding: 4,
    width: 28,
    alignItems: 'center',
  },
});

export default RegisterTeacher;