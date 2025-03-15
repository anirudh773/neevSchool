import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  useWindowDimensions,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface UserAvatarProps {
  imageUrl?: string;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  imageUrl,
  size = 40,
  style,
  imageStyle,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            { borderRadius: size / 2 },
            imageStyle,
          ]}
        />
      ) : (
        <View style={[styles.placeholder, { borderRadius: size / 2 }]}>
          <FontAwesome name="user" size={size * 0.4} color="#fff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(149, 165, 166, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserAvatar; 