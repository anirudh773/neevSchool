"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { FontAwesome } from "@expo/vector-icons"
import * as SecureStore from 'expo-secure-store'

const { width } = Dimensions.get('window')

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

interface Subject {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  section: string;
}

interface TeacherSchedule {
  id: number;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: Subject;
  class: Class;
  room: string | null;
}

interface TeacherTimetableResponse {
  success: boolean;
  data: {
    teacherId: string;
    academicYear: string;
    schedule: TeacherSchedule[];
  };
}

interface UserInfo {
  id: number;
  userId: string;
  schoolId: number;
  name: string;
  role: number;
  teacherId: number;
}

const TeacherWeeklyTimetable = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [timetableData, setTimetableData] = useState<TeacherSchedule[]>([])
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    loadUserInfoAndSchedule()
  }, [])

  const loadUserInfoAndSchedule = async () => {
    try {
      const userInfoStr = await SecureStore.getItemAsync('userData')
      if (userInfoStr) {
        const userInfo: UserInfo = JSON.parse(userInfoStr)
        setUserInfo(userInfo)
        await fetchTeacherSchedule(userInfo.schoolId, userInfo.teacherId)
      }
    } catch (error) {
      console.error('Error loading user info:', error)
    }
  }

  const fetchTeacherSchedule = async (schoolId: number, teacherId: number) => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `https://testcode-2.onrender.com/school/getTeacherTimetable?schoolId=${schoolId}&teacherId=${teacherId}`
      )
      const result: TeacherTimetableResponse = await response.json()
      
      if (result.success) {
        setTimetableData(result.data.schedule)
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderTimetableForDay = (day: string) => {
    const dayData = timetableData.filter((item) => item.day === day)
      .sort((a, b) => a.period - b.period)

    return (
      <View style={styles.dayContainer}>
        {dayData.map((item) => (
          <View key={item.id} style={styles.classCard}>
            <View style={styles.periodBadge}>
              <Text style={styles.periodNumber}>Period {item.period}</Text>
              <Text style={styles.periodTime}>
                {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
              </Text>
            </View>
            
            <View style={styles.classInfo}>
              <View style={styles.subjectSection}>
                <FontAwesome name="book" size={20} color="#1A237E" />
                <Text style={styles.subjectText}>{item.subject.name}</Text>
              </View>
              
              <View style={styles.detailsSection}>
                <View style={styles.detailItem}>
                  <FontAwesome name="users" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    Class {item.class.name} - {item.class.section}
                  </Text>
                </View>
                {item.room && (
                  <View style={styles.detailItem}>
                    <FontAwesome name="building" size={16} color="#666" />
                    <Text style={styles.detailText}>Room {item.room}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
        
        {dayData.length === 0 && (
          <View style={styles.emptyDay}>
            <FontAwesome name="calendar-o" size={24} color="#999" />
            <Text style={styles.emptyDayText}>No classes scheduled</Text>
          </View>
        )}
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#1A237E" />
          <Text style={styles.loadingText}>Loading your schedule...</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>My Teaching Schedule</Text>
      </View>

      <View style={styles.dayPickerContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, selectedDay === day && styles.selectedDay]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayButtonText, selectedDay === day && styles.selectedDayText]}>
                {day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scheduleContainer}
        contentContainerStyle={styles.scheduleContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTimetableForDay(selectedDay)}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F9",
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: 'bold',
    color: '#1A237E',
  },
  dayPickerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  daySelector: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F6F9',
    minWidth: width * 0.2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedDay: {
    backgroundColor: '#1A237E',
    borderColor: '#1A237E',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
  },
  selectedDayText: {
    color: '#fff',
  },
  scheduleContainer: {
    flex: 1,
  },
  scheduleContent: {
    padding: 16,
  },
  dayContainer: {
    gap: 12,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 12,
  },
  periodBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E8EAF6',
  },
  periodNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
  },
  periodTime: {
    fontSize: 14,
    color: '#666',
  },
  classInfo: {
    padding: 12,
    gap: 12,
  },
  subjectSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  detailsSection: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  emptyDay: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 8,
  },
  emptyDayText: {
    fontSize: 16,
    color: '#999',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1A237E',
  },
})

export default TeacherWeeklyTimetable

