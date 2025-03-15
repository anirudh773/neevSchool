import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons, FontAwesome } from "@expo/vector-icons"
import * as SecureStore from 'expo-secure-store'

const { width } = Dimensions.get('window')

interface TimetableEntry {
  id: number;
  dayName: string;
  slotName: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
}

interface SchoolDay {
  id: number;
  dayName: string;
}

interface SchoolPeriod {
  id: number;
  periodName: string;
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

const YourTimetable = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([])
  const [days, setDays] = useState<SchoolDay[]>([])
  const [periods, setPeriods] = useState<SchoolPeriod[]>([])
  const [selectedDay, setSelectedDay] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  // Get user data once at component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = await SecureStore.getItemAsync('userData')
        if (!userData) {
          throw new Error('User data not found')
        }

        const parsedUserInfo: UserInfo = JSON.parse(userData)
        setUserInfo(parsedUserInfo)

        // Call other fetch functions with the user info
        await Promise.all([
          fetchMasterData(parsedUserInfo),
          fetchTimetable(parsedUserInfo)
        ])
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  const fetchMasterData = async (userInfo: UserInfo) => {
    try {
      const response = await fetch(
        `https://neevschool.sbs/school/getSchudeleMasterData?schoolId=${userInfo.schoolId}`
      )
      const result = await response.json()
      
      if (result.success) {
        setDays(result.data.schoolDays)
        setPeriods(result.data.schoolPeriod)
        setSelectedDay(result.data.schoolDays[0]?.dayName || '')
      }
    } catch (err) {
    }
  }

  const fetchTimetable = async (userInfo: UserInfo) => {
    try {
      setIsLoading(true)
      const { studentClass, schoolId } = userInfo
      const { classId, sectionId } = studentClass

      const response = await fetch(
        `https://neevschool.sbs/school/getSchoolTimetable?schoolId=${schoolId}&classId=${classId}&sectionId=${sectionId}`
      )
      const result = await response.json()
      if (result.success) {
        setTimetableData(result.data)
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const getSubjectForPeriod = (day: string, period: string): TimetableEntry | undefined => {
    return timetableData.find(
      item => item.dayName === day && item.slotName === period
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A237E" />
        <Text style={styles.loadingText}>Loading your timetable...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Your Weekly Timetable</Text>
        {userInfo && (
          <Text style={styles.subtitle}>
            Class {userInfo.studentClass.className} - Section {userInfo.studentClass.sectionName}
          </Text>
        )}
      </View>

      <View style={styles.dayPickerContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.daySelector}
          contentContainerStyle={styles.daySelectorContent}
        >
          {days.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={[styles.dayButton, selectedDay === day.dayName && styles.selectedDay]}
              onPress={() => setSelectedDay(day.dayName)}
            >
              <Text style={[styles.dayName, selectedDay === day.dayName && styles.selectedDayText]}>
                {day.dayName.slice(0, 3)}
              </Text>
              <Text style={[styles.dayNumber, selectedDay === day.dayName && styles.selectedDayText]}>
                {day.dayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.mainContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {periods.map((period) => {
          const scheduleItem = getSubjectForPeriod(selectedDay, period.periodName)
          return (
            <View key={period.id} style={styles.periodCard}>
              <View style={styles.periodHeader}>
                <View style={styles.periodBadge}>
                  <Text style={styles.periodText}>{period.periodName}</Text>
                  <Text style={styles.timeText}>
                    {scheduleItem?.startTime?.slice(0, 5)} - {scheduleItem?.endTime?.slice(0, 5)}
                  </Text>
                </View>
              </View>
              
              {scheduleItem ? (
                <View style={styles.subjectContainer}>
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectName}>{scheduleItem.subjectName}</Text>
                    <Text style={styles.teacherName}>{scheduleItem.teacherName}</Text>
                  </View>
                  <FontAwesome name="book" size={24} color="#1A237E" style={styles.subjectIcon} />
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.emptyText}>No class scheduled</Text>
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F9',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dayPickerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 1,
  },
  daySelector: {
    flexGrow: 0,
    maxHeight: 80,
  },
  daySelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#F5F6F9',
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 64,
  },
  selectedDay: {
    backgroundColor: '#1A237E',
    borderColor: '#1A237E',
    elevation: 2,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
  },
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  periodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 100,
  },
  periodHeader: {
    padding: 12,
    backgroundColor: '#F5F6F9',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  subjectContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#666',
  },
  subjectIcon: {
    marginLeft: 16,
  },
  emptySlot: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1A237E',
  },
})

export default YourTimetable