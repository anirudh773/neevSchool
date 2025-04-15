import React, { useState, useEffect } from 'react';
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
  Platform,
  Linking,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
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
    borderRadius: 15,
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
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Function to register for push notifications
  async function registerForPushNotificationsAsync() {
    try {
      let token;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          return null;
        }

        try {
          // Get the token that uniquely identifies this device
          // token = (await Notifications.getExpoPushTokenAsync({
          //   projectId: '5f60753c-7b66-4fb8-872c-b6172aea6cc6'
          // })).data;
          token = 'xyz'
        } catch (error) {
          return null;
        }
      } else {
        // Return a test token for emulator
        token = 'EMULATOR-TEST-TOKEN-' + Date.now();
      }

      return token;
    } catch (error) {
      return null;
    }
  }

  // Function to send test notification
  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Login Successful!",
          body: "Welcome to St.Thomas Mission School",
          data: { screen: 'Home' },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
    }
  };

  const handleLogin = async () => {
    if (!userId || !password) {
      Alert.alert('Error', 'Please enter both User ID and Password.');
      return;
    }

    setLoading(true);

    try {
      // Get and store push token
      const pushToken = await registerForPushNotificationsAsync();
      
      // API call to login endpoint
      const response = await fetch('https://neevschool.sbs/school/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          password
        }),
      });

      // Handle non-JSON response safely
      const data = await response.json().catch(() => ({}));

      if(data && !data.token){
        throw new Error('Your Login userid or password is incorrect');
      }

      // Check if user is associated with the correct school
      if (data.userInfo?.schoolId !== 1) {
        throw new Error('You are not associated with this school. Please contact school.');
      }

      // Store tokens and user data securely
      const storagePromises = [
        SecureStore.setItemAsync('userToken', data.token),
        SecureStore.setItemAsync('userData', JSON.stringify(data.userInfo)),
        SecureStore.setItemAsync('userPermission', JSON.stringify(data.permission))
      ];

      if (pushToken) {
        storagePromises.push(SecureStore.setItemAsync('pushToken', pushToken));
      }

      await Promise.all(storagePromises);

      // Role-specific storage logic
      if (data.userInfo?.role === 2) {
        await SecureStore.setItemAsync('schoolClasses', JSON.stringify(data.teacherClasses));
      } else if ([1, 3, 4].includes(data.userInfo?.role)) {
        await SecureStore.setItemAsync('schoolClasses', JSON.stringify(data.classes));
      }

      // Send test notification
      await sendTestNotification();

      router.replace('../(tab)');
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong! Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSupportCall = () => {
    Alert.alert(
      "Contact Support",
      "Would you like to call our support team?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Call",
          onPress: () => {
            const phoneNumber = '7376623107';
            Linking.openURL(`tel:${phoneNumber}`);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/image.png')}
            style={styles.logo}
          />
          <Text style={styles.companyName}>St.Thomas Mission School</Text>
          <Text style={styles.location}>Jaunpur</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="User ID"
            placeholderTextColor="#aaa"
            value={userId}
            onChangeText={setUserId}
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.passwordToggle} onPress={handlePasswordVisibility}>
            <Text style={styles.passwordToggleText}>
              {showPassword ? 'Hide' : 'Show'} Password
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSupportCall}>
          <Text style={styles.footerText}>Unable to login?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginPage;