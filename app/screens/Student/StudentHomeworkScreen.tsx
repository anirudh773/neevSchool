import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking
} from "react-native";
import { Text, Surface, Card, Avatar } from "react-native-paper";
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface Homework {
  id: string;
  subject: string;
  description: string;
  date: string;
  teacherName: string;
  imgUrl?: string;
  docUrl?: string;
}

interface UserInfo {
  id: number;
  userId: string;
  schoolId: number;
  name: string;
  role: number;
  teacherId: number | null;
  studentClass: {
    classId: number;
    className: string;
    sectionId: number;
    sectionName: string;
  };
}

const StudentHomeworkScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = await SecureStore.getItemAsync('userData');
        if (!userData) {
          throw new Error('User data not found');
        }

        const parsedUserInfo: UserInfo = JSON.parse(userData);
        setUserInfo(parsedUserInfo);
        await fetchHomework(selectedDate, parsedUserInfo);
      } catch (error) {
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchHomework(selectedDate, userInfo);
    }
  }, [selectedDate]);

  const onDateChange = (_: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchHomework = async (date: Date, user: UserInfo) => {
    try {
      setIsLoading(true);
      const formattedDate = formatDate(date);
      
      const response = await fetch(
        `https://13.202.16.149:8080/school/getStudentHomework?schoolId=${user.schoolId}&studentId=${user.id}&date=${formattedDate}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setHomeworkList(result.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch homework');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (userInfo) {
      fetchHomework(selectedDate, userInfo);
    }
  };

  const handleAttachmentPress = (url: string | undefined) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Cannot open this attachment');
      });
    }
  };

  const SubjectIcon = ({ subject }: { subject: string }) => {
    const getIconName = () => {
      switch (subject.toLowerCase()) {
        case 'mathematics': return 'calculator';
        case 'science': return 'flask';
        case 'english': return 'book';
        case 'history': return 'history';
        case 'geography': return 'globe';
        default: return 'book';
      }
    };

    return (
      <Avatar.Icon 
        size={40} 
        icon={getIconName()} 
        style={{ backgroundColor: '#E3F2FD' }}
        color="#1565C0"
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animations/landing_animation.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.loadingText}>Loading your homework...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#2196F3']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Homework</Text>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <FontAwesome name="calendar" size={20} color="#FFF" />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {homeworkList.length === 0 ? (
          <Surface style={styles.emptyContainer}>
            <LottieView
              source={require('../../../assets/animations/landing_animation.json')}
              autoPlay
              loop
              style={{ width: 150, height: 150 }}
            />
            <Text style={styles.emptyText}>No homework for this date!</Text>
            <Text style={styles.emptySubText}>Pull down to refresh</Text>
          </Surface>
        ) : (
          homeworkList.map((homework) => (
            <Card key={homework.id} style={styles.homeworkCard}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.subjectContainer}>
                    <SubjectIcon subject={homework.subject} />
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{homework.subject}</Text>
                      <Text style={styles.teacherName}>By: {homework.teacherName}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.description}>{homework.description}</Text>
                {(homework.imgUrl || homework.docUrl) && (
                  <View style={styles.attachments}>
                    {homework.imgUrl && (
                      <TouchableOpacity 
                        style={styles.attachment}
                        onPress={() => handleAttachmentPress(homework.imgUrl)}
                      >
                        <FontAwesome name="image" size={20} color="#1565C0" />
                        <Text style={styles.attachmentText}>View Image</Text>
                      </TouchableOpacity>
                    )}
                    {homework.docUrl && (
                      <TouchableOpacity 
                        style={styles.attachment}
                        onPress={() => handleAttachmentPress(homework.docUrl)}
                      >
                        <FontAwesome name="file-text" size={20} color="#1565C0" />
                        <Text style={styles.attachmentText}>View Document</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 10,
  },
  dateText: {
    color: '#FFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  homeworkCard: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1565C0',
  },
  teacherName: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginVertical: 12,
  },
  attachments: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  attachmentText: {
    color: '#1565C0',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default StudentHomeworkScreen; 