import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const LoadingScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // List of required secure store keys
  const requiredKeys = ['userToken', 'userData', 'userPermission'];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for 1 second first
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if all required keys are present
        const keyResults = await Promise.all(
          requiredKeys.map(async (key) => {
            const value = await SecureStore.getItemAsync(key);
            return { key, exists: value !== null };
          })
        );
        
        // Check if any required key is missing
        const missingKeys = keyResults.filter(result => !result.exists);
        
        if (missingKeys.length > 0) {
          // Navigate to login screen if any key is missing
          router.replace('/screens/LoginPage');
        } else {
          // All required keys exist, navigate to main app
          router.replace('/(tab)');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        Alert.alert(
          'Error',
          'Something went wrong while checking your login status. Please try again.'
        );
        router.replace('/screens/LoginPage');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/image.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Neev Learn Group</Text>
      <Text style={styles.subtitle}>Loading your experience...</Text>
      <ActivityIndicator 
        size="large" 
        color="#007AFF" 
        style={styles.loader} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    padding: 20,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#5C6BC0',
    textAlign: 'center',
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});

export default LoadingScreen;
