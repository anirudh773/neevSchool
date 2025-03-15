import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserAvatar from './UserAvatar';

interface UserData {
  name: string;
  profilePic?: string;
}

interface FeatureCardProps {
  title: string;
  description?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  gradientColors?: string[];
  onPress?: () => void;
  style?: ViewStyle;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  iconColor = '#ffffff',
  gradientColors = ['#4776E6', '#8E54E9'],
  onPress,
  style,
}) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cardScale = new Animated.Value(1);
  
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (userDataStr) {
        const data = JSON.parse(userDataStr);
        setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.96,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const iconSize = isTablet ? 36 : 30;
  const avatarSize = isTablet ? 60 : 45;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale: cardScale }],
          },
          style,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.leftContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                {description && <Text style={styles.description}>{description}</Text>}
              </View>
            </View>
            <UserAvatar
              imageUrl={userData?.profilePic}
              size={avatarSize}
              style={styles.avatar}
            />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
    transform: [
      { perspective: 1000 },
      { rotateX: '2deg' },
    ],
  },
  gradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  avatar: {
    marginLeft: 20,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default FeatureCard; 