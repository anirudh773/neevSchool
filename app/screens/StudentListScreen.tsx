import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: number;
  admissionDate: string;
  parentName: string;
  parentContact: string;
  address: string;
  email: string;
  aadhaarNumber: string;
  section: {
    id: number;
    name: string
  };
  class: {
    id: number;
    name: string;
  };
}

const StudentListScreen = () => {
  const router = useRouter();
  const { classId, sectionId, className, sectionName } = useLocalSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'dob' | 'admission'>('dob');

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://13.202.16.149:8080/school/getStudentBySection?sectionId=${sectionId}`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch students');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent) return;
    let obj = {
      aadhaarNumber: selectedStudent.aadhaarNumber,
      firstName: selectedStudent.firstName,
      lastName: selectedStudent.lastName,
      schoolId: 1,
      dateOfBirth: selectedStudent.dateOfBirth,
      gender: selectedStudent.gender,
      sectionsId: +sectionId,
      admissionDate: selectedStudent.admissionDate,
      parentName: selectedStudent.parentName,
      address: selectedStudent.address,
      email: selectedStudent.email
    }
    console.log(obj, selectedStudent.id)

    try {
      setLoading(true);
      const response = await fetch(`http://13.202.16.149:8080/school/updateStudent?studentId=${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj),
      });

      console.log(response)
      if (response.ok) {
        Alert.alert('Success', 'Student updated successfully');
        setEditModalVisible(false);
        fetchStudents();
      } else {
        setLoading(false);
        setEditModalVisible(false);
        Alert.alert('Error', 'Failed to update student');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to update student');
    } finally {
      setEditModalVisible(false);
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete ❌',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`http://13.202.16.149:8080/school/updateStudent?studentId=${studentId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({isActive: false}),
              });

              if (response.ok) {
                Alert.alert('Success', 'Student deleted successfully');
                fetchStudents();
              } else {
                Alert.alert('Error', 'Failed to delete student');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete student');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && selectedStudent) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setSelectedStudent({
        ...selectedStudent,
        [dateType === 'dob' ? 'dateOfBirth' : 'admissionDate']: formattedDate,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Edit Student</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={selectedStudent?.firstName}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, firstName: text } : null)
                }
                placeholder="First Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={selectedStudent?.lastName}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, lastName: text } : null)
                }
                placeholder="Last Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setDateType('dob');
                  setShowDatePicker(true);
                }}
              >
                <Text>{selectedStudent?.dateOfBirth ? formatDate(selectedStudent.dateOfBirth) : ''}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parent Name</Text>
              <TextInput
                style={styles.input}
                value={selectedStudent?.parentName}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, parentName: text } : null)
                }
                placeholder="Parent Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parent Contact</Text>
              <TextInput
                style={styles.input}
                value={selectedStudent?.parentContact}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, parentContact: text } : null)
                }
                keyboardType="phone-pad"
                placeholder="Parent Contact"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={selectedStudent?.email}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, email: text } : null)
                }
                keyboardType="email-address"
                placeholder="Email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={selectedStudent?.address}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, address: text } : null)
                }
                multiline
                numberOfLines={3}
                placeholder="Address"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleEditStudent}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      {showDatePicker && (
        <DateTimePicker
          value={new Date(selectedStudent?.dateOfBirth || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </Modal>
  );

  const renderStudent = (student: Student) => (
    <View key={student.id} style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.avatarText}>
              {student.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>
            {student.firstName} {student.lastName}
          </Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
          <Text style={styles.studentClass}>Class: {student.class.name} Section: {sectionName}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => {
            setSelectedStudent(student);
            setEditModalVisible(true);
          }}
          style={[styles.actionButton, styles.editButton]}
        >
          <FontAwesome name="edit" size={16} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteStudent(student.id)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <FontAwesome name="trash" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Students</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push({
            pathname: '/screens/AddStudentScreen',
            params: { classId, sectionId, className, sectionName }
          })}
        >
          <FontAwesome name="plus" size={16} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.studentList}>
          {students.length > 0 ? (
            students.map(renderStudent)
          ) : (
            <View style={styles.noStudentsContainer}>
              <FontAwesome name="users" size={48} color="#cbd5e1" />
              <Text style={styles.noStudentsText}>No students added yet</Text>
              <Text style={styles.noStudentsSubText}>
                Tap the Add Student button to add your first student
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderEditModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  studentList: {
    padding: 16,
    gap: 12,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  placeholderAvatar: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
  },
  studentDetails: {
    gap: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  studentClass: {
    fontSize: 14,
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  noStudentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  noStudentsText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 16,
  },
  noStudentsSubText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default StudentListScreen;