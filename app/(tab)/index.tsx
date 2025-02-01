import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Permission, UserData } from '@/constants/types';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 40 is total horizontal padding

const HomeScreen = () => {
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const permissionsStr = await SecureStore.getItemAsync('userPermission');
      const userDataStr = await SecureStore.getItemAsync('userData');
      
      if (permissionsStr && userDataStr) {
        const permissions = JSON.parse(permissionsStr);
        const user = JSON.parse(userDataStr);
        setUserPermissions(permissions);
        setUserData(user);
      } else {
        Alert.alert('Error', 'Session expired. Please login again.');
        router.replace('./');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturePress = (feature: any) => {
    if (feature.navigation) {
      router.push(feature.navigation);
    } else {
      Alert.alert('Coming Soon', `${feature.featueName} feature will be available soon!`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userIdText}>{userData?.userId}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <FontAwesome name="user-circle" size={35} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.grid}>
            {userPermissions.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(feature)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome 
                    name={feature.icon || 'circle'}
                    size={18} 
                    color="#007AFF" 
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.featueName}</Text>
                <Text style={styles.featureSubtitle}>Tap to access</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.announcementCard}>
            <View style={styles.announcementIcon}>
              <FontAwesome name="bullhorn" size={24} color="#007AFF" />
            </View>
            <View style={styles.announcementContent}>
              <Text style={styles.announcementTitle}>New Updates Available</Text>
              <Text style={styles.announcementSubtitle}>Check what's new</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <TouchableOpacity style={styles.supportCard}>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportSubtitle}>Contact our support team</Text>
          </View>
          <View style={styles.supportButton}>
            <FontAwesome name="headphones" size={20} color="#FFF" />
            <Text style={styles.supportButtonText}>Support</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userIdText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    padding: 5,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: cardWidth,
    backgroundColor: '#FFF',
    padding: 13,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  announcementCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  announcementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  announcementSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  supportCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  supportButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default HomeScreen;