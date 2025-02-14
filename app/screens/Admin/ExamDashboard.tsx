import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Modal } from 'react-native';
interface Schedule {
  id: number;
  subject_id: number;
  subject_name: string;
  exam_datetime: string;
  duration_minutes: number;
  max_marks: number;
  passing_marks: number;
  is_marks_submitted: boolean;
  class_id: number;

  // Additional fields for dashboard
  class_average?: number;
  grade_distribution?: number[];
  progress_data?: number[];
  pass_fail_data?: PassFailData;
  top_scorers?: TopScorer[];
}

interface StudentMark {
  id: number;
  name: string;
  marks: number;
  grade: string;
}

interface ExamData {
  id: number;
  name: string;
  schedules: Schedule[];
}

interface PassFailData {
  passed: number;
  failed: number;
}

interface TopScorer {
  name: string;
  marks: number;
}

const ExamStatsDashboard = () => {
  const examData: ExamData = {
    id: 4,
    name: "Final Exams 2025",
    schedules: [
      {
        id: 17,
        subject_id: 3,
        subject_name: "English",
        exam_datetime: "2025-02-20T06:37:00.000Z",
        duration_minutes: 78,
        max_marks: 100,
        passing_marks: 76,
        is_marks_submitted: true,
        class_id: 29,

        // Additional dummy data for dashboard visualization
        class_average: 72,
        grade_distribution: [3, 4, 5, 3, 2],
        progress_data: [65, 70, 72, 76],
        pass_fail_data: { passed: 15, failed: 5 },
        top_scorers: [
          { name: "John Doe", marks: 95 },
          { name: "Jane Smith", marks: 87 },
        ],
      },
      {
        id: 18,
        subject_id: 4,
        subject_name: "Mathematics",
        exam_datetime: "2025-02-22T09:00:00.000Z",
        duration_minutes: 90,
        max_marks: 100,
        passing_marks: 50,
        is_marks_submitted: true,
        class_id: 29,

        // Additional dummy data for dashboard visualization
        class_average: 68,
        grade_distribution: [2, 3, 4, 5, 1],
        progress_data: [60, 65, 67, 68],
        pass_fail_data: { passed: 12, failed: 8 },
        top_scorers: [
          { name: "Emma Brown", marks: 92 },
          { name: "Liam Johnson", marks: 88 },
        ],
      },
      {
        id: 19,
        subject_id: 5,
        subject_name: "Science",
        exam_datetime: "2025-02-25T11:30:00.000Z",
        duration_minutes: 120,
        max_marks: 100,
        passing_marks: 45,
        is_marks_submitted: true,
        class_id: 29,

        // Additional dummy data for dashboard visualization
        class_average: 75,
        grade_distribution: [3, 5, 6, 4, 2],
        progress_data: [68, 70, 71, 75],
        pass_fail_data: { passed: 18, failed: 2 },
        top_scorers: [
          { name: "Noah Wilson", marks: 98 },
          { name: "Ava Martinez", marks: 91 },
        ],
      }
    ],
  };

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  // ... previous state and data remain same
  const [showMarksModal, setShowMarksModal] = useState(false);

  // Dummy data for all student marks
  const dummyStudentMarks: StudentMark[] = [
    { id: 1, name: "John Doe", marks: 95, grade: "A+" },
    { id: 2, name: "Jane Smith", marks: 87, grade: "A" },
    { id: 3, name: "Emma Brown", marks: 82, grade: "A-" },
    { id: 4, name: "Michael Johnson", marks: 78, grade: "B+" },
    { id: 5, name: "Sarah Wilson", marks: 75, grade: "B" },
    { id: 6, name: "David Lee", marks: 72, grade: "B-" },
    { id: 7, name: "Lisa Chen", marks: 68, grade: "C+" },
    { id: 8, name: "James Rodriguez", marks: 65, grade: "C" },
    { id: 9, name: "Anna Kim", marks: 62, grade: "C-" },
    { id: 10, name: "Tom Parker", marks: 58, grade: "D+" },
  ];

  const MarksModal = () => (
    <Modal
      visible={showMarksModal}
      animationType="slide"
      onRequestClose={() => setShowMarksModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>All Student Marks</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowMarksModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Marks</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Grade</Text>
          </View>

          {dummyStudentMarks.map((student) => (
            <View key={student.id} style={styles.tableRow}>
              <Text style={[styles.studentName, { flex: 2 }]}>{student.name}</Text>
              <Text style={[styles.studentMarks, { flex: 1 }]}>{student.marks}%</Text>
              <Text style={[styles.studentGrade, { flex: 1 }]}>{student.grade}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  // Data calculation functions
  const getAggregatedData = () => {
    return examData.schedules.reduce((acc, curr) => ({
      passed: acc.passed + (curr.pass_fail_data?.passed || 0),
      failed: acc.failed + (curr.pass_fail_data?.failed || 0),
      grade_distribution: curr.grade_distribution
        ? curr.grade_distribution.map((val, i) => (acc.grade_distribution[i] || 0) + val)
        : [0, 0, 0, 0, 0],
      class_average: acc.class_average + (curr.class_average || 0),
    }), {
      passed: 0,
      failed: 0,
      grade_distribution: [0, 0, 0, 0, 0],
      class_average: 0,
    });
  };

  const aggregatedData = getAggregatedData();
  const averageClassAverage = (aggregatedData.class_average / examData.schedules.length).toFixed(1);

  const currentSubject = examData.schedules.find(s => s.id === selectedSubject);

  // Chart data preparation
  const getChartData = {
    gradeDistribution: {
      labels: ["90+", "80-89", "70-79", "60-69", "<60"],
      datasets: [{
        data: selectedSubject
          ? currentSubject?.grade_distribution || [0, 0, 0, 0, 0]
          : aggregatedData.grade_distribution
      }]
    },
    progress: {
      labels: ["Test 1", "Test 2", "Test 3", "Current"],
      datasets: [{
        data: currentSubject?.progress_data || [],
      }]
    },
    passFail: [
      {
        name: "Passed",
        population: selectedSubject
          ? currentSubject?.pass_fail_data?.passed || 0
          : aggregatedData.passed,
        color: "#4CAF50",
        legendFontColor: "#7F7F7F",
      },
      {
        name: "Failed",
        population: selectedSubject
          ? currentSubject?.pass_fail_data?.failed || 0
          : aggregatedData.failed,
        color: "#F44336",
        legendFontColor: "#7F7F7F",
      }
    ]
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSubject}
            onValueChange={(itemValue) => setSelectedSubject(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="All Subjects" value={null} />
            {examData.schedules.map(subject => (
              <Picker.Item
                key={subject.id}
                label={subject.subject_name}
                value={subject.id}
              />
            ))}
          </Picker>
        </View>

        {/* Header Stats */}
        <View style={styles.headerStats}>
          {selectedSubject ? (
            <>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Passing Marks</Text>
                <Text style={styles.statValue}>
                  {currentSubject?.passing_marks}/{currentSubject?.max_marks}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{currentSubject?.duration_minutes}m</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Class Avg</Text>
                <Text style={styles.statValue}>{currentSubject?.class_average}%</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Passed</Text>
                <Text style={[styles.statValue, styles.successText]}>
                  {aggregatedData.passed}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Failed</Text>
                <Text style={[styles.statValue, styles.dangerText]}>
                  {aggregatedData.failed}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Avg Class Score</Text>
                <Text style={styles.statValue}>{averageClassAverage}%</Text>
              </View>
            </>
          )}
        </View>

        {/* Grade Distribution Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {selectedSubject ? 'Grade Distribution' : 'Overall Grade Distribution'}
          </Text>
          <BarChart
            data={getChartData.gradeDistribution}
            width={Dimensions.get('window').width - 50}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity) => `rgba(99, 102, 241, ${opacity})`,
              barPercentage: 0.5,
            }}
            style={styles.chart}
            yAxisSuffix=""
          />
        </View>

        {/* Progress Chart (Subject-specific only) */}
        {selectedSubject && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Performance Trend</Text>
            <LineChart
              data={getChartData.progress}
              width={Dimensions.get('window').width - 50}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity) => `rgba(16, 185, 129, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Pass/Fail Ratio */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {selectedSubject ? 'Pass/Fail Ratio' : 'Overall Pass/Fail Ratio'}
          </Text>
          <PieChart
            data={getChartData.passFail}
            width={Dimensions.get('window').width - 50}
            height={220}
            accessor="population"
            chartConfig={{
              color: (opacity) => `rgba(0, 0, 0, ${opacity})`,
            }}
            style={styles.chart}
            absolute
          />
        </View>

        {/* Top Performers (Subject-specific only) */}
        {selectedSubject && (
          <View style={styles.performersContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowMarksModal(true)}
              >
                <Text style={styles.viewAllButtonText}>View All Marks</Text>
              </TouchableOpacity>
            </View>
            {currentSubject?.top_scorers?.map((student, index) => (
              <View key={index} style={styles.performerRow}>
                <Text style={styles.performerName}>{student.name}</Text>
                <Text style={styles.performerScore}>{student.marks}%</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <MarksModal />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  picker: {
    height: 50,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  successText: {
    color: '#22c55e',
  },
  dangerText: {
    color: '#ef4444',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
    justifyContent: 'space-between'
  },
  performersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 50,
    paddingBottom: 50
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
  performerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  performerName: {
    fontSize: 14,
    color: '#475569',
  },
  performerScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  studentName: {
    fontSize: 14,
    color: '#1e293b',
  },
  studentMarks: {
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
  },
  studentGrade: {
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
  },
});

export default ExamStatsDashboard;