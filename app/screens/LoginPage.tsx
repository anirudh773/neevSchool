import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, SafeAreaView, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';

const LoginPage = () => {

  const userRoles = [
    { id: 1, label: 'Admin', value: 'admin' },
    { id: 2, label: 'Teacher', value: 'teacher' },
    { id: 3, label: 'Student', value: 'student' },
  ];

  const [loginAs, setLoginAs] = useState('Admin / Teacher / Student');
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
      router.replace('../(drawer)');
      // const response = await fetch('https://testcode-2.onrender.com/school/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Accept: 'application/json', // Optional, helps ensure API responds with JSON
      //   },
      //   body: JSON.stringify({ userName: erpId, password }),
      // });

      // const data = await response.json();

      // console.log('fgfgfgfsdsdsdsdsds', data)

      // if (response.ok && data.token) {
      //   // Save data securely
      //   await SecureStore.setItemAsync('token', data.token);
      //   await SecureStore.setItemAsync('expiryTime', data.expiryTime);
      //   await SecureStore.setItemAsync('userName', erpId);
      //   await SecureStore.setItemAsync('password', password); // Avoid storing passwords in real apps

      //   Alert.alert('Success', 'Login successful');
      //   router.replace('../(drawer)');
      // } else {
      //   Alert.alert('Error', data.message || 'Login failed');
      // }
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
        <View style={styles.header}>
          <Image source={require('../../assets/images/image.png')} style={styles.logo} />
          <Text style={styles.companyName}>Neev Learn Private Limited</Text>
          <Text style={styles.location}>Gurugram</Text>
        </View>

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
          />

          <TextInput
            style={styles.input}
            placeholder="ERP Login ID"
            value={erpId}
            onChangeText={setErpId}
          />
          <TextInput
            style={styles.input}
            placeholder="ERP Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.passwordToggle} onPress={handlePasswordVisibility}>
            <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'} Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>Unable to login?</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#E8F1FF',
    padding: 20,
    borderRadius: 10,
  },
  logo: {
    width: 100,
    height: 100,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 16,
    color: 'gray',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  passwordToggle: {
    alignSelf: 'flex-end',
  },
  passwordToggleText: {
    fontSize: 14,
    color: '#007BFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  resetButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 20,
    color: 'gray',
    fontSize: 14,
  },
  loginAsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dropdown: {
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
  },
  dropdownText: {
    fontSize: 16,
  }
});

export default LoginPage;
