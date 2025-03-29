import { useState, useEffect } from "react"
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
} from "react-native"
import { useRouter } from "expo-router"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { LinearGradient } from "expo-linear-gradient"
import { Picker } from "@react-native-picker/picker"
import * as SecureStore from 'expo-secure-store';

interface PendingFee {
  id: number;
  amount: number;
  feeType: string;
  period: string;
  dueDate: string;
  status: string;
}

interface Student {
  id: number;
  name: string;
  className: string;
  section: string;
  mobileNumber: string;
  parentName: string;
  pendingFees: PendingFee[];
}

interface PendingFeeResponse {
  success: boolean;
  data: Student[];
}

const PendingFeeList = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

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

  // Fetch pending fees data
  const fetchPendingFees = async (classId: string) => {
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
        `https://neevschool.sbs/school/getStudentsWithPendingFees?schoolId=${userData.schoolId}&classId=${classId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result: PendingFeeResponse = await response.json();
      
      if (result.success) {
        setStudents(result.data);
      } else {
        throw new Error('Failed to fetch pending fees data');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to fetch pending fees data'
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
      fetchPendingFees(selectedClass);
    }
  }, [selectedClass]);

  const toggleExpand = (studentId: number): void => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    return status === 'Overdue' ? '#e53935' : '#fb8c00';
  };

  const calculateTotalPending = (pendingFees: PendingFee[]): number => {
    return pendingFees.reduce((total: number, fee: PendingFee) => total + fee.amount, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#d32f2f', '#c62828', '#b71c1c']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Fee Students</Text>
      </LinearGradient>

      <View style={styles.filterContainer}>
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
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#c62828" />
          <Text style={styles.loaderText}>Loading classes...</Text>
        </View>
      ) : !selectedClass ? (
        <View style={styles.emptyContainer}>
          <Icon name="school-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Please select a class to view pending fees</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {students.length > 0 ? (
            students.map((student) => (
              <View key={student.id} style={styles.studentCard}>
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
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total Pending:</Text>
                      <Text style={styles.totalAmount}>₹{calculateTotalPending(student.pendingFees)}</Text>
                    </View>
                  </View>
                  <Icon 
                    name={expandedStudent === student.id ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color="#c62828" 
                  />
                </TouchableOpacity>

                {expandedStudent === student.id && (
                  <View style={styles.feeContainer}>
                    <Text style={styles.feeTitle}>Pending Fee Details</Text>
                    {student.pendingFees.map((fee) => (
                      <View key={fee.id} style={styles.paymentItem}>
                        <View style={styles.paymentHeader}>
                          <Text style={styles.periodText}>{fee.feeType} - {fee.period}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.status) }]}>
                            <Text style={styles.statusText}>{fee.status}</Text>
                          </View>
                        </View>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Amount Due:</Text>
                          <Text style={styles.paymentValue}>₹{fee.amount}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Due Date:</Text>
                          <Text style={styles.paymentValue}>{formatDate(fee.dueDate)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="check-circle-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No pending fees found for this class</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
    width: 60,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  studentDetails: {
    marginTop: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  detailLabel: {
    fontWeight: '500',
    color: '#444',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginLeft: 10,
  },
  feeContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  paymentItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default PendingFeeList;