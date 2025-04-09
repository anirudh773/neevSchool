import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';

// Define TypeScript interfaces
interface Month {
  month: string;
  amount: string;
  status: 'PENDING' | 'PAID';
  dueDate?: string;
  classFeeId?: number; // Added classFeeId property
}
interface Student {
  id: number;
  name: string;
  parentName: string;
  mobileNumber: string;
  email: string;
  sectionName: string;
}

interface FeeType {
  id: number;
  name: string;
  frequency: 'Monthly' | 'Yearly' | 'One Time';
  totalAmount: string;
  status?: 'PENDING' | 'PAID';
  months: Month[];
}

interface StudentDetails {
  name: string;
  class: string;
  section: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

interface FeeSummary {
  totalFees: string;
  totalPaid: string;
  totalBalance: string;
}

interface StudentFeesData {
  studentDetails: StudentDetails;
  academicYear: AcademicYear;
  feeTypes: FeeType[];
  summary: FeeSummary;
}

interface FormData {
  amount: string;
  paymentMode: string;
  paymentDate: Date;
  receiptNumber: string;
  remarks: string;
}

interface PaymentMode {
  id: string;
  name: string;
}

// Component definition
const SubmitPaymentScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<StudentFeesData | null>(null);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    paymentMode: 'cash',
    paymentDate: new Date(),
    receiptNumber: '',
    remarks: '',
  });

  // Parse student data only once when component mounts
  useEffect(() => {
    if (params.student && typeof params.student === 'string') {
      try {
        const parsedStudent = JSON.parse(params.student as string);
        setStudent(parsedStudent);
        // setToken()
      } catch (error) {
        console.error('Error parsing student data:', error);
      }
    }
  }, []); // Empty dependency array as params won't change

  // Fetch student fees data
  const fetchStudentFees = useCallback(async () => {
    if (!student?.id) return;
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(
        `https://neevschool.sbs/school/student-fees?student_id=${student.id}&academic_year_id=1`,
        {
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch student fees');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setStudentFees(result.data.data);
      } else {
        throw new Error(result.message || 'Failed to fetch student fees');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    if (student?.id) {
      fetchStudentFees();
    }
  }, [student?.id, fetchStudentFees]);

  // Handle fee selection
  const handleFeeSelect = (feeTypeId: number, month: string | null = null) => {
    setSelectedFees(prev => {
      const newSet = new Set(prev);
      const key = month ? `${feeTypeId}_${month}` : `${feeTypeId}`;
      
      if (prev.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      
      return newSet;
    });
  };

  // Calculate selected amount
  const selectedAmount = useMemo(() => {
    if (!studentFees) return 0;
    
    let total = 0;
    studentFees.feeTypes.forEach(feeType => {
      if (feeType.frequency === "Monthly") {
        feeType.months.forEach(monthData => {
          const key = `${feeType.id}_${monthData.month}`;
          if (selectedFees.has(key)) {
            total += parseFloat(monthData.amount);
          }
        });
      } else {
        if (selectedFees.has(`${feeType.id}`)) {
          total += parseFloat(feeType.totalAmount);
        }
      }
    });
    
    return total;
  }, [studentFees, selectedFees]);

  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, paymentDate: selectedDate }));
    }
  };

  // Handle form changes
  const handleFormChange = (field: keyof FormData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

// Submit payment
const handleSubmit = async () => {
  if (selectedFees.size === 0) {
    Alert.alert('Error', 'Please select at least one fee to pay');
    return;
  }

  if (!formData.receiptNumber) {
    Alert.alert('Error', 'Please enter receipt number');
    return;
  }

  try {
    setLoading(true);
    
    // Month name to number mapping
    const monthMap: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    
    // Prepare submissions array from selected fees
    const submissions = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    for (const feeKey of selectedFees) {
      const parts = feeKey.split('_');
      const feeTypeId = parseInt(parts[0]);
      const month = parts.length > 1 ? parts[1] : monthNames[new Date().getMonth()]
      
      // Find the corresponding fee type with this ID
      const feeType = studentFees?.feeTypes.find(f => f.id === feeTypeId);
      
      if (feeType) {
          // For monthly fees
          if(feeType.frequency == 'Monthly') {
            const monthData = feeType.months.find(m => m.month === month);
            if (monthData) {
              // Use the classFeeId from the monthData instead of the feeTypeId
              submissions.push({
                classFeeId: monthData.classFeeId, // Use the specific classFeeId from monthData
                amount: parseFloat(monthData.amount),
                month: monthMap[month] // Convert month name to number
              });
            }
          } else {
            const monthData = feeType.months[0];
             // Use the classFeeId from the monthData instead of the feeTypeId
             submissions.push({
              classFeeId: monthData.classFeeId, // Use the specific classFeeId from monthData
              amount: monthData.amount,
              month: monthMap[month] // Convert month name to number
            });
          }
        
      }
    }
    
    // Get token from secure store
    const token = await SecureStore.getItemAsync('userToken');
    
    // Prepare payment data
    const paymentData = {
      studentId: student?.id,
      academicYearId: 1,
      fees: submissions,
      trxId: formData.receiptNumber,
      totalAmounAtThatTrx: `Payment for ${formData.paymentDate.toLocaleDateString()} - ₹${selectedAmount.toLocaleString()}`
    };
    
    // Make API call
    const response = await fetch('https://neevschool.sbs/school/submitFeePayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    if (result.success && result) {
      Alert.alert(
        'Success',
        'Payment recorded successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      throw new Error(result.message || 'Failed to submit payment');
    }
  } catch (err: any) {
    Alert.alert('Error', err.message || 'Failed to submit payment');
  } finally {
    setLoading(false);
  }
};

  // Helper function to format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Render monthly fee item - Modified to allow selection of future months
  const renderMonthlyFeeItem = (feeType: FeeType) => {
    return (
      <View key={`fee-type-${feeType.id}`} style={styles.feeTypeContainer}>
        <View style={styles.feeTypeHeader}>
          <View style={styles.feeTypeIconContainer}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#512da8" />
          </View>
          <View style={styles.feeTypeInfo}>
            <Text style={styles.feeTypeName}>{feeType.name}</Text>
            <Text style={styles.feeTypeFrequency}>{feeType.frequency} • ₹{parseFloat(feeType.totalAmount).toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.monthsContainer}>
          {feeType.months.map((monthData, index) => {
            // Modified: Allow selection of all months, regardless of status
            const isMonthSelectable = monthData.status === "PENDING" || monthData.status !== "PAID";
            const key = `${feeType.id}_${monthData.month}`;
            const isSelected = selectedFees.has(key);
            
            return (
              <TouchableOpacity
                key={`month-${monthData.month}`}
                style={[
                  styles.monthItem,
                  isSelected && styles.selectedMonthItem,
                  !isMonthSelectable && styles.disabledMonthItem
                ]}
                onPress={() => isMonthSelectable && handleFeeSelect(feeType.id, monthData.month)}
                disabled={!isMonthSelectable}
              >
                <View style={styles.monthTopRow}>
                  <Text style={[styles.monthName, isSelected && styles.selectedText]}>
                    {monthData.month}
                  </Text>
                  {monthData.status === "PAID" && (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>PAID</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.monthDetailsRow}>
                  <Text style={[styles.monthAmount, isSelected && styles.selectedText]}>
                    ₹{parseFloat(monthData.amount).toLocaleString()}
                  </Text>
                  {monthData.dueDate && (
                    <Text style={styles.dueDateText}>
                      Due: {formatDate(monthData.dueDate)}
                    </Text>
                  )}
                </View>
                
                {isMonthSelectable && (
                  <View style={[styles.checkCircle, isSelected && styles.selectedCheckCircle]}>
                    <MaterialIcons 
                      name={isSelected ? "check-circle" : "radio-button-unchecked"} 
                      size={24} 
                      color={isSelected ? "#4caf50" : "#ddd"} 
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render yearly fee item
  const renderYearlyFeeItem = (feeType: FeeType) => {
    const isSelected = selectedFees.has(`${feeType.id}`);
    const isPending = feeType.status === "PENDING";
    
    return (
      <TouchableOpacity
        key={`fee-type-${feeType.id}`}
        style={[
          styles.yearlyFeeItem,
          isSelected && styles.selectedYearlyFeeItem,
          !isPending && styles.disabledYearlyFeeItem
        ]}
        onPress={() => isPending && handleFeeSelect(feeType.id)}
        disabled={!isPending}
      >
        <View style={styles.yearlyFeeContent}>
          <View style={styles.yearlyFeeIconContainer}>
            <MaterialCommunityIcons
              name="cash-register"
              size={28}
              color={isSelected ? "#4caf50" : "#512da8"}
            />
          </View>
          
          <View style={styles.yearlyFeeInfo}>
            <Text style={[styles.yearlyFeeName, isSelected && styles.selectedText]}>
              {feeType.name}
            </Text>
            <Text style={styles.yearlyFeeFrequency}>
              {feeType.frequency} • Due: {formatDate(feeType.months[0]?.dueDate)}
            </Text>
          </View>
          
          <View style={styles.yearlyFeeAmountContainer}>
            <Text style={[styles.yearlyFeeAmount, isSelected && styles.selectedText]}>
              ₹{parseFloat(feeType.totalAmount).toLocaleString()}
            </Text>
            {isPending ? (
              <View style={[styles.checkCircle, isSelected && styles.selectedCheckCircle]}>
                <MaterialIcons 
                  name={isSelected ? "check-circle" : "radio-button-unchecked"} 
                  size={24} 
                  color={isSelected ? "#4caf50" : "#ddd"} 
                />
              </View>
            ) : (
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>PAID</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const paymentModes: PaymentMode[] = [
    { id: 'cash', name: 'Cash' },
    { id: 'upi', name: 'UPI' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'cheque', name: 'Cheque' },
  ];

  if (loading && !studentFees) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#512da8" />
          <Text style={styles.loadingText}>Loading student fees...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#f44336" />
          <Text style={styles.errorText}>Failed to load student fees</Text>
          <Text style={styles.errorSubText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#512da8" />
        </TouchableOpacity>
        <Text style={styles.title}>Fee Payment</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Student Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={24} color="#512da8" />
            <Text style={styles.cardTitle}>Student Details</Text>
          </View>
          <View style={styles.studentInfoContainer}>
            <Text style={styles.studentName}>
              {studentFees?.studentDetails.name}
            </Text>
            <View style={styles.studentDetailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Class</Text>
                <Text style={styles.detailValue}>
                  {studentFees?.studentDetails.class} {studentFees?.studentDetails.section}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Academic Year</Text>
                <Text style={styles.detailValue}>
                  {studentFees?.academicYear.name}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fee Structure */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#512da8" />
            <Text style={styles.cardTitle}>Fee Structure</Text>
          </View>

          {/* Monthly and Yearly Fees */}
          {studentFees?.feeTypes.map(feeType => 
            feeType.frequency === "Monthly" 
              ? renderMonthlyFeeItem(feeType)
              : renderYearlyFeeItem(feeType)
          )}
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-donut" size={24} color="#512da8" />
            <Text style={styles.cardTitle}>Payment Summary</Text>
          </View>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Fees</Text>
              <Text style={styles.summaryValue}>
                ₹{parseFloat(studentFees?.summary.totalFees || "0").toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Paid</Text>
              <Text style={styles.summaryValue}>
                ₹{parseFloat(studentFees?.summary.totalPaid || "0").toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Selection</Text>
              <Text style={[styles.summaryValue, styles.selectedAmount]}>
                ₹{selectedAmount.toLocaleString()}
              </Text>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Balance Due</Text>
              <Text style={styles.totalValue}>
                ₹{parseFloat(studentFees?.summary.totalBalance || "0").toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Details Form */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="payment" size={24} color="#512da8" />
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Payment Amount*</Text>
              <TextInput
                style={styles.formInput}
                value={selectedAmount.toString()}
                editable={false}
                placeholder="0.00"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Payment Mode*</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.paymentMode}
                  onValueChange={(value) => handleFormChange('paymentMode', value as string)}
                  style={styles.picker}
                >
                  {paymentModes.map(mode => (
                    <Picker.Item key={mode.id} label={mode.name} value={mode.id} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Payment Date*</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formData.paymentDate.toLocaleDateString()}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color="#512da8" />
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={formData.paymentDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Receipt Number*</Text>
              <TextInput
                style={styles.formInput}
                value={formData.receiptNumber}
                onChangeText={(value) => handleFormChange('receiptNumber', value)}
                placeholder="Enter receipt number"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Remarks</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.remarks}
                onChangeText={(value) => handleFormChange('remarks', value)}
                placeholder="Enter any additional notes (optional)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || selectedFees.size === 0) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading || selectedFees.size === 0}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                Submit Payment (₹{selectedAmount.toLocaleString()})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Define proper TypeScript types for styles
interface Style {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  title: TextStyle;
  content: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  errorSubText: TextStyle;
  card: ViewStyle;
  cardHeader: ViewStyle;
  cardTitle: TextStyle;
  studentInfoContainer: ViewStyle;
  studentName: TextStyle;
  studentDetailsRow: ViewStyle;
  detailItem: ViewStyle;
  detailLabel: TextStyle;
  detailValue: TextStyle;
  feeTypeContainer: ViewStyle;
  feeTypeHeader: ViewStyle;
  feeTypeIconContainer: ViewStyle;
  feeTypeInfo: ViewStyle;
  feeTypeName: TextStyle;
  feeTypeFrequency: TextStyle;
  monthsContainer: ViewStyle;
  monthItem: ViewStyle;
  selectedMonthItem: ViewStyle;
  disabledMonthItem: ViewStyle;
  monthTopRow: ViewStyle;
  monthName: TextStyle;
  selectedText: TextStyle;
  monthDetailsRow: ViewStyle;
  monthAmount: TextStyle;
  dueDateText: TextStyle;
  checkCircle: ViewStyle;
  selectedCheckCircle: ViewStyle;
  paidBadge: ViewStyle;
  paidBadgeText: TextStyle;
  yearlyFeeItem: ViewStyle;
  selectedYearlyFeeItem: ViewStyle;
  disabledYearlyFeeItem: ViewStyle;
  yearlyFeeContent: ViewStyle;
  yearlyFeeIconContainer: ViewStyle;
  yearlyFeeInfo: ViewStyle;
  yearlyFeeName: TextStyle;
  yearlyFeeFrequency: TextStyle;
  yearlyFeeAmountContainer: ViewStyle;
  yearlyFeeAmount: TextStyle;
  summaryContainer: ViewStyle;
  summaryRow: ViewStyle;
  summaryLabel: TextStyle;
  summaryValue: TextStyle;
  selectedAmount: TextStyle;
  totalRow: ViewStyle;
  totalLabel: TextStyle;
  totalValue: TextStyle;
  formContainer: ViewStyle;
  formGroup: ViewStyle;
  formLabel: TextStyle;
  formInput: TextStyle;
  textArea: TextStyle;
  pickerContainer: ViewStyle;
  picker: ViewStyle;
  dateButton: ViewStyle;
  dateButtonText: TextStyle;
  footer: ViewStyle;
  submitButton: ViewStyle;
  submitButtonDisabled: ViewStyle;
  submitButtonText: TextStyle;
}

const styles = StyleSheet.create<Style>({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 16,
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  studentInfoContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#512da8',
    paddingLeft: 16,
    marginLeft: 2,
    marginTop: 4,
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  studentDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    marginRight: 24,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  feeTypeContainer: {
    marginBottom: 20,
  },
  feeTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  feeTypeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8eaf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#512da8',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  feeTypeInfo: {
    flex: 1,
  },
  feeTypeName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  feeTypeFrequency: {
    fontSize: 14,
    color: '#666',
  },
  monthsContainer: {
    marginLeft: 16,
    marginTop: 8,
  },
  monthItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#512da8',
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedMonthItem: {
    backgroundColor: '#e8f5e9',
    borderLeftColor: '#4caf50',
  },
  disabledMonthItem: {
    opacity: 0.6,
  },
  monthTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: '#4caf50',
  },
  monthDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  monthAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#512da8',
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
  },
  checkCircle: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  selectedCheckCircle: {
    transform: [{ scale: 1.1 }],
  },
  paidBadge: {
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#80cbc4',
  },
  paidBadgeText: {
    fontSize: 12,
    color: '#00897b',
    fontWeight: '600',
  },
  yearlyFeeItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#512da8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedYearlyFeeItem: {
    backgroundColor: '#e8f5e9',
    borderLeftColor: '#4caf50',
  },
  disabledYearlyFeeItem: {
    opacity: 0.6,
  },
  yearlyFeeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearlyFeeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8eaf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  yearlyFeeInfo: {
    flex: 1,
  },
  yearlyFeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yearlyFeeFrequency: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  yearlyFeeAmountContainer: {
    alignItems: 'flex-end',
  },
  yearlyFeeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#512da8',
    marginBottom: 4,
  },
  summaryContainer: {
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8eaf6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedAmount: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
  },
  formContainer: {
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
    marginLeft: 2,
  },
  formInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#333',
    marginTop: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 2,
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginTop: 2,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  footer: {
    padding: 18,
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  submitButton: {
    backgroundColor: '#512da8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#512da8',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  }
});