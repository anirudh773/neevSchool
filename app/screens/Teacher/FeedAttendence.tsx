import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

const { width } = Dimensions.get('window');
const STUDENTS_PER_PAGE = 10;

interface Student {
  id: number;
  studentUserId: number;
  firstName: string;
  lastName: string;
}

interface AttendanceData {
  studentId: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  date: string;
}

const TeacherAttendanceManagement: React.FC = () => {
  const { sectionId } = useLocalSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<{[key: number]: 'PRESENT' | 'ABSENT' | 'LATE'}>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date] = useState(new Date().toDateString());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const updateDisplayedStudents = (students: Student[], page: number, query: string) => {
    const filteredStudents = students.filter(student => 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(query.toLowerCase())
    );
    const startIndex = (page - 1) * STUDENTS_PER_PAGE;
    const endIndex = startIndex + STUDENTS_PER_PAGE;
    setDisplayedStudents(filteredStudents.slice(startIndex, endIndex));
  };

  const fetchStudentsBySection = async (sectionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://neevschool.sbs/school/getStudentBySection?sectionId=${sectionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const fetchedStudents = data.data.map((student: any) => ({
          id: student.id,
          studentUserId: student.studentUserId,
          firstName: student.firstName,
          lastName: student.lastName
        }));
        setStudents(fetchedStudents);
        updateDisplayedStudents(fetchedStudents, 1, searchQuery);

        // Fetch attendance data
        const attendanceResponse = await fetch(`https://neevschool.sbs/school/getAttendance/${sectionId}`);
        const attendanceData = await attendanceResponse.json();

        if (attendanceData.status && attendanceData.data) {
          if (attendanceData.data.length === 0) {
            // If no attendance data, set all students as present
            const initialStatuses: {[key: number]: 'PRESENT' | 'ABSENT' | 'LATE'} = {};
            fetchedStudents.forEach((student: Student) => {
              initialStatuses[student.id] = 'PRESENT';
            });
            setAttendanceStatuses(initialStatuses);
          } else {
            // If attendance data exists, set the statuses from the API
            const attendanceStatuses: {[key: number]: 'PRESENT' | 'ABSENT' | 'LATE'} = {};
            fetchedStudents.forEach((student: Student) => {
              const attendanceRecord = attendanceData.data.find(
                (record: any) => record.studentId === student.studentUserId
              );
              attendanceStatuses[student.id] = attendanceRecord?.status || 'PRESENT';
            });
            setAttendanceStatuses(attendanceStatuses);
            setIsEditing(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to fetch students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sectionId) {
      fetchStudentsBySection(sectionId.toString());
    }
  }, [sectionId]);

  const setAttendanceStatus = (studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const formatDateAnirudhJugaad = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      
      const currentStudentIds = displayedStudents.map(s => s.id);
      const hasEmptyAttendance = currentStudentIds.some(id => !attendanceStatuses[id]);
      
      if (hasEmptyAttendance) {
        Alert.alert('Error', 'Please mark attendance for all students on this page');
        return;
      }

      const nextPage = currentPage + 1;
      const totalPages = Math.ceil(students.length / STUDENTS_PER_PAGE);
      const isLastPage = nextPage > totalPages;

      const records = displayedStudents.map(student => ({
        studentId: student.studentUserId,
        status: attendanceStatuses[student.id]
      }));

      const payload = {
        sectionId: +sectionId,
        attendanceDate: formatDateAnirudhJugaad(date),
        records: records
        // isAttendanceSubmitted: isLastPage
      };

      const response = await fetch('https://neevschool.sbs/school/submitAttendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        if (!isLastPage) {
          setCurrentPage(nextPage);
          updateDisplayedStudents(students, nextPage, searchQuery);
          Alert.alert('Success', 'Attendance submitted successfully! Moving to next page...');
        } else {
          const presentCount = Object.values(attendanceStatuses).filter(status => status === 'PRESENT').length;
          const lateCount = Object.values(attendanceStatuses).filter(status => status === 'LATE').length;
          const absentCount = Object.values(attendanceStatuses).filter(status => status === 'ABSENT').length;

          Alert.alert(
            'Success', 
            `Attendance Submitted\n\nSummary:\nPresent: ${presentCount}\nLate: ${lateCount}\nAbsent: ${absentCount}`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        throw new Error(data.message || 'Failed to submit attendance');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStudentItem = ({ item }: { item: Student }) => {
    const status = attendanceStatuses[item.id] || 'PRESENT';
    
    return (
      <View style={styles.studentCard}>
        <Text style={styles.studentName}>{`${item.firstName} ${item.lastName}`}</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'PRESENT' && styles.activeStatusButton,
              status === 'PRESENT' && { backgroundColor: '#4CAF50' }
            ]}
            onPress={() => setAttendanceStatus(item.id, 'PRESENT')}
          >
            <Text style={[
              styles.statusButtonText,
              status === 'PRESENT' && styles.activeStatusButtonText
            ]}>P</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'LATE' && styles.activeStatusButton,
              status === 'LATE' && { backgroundColor: '#FFC107' }
            ]}
            onPress={() => setAttendanceStatus(item.id, 'LATE')}
          >
            <Text style={[
              styles.statusButtonText,
              status === 'LATE' && styles.activeStatusButtonText
            ]}>L</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'ABSENT' && styles.activeStatusButton,
              status === 'ABSENT' && { backgroundColor: '#F44336' }
            ]}
            onPress={() => setAttendanceStatus(item.id, 'ABSENT')}
          >
            <Text style={[
              styles.statusButtonText,
              status === 'ABSENT' && styles.activeStatusButtonText
            ]}>A</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Management</Text>
        <Text style={styles.dateText}>{date}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            updateDisplayedStudents(students, 1, text);
          }}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={displayedStudents}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.studentList}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No students found</Text>
            }
          />

          {students.length > 0 && (
            <View style={styles.paginationContainer}>
              <Text style={styles.paginationText}>
                Page {currentPage} of {Math.ceil(students.length / STUDENTS_PER_PAGE)}
              </Text>
            </View>
          )}

          {students.length > 0 && (
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitAttendance}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {currentPage === Math.ceil(students.length / STUDENTS_PER_PAGE)
                    ? "Submit All Attendance"
                    : "Submit & Continue"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  studentList: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeStatusButton: {
    borderWidth: 0,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  activeStatusButtonText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 16,
  },
  paginationContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
});

export default TeacherAttendanceManagement;