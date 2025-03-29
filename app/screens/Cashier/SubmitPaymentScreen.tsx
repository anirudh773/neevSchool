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
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface Student {
  id: number;
  name: string;
  parentName: string;
  mobileNumber: string;
  email: string;
  sectionName: string;
}

interface FeeStructure {
  id: number;
  feeTypeName: string;
  amount: number;
  dueDate: string;
}

interface PaymentFormData {
  amount: string;
  paymentMode: string;
  paymentDate: Date;
  receiptNumber: string;
  remarks: string;
}

interface CreateFeeResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    class_id: number;
    school_id: number;
    fee_type_id: number;
    amount: string;
    created_at: string;
    updated_at: string;
  };
}

interface FeeCreationData {
  classId: number;
  schoolId: number;
  feeTypeId: number;
  amount: number;
}

// Add new interfaces for pending fees
interface PendingFee {
  classFeeId: number;
  feeTypeId: number;
  feeTypeName: string;
  amount: string;
  frequency: string;
  month?: number;
  year: number;
}

interface PendingFeesResponse {
  success: boolean;
  data: {
    currentMonthFees: PendingFee[];
    otherPendingFees: PendingFee[];
    totalCurrentAmount: number;
    totalPendingAmount: number;
  };
}

// Dummy data
const dummyFeeStructures: FeeStructure[] = [
  { id: 1, feeTypeName: 'Tuition Fee', amount: 5000, dueDate: '2024-04-10' },
  { id: 2, feeTypeName: 'Development Fee', amount: 2000, dueDate: '2024-04-10' },
  { id: 3, feeTypeName: 'Library Fee', amount: 1000, dueDate: '2024-04-10' },
];

const paymentModes = [
  { id: 'cash', name: 'Cash' },
  { id: 'upi', name: 'UPI' },
  { id: 'bank_transfer', name: 'Bank Transfer' },
];

const SubmitPaymentScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [feeStructures] = useState<FeeStructure[]>(dummyFeeStructures);
  const [pendingFees, setPendingFees] = useState<PendingFeesResponse['data'] | null>(null);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFeeCreationForm, setShowFeeCreationForm] = useState(false);
  const [creatingFee, setCreatingFee] = useState(false);
  const [feeCreationData, setFeeCreationData] = useState<FeeCreationData>({
    classId: 0,
    schoolId: 0,
    feeTypeId: 0,
    amount: 0
  });
  
  // Memoize the initial form data
  const initialFormData = useCallback(() => ({
    amount: '',
    paymentMode: 'cash',
    paymentDate: new Date(),
    receiptNumber: '',
    remarks: '',
  }), []);
  
  const [formData, setFormData] = useState<PaymentFormData>(initialFormData());

  // Memoize total fees calculation
  const totalFees = useMemo(() => 
    feeStructures.reduce((sum, fee) => sum + fee.amount, 0),
    [feeStructures]
  );
  
  // Parse student data only once when component mounts
  useEffect(() => {
    if (params.student && typeof params.student === 'string') {
      try {
        const parsedStudent = JSON.parse(params.student);
        setStudent(parsedStudent);
      } catch (error) {
        console.error('Error parsing student data:', error);
      }
    }
  }, []); // Empty dependency array as params won't change

  // Fetch pending fees
  const fetchPendingFees = useCallback(async () => {
    if (!student?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `https://neevschool.sbs/school/getStudentPendingFees/${student.id}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result: PendingFeesResponse = await response.json();
      if (result.success) {
        setPendingFees(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch pending fees');
      }
    } catch (error) {
      // Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch pending fees');
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  // Effect to fetch pending fees when student is loaded
  useEffect(() => {
    if (student?.id) {
      fetchPendingFees();
    }
  }, [student?.id, fetchPendingFees]);

  // Calculate selected amount
  const selectedAmount = useMemo(() => {
    if (!pendingFees) return 0;
    
    const allFees = [...pendingFees.currentMonthFees, ...pendingFees.otherPendingFees];
    return allFees
      .filter(fee => {
        const key = fee.feeTypeName.toLowerCase().includes('tuition') 
          ? `${fee.classFeeId}_${fee.month}`
          : `${fee.classFeeId}`;
        return selectedFees.has(key);
      })
      .reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
  }, [pendingFees, selectedFees]);

  // Handle fee selection
  const handleFeeSelect = useCallback((classFeeId: number, month?: number) => {
    if (!pendingFees) return;
    
    const allFees = [...pendingFees.currentMonthFees, ...pendingFees.otherPendingFees];
    const selectedFee = allFees.find(fee => fee.classFeeId === classFeeId);
    
    if (!selectedFee) return;

    setSelectedFees(prev => {
      const newSet = new Set(prev);
      const isTuitionFee = selectedFee.feeTypeName.toLowerCase().includes('tuition');
      
      // Create a unique key based on whether it's a tuition fee
      const key = isTuitionFee && month 
        ? `${classFeeId}_${month}`
        : `${classFeeId}`;
      
      if (prev.has(key)) {
        // If already selected, remove it
        newSet.delete(key);
      } else {
        if (isTuitionFee) {
          // For tuition fees, first remove any other tuition fee from the same month
          const tuitionKeysToRemove = Array.from(prev).filter(existingKey => {
            const [, existingMonth] = existingKey.split('_');
            return existingKey.includes('_') && existingMonth === month?.toString();
          });
          tuitionKeysToRemove.forEach(keyToRemove => newSet.delete(keyToRemove));
        }
        // Add the new selection
        newSet.add(key);
      }
      
      return newSet;
    });
  }, [pendingFees]);

  // Render fee item
  const renderFeeItem = useCallback((fee: PendingFee, index: number, type: 'current' | 'pending') => {
    const isTuitionFee = fee.feeTypeName.toLowerCase().includes('tuition');
    const key = isTuitionFee && fee.month 
      ? `${fee.classFeeId}_${fee.month}`
      : `${fee.classFeeId}`;
    const isSelected = selectedFees.has(key);
    const monthText = fee.month ? new Date(2000, fee.month - 1).toLocaleString('default', { month: 'long' }) : '';
    const uniqueKey = `${type}-${fee.classFeeId}-${index}`;
    
    return (
      <TouchableOpacity
        key={uniqueKey}
        style={[
          styles.feeItem,
          isSelected && styles.selectedFeeItem,
          { borderLeftWidth: 4, borderLeftColor: isSelected ? '#4caf50' : '#512da8' }
        ]}
        onPress={() => handleFeeSelect(fee.classFeeId, fee.month)}
        activeOpacity={0.7}
      >
        <View style={styles.feeItemHeader}>
          <View style={styles.feeIconContainer}>
            <MaterialCommunityIcons 
              name="cash-multiple" 
              size={24} 
              color={isSelected ? '#4caf50' : '#512da8'} 
            />
          </View>
          <View style={styles.feeTypeContainer}>
            <View style={styles.feeTypeRow}>
              <Text style={[styles.feeType, isSelected && styles.selectedText]}>
                {fee.feeTypeName}
              </Text>
              {isTuitionFee && monthText && (
                <View style={[styles.monthBadge, isSelected && styles.selectedMonthBadge]}>
                  <Text style={[styles.monthBadgeText, isSelected && styles.selectedMonthBadgeText]}>
                    {monthText}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.feePeriod}>
              <MaterialCommunityIcons 
                name="calendar-clock" 
                size={14} 
                color="#666" 
                style={styles.periodIcon}
              />
              {' '}{fee.frequency}{!isTuitionFee && monthText ? ` - ${monthText}` : ''} {fee.year}
            </Text>
          </View>
          <View style={styles.feeAmountContainer}>
            <Text style={[styles.feeAmount, isSelected && styles.selectedText]}>
              ₹{parseFloat(fee.amount).toLocaleString()}
            </Text>
            <View style={[styles.checkCircle, isSelected && styles.selectedCheckCircle]}>
              <MaterialIcons 
                name={isSelected ? "check-circle" : "radio-button-unchecked"} 
                size={24} 
                color={isSelected ? "#4caf50" : "#ddd"} 
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [selectedFees, handleFeeSelect]);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, paymentDate: selectedDate }));
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!student?.id || selectedFees.size === 0) {
      Alert.alert('Error', 'Please select at least one fee to pay');
      return;
    }

    try {
      setLoading(true);

      // Prepare the fees array from selected fees
      const selectedFeesArray = Array.from(selectedFees).map(key => {
        const [classFeeId] = key.split('_');
        const allFees = [...(pendingFees?.currentMonthFees || []), ...(pendingFees?.otherPendingFees || [])];
        const fee = allFees.find(f => f.classFeeId === parseInt(classFeeId));
        return {
          classFeeId: parseInt(classFeeId),
          amount: fee?.amount || "0"
        };
      });

      const paymentData = {
        studentId: student.id,
        trxId: formData.receiptNumber, // Using receipt number as transaction ID
        fees: selectedFeesArray,
        totalAmounAtThatTrx: selectedAmount.toString()
      };

      const response = await fetch('https://neevschool.sbs/school/submitFeePayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        // Refresh fee data
        await fetchPendingFees();
        
        Alert.alert(
          'Success',
          'Payment recorded successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(result.message || 'Failed to submit payment');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  }, [student?.id, selectedFees, pendingFees, selectedAmount, formData.receiptNumber, fetchPendingFees, router]);

  const handleFormChange = useCallback((field: keyof PaymentFormData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCreateFee = async () => {
    if (!feeCreationData.classId || !feeCreationData.feeTypeId || !feeCreationData.amount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setCreatingFee(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }

      const userData = JSON.parse(userDataStr);
      const response = await fetch('https://neevschool.sbs/school/createClassFee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
                },
                body: JSON.stringify({
          ...feeCreationData,
          schoolId: userData.schoolId
        }),
      });

      const result: CreateFeeResponse = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Fee structure created successfully');
        setShowFeeCreationForm(false);
        // Refresh fee structures
        const updatedFeeStructures = [...feeStructures, {
          id: result.data.id,
          feeTypeName: feeTypes.find(ft => ft.id === feeCreationData.feeTypeId)?.name || '',
          amount: parseFloat(result.data.amount),
          dueDate: new Date().toISOString()
        }];
        setFeeStructures(updatedFeeStructures);
              } else {
        throw new Error(result.message || 'Failed to create fee structure');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create fee structure');
    } finally {
      setCreatingFee(false);
    }
  };

  const FeeCreationForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Create New Fee Structure</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Class*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={feeCreationData.classId}
            onValueChange={(value) => setFeeCreationData(prev => ({ ...prev, classId: Number(value) }))}
            style={styles.picker}
          >
            <Picker.Item label="Select Class" value={0} />
            {classes.map(cls => (
              <Picker.Item
                key={cls.id}
                label={cls.name}
                value={cls.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Fee Type*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={feeCreationData.feeTypeId}
            onValueChange={(value) => setFeeCreationData(prev => ({ ...prev, feeTypeId: Number(value) }))}
            style={styles.picker}
          >
            <Picker.Item label="Select Fee Type" value={0} />
            {feeTypes.map(type => (
              <Picker.Item
                key={type.id}
                label={type.name}
                value={type.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Amount*</Text>
        <TextInput
          style={styles.input}
          value={feeCreationData.amount.toString()}
          onChangeText={(value) => setFeeCreationData(prev => ({ ...prev, amount: Number(value.replace(/[^0-9]/g, '')) }))}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setShowFeeCreationForm(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.createButton, creatingFee && styles.buttonDisabled]}
          onPress={handleCreateFee}
          disabled={creatingFee}
        >
          {creatingFee ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Fee</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#666" />
          <Text style={styles.errorText}>Student information not found</Text>
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
        <Text style={styles.title}>Submit Payment</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showFeeCreationForm && <FeeCreationForm />}

        {/* Student Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Details</Text>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentDetail}>Section {student.sectionName}</Text>
            <Text style={styles.studentDetail}>{student.parentName}</Text>
            <Text style={styles.studentDetail}>{student.mobileNumber}</Text>
          </View>
        </View>

        {/* Current Month Fees */}
        {pendingFees?.currentMonthFees.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color="#512da8" />
              <Text style={styles.cardTitle}>Current Month Fees</Text>
            </View>
            {pendingFees.currentMonthFees.map((fee, index) => 
              renderFeeItem(fee, index, 'current')
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color="#512da8" />
              <Text style={styles.cardTitle}>Current Month Fees</Text>
            </View>
            <View style={styles.noFeesContainer}>
              <MaterialCommunityIcons name="cash-remove" size={48} color="#ccc" />
              <Text style={styles.noFeesText}>No fees added to this structure</Text>
              <Text style={styles.noFeesSubText}>Please contact the administrator to add fee structure</Text>
            </View>
          </View>
        )}

        {/* Other Pending Fees */}
        {pendingFees?.otherPendingFees.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons name="calendar-alert" size={24} color="#f44336" />
              <Text style={[styles.cardTitle, { color: '#f44336' }]}>Other Pending Fees</Text>
            </View>
            {pendingFees.otherPendingFees.map((fee, index) => 
              renderFeeItem(fee, index, 'pending')
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons name="calendar-alert" size={24} color="#f44336" />
              <Text style={[styles.cardTitle, { color: '#f44336' }]}>Other Pending Fees</Text>
            </View>
            <View style={styles.noFeesContainer}>
              <MaterialCommunityIcons name="cash-remove" size={48} color="#ccc" />
              <Text style={styles.noFeesText}>No pending fees</Text>
              <Text style={styles.noFeesSubText}>All fees are up to date</Text>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#512da8" />
            <Text style={styles.cardTitle}>Payment Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelContainer}>
              <MaterialCommunityIcons name="cash-check" size={20} color="#4caf50" style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Selected Amount:</Text>
            </View>
            <Text style={styles.summaryAmount}>₹{selectedAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelContainer}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#512da8" style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Current Month Total:</Text>
            </View>
            <Text style={styles.summaryAmount}>₹{pendingFees?.totalCurrentAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#f44336" style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Total Pending:</Text>
            </View>
            <Text style={styles.summaryAmount}>₹{pendingFees?.totalPendingAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount*</Text>
            <TextInput
              style={styles.input}
              value={selectedAmount.toString()}
              editable={false}
              placeholder="Selected amount"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Mode*</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.paymentMode}
                onValueChange={(value) => handleFormChange('paymentMode', value)}
                style={styles.picker}
              >
                {paymentModes.map(mode => (
                  <Picker.Item key={mode.id} label={mode.name} value={mode.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Date*</Text>
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
            <Text style={styles.label}>Receipt Number*</Text>
            <TextInput
              style={styles.input}
              value={formData.receiptNumber}
              onChangeText={(value) => handleFormChange('receiptNumber', value)}
              placeholder="Enter receipt number"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.remarks}
              onChangeText={(value) => handleFormChange('remarks', value)}
              placeholder="Enter remarks (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
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
              <MaterialIcons name="payment" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Payment</Text>
        </>
      )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  studentInfo: {
    borderLeftWidth: 3,
    borderLeftColor: '#512da8',
    paddingLeft: 12,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  feeItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
        elevation: 2,
      },
  selectedFeeItem: {
    borderColor: '#4caf50',
    backgroundColor: '#f1f8e9',
  },
  feeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeIconContainer: {
    marginRight: 12,
  },
  feeTypeContainer: {
    flex: 1,
    marginRight: 8,
  },
  feeTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  feeType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedText: {
    color: '#4caf50',
  },
  feePeriod: {
    fontSize: 14,
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodIcon: {
    marginRight: 4,
  },
  feeAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginRight: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckCircle: {
    transform: [{ scale: 1.1 }],
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#512da8',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#512da8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  addFeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#512da8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  addFeeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  createButton: {
    backgroundColor: '#512da8',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    marginRight: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#512da8',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  selectedMonthBadge: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
  },
  monthBadgeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  selectedMonthBadgeText: {
    color: '#4caf50',
  },
  noFeesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 8,
  },
  noFeesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  noFeesSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SubmitPaymentScreen;

