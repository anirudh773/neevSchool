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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

interface Section {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

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
  section: Section;
  class: Class;
  bloodGroup: number | null;
  height: string | null;
  weight: string | null;
  motherName: string | null;
  isStudentNew: boolean;
}

interface RouteParams {
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
}

const getAvatarColor = (name: string): string => {
  const colors = [
    '#4f46e5', '#0891b2', '#4338ca', '#7c3aed', 
    '#0284c7', '#2563eb', '#4f46e5', '#6366f1'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

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
      const response = await fetch(`https://neevschool.sbs/school/getStudentBySection?sectionId=${sectionId}`);
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
      email: selectedStudent.email,
      bloodGroup: selectedStudent.bloodGroup || 1,
      height: selectedStudent.height || '',
      weight: selectedStudent.weight || '',
      motherName: selectedStudent.motherName || '',
      isStudentNew: selectedStudent.isStudentNew
    }

    try {
      setLoading(true);
      const response = await fetch(`https://neevschool.sbs/school/updateStudent?studentId=${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj),
      });

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
              const response = await fetch(`https://neevschool.sbs/school/updateStudent?studentId=${studentId}`, {
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group (Optional)</Text>
              <View style={styles.bloodGroupContainer}>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((group, index) => (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.bloodGroupButton,
                      selectedStudent?.bloodGroup === index + 1 && styles.bloodGroupButtonActive
                    ]}
                    onPress={() => 
                      setSelectedStudent(prev => 
                        prev ? { ...prev, bloodGroup: index + 1 } : null
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.bloodGroupButtonText,
                        selectedStudent?.bloodGroup === index + 1 && styles.bloodGroupButtonTextActive
                      ]}
                    >
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm) (Optional)</Text>
              <TextInput
                style={styles.input}
                value={selectedStudent?.height || ''}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, height: text } : null)
                }
                placeholder="Enter height in cm"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg) (Optional)</Text>
              <TextInput
                style={styles.input}
                value={selectedStudent?.weight || ''}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, weight: text } : null)
                }
                placeholder="Enter weight in kg"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mother's Name</Text>
              <TextInput
                style={styles.input}
                value={selectedStudent?.motherName || ''}
                onChangeText={(text) =>
                  setSelectedStudent(prev => prev ? { ...prev, motherName: text } : null)
                }
                placeholder="Enter mother's name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Student Status</Text>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    selectedStudent?.isStudentNew && styles.statusButtonActive
                  ]}
                  onPress={() => 
                    setSelectedStudent(prev => 
                      prev ? { ...prev, isStudentNew: true } : null
                    )
                  }
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      selectedStudent?.isStudentNew && styles.statusButtonTextActive
                    ]}
                  >
                    New Student
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    selectedStudent?.isStudentNew === false && styles.statusButtonActive
                  ]}
                  onPress={() => 
                    setSelectedStudent(prev => 
                      prev ? { ...prev, isStudentNew: false } : null
                    )
                  }
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      selectedStudent?.isStudentNew === false && styles.statusButtonTextActive
                    ]}
                  >
                    Transfer Student
                  </Text>
                </TouchableOpacity>
              </View>
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
    <View key={student.id} style={[
      styles.studentCard,
      { width: width > 768 ? '48%' : '100%' }
    ]}>
      <View style={styles.studentInfo}>
        <View style={[
          styles.avatar,
          { backgroundColor: getAvatarColor(student.firstName) }
        ]}>
          <Text style={styles.avatarText}>
            {student.firstName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>
            {student.firstName} {student.lastName}
          </Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Class {student.class.name}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Section {sectionName}</Text>
            </View>
          </View>
          <View style={styles.parentInfoContainer}>
            <FontAwesome name="user" size={12} color="#64748b" />
            <Text style={styles.parentInfo}>{student.parentName}</Text>
          </View>
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
          <FontAwesome name="edit" size={14} color="#4f46e5" />
          <Text style={[styles.actionButtonText, { color: '#4f46e5' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteStudent(student.id)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <FontAwesome name="trash" size={14} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading students...</Text>
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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.studentList}>
          {students.length > 0 ? (
            students.map(renderStudent)
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="users" size={64} color="#cbd5e1" />
              <Text style={styles.emptyStateTitle}>No students yet</Text>
              <Text style={styles.emptyStateText}>
                Start by adding your first student to this class
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
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: width > 768 ? 32 : 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
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
  scrollViewContent: {
    padding: 16,
  },
  studentList: {
    flexDirection: width > 768 ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  studentCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  studentDetails: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontSize: width > 768 ? 18 : 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#475569',
  },
  parentInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  parentInfo: {
    fontSize: 14,
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
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
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  bloodGroupButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  bloodGroupButtonText: {
    color: '#1f2937',
    fontSize: 14,
  },
  bloodGroupButtonTextActive: {
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  statusButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  statusButtonText: {
    color: '#1f2937',
    fontSize: 16,
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
});

export default StudentListScreen;