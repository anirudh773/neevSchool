import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

const dummyData: Post[] = [
  {
    id: 1,
    author: "Sarah Johnson",
    avatar: "SJ",
    content: "Just finished grading the mid-term papers. Impressed by the progress our students are making! 📚✨",
    likes: 24,
    comments: 5,
    timeAgo: "2h ago"
  },
  {
    id: 2,
    author: "Mike Peterson",
    avatar: "MP",
    content: "Our science fair winners! Congratulations to all participants. The creativity and innovation displayed was outstanding.",
    likes: 45,
    comments: 12,
    timeAgo: "4h ago"
  },
  {
    id: 3,
    author: "Emma Wilson",
    avatar: "EW",
    content: "Today's professional development workshop on integrating technology in classrooms was enlightening. Looking forward to implementing new strategies!",
    likes: 38,
    comments: 8,
    timeAgo: "6h ago"
  },
  {
    id: 4,
    author: "David Chen",
    avatar: "DC",
    content: "Sports day preparations are in full swing! Can't wait for next week's events. 🏃‍♂️🏆",
    likes: 29,
    comments: 7,
    timeAgo: "8h ago"
  },
  {
    id: 5,
    author: "Lisa Thompson",
    avatar: "LT",
    content: "Parent-teacher meetings start tomorrow. Looking forward to productive discussions about student progress.",
    likes: 15,
    comments: 3,
    timeAgo: "12h ago"
  }
];

const Profile = () => {
  const router = useRouter();

  const renderPost = (post: Post) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{post.avatar}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.author}</Text>
            <Text style={styles.timeAgo}>{post.timeAgo}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <FontAwesome name="ellipsis-h" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      <View style={styles.postActions}>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome name="heart-o" size={20} color="#64748b" />
            <Text style={styles.actionText}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome name="comment-o" size={20} color="#64748b" />
            <Text style={styles.actionText}>{post.comments}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <FontAwesome name="bookmark-o" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        <TouchableOpacity style={styles.createButton}>
          <FontAwesome name="plus" size={16} color="#ffffff" />
          <Text style={styles.createButtonText}>Create Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.feedContainer}>
          {dummyData.map(renderPost)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  feedContainer: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  timeAgo: {
    fontSize: 14,
    color: '#64748b',
  },
  postContent: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default Profile;