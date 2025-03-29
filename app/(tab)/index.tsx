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
  Linking,
  Modal,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Permission, UserData } from 'constants/types';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 40 is total horizontal padding

const iconColors = {
  primary: '#3F51B5',    // Indigo
  secondary: '#5C6BC0',  // Lighter Indigo
  accent: '#FF4081',     // Pink accent
};

const HomeScreen = () => {
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  const handleHelpPress = () => {
    Alert.alert(
      "Need Help?",
      "Contact our support at: 7376623107",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Call Now",
          onPress: () => {
            Linking.openURL('tel:7376623107');
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              // Clear all secure storage keys
              const keys = ['userToken', 'userData', 'userPermission', 'pushToken', 'teacherClasses', 'schoolClasses'];
              await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
              
              // Navigate to login screen
              router.replace('/screens/LoginPage');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleProfilePress = () => {
    setShowProfileMenu(true);
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
            <Text style={styles.userIdText}>{userData?.name || userData?.userId}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <FontAwesome name="user-circle" size={35} color="#007AFF" />
            </TouchableOpacity>
          </View>
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
                <View style={[styles.iconContainer, { backgroundColor: `${iconColors.primary}15` }]}>
                  <FontAwesome 
                    name={feature.icon || 'circle'}
                    size={20} 
                    color={iconColors.primary}
                  />
                </View>
                <Text numberOfLines={1} style={styles.featureTitle}>{feature.featueName}</Text>
                <Text numberOfLines={1} style={styles.featureSubtitle}>Tap to access</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.announcementCard}>
            <View style={styles.announcementIcon}>
              <FontAwesome name="bullhorn" size={20} color={iconColors.accent} />
            </View>
            <View style={styles.announcementContent}>
              <Text numberOfLines={1} style={styles.announcementTitle}>
                New Updates Available
              </Text>
              <Text numberOfLines={1} style={styles.announcementSubtitle}>
                Check what's new
              </Text>
            </View>
            <FontAwesome 
              name="chevron-right" 
              size={16} 
              color={iconColors.secondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <TouchableOpacity style={styles.supportCard} onPress={handleHelpPress} >
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportSubtitle}>Contact our support team</Text>
          </View>
          <View style={styles.supportButton}>
            <FontAwesome name="headphones" size={16} color="#FFFFFF" />
            <Text style={styles.supportButtonText}>Support</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.profileMenuContainer}>
            <TouchableOpacity 
              style={styles.profileMenuItem}
              onPress={handleProfilePress}
            >
              <FontAwesome name="user" size={20} color="#3F51B5" />
              <Text style={styles.profileMenuItemText}>View Profile</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.profileMenuItem}
              onPress={handleLogout}
            >
              <FontAwesome name="sign-out" size={20} color="#FF4081" />
              <Text style={[styles.profileMenuItemText, {color: '#FF4081'}]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  welcomeText: {
    fontSize: Math.min(16, width * 0.04),
    color: '#5C6BC0',
    fontWeight: '500',
  },
  userIdText: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: 'bold',
    color: '#1A237E',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  profileButton: {
    padding: 8,
    backgroundColor: '#E8EAF6',
    borderRadius: 12,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  featureCard: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 4,
    minHeight: 110,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: Math.min(11, width * 0.028),
    color: '#5C6BC0',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  announcementIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: `${iconColors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: Math.min(16, width * 0.04),
    fontWeight: '600',
    color: '#1A237E',
  },
  announcementSubtitle: {
    fontSize: Math.min(14, width * 0.035),
    color: '#5C6BC0',
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '600',
    color: '#1A237E',
  },
  supportSubtitle: {
    fontSize: Math.min(14, width * 0.035),
    color: '#5C6BC0',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: iconColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  supportButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
    fontSize: Math.min(14, width * 0.035),
  },
  helpButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  helpButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  profileMenuContainer: {
    width: width * 0.5,
    marginTop: 70,
    marginRight: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  profileMenuItemText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A237E',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
});

export default HomeScreen;