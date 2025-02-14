import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Type Definitions
interface AttendanceRecord {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'DEFAULT';
}

interface SummaryData {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

interface ApiResponse {
  success: boolean;
  response: {
    attendanceData: Array<{
      date: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE';
    }>;
    overall: SummaryData;
    thisMonth: SummaryData;
  };
}

// Color Constants
const COLORS = {
  primary: '#2C3E50',
  background: '#ECF0F1',
  white: '#FFFFFF',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
  },
  status: {
    present: { light: '#E8F5E9', dark: '#006400' },
    absent: { light: '#FFEBEE', dark: '#E74C3C' },
    late: { light: '#FFF3E0', dark: '#F39C12' },
    default: { light: '#F5F5F5', dark: '#95A5A6' }
  }
};

const { width } = Dimensions.get('window');

const SPACING = {
  xs: 4, sm: 8, df: 20, md: 12, lg: 11, xl: 20, xxl: 24
};

const TYPOGRAPHY = {
  xtraSmall: 8, small: 12, normal: 14, medium: 16, large: 18, xlarge: 22
};

const generateDummyAttendance = (year: number, month: number): AttendanceRecord[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const attendanceStatuses: AttendanceRecord['status'][] = ['PRESENT', 'ABSENT', 'LATE'];

  return Array.from({ length: daysInMonth }, (_, day) => {
    const date = new Date(year, month, day + 1);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      return {
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`,
        status: 'DEFAULT'
      };
    }

    // Weighted randomness for statuses
    const randomValue = Math.random();
    let status: AttendanceRecord['status'];

    if (randomValue < 0.7) status = 'PRESENT';
    else if (randomValue < 0.9) status = 'LATE';
    else status = 'ABSENT';

    return {
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`,
      status
    };
  });
};

const AttendanceCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord['status']>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<{
    thisMonth: SummaryData;
    overall: SummaryData;
  }>({
    thisMonth: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 },
    overall: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 }
  });

  // Fetch attendance data (now using dummy data)
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1; // API uses 1-indexed months
        const studentId = '10'; // Replace with actual student ID

        const response = await fetch(
          `https://testcode-2.onrender.com/school/getAttendaceByStudentId?studentId=${studentId}&year=${year}&month=${month}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const data: ApiResponse = await response.json();

        if (data.success) {
          const { attendanceData, overall, thisMonth } = data.response;

          // Convert API data to component's format
          const formattedData = attendanceData.reduce((acc, item) => {
            const date = new Date(item.date);
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            acc[dateString] = item.status;
            return acc;
          }, {} as Record<string, AttendanceRecord['status']>);

          setAttendanceData(formattedData);
          setSummary({
            thisMonth,
            overall
          });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch attendance data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedDate]);

  // Status style mapping
  const getStatusStyle = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT': return {
        background: ['#E8F5E9', '#27AE60'] as const,
        icon: 'check-circle',
        textColor: '#000000'
      };
      case 'ABSENT': return {
        background: ['#FFEBEE', '#E74C3C'] as const,
        icon: 'times-circle',
        textColor: '#FFFFFF'
      };
      case 'LATE': return {
        background: ['#FFF3E0', '#F39C12'] as const,
        icon: 'clock',
        textColor: 'blue'
      };
      default: return {
        background: ['#F5F5F5', '#95A5A6'] as const,
        icon: 'house',
        textColor: '#0e0301'
      };
    }
  };

  // Change month navigation
  const changeMonth = (direction: number): void => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const generateCalendarDays = () => {
    const daysInMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), daysInMonth).getDay();

    const paddingDaysStart = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const paddingDaysEnd = lastDayOfMonth === 0 ? 0 : 7 - lastDayOfMonth;

    return (
      <>
        {/* Padding Days at Start */}
        {[...Array(paddingDaysStart)].map((_, index) => (
          <View key={`padding-start-${index}`} style={styles.calendarDay} />
        ))}

        {/* Days in the Month */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const status = attendanceData[dateString] || 'DEFAULT';
          const statusStyle = getStatusStyle(status);

          return (
            <LinearGradient
              key={day}
              colors={statusStyle.background}
              style={[styles.calendarDay, styles.shadowElevation]}
            >
              <View style={styles.dayContent}>
                <Text style={[styles.dayNumber, { color: statusStyle.textColor }]}>
                  {day}
                </Text>
                <Text style={[styles.dayStatus, { color: statusStyle.textColor }]}>
                  {status}
                </Text>
              </View>
            </LinearGradient>
          );
        })}

        {/* Padding Days at End */}
        {[...Array(paddingDaysEnd)].map((_, index) => (
          <View key={`padding-end-${index}`} style={styles.calendarDay} />
        ))}
      </>
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={COLORS.primary} 
          style={styles.loadingIndicator}
        />
        <Text style={styles.loadingText}>Loading Attendance Data...</Text>
      </View>
    );
  }


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Month Navigation */}
      <LinearGradient
        colors={['#34495E', '#2C3E50']}
        style={[styles.monthNavigation, styles.shadowElevation]}
      >
        <TouchableOpacity
          onPress={() => changeMonth(-1)}
          style={styles.navButton}
        >
          <FontAwesome name="chevron-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          onPress={() => changeMonth(1)}
          style={styles.navButton}
        >
          <FontAwesome name="chevron-right" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Overall Attendance Statistics */}
      <View style={styles.overallStatsContainer}>
        <LinearGradient
          colors={['#2980B9', '#2980B9']}
          style={[styles.overallStatsCard, styles.shadowElevation]}
        >
          <Text style={styles.overallStatsTitle}>Overall Attendance</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Working Days</Text>
              <Text style={styles.statValue}>{summary.overall.total}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Present</Text>
              <Text style={[styles.statValue, styles.presentColor]}>
                {summary.overall.present} ({summary.overall.percentage}%)
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Absent</Text>
              <Text style={[styles.statValue, styles.absentColor]}>
                {summary.overall.absent}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Late</Text>
              <Text style={[styles.statValue, styles.lateColor]}>
                {summary.overall.late}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Monthly Attendance Summary */}
      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={['#27AE60', '#27AE60']}
          style={[styles.summaryCard, styles.shadowElevation]}
        >
          <Text style={styles.summaryTitle}>This Month</Text>
          <View style={styles.summaryDetails}>
            {[
              { label: 'Total Days', value: summary.thisMonth.total },
              { label: 'Present', value: summary.thisMonth.present, color: 'black' },
              { label: 'Absent', value: summary.thisMonth.absent, color: COLORS.status.absent.dark },
              { label: 'Late', value: summary.thisMonth.late, color: COLORS.status.late.dark },
              { label: 'Percentage', value: summary.thisMonth.percentage?`${summary.thisMonth.percentage} %`: '0%' }
            ].map(({ label, value, color }) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={color ? { color: COLORS.white } : {}}>{label}</Text>
                <Text style={color ? { color, fontWeight: 'bold' } : {}}>{value}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <Text key={day} style={styles.dayHeader}>{day}</Text>
        ))}
        {generateCalendarDays()}
      </View>
    </ScrollView>
  );
};

const shadowElevation = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  android: {
    elevation: 10,
    shadowColor: 'blue',
    padding: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    marginBottom: 30
  },
  default: {}
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: SPACING.lg,
    borderBottomRightRadius: SPACING.lg,
  },
  navButton: {
    padding: SPACING.md,
  },
  monthTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.large,
    fontWeight: 'bold',
  },
  overallStatsContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    color: '#FF1493'
  },
  overallStatsCard: {
    borderRadius: SPACING.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  overallStatsTitle: {
    fontSize: TYPOGRAPHY.medium,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.small,
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.medium,
    fontWeight: 'bold',
  },
  presentColor: {
    color: COLORS.status.present.dark,
  },
  absentColor: {
    color: COLORS.status.absent.dark,
  },
  lateColor: {
    color: COLORS.status.late.dark,
  },
  summaryContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  summaryCard: {
    borderRadius: SPACING.md,
    padding: SPACING.xxl,
    marginBottom: SPACING.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
        padding: 10
      },
    }),
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.medium,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
    color: COLORS.white,
  },
  summaryDetails: {
    gap: SPACING.sm,
    padding: 2
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    padding:25,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  dayHeader: {
    width: width / 7 - 3,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.small,
    fontWeight: 'bold',
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  calendarDay: {
    width: width / 7 - SPACING.lg,
    height: width / 7,
    borderRadius: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
        shadowColor: 'red'
      },
    }),
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: TYPOGRAPHY.medium,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  dayStatus: {
    fontSize: TYPOGRAPHY.xtraSmall,
    marginTop: SPACING.xs,
  },
  shadowElevation: {
    ...shadowElevation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingIndicator: {
    marginBottom: 20
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.medium
  }
});

export default AttendanceCalendar;