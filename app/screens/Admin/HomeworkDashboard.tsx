import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native"
import { Appbar, Title, Text, Surface } from "react-native-paper"
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import StatsSummary from "../../../components/StatsSummary"
import TodaysSubmissions from "../../../components/TodaysSubmissions"

const { width, height } = Dimensions.get('window');

interface HomeworkSubmission {
  id: string;
  class: string;
  section: string;
  subject: string;
  date: Date;
  description: string;
  imageUri?: string;
  documentUri?: string;
  documentName?: string;
  status: "Submitted" | "Pending";
}

const HomeworkDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>([]);

  useEffect(() => {
    fetchSubmissionsForDate(new Date());
  }, []);

  const onDateChange = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
      fetchSubmissionsForDate(selected);
    }
  };

  const fetchSubmissionsForDate = (date: Date) => {
    // Mock data with more realistic examples
    const mockSubmissions: HomeworkSubmission[] = [
      {
        id: '1',
        class: '10',
        section: 'A',
        subject: 'Mathematics',
        date: date,
        description: 'Solve Quadratic Equations (Chapter 4, Ex 4.2)',
        status: 'Submitted',
      },
      {
        id: '2',
        class: '9',
        section: 'B',
        subject: 'Physics',
        date: date,
        description: 'Newton\'s Laws of Motion Assignment',
        status: 'Pending',
      },
      {
        id: '3',
        class: '10',
        section: 'C',
        subject: 'Chemistry',
        date: date,
        description: 'Periodic Table Elements Quiz Preparation',
        status: 'Submitted',
      },
      {
        id: '4',
        class: '8',
        section: 'A',
        subject: 'Biology',
        date: date,
        description: 'Draw and Label Plant Cell Diagram',
        status: 'Pending',
      },
      {
        id: '5',
        class: '9',
        section: 'A',
        subject: 'English',
        date: date,
        description: 'Write an Essay on Environmental Conservation',
        status: 'Submitted',
      }
    ];

    setHomeworkSubmissions(mockSubmissions);
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.headerCard}>
        <Text style={styles.headerTitle}>Homework Dashboard</Text>
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
        bounces={true}
      >
        <Surface style={styles.statsCard}>
          <StatsSummary />
        </Surface>
        
        <Surface style={styles.submissionsCard}>
          <TodaysSubmissions submissions={homeworkSubmissions} />
        </Surface>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  )
}

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
  headerTitle: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
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
  bottomSpacing: {
    height: 20,
  },
})

export default HomeworkDashboard

