import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';

const Landing: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page after 10 seconds
    const timer = setTimeout(() => {
      router.replace('/screens/LoginPage');
    }, 2000); // Adjust the delay as needed

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures the effect runs only once

  return (
    <View style={styles.container}>
        <Image source={require('../assets/images/image.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome to Neev Learn pvt. ltd.</Text>
      <LottieView
        source={require('../assets/animations/landing_animation.json')} // Replace with your animation file path
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  animation: {
    width: 400,
    height: 400,
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 50,
  },
});

export default Landing;