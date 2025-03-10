import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native"
import { Text, Surface } from "react-native-paper"
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import StatsSummary from "../../../components/StatsSummary"
import TodaysSubmissions from "../../../components/TodaysSubmissions"
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const { width, height } = Dimensions.get('window');

// Update the interfaces
interface Stats {
  totalHomeWork: number;
  activeTeachers: number;
  totalClasses: number;
  submitted: number;
  pending: number;
}

interface HomeworkSubmission {
  id: string;
  class: string;
  section: string;
  subject: string;
  date: string;
  description: string;
  status: "Submitted" | "Pending";
}

interface DashboardData {
  totalSubmissionStats: {
    totalHomeWork: number;
    activeTeachers: number;
    totalClasses: number;
  };
  todaysHomework: {
    submitted: number;
    pending: number;
  };
  submissions: Array<{
    id: number;
    class: string;
    section: string;
    subject: string;
    date: string;
    description: string;
    status: "Submitted" | "Pending";
  }>;
}

const HomeworkDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStatsData] = useState<Stats>({
    totalHomeWork: 0,
    activeTeachers: 0,
    totalClasses: 0,
    submitted: 0,
    pending: 0
  });
  const [formattedSubmissions, setFormattedSubmissions] = useState<HomeworkSubmission[]>([]);

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  const onDateChange = (_: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchDashboardData = async (date: Date) => {
    try {
      setIsLoading(true);
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) return;

      const { schoolId } = JSON.parse(userData);
      const formattedDate = formatDate(date);

      const response = await fetch(
        `https://13.202.16.149:8080/school/getHomeworkDashboard?schoolId=${schoolId}&date=${formattedDate}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        setDashboardData(data);

        // Update stats
        setStatsData({
          totalHomeWork: data.totalSubmissionStats.totalHomeWork,
          activeTeachers: data.totalSubmissionStats.activeTeachers,
          totalClasses: data.totalSubmissionStats.totalClasses,
          submitted: data.todaysHomework.submitted,
          pending: data.todaysHomework.pending
        });

        // Update submissions
        const formattedData = data.submissions.map((sub: {
          id: number;
          class: string;
          section: string;
          subject: string;
          date: string;
          description: string;
          status: "Submitted" | "Pending";
        }) => ({
          id: String(sub.id),
          class: sub.class,
          section: sub.section,
          subject: sub.subject,
          date: sub.date,
          description: sub.description,
          status: sub.status
        }));
        setFormattedSubmissions(formattedData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.headerCard}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <FontAwesome name="calendar" size={20} color="#1A237E" />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </TouchableOpacity>
      </Surface>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.statsCard}>
          <StatsSummary stats={stats} />
        </Surface>

        <Surface style={styles.submissionsCard}>
          <TodaysSubmissions 
            submissions={formattedSubmissions} 
            selectedDate={selectedDate}
            pending = {stats.pending}
          />
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerCard: {
    padding: 12,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 2,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F5F6F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: Math.min(16, width * 0.04),
    color: '#1A237E',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 16,
  },
  statsCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: Math.min(120, height * 0.15),
  },
  submissionsCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: Math.min(200, height * 0.3),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  }
});

export default HomeworkDashboard;

