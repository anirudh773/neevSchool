import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Modal, FlatList } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

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

const ExamScheduleApp: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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

  const renderExamCard = (exam: Exam) => (
    <TouchableOpacity
      key={exam.id}
      style={[styles.card, { backgroundColor: exam.status === 'Upcoming' ? '#e3f2fd' : '#f5f5f5' }]}
      onPress={() => {
        setSelectedExam(exam);
        setModalVisible(true);
      }}
    >
      <Text style={styles.examName}>{exam.name}</Text>
      <Text style={styles.examDate}>Date: {exam.date}</Text>
      <Text style={[styles.statusBadge, 
        { backgroundColor: exam.status === 'Upcoming' ? '#2196f3' : '#ff9800' }]}>
        {exam.status}
      </Text>
    </TouchableOpacity>
  );

  const renderMarksTable = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Subject</Text>
        <Text style={styles.headerText}>Marks</Text>
      </View>
      <FlatList
        data={studentMarks}
        keyExtractor={(item) => item.subject}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={styles.rowText}>{item.subject}</Text>
            <Text style={styles.rowText}>{item.marks}</Text>
          </View>
        )}
      />
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
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedExam?.name}</Text>
          
          <ScrollView style={styles.scheduleContainer}>
            {selectedExam?.schedules.map((schedule, index) => (
              <View key={index} style={styles.scheduleCard}>
                <Text style={styles.subjectName}>{schedule.subject_name}</Text>
                <Text style={styles.scheduleText}>
                  Date: {formatDateTime(schedule.exam_datetime)}
                </Text>
                <Text style={styles.scheduleText}>
                  Duration: {schedule.duration_minutes} minutes
                </Text>
                <Text style={styles.scheduleText}>
                  Maximum Marks: {schedule.max_marks}
                </Text>
                <Text style={styles.scheduleText}>
                  Passing Marks: {schedule.passing_marks}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Performance Overview</Text>
            <LineChart
              data={marksData}
              width={Dimensions.get('window').width - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                style: {
                  borderRadius: 16,
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>

          <View style={styles.marksTableContainer}>
            <Text style={styles.marksTableTitle}>Subject-wise Marks</Text>
            {renderMarksTable()}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Exam Schedule</Text>
      <ScrollView style={styles.scrollView}>
        {examData.map(exam => renderExamCard(exam))}
      </ScrollView>
      <ExamDetailsModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976d2',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  examName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  examDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1976d2',
  },
  scheduleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
  },
  marksTableContainer: {
    marginVertical: 16,
  },
  marksTableTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1976d2',
    padding: 12,
  },
  headerText: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  rowText: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ExamScheduleApp;