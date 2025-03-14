import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

interface ExamSchedule {
  subject_name: string;
  exam_datetime: string;
  duration_minutes: number;
  max_marks: number;
  passing_marks: number;
  marks_obtained?: string;
  remarks?: string;
}

interface Exam {
  id: number;
  name: string;
  date: string;
  status: 'Upcoming' | 'Ongoing';
  schedules: ExamSchedule[];
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

interface Marks {
  subject: string;
  marks: number;
}

interface ApiResponse {
  success: boolean;
  data: Exam[];
}

interface UserInfo {
  id: number;
  userId: string;
  schoolId: number;
  name: string;
  role: number;
  teacherId: number | null;
  studentClass: {
    classId: number;
    className: string;
    sectionId: number;
    sectionName: string;
  };
}

type GradientColors = [string, string];

const THEME = {
  colors: {
    gradient: {
      primary: ['#4F46E5', '#7C3AED'] as GradientColors,
      secondary: ['#3B82F6', '#2563EB'] as GradientColors,
      card: {
        upcoming: ['#6366F1', '#4F46E5'] as GradientColors,
        ongoing: ['#8B5CF6', '#6D28D9'] as GradientColors,
        success: ['#10B981', '#059669'] as GradientColors,
      },
      modal: ['#4F46E5', '#4338CA'] as GradientColors,
      chart: ['#818CF8', '#4F46E5'] as GradientColors,
      background: ['#F8FAFC', '#EEF2FF'] as GradientColors,
    },
    status: {
      upcoming: ['#6366F1', '#4F46E5'] as GradientColors,
      ongoing: ['#8B5CF6', '#6D28D9'] as GradientColors
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      light: '#FFFFFF',
      muted: 'rgba(255,255,255,0.9)',
      accent: '#4F46E5'
    },
    surface: {
      light: 'rgba(255,255,255,0.15)',
      medium: 'rgba(255,255,255,0.25)',
      strong: 'rgba(255,255,255,0.35)'
    },
    border: {
      light: '#E2E8F0',
      medium: '#CBD5E1'
    }
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8
    }
  }
};

// Separate Modal Component to prevent re-renders
const ExamDetailsModal = React.memo(({ 
  exam, 
  visible, 
  onClose 
}: { 
  exam: Exam | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!exam) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED'] as [string, string]}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>{exam.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalBody}>
            {exam.schedules?.map((schedule, index) => (
              <View key={index} style={styles.examDetailCard}>
                <Text style={styles.subjectTitle}>{schedule.subject_name}</Text>
                <Text style={styles.examInfo}>
                  Date: {new Date(schedule.exam_datetime).toLocaleDateString()}
                </Text>
                <Text style={styles.examInfo}>
                  Time: {new Date(schedule.exam_datetime).toLocaleTimeString()}
                </Text>
                <Text style={styles.examInfo}>
                  Duration: {schedule.duration_minutes} minutes
                </Text>
                <View style={styles.marksContainer}>
                  <Text style={styles.examInfo}>
                    Maximum Marks: {schedule.max_marks}
                  </Text>
                  <Text style={styles.examInfo}>
                    Passing Marks: {schedule.passing_marks}
                  </Text>
                </View>
                {schedule.marks_obtained && (
                  <View style={styles.obtainedMarksContainer}>
                    <Text style={styles.obtainedMarks}>
                      Marks Obtained: {schedule.marks_obtained}/{schedule.max_marks}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

// Separate ExamCard Component
const ExamCard = React.memo(({ 
  exam, 
  onPress 
}: { 
  exam: Exam;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity style={styles.examCard} onPress={onPress}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED'] as [string, string]}
        style={styles.cardHeader}
      >
        <View>
          <Text style={styles.examName}>{exam.name}</Text>
          <Text style={styles.examDate}>Date: {exam.date}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{exam.status}</Text>
        </View>
      </LinearGradient>

      <View style={styles.schedulesList}>
        {exam.schedules?.map((schedule, index) => (
          <View key={index} style={styles.scheduleItem}>
            <Text style={styles.subjectName}>{schedule.subject_name}</Text>
            <Text style={styles.scheduleTime}>
              Time: {new Date(schedule.exam_datetime).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
});

const ExamScheduleApp: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<Exam[]>([]);
  const { width: windowWidth } = useWindowDimensions();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const loadExams = useCallback(async () => {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) {
        Alert.alert('Error', 'User data not found');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const { schoolId, id, studentClass } = parsedUserData;
      
      if (!studentClass?.classId || !studentClass?.sectionId) {
        Alert.alert('Error', 'Class or section information not found');
        return;
      }

      const response = await fetch(
        `https://neevschool.sbs/school/getStudentExams?schoolId=${schoolId}&studentId=${id}&classId=${studentClass.classId}&sectionId=${studentClass.sectionId}`
      );
      const result = await response.json();

      if (result.success) {
        setExamData(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to load exams');
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      Alert.alert('Error', 'Failed to load exam data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleExamPress = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedExam(null);
  }, []);

  const getChartData = () => {
    if (!selectedExam?.schedules?.length) return {
      labels: [],
      datasets: [{ data: [0] }]
    };

    const validSchedules = selectedExam.schedules.filter(s => 
      s.marks_obtained && !isNaN(Number(s.marks_obtained))
    );

    if (!validSchedules.length) return {
      labels: ['No Data'],
      datasets: [{ data: [0] }]
    };

    return {
      labels: validSchedules.map(s => s.subject_name.substring(0, 3)),
      datasets: [{
        data: validSchedules.map(s => Number(s.marks_obtained) || 0)
      }]
    };
  };

  const formatDateTime = (datetime: string): string => {
    return new Date(datetime).toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {examData.map(exam => (
        <ExamCard
          key={exam.id}
          exam={exam}
          onPress={() => handleExamPress(exam)}
        />
      ))}
      
      <ExamDetailsModal
        exam={selectedExam}
        visible={modalVisible}
        onClose={handleCloseModal}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    padding: 24,
  },
  examName: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.text.light,
    flex: 1,
    letterSpacing: 0.5,
  },
  examDate: {
    fontSize: 16,
    color: THEME.colors.text.muted,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  statusBadge: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: THEME.colors.surface.light,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.surface.strong,
  },
  statusText: {
    color: THEME.colors.text.light,
    fontSize: 14,
    fontWeight: '600',
  },
  schedulesList: {
    marginTop: 16,
  },
  scheduleItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a73e8',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#4F46E5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 15,
  },
  examDetailCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a73e8',
    marginBottom: 10,
  },
  examInfo: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 5,
  },
  marksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  obtainedMarksContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  obtainedMarks: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
});

export default ExamScheduleApp;