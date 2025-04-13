import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	View,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Text,
	Modal,
	Dimensions,
	RefreshControl,
	ActivityIndicator,
	Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import YouTubeLink from 'components/YouTubeLink';

// Type Definitions
interface Section {
	id: string;
	name: string;
}

interface ClassData {
	id: string;
	name: string;
	sections: Section[];
}

interface StudentAttendance {
	[date: string]: 'PRESENT' | 'ABSENT' | 'LATE';
}

interface Student {
	id: number;
	name: string;
	rollNumber: string;
	section: string;
	attendance: StudentAttendance;
}

interface AttendanceStats {
	presentPercentage: string;
	presentDays: number;
	absentDays: number;
	lateDays: number;
	totalDays: number;
}

interface SectionStats {
	sectionName: string;
	averageAttendance: number;
	totalStudents: number;
	regularStudents: number;
	irregularStudents: number;
	lastWeekTrend: number;
}

interface WeeklyTrend {
	week: string;
	attendance: number;
}

interface DateRange {
    startDate: Date;
    endDate: Date;
}

// Add interface for teacher info
interface UserInfo {
	id: number;
	userId: string;
	schoolId: number;
	name: string;
	role: number;
	teacherId: number;
	classTeacherDetails?: {
		sectionId: number;
		sectionName: string;
		classId: number;
		className: string;
	};
}

