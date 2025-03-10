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
import { useRouter } from 'expo-router';

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

const AttendanceAnalytics: React.FC = () => {
	const router = useRouter();
	const [classes, setClasses] = useState<ClassData[]>([]);
	const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
	const [selectedSection, setSelectedSection] = useState<Section | null>(null);
	const [modalType, setModalType] = useState<'class' | 'section' | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
	const [students, setStudents] = useState<Student[]>([]);

	const { width } = Dimensions.get('window');
	const isTablet = width >= 768;

	// Fetch attendance data from API
	const fetchAttendanceData = async (sectionId: string) => {
		try {
			const startDate = '2025-01-01';
			const endDate = '2025-01-26';
			setLoading(true);

			const response = await fetch(
				`https://13.202.16.149:8080/school/getAttendaceBySectionId?sectionId=${sectionId}&startDate=${startDate}&endDate=${endDate}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch attendance data');
			}

			const data = await response.json();
			if(data.success){
				setStudents(data.response);
				setLoading(false);
				return data.response;
			}
			setStudents([])
			return [];
			
		} catch (error) {
			setLoading(false);
			console.error('Error fetching attendance:', error);
			setError('Failed to fetch attendance data. Please try again.');
			return [];
		}
	};

	// Generate weekly trends
	const generateWeeklyTrends = useCallback(() => {
		const trends: WeeklyTrend[] = [];
		const weeks = 4;
		let baseAttendance = 85;

		for (let i = 0; i < weeks; i++) {
			const variation = Math.random() * 10 - 5;
			trends.push({
				week: `Week ${weeks - i}`,
				attendance: Math.min(100, Math.max(0, baseAttendance + variation))
			});
			baseAttendance += Math.random() * 2 - 1;
		}

		return trends;
	}, []);

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
			const classesData = await SecureStore.getItemAsync('schoolClasses');
			if (classesData) {
				setClasses(JSON.parse(classesData));
			}
			setWeeklyTrends(generateWeeklyTrends());
		} catch (error) {
			console.error('Error loading classes:', error);
			setError('Failed to load class data. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [generateWeeklyTrends]);

	// Effect to fetch attendance when section is selected
	useEffect(() => {
		if (selectedSection) {
			fetchAttendanceData(selectedSection.id);
		}
	}, [selectedSection]);

	// Refresh handler
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		Promise.all([
			loadClassesData(),
			selectedSection ? fetchAttendanceData(selectedSection.id) : Promise.resolve()
		]).finally(() => setRefreshing(false));
	}, [loadClassesData, selectedSection]);

	useEffect(() => {
		loadClassesData();
	}, [loadClassesData]);

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
		const attendanceColor = parseFloat(stats.presentPercentage) >= 75 ? '#4CAF50' : '#F44336';

		return (
			<View style={styles.studentCard}>
				<View style={styles.studentPhotoContainer}>
					<Image
						source={{ uri: 'https://via.placeholder.com/150' }}
						style={styles.studentPhoto}
					/>
				</View>

				<View style={styles.studentInfo}>
					<Text style={styles.studentName} numberOfLines={1}>
						{student.name}
					</Text>
					<Text style={styles.rollNumber}>
						{student.rollNumber}
					</Text>

					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Text style={[styles.statCount, { color: '#4CAF50' }]}>
								{stats.presentDays}
							</Text>
							<Text style={styles.statLabel}>P</Text>
						</View>

						<View style={styles.statItem}>
							<Text style={[styles.statCount, { color: '#F44336' }]}>
								{stats.absentDays}
							</Text>
							<Text style={styles.statLabel}>A</Text>
						</View>

						<View style={styles.statItem}>
							<Text style={[styles.statCount, { color: '#FF9800' }]}>
								{stats.lateDays}
							</Text>
							<Text style={styles.statLabel}>L</Text>
						</View>
					</View>

					<View style={styles.percentageContainer}>
						<View style={styles.percentageBar}>
							<View
								style={[
									styles.percentageFill,
									
								]}
							/>
						</View>
						<Text style={[styles.percentageText, { color: attendanceColor }]}>
							{stats.presentPercentage}%
						</Text>
					</View>
				</View>
			</View>
		);
	};

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
						onRefresh={onRefresh}
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

				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#2196F3" />
						<Text style={styles.loadingText}>Loading data...</Text>
					</View>
				) : selectedClass && selectedSection ? (
					<>
						<View style={styles.header}>
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
						</View>

						{/* Section Statistics */}
						{renderSectionStats(calculateSectionStats(students))}

						{/* Weekly Trends */}
						{renderWeeklyTrends()}

						{/* Student Cards */}
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
		padding: 16,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		borderBottomWidth: 1,
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
		fontSize: 14,
		color: '#666'
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
		padding: 15,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginHorizontal: -5,
	},
	gridItem: {
		width: '50%',
		paddingHorizontal: 5,
		marginBottom: 10,
	},
	studentCard: {
		backgroundColor: 'white',
		borderRadius: 12,
		padding: 12,
		flexDirection: 'row',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	studentPhotoContainer: {
		marginRight: 12,
	},
	studentPhoto: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#f0f0f0',
	},
	studentInfo: {
		flex: 1,
	},
	studentName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 4,
	},
	rollNumber: {
		fontSize: 12,
		color: '#666',
		marginBottom: 8,
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
		paddingRight: 10,
	},
	statItem: {
		alignItems: 'center',
	},
	statCount: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	percentageContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	percentageBar: {
		flex: 1,
		height: 4,
		backgroundColor: '#e0e0e0',
		borderRadius: 2,
		overflow: 'hidden',
	},
	percentageFill: {
		height: '100%',
		borderRadius: 2,
	},
	percentageText: {
		fontSize: 12,
		fontWeight: 'bold',
		width: 45,
	}
});

export default AttendanceAnalytics;