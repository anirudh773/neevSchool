import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import UserAvatar from './UserAvatar';

interface UserData {
  name: string;
  profilePic?: string;
}

const Example: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  
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
  
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        {/* User Avatar without navigation */}
        <UserAvatar 
          imageUrl={userData?.profilePic} 
          size={50} 
          style={styles.avatar}
        />
        <Text style={styles.userName}>{userData?.name || 'User'}</Text>
      </View>
      
      {/* Rest of your component */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default Example; 