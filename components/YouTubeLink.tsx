import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface YouTubeLinkProps {
  url: string;
  size?: number;
  color?: string;
}

const YouTubeLink: React.FC<YouTubeLinkProps> = ({ 
  url, 
  size = 24, 
  color = '#FF0000' 
}) => {
  const handlePress = () => {
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
    >
      <FontAwesome
        name="youtube-play"
        size={size}
        color={color}
      />
      <Text> Learn More</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
});

export default YouTubeLink;