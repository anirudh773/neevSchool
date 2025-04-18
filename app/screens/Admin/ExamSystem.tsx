import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Card, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Animated } from 'react-native';
import ExamScheduleCard from '@/components/exam/ExamScheduleCard';

interface ExamStats {
  ongoingExams: number;
  upcomingExams: number;
  completedExams: number;
  totalStudents: number;
}

interface QuickAction {
  icon: string;
  label: string;
  color: string;
}

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
  section_id: number;
}

interface Exam {
  id: number;
  name: string;
  date: string;
  status: 'Ongoing' | 'Upcoming' | 'Completed';
  participation: string;
  class: string;
  schedules: Schedule[];
}

interface Class {
  id: number;
  name: string;
  sections: Section[];
}

interface Section {
  id: number;
  name: string;
}

const ExamDashboardScreen: React.FC = () => {
  const router = useRouter();

  // States
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<Class>();
  const [selectedSection, setSelectedSection] = useState<Section>();
  const [showClassPicker, setShowClassPicker] = useState<boolean>(false);
  const [showSectionPicker, setShowSectionPicker] = useState<boolean>(false);
  const [examStats, setExamStats] = useState<ExamStats>()
  const [recentExams, setRecentExams] = useState<Exam[]>([])
  const [allRecentExams, setallRecentExams] = useState<Exam[]>([])
  const [recentExamsLoading, setRecentExamsLoading] = useState<boolean>(false);

  const quickActions: QuickAction[] = [
    { icon: 'add-circle', label: 'New Exam', color: '#4CAF50' },
    { icon: 'calendar', label: 'Schedule', color: '#2196F3' },
    { icon: 'stats-chart', label: 'Reports', color: '#9C27B0' },
    { icon: 'notifications', label: 'Alerts', color: '#FF9800' }
  ];

  useFocusEffect(
    useCallback(() => {
      loadClassesData();
      loadExamMaterData();
      if (selectedClass && selectedSection) {
        fetchRecentExams();
      }
    }, [selectedClass, selectedSection])
  );

  const loadClassesData = async () => {
    try {
      setLoading(true);
      let userInfo = await SecureStore.getItemAsync('userData');
      userInfo = JSON.parse(userInfo);
      if(userInfo && userInfo.role && userInfo.role == 2 ){
        const classesData = await SecureStore.getItemAsync('teacherClasses');
        if (classesData) {
          const parsedData = JSON.parse(classesData);
          setClasses(parsedData || []);
        }
      } else{
        const classesData = await SecureStore.getItemAsync('schoolClasses');
        if (classesData) {
          const parsedData = JSON.parse(classesData);
          setClasses(parsedData || []);
        }
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  };

  const loadExamMaterData = async () => {
    try {
      setLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }
      
      // Parse user data and get schoolId
      const userData: { schoolId: number } = JSON.parse(userDataStr);
      if (!userData.schoolId) {
        throw new Error('School ID not found');
      }

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
        // Only set exam stats and master data
        setExamStats(data.data.examStats);

        // Set master data for next page 
        await Promise.all([
          SecureStore.setItemAsync('subjectBySchool', JSON.stringify(data.data.subjectBySchool)),
          SecureStore.setItemAsync('examType', JSON.stringify(data.data.examType))
        ]);
      } else {
        throw new Error(data.message || 'Failed to load exam data');
      }

    } catch (err) {
      console.error('Error loading exam data:', err);
      Alert.alert('Error', 'Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExams = async () => {
    try {
      if (!selectedClass || !selectedSection) return;
      
      setRecentExamsLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }
      const userData = JSON.parse(userDataStr);

      const response = await fetch(
        `http://13.202.16.149:8080/school/getRecentExam?schoolId=${userData.schoolId}&classId=${selectedClass.id}&sectionId=${selectedSection.id}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setRecentExams(data.data.recentExam);
      }
    } catch (error) {
      console.error('Error fetching recent exams:', error);
      Alert.alert('Error', 'Failed to fetch recent exams');
    } finally {
      setRecentExamsLoading(false);
    }
  };

  const getStatusColor = (status: Exam['status']): string => {
    switch (status) {
      case 'Ongoing':
        return '#4CAF50';
      case 'Upcoming':
        return '#2196F3';
      case 'Completed':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    switch (action.label) {
      case 'New Exam':
        router.push({
          pathname: '/screens/Admin/AddExamScreeen',
          params: { selectedClasses: selectedClass.id, selectedSection: selectedSection.id }
        })
        break;
      case 'Schedule':
        // router.push('/screens/Admin/ScheduleScreen');
        break;
      case 'Reports':
        router.push('/screens/Admin/ExamDashboard');
        break;
      case 'Alerts':
        // router.push('/screens/Admin/AlertsScreen');
        break;
    }
  };

  const handleViewDetails = (exam: any) => {
    router.push({
      pathname: '/screens/Admin/FeedMarksScreen',
      params: { classId: selectedClass.name, sectionId: selectedSection.id, sectionName: selectedSection.name, exam: JSON.stringify(exam.schedules) }
    })
  };

  const handleEditExam = (examId: number) => {
    // router.push({
    //   pathname: '/screens/Admin/EditExam',
    //   params: { examId }
    // });
  };

  const [expandedExams, setExpandedExams] = useState<{ [key: number]: boolean }>({});
  const animationValues = useRef<{ [key: number]: Animated.Value }>({}).current;

  // Add this function before the return statement
  const toggleSchedule = (examId: number) => {
    // Initialize animation value if it doesn't exist
    if (!animationValues[examId]) {
      animationValues[examId] = new Animated.Value(0);
    }

    const isExpanded = expandedExams[examId];
    setExpandedExams(prev => ({
      ...prev,
      [examId]: !isExpanded
    }));

    Animated.timing(animationValues[examId], {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const renderStatsGrid = () => {
    // Early return if examStats is not available
    if (!examStats) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    // Default values if specific stats are null/undefined
    const stats = {
      ongoingExams: examStats.ongoingExams ?? 0,
      upcomingExams: examStats.upcomingExams ?? 0,
      completedExams: examStats.completedExams ?? 0,
      totalStudents: examStats.totalStudents ?? 0
    };

    return (
      <View style={styles.statsGrid}>
        <Surface style={[styles.statsCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.statsNumber}>{stats.ongoingExams}</Text>
          <Text style={styles.statsLabel}>Ongoing Exams</Text>
        </Surface>
        <Surface style={[styles.statsCard, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.statsNumber}>{stats.upcomingExams}</Text>
          <Text style={styles.statsLabel}>Upcoming Exams</Text>
        </Surface>
        <Surface style={[styles.statsCard, { backgroundColor: '#9C27B0' }]}>
          <Text style={styles.statsNumber}>{stats.completedExams}</Text>
          <Text style={styles.statsLabel}>Completed</Text>
        </Surface>
        <Surface style={[styles.statsCard, { backgroundColor: '#FF9800' }]}>
          <Text style={styles.statsNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statsLabel}>Total Students</Text>
        </Surface>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.cardHeader}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.cardTitle}>Exam Management</Text>
        <Text style={styles.cardSubtitle}>Manage class test and exams</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {renderStatsGrid()}
        {renderHeader()}

        <View style={styles.selectors}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowClassPicker(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedClass ? `Class ${selectedClass.name}` : 'Select Class'}
            </Text>
            <FontAwesome name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdown, !selectedClass && styles.dropdownDisabled]}
            onPress={() => selectedClass && setShowSectionPicker(true)}
            disabled={!selectedClass}
          >
            <Text style={styles.dropdownText}>
              {selectedSection ? `Section ${selectedSection.name}` : 'Select Section'}
            </Text>
            <FontAwesome name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {selectedClass && selectedSection ? (
          <ScrollView>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionButton}
                  onPress={() => handleQuickAction(action)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon as any} size={24} color="white" />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent Exams</Text>
            {recentExamsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : recentExams.length > 0 ? (
              recentExams.map((exam) => (
                <ExamScheduleCard
                  key={exam.id}
                  exam={exam}
                  isExpanded={expandedExams[exam.id]}
                  animationValue={animationValues[exam.id] || new Animated.Value(0)}
                  onToggle={() => toggleSchedule(exam.id)}
                  onViewDetails={() => handleViewDetails(exam)}
                  onEdit={() => handleEditExam(exam.id)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No exams found</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Please select both class and section to view the exam
            </Text>
          </View>
        )}
      </View>

      {/* Class Picker Modal */}
      <Modal
        visible={showClassPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClassPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Class</Text>
            <ScrollView>
              {classes.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedClass(cls);
                    setSelectedSection(null);
                    setShowClassPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>Class {cls.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowClassPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Section Picker Modal */}
      <Modal
        visible={showSectionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSectionPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Section</Text>
            <ScrollView>
              {selectedClass?.sections.map(section => (
                <TouchableOpacity
                  key={section.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedSection(section);
                    setShowSectionPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>Section {section.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSectionPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statsLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  selectors: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  dropdownText: {
    color: '#333',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  examCard: {
    marginBottom: 16,
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  examClass: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  examDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnLabel: {
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectsList: {
    marginTop: 12,
    marginBottom: 8,
  },
  subjectsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  subjectItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  submissionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  submissionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectDetails: {
    marginTop: 4,
  },
  subjectInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  examDateTime: {
    fontSize: 13,
    color: '#666',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default ExamDashboardScreen;