import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Landing: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
    // router.replace('/(tab)')
      router.replace('/screens/LoginPage');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#4A90E2', '#007AFF']} // Gradient from lighter to darker blue
      style={styles.container}
    >
      <Image 
        source={require('../assets/images/image.png')} 
        style={styles.logo} 
      />
      <Text style={styles.title}>Welcome to Neev Learn Pvt. Ltd.</Text>
      <LottieView
        source={require('../assets/animations/landing_animation.json')} 
        autoPlay
        loop
        style={styles.animation}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default Landing;
