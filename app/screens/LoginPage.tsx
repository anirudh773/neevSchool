import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';

const LoginPage = () => {
  const userRoles = [
    { id: 1, label: 'Admin', value: 'admin' },
    { id: 2, label: 'Teacher', value: 'teacher' },
    { id: 3, label: 'Student', value: 'student' },
  ];

  const [loginAs, setLoginAs] = useState(null);
  const [erpId, setErpId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!erpId || !password) {
      Alert.alert('Error', 'Please enter both ERP ID and Password.');
      return;
    }

    try {
      router.replace('../(tab)');
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Error', 'Something went wrong! Please try again later.');
    }
  };

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/image.png')}
            style={styles.logo}
          />
          <Text style={styles.companyName}>Neev Learn Private Limited</Text>
          <Text style={styles.location}>Gurugram</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.loginAsLabel}>Login As</Text>
          <DropDownPicker
            open={openDropdown}
            value={loginAs}
            items={userRoles}
            setOpen={setOpenDropdown}
            setValue={setLoginAs}
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            placeholder="Select Role"
            placeholderStyle={{ color: '#888' }}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <TextInput
            style={styles.input}
            placeholder="ERP Login ID"
            placeholderTextColor="#aaa"
            value={erpId}
            onChangeText={setErpId}
          />
          <TextInput
            style={styles.input}
            placeholder="ERP Password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.passwordToggle} onPress={handlePasswordVisibility}>
            <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'} Password</Text>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>Unable to login?</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD', // Light blue background
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  location: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  loginAsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  dropdown: {
    borderColor: '#007AFF',
    borderRadius: 5,
    marginBottom: 15,
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownContainer: {
    borderColor: '#007AFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  passwordToggleText: {
    fontSize: 14,
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  resetButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    marginTop: 20,
    color: 'gray',
    fontSize: 14,
  },
});

export default LoginPage;
