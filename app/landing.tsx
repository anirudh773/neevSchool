import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

// Add interface for decoded token
interface DecodedToken {
  id: number;
  username: string;
  exp: number;
  iat: number;
}

const Landing: React.FC = () => {
  const router = useRouter();
  const [isLottieLoaded, setIsLottieLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // List of required secure store keys
  const requiredKeys = ['userToken', 'userData', 'userPermission'];

  // Updated token decoder function
  const parseJwt = (token: string): DecodedToken | null => {
    try {
      const base64Payload = token.split('.')[1];
      if (!base64Payload) return null;
      
      // Base64 decoding for React Native
      const decodedPayload = decodeURIComponent(
        atob(base64Payload)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  // Add this helper function to handle potential atob errors
  const atob = (input: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = input.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 === 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }

    for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    return output;
  };

  // Updated token validation function
  const isTokenValid = (token: string): boolean => {
    try {
      const decoded = parseJwt(token);

      if (!decoded || !decoded.exp) {
        return false;
      }
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (decoded.exp < currentTime) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await Promise.all([
                  SecureStore.deleteItemAsync('userToken'),
                  SecureStore.deleteItemAsync('userData'),
                  SecureStore.deleteItemAsync('userPermission'),
                  SecureStore.deleteItemAsync('teacherClasses'),
                  SecureStore.deleteItemAsync('schoolClasses'),
                  SecureStore.deleteItemAsync('pushToken')
                ]);
                router.replace('/screens/LoginPage');
              }
            }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/screens/LoginPage');
      // router.replace('/(tab)')
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Update the checkAuth function to include better error handling
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const token = await SecureStore.getItemAsync('userToken');

        if (!token) {
          router.replace('/screens/LoginPage');
          return;
        }

        const isValid = isTokenValid(token);

        if (!isValid) {
          router.replace('/screens/LoginPage');
          return;
        }

        // Check other required keys
        const keyResults = await Promise.all(
          requiredKeys.map(async (key) => {
            const value = await SecureStore.getItemAsync(key);
            return { key, exists: value !== null };
          })
        );
        
        const missingKeys = keyResults.filter(result => !result.exists);
        
        if (missingKeys.length > 0) {
          router.replace('/screens/LoginPage');
        } else {
          router.replace('/(tab)');
        }
      } catch (error) {
        console.error('Error in checkAuth:', error);
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

  // Fallback view in case LinearGradient has issues in preview
  const BackgroundComponent = ({ children }: { children: React.ReactNode }) => {
    try {
      return (
        <LinearGradient
          colors={['#4A90E2', '#007AFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          {children}
        </LinearGradient>
      );
    } catch (error) {
      return <View style={[styles.container, styles.fallbackBackground]}>{children}</View>;
    }
  };

  // Animation component with fallback
  const AnimationComponent = () => {
    if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
      // Simplified fallback for web preview
      return (
        <View style={styles.animationFallback}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.fallbackText}>Loading...</Text>
        </View>
      );
    }

    return (
      <LottieView
        source={require('../assets/animations/landing_animation.json')}
        autoPlay
        loop
        style={styles.animation}
        onAnimationFinish={() => setIsLottieLoaded(true)}
      />
    );
  };

  return (
    <BackgroundComponent>
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/image.png')} 
          style={styles.logo}
          defaultSource={require('../assets/images/image.png')} // Fallback for web
        />
        <Text style={styles.title}>Welcome to St. Thomas mission school</Text>
        <AnimationComponent />
      </View>
    </BackgroundComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fallbackBackground: {
    backgroundColor: '#4A90E2',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  animation: {
    width: 300,
    height: 300,
    marginTop: 20,
  },
  animationFallback: {
    width: 300,
    height: 300,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    marginTop: 20,
    fontSize: 16,
  },
});

export default Landing;
