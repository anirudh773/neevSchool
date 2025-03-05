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
        alert('Failed to get push token for push notification!');
        return;
      }
      token = 'xyz'
      
      // token = (await Notifications.getExpoPushTokenAsync({
      //   projectId: 'your-project-id-here'
      // })).data;
    } else {
      // Return a test token for emulator
      token = 'EMULATOR-TEST-TOKEN-' + Date.now();
      console.log('Using emulator - generated test token:', token);
    }

    return token;
  }

  // Function to send test notification
  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Login Successful!",
          body: "Welcome to Neev Learn Private Limited",
          data: { screen: 'Home' },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  // Set up notification listeners
  useEffect(() => {
    // Request notification permissions
    Notifications.requestPermissionsAsync();

    // Set up notification listeners
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Received notification:', notification);
    });

    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Background notification tapped:', response);
      // You can handle navigation here if needed
      // const screen = response.notification.request.content.data.screen;
      // router.push(screen);
    });

    return () => {
      // Clean up listeners
      foregroundSubscription.remove();
      backgroundSubscription.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!userId || !password) {
      Alert.alert('Error', 'Please enter both User ID and Password.');
      return;
    }

    setLoading(true);
    
    try {
      // Get push token
      const pushToken = await registerForPushNotificationsAsync();
      console.log('Push Token:', pushToken);

      // Store push token
      if (pushToken) {
        await SecureStore.setItemAsync('pushToken', pushToken);
      }

      const response = await fetch('http://13.202.16.149:8080/school/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password,
          // pushToken, // Send token to backend
        }),
      });

      const data = await response.json();

      console.log(data, "ddsdsds")

      if (response.ok) {
        // Store all tokens and data
        const storagePromises = [
          SecureStore.setItemAsync('userToken', data.token),
          SecureStore.setItemAsync('userData', JSON.stringify(data.userInfo)),
          SecureStore.setItemAsync('userPermission', JSON.stringify(data.permission))
        ];

        if (pushToken) {
          storagePromises.push(SecureStore.setItemAsync('pushToken', pushToken));
        }

        await Promise.all(storagePromises);

        if(data.userInfo && data.userInfo.role == 2){
          await SecureStore.setItemAsync('teacherClasses', JSON.stringify(data.teacherClasses));
        }
        else if(data.userInfo && [1,2].includes(data.userInfo.role)){
          await SecureStore.setItemAsync('schoolClasses',JSON.stringify(data.classes));
        }
        
        // Send test notification
        await sendTestNotification();
        
        router.replace('../(tab)');
      } else {
        Alert.alert('Error', data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Error', 'Something went wrong! Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/image.png')}
            style={styles.logo}
          />
          <Text style={styles.companyName}>Neev Learn Private Limited</Text>
          <Text style={styles.location}>Gurugram</Text>
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

        <Text style={styles.footerText}>Unable to login?</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginPage;