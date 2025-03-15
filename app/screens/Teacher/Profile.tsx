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
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: number;
  schoolId: number;
  profilePic?: string;
  subject?: string;
}

const TeacherProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setProfile(userData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
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
        quality: 0.5,
      });

      if (!result.canceled) {
        setUploading(true);
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('profilePic', {
        uri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      } as any);
      formData.append('userId', profile?.schoolId.toString() || '');

      const response = await fetch('https://neevschool.sbs/school/updateProfilePic', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local profile data
        setProfile(prev => prev ? {...prev, profilePic: result.profilePic} : null);
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        throw new Error(result.message || 'Failed to upload image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.header}
      >
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={handleImagePick} style={styles.imageWrapper}>
            {profile?.profilePic ? (
              <Image
                source={{ uri: profile.profilePic }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <FontAwesome name="user" size={50} color="#fff" />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <FontAwesome name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.role}>Teacher</Text>
      </LinearGradient>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <FontAwesome name="envelope" size={20} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="phone" size={20} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile?.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="id-badge" size={20} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>School ID</Text>
              <Text style={styles.infoValue}>{profile?.schoolId}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="book" size={20} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Subject</Text>
              <Text style={styles.infoValue}>{profile?.subject || 'Not assigned'}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    marginVertical: 20,
  },
  imageWrapper: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: (width * 0.3) / 2,
    backgroundColor: '#95a5a6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.3) / 2,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.3) / 2,
    backgroundColor: '#95a5a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3498db',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: (width * 0.3) / 2,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  role: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
});

export default TeacherProfile; 