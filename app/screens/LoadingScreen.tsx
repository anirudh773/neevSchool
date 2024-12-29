import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const LoadingScreen: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Set a 2-second delay before navigating to the login page
    const timer = setTimeout(() => {
      router.replace('/screens/LoginPage'); // Navigate to the Login Page
    }, 2000);

    // Cleanup the timer when the component is unmounted
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
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
});

export default LoadingScreen;
