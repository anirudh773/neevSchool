import React, { useState, useEffect } from 'react';
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import * as SecureStore from 'expo-secure-store';

// Get screen dimensions for responsive design
const { width } = Dimensions.get('window');

// Form Field Component
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

interface FeeType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  frequency: {
    id: number;
    name: string;
  };
}

const FormField = ({ label, error, required = false, children }: FormFieldProps) => (
  <View style={styles.formField}>
    <View style={styles.labelContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {required && <Text style={styles.requiredStar}>*</Text>}
    </View>
    {children}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// Main Fee Master Screen
const FeeMasterScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Remove edit mode related code
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // State for classes and fee types data
  const [classesData, setClassesData] = useState<Array<{ id: number; name: string }>>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingFeeTypes, setIsLoadingFeeTypes] = useState(true);

  // Form state with initial values
  const initialFormState = {
    class: '',
    feeType: '',
    amount: '',
    dueDate: '',
    description: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  // Get selected fee type frequency
  const getSelectedFeeTypeFrequency = () => {
    const selectedFeeType = feeTypes.find(type => type.id.toString() === formData.feeType);
    return selectedFeeType?.frequency?.name || '';
  };

  // Fetch classes data from SecureStore
  useEffect(() => {
    const fetchClassesData = async () => {
      try {
        setIsLoadingClasses(true);
        const userData = await SecureStore.getItemAsync('userData');
        if (!userData) {
          Alert.alert('Error', 'User data not found');
          return;
        }

        const parsedUserData = JSON.parse(userData);
        const classesData = await SecureStore.getItemAsync(
          parsedUserData.role === 2 ? 'teacherClasses' : 'schoolClasses'
        );
        if (classesData) {
          const parsedData = JSON.parse(classesData);
          // parsedData = parsedData.map(obj => )
          setClassesData(parsedData || []);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch classes data');
      } finally {
        setIsLoadingClasses(false);
      }
    };

    fetchClassesData();
  }, []);

  // Fetch fee types from API
  useEffect(() => {
    const fetchFeeTypes = async () => {
      try {
        setIsLoadingFeeTypes(true);
        const userData = await SecureStore.getItemAsync('userData');
        if (!userData) return;

        const { schoolId } = JSON.parse(userData);
        const response = await fetch(
          `https://neevschool.sbs/school/getFeeMasterData?schoolId=${schoolId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const result = await response.json();
        if (result.success) {
          setFeeTypes(result.data);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch fee types');
      } finally {
        setIsLoadingFeeTypes(false);
      }
    };

    fetchFeeTypes();
  }, []);

  // Handle form field change
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // If fee type changes, update due date
    if (field === 'feeType') {
      const selectedFeeType = feeTypes.find(type => type.id.toString() === value);
      if (selectedFeeType) {
        setFormData(prev => ({ 
          ...prev, 
          feeType: value,
          dueDate: selectedFeeType.frequency.name,
          description: selectedFeeType.description || ''
        }));
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.class) newErrors.class = 'Class is required';
    if (!formData.feeType) newErrors.feeType = 'Fee type is required';
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }
    
    try {
      setSubmitting(true);
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) {
        throw new Error('User data not found');
      }

      const { schoolId } = JSON.parse(userData);
      
      const response = await fetch(
        'https://neevschool.sbs/school/createClassFee',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            schoolId,
            classId: Number(formData.class),
            feeTypeId: Number(formData.feeType),
            amount: Number(formData.amount)
          })
        }
      );

      const result = await response.json();
      if (result.success) {
        // Show success message
        Alert.alert(
          'Success',
          'Fee structure created successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm(); // Reset form after successful submission
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || 'Failed to create fee structure');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create fee structure');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isLoadingClasses || isLoadingFeeTypes) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#512da8" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#512da8" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Fee Structure</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Form */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Icon name="cash-multiple" size={24} color="#512da8" />
                <Text style={styles.formTitle}>Fee Structure Details</Text>
              </View>
              
              {/* Class */}
              <FormField label="Class" error={errors.class} required>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.class}
                    onValueChange={(value) => handleChange('class', value)}
                    style={styles.picker}
                    dropdownIconColor="#512da8"
                  >
                    <Picker.Item label="Select Class" value="" color="#999" />
                    {classesData.map((option) => (
                      <Picker.Item 
                        key={option.id} 
                        label={option.name} 
                        value={option.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
              </FormField>

              {/* Fee Type */}
              <FormField label="Fee Type" error={errors.feeType} required>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.feeType}
                    onValueChange={(value) => handleChange('feeType', value)}
                    style={styles.picker}
                    dropdownIconColor="#512da8"
                  >
                    <Picker.Item label="Select Fee Type" value="" color="#999" />
                    {feeTypes.map((option) => (
                      <Picker.Item 
                        key={option.id} 
                        label={option.name} 
                        value={option.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
              </FormField>

              {/* Amount */}
              <FormField label="Amount (₹)" error={errors.amount} required>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(value) => handleChange('amount', value)}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </FormField>

              {/* Due Date */}
              <FormField label="Due Date" required>
                <View style={styles.pickerWrapper}>
                  <Text style={[styles.input, styles.disabledInput]}>
                    {getSelectedFeeTypeFrequency() || 'Select fee type first'}
                  </Text>
                </View>
              </FormField>

              {/* Description */}
              <FormField label="Description">
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => handleChange('description', value)}
                  placeholder="Enter fee description"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                  editable={false}
                />
              </FormField>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#512da8', '#673ab7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="plus-circle" size={20} color="white" />
                    <Text style={styles.submitText}>Add Fee Structure</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#512da8',
    paddingVertical: 16,
    paddingHorizontal: width * 0.05,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: 20,
    paddingHorizontal: width * 0.05,
  },
  formContainer: {
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  formField: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  requiredStar: {
    color: '#F44336',
    marginLeft: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    marginTop: Platform.OS === 'ios' ? 0 : -8,
    width: '100%',
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginTop: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
    paddingVertical: 12,
  },
});

export default FeeMasterScreen; 