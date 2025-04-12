import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  ViewStyle,
  TextStyle,
  ImageStyle,
  useWindowDimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UserProfile {
  id: number,
  name: string;
  email: string;
  phone: string;
  role: number;
  schoolId: number;
  profilePic?: string;
  subject?: string;
  class?: string;
  section?: string;
  studentClass: object,
  userId: string
}

interface RoleInfo {
  roleTitle: string;
  gradientColors: string[];
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  additionalInfo?: Array<{
    icon: keyof typeof FontAwesome.glyphMap;
    label: string;
    value: string;
  }>;
}

const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLandscape = width > height;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (): Promise<void> => {
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (userDataStr) {
        const userData: UserProfile = JSON.parse(userDataStr);
        setProfile(userData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async (): Promise<void> => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setUploading(true);
        const imageUri = result.assets[0].uri;
        // First upload image to Firebase
        const uploadedUrl = await uploadImageToFirebase(imageUri);
        // Then update profile with the URL
        await updateProfilePhoto(uploadedUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      setUploading(false);
    }
  };

  const uploadImageToFirebase = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const filename = `profile_${profile?.schoolId}_${Date.now()}`;
      const storageRef = ref(storage, `profiles/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      throw new Error('Failed to upload image to storage');
    }
  };

  const updateProfilePhoto = async (imgUrl: string): Promise<void> => {
    try {
      if (!profile?.schoolId) {
        throw new Error('User ID not found');
      }

      const response = await fetch(`https://neevschool.sbs/school/updateProfilePhoto`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profile?.id,  imgUrl }),
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(prev => prev ? {...prev, profilePic: imgUrl} : null);
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        throw new Error(result.message || 'Failed to update profile photo');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile photo');
    } finally {
      setUploading(false);
    }
  };

  const getRoleSpecificInfo = (): RoleInfo => {
    switch (profile?.role) {
      case 1:
        return {
          roleTitle: 'Administrator',
          icon: 'account-tie',
          gradientColors: ['#4776E6', '#8E54E9'] as const,
        };
      case 2:
        return {
          roleTitle: 'Teacher',
          icon: 'book-education',
          gradientColors: ['#11998e', '#38ef7d'] as const,
          additionalInfo: [
            {
              icon: 'book',
              label: 'Subject',
              value: profile.subject || 'Not assigned'
            }
          ]
        };
      case 3:
        return {
          roleTitle: 'Student',
          icon: 'school',
          gradientColors: ['#FF416C', '#FF4B2B'] as const,
          additionalInfo: [
            {
              icon: 'graduation-cap',
              label: 'Class',
              value: profile.studentClass.className || 'Not assigned'
            },
            {
              icon: 'users',
              label: 'Section',
              value: profile.studentClass.sectionName || 'Not assigned'
            }
          ]
        };
      default:
        return {
          roleTitle: 'User',
          icon: 'account',
          gradientColors: ['#606c88', '#3f4c6b'] as const,
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E54E9" />
      </View>
    );
  }

  const roleInfo = getRoleSpecificInfo();
  
  // Calculate responsive dimensions
  const imageSize = isTablet ? width * 0.2 : width * 0.3;
  const headerPadding = isTablet ? 40 : 20;
  const headerHeight = isTablet ? 300 : 270;
  const textSize = {
    name: isTablet ? 34 : 26,
    role: isTablet ? 22 : 18,
    label: isTablet ? 14 : 12,
    value: isTablet ? 20 : 16,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <LinearGradient
          colors={roleInfo.gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { height: headerHeight, padding: headerPadding }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity 
                onPress={handleImagePick} 
                style={[
                  styles.imageWrapper, 
                  { 
                    width: imageSize, 
                    height: imageSize, 
                    borderRadius: imageSize / 2 
                  }
                ]}
              >
                {profile?.profilePic ? (
                  <Image
                    source={{ uri: profile.profilePic }}
                    style={[styles.profileImage, { borderRadius: imageSize / 2 }]}
                  />
                ) : (
                  <View style={[styles.placeholderImage, { borderRadius: imageSize / 2 }]}>
                    <FontAwesome name="user" size={imageSize * 0.4} color="#fff" />
                  </View>
                )}
                <View style={styles.editIconContainer}>
                  <FontAwesome name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              {uploading && (
                <View style={[styles.uploadingOverlay, { width: imageSize, height: imageSize, borderRadius: imageSize / 2 }]}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Text style={[styles.name, { fontSize: textSize.name }]}>{profile?.name || 'User'}</Text>
              <View style={styles.roleContainer}>
                <MaterialCommunityIcons name={roleInfo.icon} size={textSize.role} color="#fff" />
                <Text style={[styles.role, { fontSize: textSize.role }]}>{roleInfo.roleTitle}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.infoSection, { 
          padding: isTablet ? 30 : 20,
          flexDirection: isLandscape && isTablet ? 'row' : 'column'
        }]}>
          <View style={[
            styles.infoCard, 
            isLandscape && isTablet ? { flex: 1, marginRight: 10 } : { marginBottom: 20 }
          ]}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            
            <View style={[styles.infoRow, { marginBottom: isTablet ? 30 : 20 }]}>
              <View style={styles.iconContainer}>
                <FontAwesome name="envelope" size={isTablet ? 24 : 20} color="#8E54E9" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: textSize.label }]}>Email</Text>
                <Text style={[styles.infoValue, { fontSize: textSize.value }]}>{profile?.email || 'Not available'}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { marginBottom: isTablet ? 30 : 20 }]}>
              <View style={styles.iconContainer}>
                <FontAwesome name="phone" size={isTablet ? 24 : 20} color="#8E54E9" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: textSize.label }]}>User ID</Text>
                <Text style={[styles.infoValue, { fontSize: textSize.value }]}>{profile?.userId || 'Not available'}</Text>
              </View>
            </View>

            <View style={[styles.infoRow]}>
              <View style={styles.iconContainer}>
                <FontAwesome name="id-badge" size={isTablet ? 24 : 20} color="#8E54E9" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { fontSize: textSize.label }]}>Reference number</Text>
                <Text style={[styles.infoValue, { fontSize: textSize.value }]}>{`NEEV_${profile?.schoolId}` || 'Not available'}</Text>
              </View>
            </View>
          </View>

          {roleInfo.additionalInfo && roleInfo.additionalInfo.length > 0 && (
            <View style={[
              styles.infoCard,
              isLandscape && isTablet ? { flex: 1, marginLeft: 10 } : {}
            ]}>
              <Text style={styles.cardTitle}>Role Information</Text>
              
              {roleInfo.additionalInfo.map((info, index) => (
                <View key={index} style={[
                  styles.infoRow, 
                  { marginBottom: index === roleInfo.additionalInfo!.length - 1 ? 0 : isTablet ? 30 : 20 }
                ]}>
                  <View style={styles.iconContainer}>
                    <FontAwesome name={info.icon} size={isTablet ? 24 : 20} color="#8E54E9" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { fontSize: textSize.label }]}>{info.label}</Text>
                    <Text style={[styles.infoValue, { fontSize: textSize.value }]}>{info.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(149, 165, 166, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#8E54E9',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  uploadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  role: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoSection: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a4a4a',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(142, 84, 233, 0.2)',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(142, 84, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 10,
  },
  infoLabel: {
    color: '#7f8c8d',
    marginBottom: 4,
  },
  infoValue: {
    color: '#2c3e50',
    fontWeight: '500',
  },
});

export default ProfileScreen;