import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddStudentScreen = () => {
  const router = useRouter();
  const { sectionId, className, sectionName } = useLocalSearchParams();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'dob' | 'admission'>('dob');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    schoolId: 1, // Fixed value as per API
    dateOfBirth: new Date(),
    gender: '',
    sectionsId: Number(sectionId),
    admissionDate: new Date(),
    parentName: '',
    parentContact: '',
    address: '',
    email: '',
    aadhaarNumber: '',
    bloodGroup: 1,
    height: '',
    weight: '',
    motherName: '',
    isStudentNew: true
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'dob') {
        handleInputChange('dateOfBirth', selectedDate);
      } else {
        handleInputChange('admissionDate', selectedDate);
      }
    }
  };

  const formatDateForAPI = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async () => {
    setLoading(true)
    if (!formData.firstName || !formData.lastName || !formData.aadhaarNumber) {
      Alert.alert('Error', 'Name and Aadhaar Number are required');
      setLoading(false);
      return;
    }

    try {
      const apiData = {
        ...formData,
        dateOfBirth: formatDateForAPI(formData.dateOfBirth),
        admissionDate: formatDateForAPI(formData.admissionDate),
        gender: formData.gender === 'male' ? 1 : formData.gender === 'female' ? 2 : 3,
        height: formData.height || '',
        weight: formData.weight || '',
        bloodGroup: formData.bloodGroup || null,
      };
      const response = await fetch('https://neevschool.sbs/school/addStudent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert(
          '✅ Success', 
          'Student added successfully',
          [
            {
              text: '✅ Success',
              onPress: () => {
                setFormData({
                  firstName: '',
                  lastName: '',
                  schoolId: 1,
                  dateOfBirth: new Date(),
                  gender: '',
                  sectionsId: Number(sectionId),
                  admissionDate: new Date(),
                  parentName: '',
                  parentContact: '',
                  address: '',
                  email: '',
                  aadhaarNumber: '',
                  bloodGroup: 1,
                  height: '',
                  weight: '',
                  motherName: '',
                  isStudentNew: true
                });
              },
              style: 'default'
            }
          ]
        );
      } else {
        throw new Error(data.message || 'Failed to add student');
      }
    } catch (error) {
      setLoading(false)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to register student');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#64748b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Add Student</Text>
          <Text style={styles.subtitle}>
            Class {className} - Section {sectionName}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            placeholder="Enter first name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            placeholder="Enter last name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => {
              setDatePickerMode('dob');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.datePickerText}>
              {formatDateForAPI(formData.dateOfBirth)}
            </Text>
            <FontAwesome name="calendar" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Admission Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => {
              setDatePickerMode('admission');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.datePickerText}>
              {formatDateForAPI(formData.admissionDate)}
            </Text>
            <FontAwesome name="calendar" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderButtons}>
            {['male', 'female'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton,
                  formData.gender === gender && styles.genderButtonActive
                ]}
                onPress={() => handleInputChange('gender', gender)}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === gender && styles.genderButtonTextActive
                  ]}
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Parent Name</Text>
          <TextInput
            style={styles.input}
            value={formData.parentName}
            onChangeText={(value) => handleInputChange('parentName', value)}
            placeholder="Enter parent name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Parent Contact</Text>
          <TextInput
            style={styles.input}
            value={formData.parentContact}
            onChangeText={(value) => handleInputChange('parentContact', value)}
            placeholder="Enter parent contact"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>UID number (Aadhaar Number *)</Text>
          <TextInput
            style={styles.input}
            value={formData.aadhaarNumber}
            onChangeText={(value) => handleInputChange('aadhaarNumber', value)}
            placeholder="Enter Aadhaar number"
            keyboardType="numeric"
            maxLength={12}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            placeholder="Enter address"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Group (Optional)</Text>
          <View style={styles.bloodGroupContainer}>
            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((group, index) => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.bloodGroupButton,
                  formData.bloodGroup === index + 1 && styles.bloodGroupButtonActive
                ]}
                onPress={() => handleInputChange('bloodGroup', index + 1)}
              >
                <Text
                  style={[
                    styles.bloodGroupButtonText,
                    formData.bloodGroup === index + 1 && styles.bloodGroupButtonTextActive
                  ]}
                >
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Height (cm) (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.height}
            onChangeText={(value) => handleInputChange('height', value)}
            placeholder="Enter height in cm"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight (kg) (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight}
            onChangeText={(value) => handleInputChange('weight', value)}
            placeholder="Enter weight in kg"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mother's Name</Text>
          <TextInput
            style={styles.input}
            value={formData.motherName}
            onChangeText={(value) => handleInputChange('motherName', value)}
            placeholder="Enter mother's name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Student Status</Text>
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                formData.isStudentNew && styles.statusButtonActive
              ]}
              onPress={() => handleInputChange('isStudentNew', true)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  formData.isStudentNew && styles.statusButtonTextActive
                ]}
              >
                New Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                !formData.isStudentNew && styles.statusButtonActive
              ]}
              onPress={() => handleInputChange('isStudentNew', false)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  !formData.isStudentNew && styles.statusButtonTextActive
                ]}
              >
                Transfer Student
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}> {loading ? 'Adding Student...' : 'Add Student'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'dob' ? formData.dateOfBirth : formData.admissionDate}
          mode="date"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: "#ECF0F1"
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 2
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    color: '#1f2937',
    fontSize: 16,
  },
  genderButtonTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  bloodGroupButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  bloodGroupButtonText: {
    color: '#1f2937',
    fontSize: 14,
  },
  bloodGroupButtonTextActive: {
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    color: '#1f2937',
    fontSize: 16,
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
});

export default AddStudentScreen;