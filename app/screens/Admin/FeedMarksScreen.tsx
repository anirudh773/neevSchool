import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Divider,
  Menu,
  Portal,
  Snackbar,
  ProgressBar,
  Provider as PaperProvider,
  IconButton,
  useTheme
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import StudentCard from '../Student/StudentCard';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  rollNo: string;
}

interface MarksData {
  [studentId: number]: {
    marks: string;
    remarks: string;
  };
}

interface SubjectOption {
  id: string;
  name: string;
}

const STUDENTS_PER_PAGE = 10;

const StudentMarksEntry = () => {
  let router = useRouter();
  const theme = useTheme();
  const { classId, sectionId, sectionName, exam } = useLocalSearchParams();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  const [subjectOptions, setSubject] = useState<SubjectOption[] | null>(null);
  const [marksData, setMarksData] = useState<MarksData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submittedMarks, setSubmittedMarks] = useState<MarksData>({});

  const updateDisplayedStudents = (students: Student[], page: number) => {
    const startIndex = (page - 1) * STUDENTS_PER_PAGE;
    const endIndex = startIndex + STUDENTS_PER_PAGE;
    setDisplayedStudents(students.slice(startIndex, endIndex));
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://13.202.16.149:8080/school/getStudentBySection?sectionId=${sectionId}`);
      const data = await response.json();
      if (data.success) {
        setAllStudents(data.data);
        updateDisplayedStudents(data.data, 1);
      }
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubject = async () => {
    try {
      setLoading(true);
      let subjectBySchool = await SecureStore.getItemAsync('subjectBySchool');
      if (subjectBySchool) {
        const parsedExam = JSON.parse(exam as string);
        const nonSubmittedExams = parsedExam?.filter(obj => !obj.is_marks_submitted);
        const scheduledSubjectIds = nonSubmittedExams.map(schedule => schedule.subject_id);
        const parsedSubjects = JSON.parse(subjectBySchool);
        const scheduledSubjects = parsedSubjects?.filter(subject => 
          scheduledSubjectIds.includes(subject.id)
        );
        setSubject(scheduledSubjects);
      }
    } catch (err) {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useMemo(() => {
    fetchSubject();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchStudents();
    }
  }, [selectedSubject]);

  const calculateProgress = () => {
    if (!allStudents.length) return 0;
    const totalPages = Math.ceil(allStudents.length / STUDENTS_PER_PAGE);
    return currentPage / totalPages;
  };

  const validateMarks = (value: string) => {
    if (value === '') return true;
    const numValue = Number(value);
    return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
  };

  const updateStudentData = (studentId: number, field: 'marks' | 'remarks', value: string) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId] || {},
        [field]: value
      }
    }));
    if (field === 'marks' && !validateMarks(value)) {
      setError("Marks must be between 0 and 100");
    } else {
      setError("");
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const currentStudentIds = displayedStudents.map(s => s.id);
      
      // Validation checks
      const hasEmptyMarks = currentStudentIds.some(id => !marksData[id]?.marks);
      const hasInvalidMarks = Object.entries(marksData)
        .filter(([id]) => currentStudentIds.includes(Number(id)))
        .some(([_, value]) => !validateMarks(value.marks));
      
      if (hasEmptyMarks) {
        setError("Please enter marks for all students on this page");
        return;
      }
      
      if (hasInvalidMarks) {
        setError("Please correct invalid marks entries");
        return;
      }
  
      const nextPage = currentPage + 1;
      const totalPages = Math.ceil(allStudents.length / STUDENTS_PER_PAGE);
      const isLastPage = nextPage > totalPages;
      
      const formattedMarks = Object.entries(marksData)
        .map(([studentId, data]) => ({
          studentId: Number(studentId),
          marks: +data.marks,
          remarks: data.remarks || "N/A"
        }));
  
      const requestBody = {
        marks: formattedMarks,
        metadata: {
          submittedBy: 7,
          isMarksSubmitted: isLastPage
        }
      };
      let examSchId = JSON.parse(exam as string);
      examSchId = examSchId.find(obj => obj.subject_id===selectedSubject)
  
      const response = await fetch(`http://13.202.16.149:8080/school/submitExamMarks?examScId=${examSchId.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        throw new Error('API call failed');
      }
  
      setSubmittedMarks(prev => ({
        ...prev,
        ...marksData
      }));
  
      if (!isLastPage) {
        setCurrentPage(nextPage);
        updateDisplayedStudents(allStudents, nextPage);
        setMarksData({});
        setSuccess("Marks submitted successfully! Moving to next page...");
      } else {
        setSuccess("All marks submitted successfully!");
        setCurrentPage(1);
        setMarksData({});
        setSubmittedMarks({});
        setSelectedSubject(null);
        setAllStudents([]);
        setDisplayedStudents([]);
        router.back()
      }
    } catch (err) {
      setError("Failed to submit marks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.mainCard}>
              <Card.Title
                title="Marks Entry"
                subtitle={`Class: ${classId}, Section: ${sectionName}`}
                titleStyle={styles.cardTitle}
                subtitleStyle={styles.cardSubtitle}
              />
              <Divider />

              <View style={styles.menuContainer}>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setMenuVisible(true)}
                      disabled={loading}
                      style={styles.subjectButton}
                      icon="book"
                    >
                      {selectedSubject && subjectOptions
                        ? subjectOptions.find(s => s.id === selectedSubject)?.name
                        : 'Select Subject'}
                    </Button>
                  }
                >
                  {subjectOptions?.map((subject) => (
                    <Menu.Item
                      key={subject.id}
                      onPress={() => {
                        setSelectedSubject(subject.id);
                        setMenuVisible(false);
                      }}
                      title={subject.name}
                    />
                  ))}
                </Menu>
              </View>

              {selectedSubject && allStudents.length > 0 && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    Page {currentPage} of {Math.ceil(allStudents.length / STUDENTS_PER_PAGE)}
                  </Text>
                  <ProgressBar 
                    progress={calculateProgress()}
                    style={styles.progressBar}
                    color={theme.colors.primary}
                  />
                </View>
              )}

              {loading && (
                <ActivityIndicator 
                  style={styles.loader} 
                  size="large"
                  color={theme.colors.primary}
                />
              )}

              {selectedSubject && displayedStudents.length > 0 && !loading && (
                <View style={styles.studentsContainer}>
                  {displayedStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      marksData={marksData}
                      updateStudentData={updateStudentData}
                    />
                  ))}

                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                    disabled={loading}
                    icon="check-circle"
                  >
                    {currentPage === Math.ceil(allStudents.length / STUDENTS_PER_PAGE)
                      ? "Submit All Marks"
                      : "Submit & Continue"}
                  </Button>
                </View>
              )}

              {!selectedSubject && !loading && (
                <View style={styles.emptyStateContainer}>
                  <IconButton
                    icon="book-open-variant"
                    size={48}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.emptyText}>
                    Please select a subject to begin entering marks
                  </Text>
                </View>
              )}
            </Card>
          </ScrollView>

          <Portal>
            <Snackbar
              visible={!!error || !!success}
              onDismiss={() => {
                setError("");
                setSuccess("");
              }}
              duration={3000}
              style={[
                styles.snackbar,
                error ? styles.errorSnackbar : styles.successSnackbar
              ]}
            >
              {error || success}
            </Snackbar>
          </Portal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1
  },
  mainCard: {
    elevation: 4,
    margin: 1,
    borderRadius: 12
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.8
  },
  menuContainer: {
    padding: 16,
    alignItems: 'center'
  },
  subjectButton: {
    width: '80%',
    borderRadius: 8
  },
  progressContainer: {
    padding: 16,
    paddingTop: 0
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
    fontSize: 14
  },
  progressBar: {
    height: 8,
    borderRadius: 4
  },
  studentsContainer: {
    padding: 16,
    gap: 16
  },
  submitButton: {
    marginTop: 24,
    marginBottom: Platform.OS === 'ios' ? 32 : 24,
    borderRadius: 8,
    paddingVertical: 8
  },
  loader: {
    padding: 32
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 16
  },
  snackbar: {
    margin: 16,
    borderRadius: 8
  },
  errorSnackbar: {
    backgroundColor: '#d32f2f'
  },
  successSnackbar: {
    backgroundColor: '#2e7d32'
  }
});

export default StudentMarksEntry;