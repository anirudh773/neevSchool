import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
} from "react-native"
import { useRouter } from "expo-router"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { LinearGradient } from "expo-linear-gradient"
import { Picker } from "@react-native-picker/picker"
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const HEADER_HEIGHT = 60;
const FILTER_HEIGHT = 70;

interface FeePayment {
  id: number;
  amount: number;
  feeType: string;
  period: string;
  submittedAt: string;
  paymentMode: string;
  remarks: string;
}

interface Student {
  id: number;
  name: string;
  className: string;
  section: string;
  mobileNumber: string;
  parentName: string;
  feePayments: FeePayment[];
}

interface PaidFeeResponse {
  success: boolean;
  data: Student[];
}

const StudentFeeList: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch classes from SecureStore
  const fetchClasses = async () => {
    try {
      const storedClasses = await SecureStore.getItemAsync('schoolClasses');
      if (storedClasses) {
        const parsedClasses = JSON.parse(storedClasses);
        setClasses(parsedClasses);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch paid fees data
  const fetchPaidFees = async (classId: string) => {
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }

      const userData = JSON.parse(userDataStr);
      if (!userData.schoolId) {
        throw new Error('School ID not found');
      }

      const response = await fetch(
        `https://neevschool.sbs/school/getStudentsPaidFees?schoolId=${userData.schoolId}&classId=${classId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result: PaidFeeResponse = await response.json();
      
      if (result.success) {
        setStudents(result.data);
      } else {
        throw new Error('Failed to fetch paid fees data');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to fetch paid fees data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchClasses();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setLoading(true);
      fetchPaidFees(selectedClass);
    }
  }, [selectedClass]);

  const toggleExpand = (studentId: number): void => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
    setExpandedMonth(null); // Reset expanded month when toggling student
  };

  const toggleMonth = (month: string): void => {
    setExpandedMonth(expandedMonth === month ? null : month);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupPaymentsByMonth = (payments: FeePayment[]): { [key: string]: FeePayment[] } => {
    return payments.reduce((groups: { [key: string]: FeePayment[] }, payment) => {
      const month = new Date(payment.submittedAt).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(payment);
      return groups;
    }, {});
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT + FILTER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT - FILTER_HEIGHT],
    extrapolate: 'clamp',
  });

  const filterTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT + FILTER_HEIGHT],
    outputRange: [0, -FILTER_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT + FILTER_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          }
        ]}
      >
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fee Payment Records</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View 
        style={[
          styles.filterContainer,
          {
            transform: [{ translateY: filterTranslateY }],
          }
        ]}
      >
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Class:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedClass}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedClass(itemValue)}
              enabled={!loading}
            >
              <Picker.Item label="Select a class" value="" />
              {classes.map((classItem) => (
                <Picker.Item 
                  key={classItem.id} 
                  label={classItem.name} 
                  value={classItem.id} 
                />
              ))}
            </Picker>
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b5998" />
          <Text style={styles.loaderText}>Loading classes...</Text>
        </View>
      ) : !selectedClass ? (
        <View style={styles.emptyContainer}>
          <Icon name="school-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Please select a class to view paid fees</Text>
        </View>
      ) : (
        <Animated.ScrollView 
          style={styles.scrollView}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.studentGrid}>
            {students.length > 0 ? (
              students.map((student) => (
                <View key={student.id} style={[
                  styles.studentCard,
                  isTablet && styles.tabletCard
                ]}>
                  <TouchableOpacity 
                    style={styles.studentHeader}
                    onPress={() => toggleExpand(student.id)}
                  >
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <View style={styles.studentDetails}>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Class: </Text>
                          {student.className} | <Text style={styles.detailLabel}>Section: </Text>
                          {student.section}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Mobile: </Text>
                          {student.mobileNumber}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Parent: </Text>
                          {student.parentName}
                        </Text>
                      </View>
                    </View>
                    <Icon 
                      name={expandedStudent === student.id ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#3b5998" 
                    />
                  </TouchableOpacity>

                  {expandedStudent === student.id && (
                    <View style={styles.feeContainer}>
                      <Text style={styles.feeTitle}>Fee Payment History</Text>
                      {Object.entries(groupPaymentsByMonth(student.feePayments)).map(([month, payments]) => (
                        <View key={month} style={styles.monthContainer}>
                          <TouchableOpacity
                            style={styles.monthHeader}
                            onPress={() => toggleMonth(month)}
                          >
                            <Text style={styles.monthTitle}>{month}</Text>
                            <Icon 
                              name={expandedMonth === month ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color="#666" 
                            />
                          </TouchableOpacity>
                          {expandedMonth === month && (
                            <View style={styles.monthPayments}>
                              {payments.map((payment) => (
                                <View key={payment.id} style={styles.paymentItem}>
                                  <View style={styles.paymentRow}>
                                    <Text style={styles.paymentLabel}>Amount:</Text>
                                    <Text style={styles.paymentValue}>₹{payment.amount}</Text>
                                  </View>
                                  <View style={styles.paymentRow}>
                                    <Text style={styles.paymentLabel}>Fee Type:</Text>
                                    <Text style={styles.paymentValue}>{payment.feeType}</Text>
                                  </View>
                                  <View style={styles.paymentRow}>
                                    <Text style={styles.paymentLabel}>Period:</Text>
                                    <Text style={styles.paymentValue}>{payment.period}</Text>
                                  </View>
                                  <View style={styles.paymentRow}>
                                    <Text style={styles.paymentLabel}>Date:</Text>
                                    <Text style={styles.paymentValue}>{formatDate(payment.submittedAt)}</Text>
                                  </View>
                                  {payment.paymentMode && (
                                    <View style={styles.paymentRow}>
                                      <Text style={styles.paymentLabel}>Payment Mode:</Text>
                                      <Text style={styles.paymentValue}>{payment.paymentMode}</Text>
                                    </View>
                                  )}
                                  {payment.remarks && (
                                    <View style={styles.paymentRow}>
                                      <Text style={styles.paymentLabel}>Remarks:</Text>
                                      <Text style={styles.paymentValue}>{payment.remarks}</Text>
                                    </View>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="check-circle-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No paid fees found for this class</Text>
              </View>
            )}
          </View>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: isTablet ? 24 : 18,
    fontWeight: 'bold',
  },
  filterContainer: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 15,
    height: FILTER_HEIGHT,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterLabel: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '500',
    marginRight: 10,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    marginTop: HEADER_HEIGHT + FILTER_HEIGHT,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  studentGrid: {
    padding: 15,
    flexDirection: isTablet ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  tabletCard: {
    width: '48%',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  studentDetails: {
    marginTop: 5,
  },
  detailText: {
    fontSize: isTablet ? 16 : 14,
    color: '#666',
    marginBottom: 3,
  },
  detailLabel: {
    fontWeight: '500',
    color: '#444',
  },
  feeContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  feeTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  monthContainer: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f1f5f9',
  },
  monthTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#333',
  },
  monthPayments: {
    padding: 10,
  },
  paymentItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  paymentLabel: {
    fontSize: isTablet ? 15 : 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: isTablet ? 15 : 14,
    color: '#333',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: isTablet ? 18 : 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: isTablet ? 18 : 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default StudentFeeList;