import React, { useState } from 'react';
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
  useWindowDimensions 
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Schedule {
  subject_name: string;
  exam_datetime: string;
  duration_minutes: number;
  max_marks: number;
  passing_marks: number;
}

interface Exam {
  id: number;
  name: string;
  date: string;
  status: 'Upcoming' | 'Ongoing';
  schedules: Schedule[];
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
  const { width } = useWindowDimensions();

  const examData: Exam[] = [
    {
      id: 25,
      name: "test",
      date: "Feb 19, 2025",
      status: "Upcoming",
      schedules: [
        {
          subject_name: "English",
          exam_datetime: "2025-02-20T06:37:00.000Z",
          duration_minutes: 78,
          max_marks: 100,
          passing_marks: 76,
        }
      ]
    },
    {
      id: 16,
      name: "Midterm Exam 2024",
      date: "Feb 10, 2025",
      status: "Ongoing",
      schedules: [
        {
          subject_name: "Mathematics",
          exam_datetime: "2024-02-12T00:00:00.000Z",
          duration_minutes: 120,
          max_marks: 100,
          passing_marks: 35,
        },
        {
          subject_name: "Science",
          exam_datetime: "2024-02-14T00:00:00.000Z",
          duration_minutes: 90,
          max_marks: 100,
          passing_marks: 35,
        }
      ]
    }
  ];

  const marksData: ChartData = {
    labels: ["English", "Mathematics", "Science"],
    datasets: [
      {
        data: [85, 78, 92],
      }
    ]
  };

  const studentMarks: Marks[] = [
    { subject: "English", marks: 85 },
    { subject: "Mathematics", marks: 78 },
    { subject: "Science", marks: 92 },
  ];

  const formatDateTime = (datetime: string): string => {
    return new Date(datetime).toLocaleString();
  };

  const renderExamCard = (exam: Exam) => {
    const gradientColors = THEME.colors.status[exam.status.toLowerCase() as Lowercase<Exam['status']>];
    
    return (
      <TouchableOpacity
        key={exam.id}
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
            <Text style={styles.examName}>{exam.name}</Text>
            <View style={styles.statusContainer}>
              <FontAwesome 
                name={exam.status === 'Upcoming' ? 'calendar' : 'calendar-check-o'} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.statusText}>{exam.status}</Text>
            </View>
          </View>
          <Text style={styles.examDate}>
            <FontAwesome name="clock-o" size={14} color="#fff" /> {exam.date}
          </Text>
          <View style={styles.subjectsPreview}>
            {exam.schedules.map((schedule, index) => (
              <View key={index} style={styles.subjectChip}>
                <Text style={styles.subjectChipText}>{schedule.subject_name}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderMarksTable = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Subject</Text>
        <Text style={styles.headerText}>Marks</Text>
      </View>
      {studentMarks.map((item) => (
        <View key={item.subject} style={styles.tableRow}>
          <Text style={styles.rowText}>{item.subject}</Text>
          <Text style={styles.rowText}>{item.marks}</Text>
        </View>
      ))}
    </View>
  );

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
          <Text style={styles.modalTitle}>{selectedExam?.name}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <FontAwesome name="times" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView 
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: 40,
            gap: 24
          }}
        >
          <View style={styles.scheduleContainer}>
            <Text style={styles.sectionTitle}>Exam Schedule</Text>
            {selectedExam?.schedules.map((schedule, index) => (
              <LinearGradient
                key={index}
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
            ))}
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <LineChart
              data={marksData}
              width={width - 40}
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
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#fff'
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  strokeWidth: 1,
                  strokeColor: THEME.colors.border.light,
                },
              }}
              bezier
              style={styles.chart}
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
    <LinearGradient
      colors={['#F8FAFC', '#F1F5F9']}
      style={styles.container}
    >
      <Text style={styles.header}>Your Exams</Text>
      <FlatList
        data={examData}
        renderItem={({ item }) => renderExamCard(item)}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.examList}
        showsVerticalScrollIndicator={false}
      />
      <ExamDetailsModal />
    </LinearGradient>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalHeader: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...THEME.shadows.large,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.text.light,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  scheduleContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.text.primary,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  scheduleCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    ...THEME.shadows.small,
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
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...THEME.shadows.medium,
    borderWidth: 1,
    borderColor: THEME.colors.border.light,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  marksTableContainer: {
    width: '100%',
  },
  tableContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    ...THEME.shadows.medium,
    backgroundColor: '#fff',
    marginTop: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border.light,
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
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  rowText: {
    flex: 1,
    textAlign: 'center',
    color: THEME.colors.text.primary,
    fontSize: 15,
  },
  closeButton: {
    backgroundColor: THEME.colors.surface.light,
    padding: 12,
    borderRadius: 12,
  }
});

export default ExamScheduleApp;