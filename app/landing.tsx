import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Landing: React.FC = () => {
  const router = useRouter();
  const [isLottieLoaded, setIsLottieLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/screens/LoginPage');
    }, 2000);

    return () => clearTimeout(timer);
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
        <Text style={styles.title}>Welcome to Neev Learn Pvt. Ltd.</Text>
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