const CheckAttendence: React.FC = () => {
	const router = useRouter();
	const { youtubeLink } = useLocalSearchParams();
	const [classes, setClasses] = useState<ClassData[]>([]);
	const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
	const [selectedSection, setSelectedSection] = useState<Section | null>(null);
	const [modalType, setModalType] = useState<'class' | 'section' | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
	const [students, setStudents] = useState<Student[]>([]);
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().setDate(new Date().getDate()-30)), // Default to last 28 days
        endDate: new Date()
    });
    const [showDatePicker, setShowDatePicker] = useState<{
        show: boolean;
        type: 'start' | 'end';
    }>({ show: false, type: 'start' });

	// Add userInfo state
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

	const { width } = Dimensions.get('window');
	const isTablet = width >= 768;

    // Format date for API
	const formatDate = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
		const day = String(date.getDate()).padStart(2, '0');
	
		return `${year}-${month}-${day}`;
	};

    // Handle date change
    const onDateChange = (event: any, selectedDate: Date | undefined) => {
        setShowDatePicker({ show: false, type: showDatePicker.type });
        if (selectedDate) {
            setDateRange(prev => ({
                ...prev,
                [showDatePicker.type === 'start' ? 'startDate' : 'endDate']: selectedDate
            }));
        }
    };

	// Fetch attendance data from API
	const fetchAttendanceData = async (sectionId: string) => {
		try {
            const startDateStr = formatDate(dateRange.startDate);
            const endDateStr = formatDate(dateRange.endDate);
            
			setLoading(true);
			const response = await fetch(
				`https://neevschool.sbs/school/getAttendaceBySectionId?sectionId=${sectionId}&startDate=${startDateStr}&endDate=${endDateStr}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch attendance data');
			}

			const data = await response.json();
			if (data.success) {
				setStudents(data.response);
                // Process weekly trends from actual data
                const weeklyTrendsData = processWeeklyTrends(data.response);
                setWeeklyTrends(weeklyTrendsData);
				setLoading(false);
				return data.response;
			}
			setStudents([]);
			return [];

		} catch (error) {
			setLoading(false);
			setError('Failed to fetch attendance data. Please try again.');
			return [];
		}
	};

    // Process weekly trends from actual data
    const processWeeklyTrends = (studentsData: Student[]): WeeklyTrend[] => {
        const weeks: { [key: string]: { total: number; count: number } } = {};
        
        studentsData.forEach(student => {
            Object.entries(student.attendance).forEach(([date, status]) => {
                const weekStart = new Date(date);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekKey = formatDate(weekStart);
                
                if (!weeks[weekKey]) {
                    weeks[weekKey] = { total: 0, count: 0 };
                }
                
                if (status === 'PRESENT') {
                    weeks[weekKey].total += 1;
                }
                weeks[weekKey].count += 1;
            });
        });

        return Object.entries(weeks)
            .map(([week, data]) => ({
                week: `Date${new Date(week).getDate()}/ Month${new Date(week).getMonth() + 1}`,
                attendance: (data.total / data.count) * 100
            }))
            .sort((a, b) => a.week.localeCompare(b.week));
    };

	// Calculate attendance statistics
	const calculateAttendanceStats = useCallback((studentAttendance: StudentAttendance): AttendanceStats => {
		const totalDays = Object.keys(studentAttendance).length;
		const presentDays = Object.values(studentAttendance).filter(status => status === 'PRESENT').length;
		const absentDays = Object.values(studentAttendance).filter(status => status === 'ABSENT').length;
		const lateDays = Object.values(studentAttendance).filter(status => status === 'LATE').length;

		return {
			presentPercentage: totalDays === 0 ? '0.00' : ((presentDays / totalDays) * 100).toFixed(2),
			presentDays,
			absentDays,
			lateDays,
			totalDays
		};
	}, []);

	// Calculate section statistics
	const calculateSectionStats = useCallback((students: Student[]): SectionStats => {
		const totalStudents = students.length;

		const totalAttendance = students.reduce((sum, student) => {
			const stats = calculateAttendanceStats(student.attendance);
			return sum + parseFloat(stats.presentPercentage);
		}, 0);

		const averageAttendance = totalStudents === 0 ? 0 : totalAttendance / totalStudents;
		const regularStudents = students.filter(student => {
			const stats = calculateAttendanceStats(student.attendance);
			return parseFloat(stats.presentPercentage) >= 75;
		}).length;

		return {
			sectionName: selectedSection?.name || '',
			averageAttendance: parseFloat(averageAttendance.toFixed(2)),
			totalStudents,
			regularStudents,
			irregularStudents: totalStudents - regularStudents,
			lastWeekTrend: averageAttendance
		};
	}, [selectedSection, calculateAttendanceStats]);

	// Load classes data
	const loadClassesData = useCallback(async () => {
		try {
			setLoading(true);
			setError('');
			const [classesData, userDataStr] = await Promise.all([
				SecureStore.getItemAsync('schoolClasses'),
				SecureStore.getItemAsync('userData')
			]);

			if (classesData && userDataStr) {
				const userData: UserInfo = JSON.parse(userDataStr);
				setUserInfo(userData);
				const allClasses = JSON.parse(classesData);

				if (userData.role === 2 && userData.classTeacherDetails) {
					// For class teacher, filter to show only their class
					const teacherClass = allClasses.find((c: ClassData) => 
						c.id == userData.classTeacherDetails?.classId.toString()
					);
					
					if (teacherClass) {
						setClasses([teacherClass]);
						setSelectedClass(teacherClass);
						
						const teacherSection = teacherClass.sections.find((s: Section) => 
							s.id == userData.classTeacherDetails?.sectionId.toString()
						);
						if (teacherSection) {
							setSelectedSection(teacherSection);
						}
					}
				} else {
					setClasses(allClasses);
				}
			}
		} catch (error) {
			setError('Failed to load class data. Please try again.');
		} finally {
			setLoading(false);
		}
	}, []);

	// Replace the existing useEffect
	useFocusEffect(
		useCallback(() => {
			if (selectedSection) {
				fetchAttendanceData(selectedSection.id);
			}
		}, [selectedSection?.id, dateRange])
	);

	// Initial load only once
	useEffect(() => {
		loadClassesData();
	}, []); // Empty dependency array for initial load only

	// Render weekly trends chart
	const renderWeeklyTrends = () => (
		<View style={styles.trendCard}>
			<Text style={styles.trendTitle}>Weekly Attendance Trends</Text>

			{weeklyTrends.map((trend, index) => (
				<View key={trend.week} style={styles.trendRow}>
					<Text style={styles.trendLabel}>{trend.week}</Text>
					<View style={styles.trendBar}>
						<View
							style={[
								styles.trendFill,
								{ width: `${trend.attendance}%` }
							]}
						/>
					</View>
					<Text style={styles.trendValue}>{trend.attendance.toFixed(1)}%</Text>
				</View>
			))}
		</View>
	);

	// Render section statistics
	const renderSectionStats = (stats: SectionStats) => (
		<View style={styles.sectionStatsCard}>
			<Text style={styles.sectionTitle}>Section {stats.sectionName} Overview</Text>

			<View style={styles.statsGrid}>
				<View style={styles.statBox}>
					<Text style={styles.statValue}>{stats.averageAttendance}%</Text>
					<Text style={styles.statLabel}>Average Attendance</Text>
				</View>

				<View style={styles.statBox}>
					<Text style={styles.statValue}>{stats.totalStudents}</Text>
					<Text style={styles.statLabel}>Total Students</Text>
				</View>

				<View style={styles.statBox}>
					<Text style={[styles.statValue, { color: '#4CAF50' }]}>
						{stats.regularStudents}
					</Text>
					<Text style={styles.statLabel}>Regular (≥75%)</Text>
				</View>

				<View style={styles.statBox}>
					<Text style={[styles.statValue, { color: '#F44336' }]}>
						{stats.irregularStudents}
					</Text>
					<Text style={styles.statLabel}>Irregular (＜75%)</Text>
				</View>
			</View>

			<View style={styles.trendIndicator}>
				<Text style={styles.trendIndicatorLabel}>Last Week:</Text>
				<Text style={[
					styles.trendIndicatorValue,
					{ color: stats.lastWeekTrend >= 75 ? '#4CAF50' : '#F44336' }
				]}>
					{stats.lastWeekTrend.toFixed(1)}%
				</Text>
			</View>
		</View>
	);

	const renderStudentCard = (student: Student) => {
		const stats = calculateAttendanceStats(student.attendance);
		const attendancePercentage = parseFloat(stats.presentPercentage);
		const getStatusColor = () => {
			if (attendancePercentage >= 90) return '#22C55E';
			if (attendancePercentage >= 75) return '#3B82F6';
			return '#EF4444';
		};
		const statusColor = getStatusColor();

		return (
			<View style={styles.studentCard}>
				{/* Header with attendance indicator */}
				<View style={[styles.attendanceIndicator, { backgroundColor: `${statusColor}20` }]}>
					<FontAwesome name="circle" size={8} color={statusColor} />
					<Text style={[styles.attendanceText, { color: statusColor }]}>
						{attendancePercentage}% Attendance
					</Text>
				</View>

				{/* Student Info */}
				<View style={styles.studentInfo}>
					<View style={styles.nameContainer}>
						<Text style={styles.studentName} numberOfLines={1}>
							{student.name}
						</Text>
						<View style={styles.rollNoContainer}>
							<Text style={styles.rollNoLabel}>Roll No:</Text>
							<Text style={styles.rollNoValue}>{student.rollNumber}</Text>
						</View>
					</View>
				</View>

				{/* Attendance Stats */}
				<View style={styles.statsContainer}>
					<View style={styles.statBox}>
						<View style={[styles.statIconBg, { backgroundColor: '#22C55E20' }]}>
							<FontAwesome name="check" size={14} color="#22C55E" />
						</View>
						<Text style={styles.statCount}>{stats.presentDays}</Text>
						<Text style={styles.statLabel}>Present</Text>
					</View>
					<View style={styles.statBox}>
						<View style={[styles.statIconBg, { backgroundColor: '#EF444420' }]}>
							<FontAwesome name="times" size={14} color="#EF4444" />
						</View>
						<Text style={styles.statCount}>{stats.absentDays}</Text>
						<Text style={styles.statLabel}>Absent</Text>
					</View>
					<View style={styles.statBox}>
						<View style={[styles.statIconBg, { backgroundColor: '#F59E0B20' }]}>
							<FontAwesome name="clock-o" size={14} color="#F59E0B" />
						</View>
						<Text style={styles.statCount}>{stats.lateDays}</Text>
						<Text style={styles.statLabel}>Late</Text>
					</View>
				</View>
			</View>
		);
	};

	const formatDatekk = (date: Date) => {
		return date.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	};
	

// Render date selection buttons
const renderDateSelection = () => (
    <View style={styles.dateSelectionContainer}>
        <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker({ show: true, type: 'start' })}
        >
            <Text style={styles.dateButtonLabel}>Start Date</Text>
            <Text style={styles.dateButtonText}>
                {formatDatekk(dateRange.startDate)}
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker({ show: true, type: 'end' })}
        >
            <Text style={styles.dateButtonLabel}>End Date</Text>
            <Text style={styles.dateButtonText}>
                {formatDatekk(dateRange.endDate)}
            </Text>
        </TouchableOpacity>

        {showDatePicker.show && (
            <DateTimePicker
                value={showDatePicker.type === 'start' ? dateRange.startDate : dateRange.endDate}
                mode="date"
                onChange={onDateChange}
                maximumDate={new Date()}
            />
        )}
    </View>
);

	// Render modal
	const renderModal = () => (
		<Modal
			transparent
			visible={!!modalType}
			animationType="slide"
			onRequestClose={() => setModalType(null)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalHeaderText}>
								{modalType === 'class' ? 'Select Class' : 'Select Section'}
							</Text>
							<TouchableOpacity
								onPress={() => setModalType(null)}
								style={styles.modalCloseButton}
							>
								<FontAwesome name="close" size={20} color="#666" />
							</TouchableOpacity>
						</View>
	
						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.modalScrollContent}
						>
							{modalType === 'class'
								? classes.map(classItem => (
									<TouchableOpacity
										key={classItem.id}
										style={styles.modalListItem}
										onPress={() => {
											setSelectedClass(classItem);
											setSelectedSection(null);
											setModalType(null);
										}}
									>
										<Text style={styles.modalListItemText}>Class {classItem.name}</Text>
										<FontAwesome name="chevron-right" size={16} color="#2196F3" />
									</TouchableOpacity>
								))
								: selectedClass?.sections.map(section => (
									<TouchableOpacity
										key={section.id}
										style={styles.modalListItem}
										onPress={() => {
											setSelectedSection(section);
											setModalType(null);
										}}
									>
										<Text style={styles.modalListItemText}>Section {section.name}</Text>
										<FontAwesome name="chevron-right" size={16} color="#2196F3" />
									</TouchableOpacity>
								))
							}
						</ScrollView>
					</View>
				</View>
			</Modal>
		);
	
		// Main render
		return (
			<SafeAreaView style={styles.container}>
				<ScrollView
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => {}}
							colors={['#2196F3']}
							tintColor="#2196F3"
						/>
					}
				>
					{error && (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>{error}</Text>
						</View>
					)}

{youtubeLink && typeof youtubeLink === 'string' && (
              <YouTubeLink url={youtubeLink} size={20} />
            )}
	
					<View style={[styles.selectors, { flexDirection: isTablet ? 'row' : 'column' }]}>
						<TouchableOpacity
							style={[
								styles.dropdown,
								{
									width: isTablet ? '45%' : '100%',
									marginBottom: isTablet ? 0 : 10
								}
							]}
							onPress={() => setModalType('class')}
						>
							<Text style={styles.dropdownText}>
								{selectedClass ? `Class ${selectedClass.name}` : 'Select Class'}
							</Text>
							<FontAwesome name="chevron-down" size={12} color="#666" />
						</TouchableOpacity>
	
						<TouchableOpacity
							style={[
								styles.dropdown,
								!selectedClass && styles.dropdownDisabled,
								{
									width: isTablet ? '45%' : '100%',
									marginLeft: isTablet ? 10 : 0
								}
							]}
							onPress={() => selectedClass && setModalType('section')}
							disabled={!selectedClass}
						>
							<Text style={styles.dropdownText}>
								{selectedSection ? `Section ${selectedSection.name}` : 'Select Section'}
							</Text>
							<FontAwesome name="chevron-down" size={12} color="#666" />
						</TouchableOpacity>
					</View>

					{selectedClass && selectedSection ? (<View style={styles.header}>
								<TouchableOpacity
									style={styles.addButton}
									onPress={() => router.push({
										pathname: '/screens/Teacher/FeedAttendence',
										params: {
											classId: selectedClass.name,
											sectionId: selectedSection.id,
											sectionName: selectedSection.name
										}
									})}
								>
									<FontAwesome name="plus" size={16} color="#ffffff" />
									<Text style={styles.addButtonText}>Add Attendance</Text>
								</TouchableOpacity>
							</View>): []}
	
					{selectedClass && selectedSection && renderDateSelection()}
			
	
					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color="#2196F3" />
							<Text style={styles.loadingText}>Loading data...</Text>
						</View>
					) : selectedClass && selectedSection ? (
						<>
							{renderSectionStats(calculateSectionStats(students))}
							{renderWeeklyTrends()}
	
							<View style={styles.studentGridContainer}>
								<Text style={styles.sectionSubtitle}>Student Details</Text>
								<View style={styles.grid}>
									{students.map(student => (
										<View key={student.id} style={styles.gridItem}>
											{renderStudentCard(student)}
										</View>
									))}
								</View>
							</View>
						</>
					) : (
						<View style={styles.emptyState}>
							<FontAwesome name="bar-chart" size={48} color="#ccc" />
							<Text style={styles.emptyStateText}>
								Please select both class and section to view attendance analytics
							</Text>
						</View>
					)}
	
					{renderModal()}
				</ScrollView>
			</SafeAreaView>
		);
	};
	
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: '#f5f5f5'
		},
		loadingContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 20
		},
		loadingText: {
			marginTop: 10,
			color: '#666',
			fontSize: 16
		},
		header: {
			padding: 0,
			flexDirection: 'row',
			justifyContent: 'center',
			borderBottomWidth: 0,
			borderBottomColor: '#e0e0e0'
		},
		selectors: {
			padding: 15,
			justifyContent: 'center',
			alignItems: 'center'
		},
		dropdown: {
			backgroundColor: 'white',
			borderRadius: 12,
			padding: 15,
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 3
		},
		dropdownDisabled: {
			opacity: 0.5
		},
		dropdownText: {
			fontSize: 16,
			color: '#333'
		},
		dateSelectionContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			padding: 15,
			backgroundColor: 'white',
			marginHorizontal: 15,
			marginTop: 10,
			borderRadius: 12,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 3,
		},
		dateButton: {
			flex: 1,
			marginHorizontal: 5,
			padding: 10,
			backgroundColor: '#f5f5f5',
			borderRadius: 8,
			alignItems: 'center',
		},
		dateButtonLabel: {
			fontSize: 12,
			color: '#666',
			marginBottom: 4,
		},
		dateButtonText: {
			fontSize: 14,
			color: '#333',
			fontWeight: 'bold',
		},
		sectionStatsCard: {
			backgroundColor: 'white',
			borderRadius: 16,
			padding: 20,
			margin: 15,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 4
		},
		sectionTitle: {
			fontSize: 20,
			fontWeight: 'bold',
			marginBottom: 20,
			color: '#1a237e'
		},
		sectionSubtitle: {
			fontSize: 18,
			fontWeight: 'bold',
			margin: 15,
			color: '#333'
		},
		statsGrid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'space-between'
		},
		statBox: {
			width: '48%',
			backgroundColor: '#f8f9fa',
			borderRadius: 12,
			padding: 15,
			marginBottom: 15,
			alignItems: 'center'
		},
		statValue: {
			fontSize: 24,
			fontWeight: 'bold',
			color: '#333',
			marginBottom: 5
		},
		statLabel: {
			fontSize: 12,
			color: '#6B7280',
			fontWeight: '500',
		},
		trendCard: {
			backgroundColor: 'white',
			borderRadius: 16,
			padding: 20,
			margin: 15,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 4
		},
		trendTitle: {
			fontSize: 18,
			fontWeight: 'bold',
			marginBottom: 15,
			color: '#333'
		},
		trendRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: 12
		},
		trendLabel: {
			width: 80,
			fontSize: 14,
			color: '#666'
		},
		trendBar: {
			flex: 1,
			height: 8,
			backgroundColor: '#e0e0e0',
			borderRadius: 4,
			overflow: 'hidden',
			marginHorizontal: 10
		},
		trendFill: {
			height: '100%',
			backgroundColor: '#2196F3',
			borderRadius: 4
		},
		trendValue: {
			width: 50,
			fontSize: 14,
			fontWeight: 'bold',
			color: '#333',
			textAlign: 'right'
		},
		trendIndicator: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-end',
			marginTop: 10
		},
		trendIndicatorLabel: {
			fontSize: 14,
			color: '#666',
			marginRight: 5
		},
		trendIndicatorValue: {
			fontSize: 16,
			fontWeight: 'bold'
		},
		modalOverlay: {
			flex: 1,
			backgroundColor: 'rgba(0,0,0,0.5)',
			justifyContent: 'flex-end'
		},
		modalContainer: {
			backgroundColor: 'white',
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
			maxHeight: '80%'
		},
		modalHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: 20,
			borderBottomWidth: 1,
			borderBottomColor: '#e0e0e0'
		},
		modalHeaderText: {
			fontSize: 18,
			fontWeight: 'bold',
			color: '#333'
		},
		modalCloseButton: {
			padding: 5
		},
		modalScrollContent: {
			padding: 10
		},
		modalListItem: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: 15,
			borderBottomWidth: 1,
			borderBottomColor: '#f0f0f0'
		},
		modalListItemText: {
			fontSize: 16,
			color: '#333'
		},
		addButton: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: '#2196F3',
			paddingHorizontal: 16,
			paddingVertical: 10,
			borderRadius: 8,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 2
		},
		addButtonText: {
			color: '#ffffff',
			fontSize: 14,
			fontWeight: '500',
			marginLeft: 8
		},
		emptyState: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 30
		},
		emptyStateText: {
			marginTop: 15,
			fontSize: 16,
			color: '#666',
			textAlign: 'center'
		},
		errorContainer: {
			backgroundColor: '#ffebee',
			padding: 15,
			margin: 15,
			borderRadius: 8
		},
		errorText: {
			color: '#d32f2f',
			textAlign: 'center'
		},
		studentGridContainer: {
			padding: 15
		},
		grid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'space-between',
			marginHorizontal: -5
		},
		gridItem: {
			width: '50%',
			paddingHorizontal: 5,
			marginBottom: 10
		},
		studentCard: {
			backgroundColor: '#FFFFFF',
			borderRadius: 12,
			margin: 8,
			shadowColor: '#0F172A',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.08,
			shadowRadius: 12,
			elevation: 3,
			overflow: 'hidden',
		},
		attendanceIndicator: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 6,
			paddingHorizontal: 12,
			paddingVertical: 6,
		},
		attendanceText: {
			fontSize: 12,
			fontWeight: '600',
		},
		studentInfo: {
			padding: 12,
		},
		nameContainer: {
			gap: 4,
		},
		studentName: {
			fontSize: 16,
			fontWeight: '600',
			color: '#1F2937',
		},
		rollNoContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 4,
		},
		rollNoLabel: {
			fontSize: 13,
			color: '#6B7280',
		},
		rollNoValue: {
			fontSize: 13,
			fontWeight: '500',
			color: '#374151',
		},
		statsContainer: {
			flexDirection: 'row',
			borderTopWidth: 1,
			borderTopColor: '#F1F5F9',
		},
		statIconBg: {
			width: 28,
			height: 28,
			borderRadius: 14,
			justifyContent: 'center',
			alignItems: 'center',
		},
		statCount: {
			fontSize: 16,
			fontWeight: '600',
			color: '#1F2937',
		},
	})

	export default	CheckAttendence