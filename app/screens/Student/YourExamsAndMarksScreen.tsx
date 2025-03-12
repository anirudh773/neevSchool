import React, { useState, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';

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

const ExamScheduleApp: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [examData, setExamData] = useState<Exam[]>([]);
  const { width } = useWindowDimensions();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = await SecureStore.getItemAsync('userData');
        if (!userData) {
          throw new Error('User data not found');
        }

        const parsedUserInfo: UserInfo = JSON.parse(userData);
        setUserInfo(parsedUserInfo);
        await fetchExamData(parsedUserInfo);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, []);

  const fetchExamData = async (user: UserInfo) => {
    try {
      setLoading(true);
      const { schoolId, id: studentId, studentClass } = user;
      const { classId, sectionId } = studentClass;

      const response = await fetch(
        `https://neevschool.sbs/school/getStudentExams?schoolId=${schoolId}&classId=${classId}&sectionId=${sectionId}&studentId=${studentId}`
      );
      const result: ApiResponse = await response.json();

      if (result.success) {
        setExamData(result.data);
      }
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderExamCard = (exam: Exam) => {
    const status = exam?.status?.toLowerCase() as Lowercase<Exam['status']>;
    const gradientColors = status ? 
      THEME.colors.status[status] || THEME.colors.gradient.primary : 
      THEME.colors.gradient.primary;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedExam(exam);
          setModalVisible(true);
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.examName}>{exam?.name || 'Untitled Exam'}</Text>
            <View style={styles.statusContainer}>
              <FontAwesome 
                name={exam?.status === 'Upcoming' ? 'calendar' : 'calendar-check-o'} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.statusText}>{exam?.status || 'Unknown'}</Text>
            </View>
          </View>
          <Text style={styles.examDate}>
            <FontAwesome name="clock-o" size={14} color="#fff" /> {exam?.date || 'Date not set'}
          </Text>
          <View style={styles.subjectsPreview}>
            {exam?.schedules?.length ? (
              exam.schedules.map((schedule, index) => (
                <View key={index} style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{schedule.subject_name}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.subjectChipText, { color: THEME.colors.text.muted }]}>
                No subjects scheduled
              </Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderMarksTable = () => {
    if (!selectedExam?.schedules?.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No schedule data available</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Subject</Text>
          <Text style={styles.headerText}>Marks</Text>
          <Text style={styles.headerText}>Status</Text>
        </View>
        {selectedExam.schedules.map((schedule, index) => (
          <View key={`marks-${index}`} style={styles.tableRow}>
            <Text style={styles.rowText}>{schedule.subject_name}</Text>
            <Text style={styles.rowText}>
              {schedule.marks_obtained 
                ? `${schedule.marks_obtained}/${schedule.max_marks}`
                : 'Pending'
              }
            </Text>
            <Text style={[
              styles.rowText,
              {
                color: schedule.marks_obtained 
                  ? Number(schedule.marks_obtained) >= schedule.passing_marks 
                    ? '#10B981' 
                    : '#EF4444'
                  : '#64748B'
              }
            ]}>
              {schedule.marks_obtained 
                ? Number(schedule.marks_obtained) >= schedule.passing_marks 
                  ? 'Pass' 
                  : 'Fail'
                : 'N/A'
              }
            </Text>
          </View>
        ))}
      </View>
    );
  };

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

  const ExamDetailsModal: React.FC = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={THEME.colors.gradient.modal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalHeader}
        >
          <View style={styles.modalHeaderContent}>
            <Text style={styles.modalTitle}>{selectedExam?.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <FontAwesome name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            <FontAwesome name="calendar" size={14} color="#fff" /> {selectedExam?.date}
          </Text>
        </LinearGradient>

        <ScrollView 
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalScrollContent}
        >
          <View style={styles.scheduleContainer}>
            <Text style={styles.sectionTitle}>Exam Schedule</Text>
            {selectedExam?.schedules?.length ? (
              selectedExam.schedules.map((schedule, index) => (
                <LinearGradient
                  key={`schedule-${index}`}
                  colors={THEME.colors.gradient.card.success}
                  style={styles.scheduleCard}
                >
                  <Text style={styles.subjectName}>{schedule.subject_name}</Text>
                  <View style={styles.scheduleDetails}>
                    <View style={styles.scheduleItem}>
                      <FontAwesome name="calendar" size={16} color="#fff" />
                      <Text style={styles.scheduleText}>
                        {formatDateTime(schedule.exam_datetime)}
                      </Text>
                    </View>
                    <View style={styles.scheduleItem}>
                      <FontAwesome name="clock-o" size={16} color="#fff" />
                      <Text style={styles.scheduleText}>
                        {schedule.duration_minutes} minutes
                      </Text>
                    </View>
                    <View style={styles.scheduleItem}>
                      <FontAwesome name="star" size={16} color="#fff" />
                      <Text style={styles.scheduleText}>
                        Max: {schedule.max_marks} | Pass: {schedule.passing_marks}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No schedule data available</Text>
              </View>
            )}
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <LineChart
              data={getChartData()}
              width={width - 48}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                labelColor: () => THEME.colors.text.secondary,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: THEME.colors.gradient.primary[0]
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  strokeWidth: 1,
                  strokeColor: THEME.colors.border.light,
                },
                formatYLabel: (value: string) => Math.round(Number(value)).toString(),
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
            />
          </View>

          <View style={styles.marksTableContainer}>
            <Text style={styles.sectionTitle}>Subject-wise Marks</Text>
            {renderMarksTable()}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.text.accent} />
          <Text style={styles.loadingText}>Loading exams...</Text>
        </View>
      ) : (
        <>
          {examData && examData.length > 0 ? (
            examData.map((exam) => (
              <React.Fragment key={`exam-${exam.id}`}>
                {renderExamCard(exam)}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No exams found</Text>
            </View>
          )}
          <ExamDetailsModal />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 24,
    color: THEME.colors.text.primary,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 8,
  },
  examList: {
    padding: 8,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 20,
    borderRadius: 24,
    ...THEME.shadows.medium,
    overflow: 'hidden',
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  examName: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.text.light,
    flex: 1,
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.surface.light,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.surface.strong,
  },
  statusText: {
    color: THEME.colors.text.light,
    fontSize: 14,
    fontWeight: '600',
  },
  examDate: {
    fontSize: 16,
    color: THEME.colors.text.muted,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  subjectsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: THEME.colors.surface.medium,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.surface.strong,
  },
  subjectChipText: {
    color: THEME.colors.text.light,
    fontSize: 13,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 16,
  },
  modalScrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  scheduleContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  scheduleCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1976d2',
  },
  scheduleDetails: {
    gap: 14,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.colors.surface.light,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.surface.strong,
  },
  scheduleText: {
    fontSize: 15,
    color: THEME.colors.text.light,
    flex: 1,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  marksTableContainer: {
    width: '100%',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.gradient.primary[0],
    padding: 16,
  },
  headerText: {
    flex: 1,
    color: THEME.colors.text.light,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border.light,
    backgroundColor: '#fff',
  },
  rowText: {
    flex: 1,
    textAlign: 'center',
    color: THEME.colors.text.primary,
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.gradient.background[0],
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
  },
});

export default ExamScheduleApp;