import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  ScrollView,
  Dimensions,
  TextInput,
  InteractionManager,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import YouTubeLink from 'components/YouTubeLink';

// Get device width for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CLASS_CARD_SIZE = Math.min(85, SCREEN_WIDTH / 4.5);

interface Student {
  id: number;
  name: string;
  parentName: string;
  mobileNumber: string;
  email: string;
  sectionName: string;
}

interface Class {
  id: number;
  name: string;
  displayName?: string;
}

interface StudentItemProps {
  item: Student;
  onPress: (student: Student) => void;
}

interface EmptyListProps {
  searchQuery: string;
}

// Memoized student item component to prevent unnecessary re-renders
const StudentItem = memo(({ item, onPress }: StudentItemProps) => (
  <TouchableOpacity 
    style={styles.studentCard}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <View style={styles.studentInfo}>
      <Text style={styles.studentName}>{item.name}</Text>
      
      <View style={styles.studentDetail}>
        <MaterialIcons name="phone" size={16} color="#64748b" />
        <Text style={styles.studentDetailText}>{item.mobileNumber}</Text>
      </View>
      
      <View style={styles.studentDetail}>
        <MaterialIcons name="person" size={16} color="#64748b" />
        <Text style={styles.studentDetailText}>{item.parentName}</Text>
      </View>
      
      <View style={styles.studentDetail}>
        <MaterialIcons name="email" size={16} color="#64748b" />
        <Text style={styles.studentDetailText}>{item.email}</Text>
      </View>

      <View style={styles.sectionBadge}>
        <MaterialIcons name="class" size={14} color="#fff" />
        <Text style={styles.sectionBadgeText}>Section {item.sectionName}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

// Memoized empty state component
const EmptyList = memo(({ searchQuery }: EmptyListProps) => (
  <View style={styles.emptyContainer}>
    <MaterialIcons name="person-search" size={60} color="#eee" />
    <Text style={styles.emptyText}>
      {searchQuery 
        ? 'No students match your search' 
        : 'No students found in this class'}
    </Text>
  </View>
));

const PaymentStudentScreen = () => {
  // States
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Refs
  const isMounted = useRef(true);
  const router = useRouter();
  const { youtubeLink } = useLocalSearchParams();

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    loadClasses();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Remove useFocusEffect as it's causing multiple updates
  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, [])
  );

  // Handle class selection
  useEffect(() => {
    if (!selectedClassId || !isMounted.current) return;

    const loadStudents = async () => {
      try {
        setLoading(true);
        await fetchStudentsByClass(selectedClassId);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadStudents();
  }, [selectedClassId]);

  // Handle search filtering with stable dependencies
  useEffect(() => {
    if (!isMounted.current) return;
    
    const query = searchQuery.toLowerCase();
    const timeoutId = setTimeout(() => {
      if (!isMounted.current) return;
      
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.mobileNumber.toLowerCase().includes(query) ||
        student.parentName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
      
      setFilteredStudents(filtered);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, students]);

  const loadClasses = async () => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      const classesData = await SecureStore.getItemAsync('schoolClasses');
      
      if (!isMounted.current) return;
      
      if (classesData) {
        const parsedClasses = JSON.parse(classesData);
        setClasses(parsedClasses);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('Failed to load classes:', error);
        Alert.alert('Error', 'Failed to load classes. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchStudentsByClass = async (classId: number) => {
    if (!isMounted.current) return;
    
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr || !isMounted.current) return;
      
      const userData = JSON.parse(userDataStr);
      const response = await fetch(
        `https://neevschool.sbs/school/getLeastPopulatedSection?schoolId=${userData.schoolId}&classId=${classId}`
      );
      
      if (!isMounted.current) return;
      
      const result = await response.json();
      
      if (result.success && result.data?.allStudents) {
        const studentsList = Array.isArray(result.data.allStudents) 
          ? result.data.allStudents 
          : [];
        
        setStudents(studentsList);
        setFilteredStudents(studentsList);
      } else {
        throw new Error(result.message || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load students. Please try again.');
        setStudents([]);
        setFilteredStudents([]);
      }
    }
  };

  const handleClassSelect = useCallback((classId: number) => {
    if (!isMounted.current || isNavigating) return;
    setSelectedClassId(classId);
  }, [isNavigating]);

  const handleStudentSelect = useCallback((student: Student) => {
    if (!isMounted.current || isNavigating) return;
    
    setIsNavigating(true);
    InteractionManager.runAfterInteractions(() => {
      if (isMounted.current) {
        router.push({
          pathname: '/screens/Cashier/SubmitPaymentScreen',
          params: { student: JSON.stringify(student) }
        });
      }
    });
  }, [router]);

  const handleSearchClear = useCallback(() => {
    if (!isMounted.current || isNavigating) return;
    setSearchQuery('');
  }, [isNavigating]);

  // Memoized callbacks for FlatList
  const keyExtractor = useCallback((item: Student) => `student-${item.id}`, []);
  
  const renderItem = useCallback(({ item }: { item: Student }) => (
    <StudentItem item={item} onPress={handleStudentSelect} />
  ), [handleStudentSelect]);
  
  const renderEmptyComponent = useCallback(() => (
    <EmptyList searchQuery={searchQuery} />
  ), [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>Select Class</Text>

      </View> */}

      <View style={styles.xyz}>
      <Text style={styles.title}>Select Class</Text>
      {youtubeLink && typeof youtubeLink === 'string' && (
              <YouTubeLink url={youtubeLink} size={20} />
            )}
      </View>

      <View style={styles.classSelectionContainer}>
        {loading && (!classes || classes.length === 0) ? (
          <View style={[styles.loaderContainer, styles.smallLoader]}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.loaderText}>Loading classes...</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classesScrollContainer}
            removeClippedSubviews={false}
            keyboardShouldPersistTaps="handled"
          >
            {(classes || []).map(classItem => (
              <TouchableOpacity
                key={`class-${classItem.id}`}
                style={[
                  styles.classCard,
                  selectedClassId === classItem.id && styles.selectedClassCard
                ]}
                onPress={() => handleClassSelect(classItem.id)}
                disabled={isNavigating || loading}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={selectedClassId === classItem.id 
                    ? ['#4A90E2', '#5CA9FB'] 
                    : ['#F8F9FA', '#E9ECEF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.classCardGradient}
                >
                  <View style={[
                    styles.classIconContainer,
                    selectedClassId === classItem.id && styles.selectedClassIconContainer
                  ]}>
                    <MaterialIcons 
                      name="school" 
                      size={20} 
                      color={selectedClassId === classItem.id ? "#fff" : "#4A90E2"} 
                    />
                  </View>
                  <Text style={[
                    styles.className,
                    selectedClassId === classItem.id && styles.selectedClassName
                  ]}
                    numberOfLines={1}
                  >
                    {classItem.displayName || classItem.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {loading && selectedClassId ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF5F6D" />
          <Text style={styles.loaderText}>Loading student data...</Text>
        </View>
      ) : (
        <>
          {selectedClassId ? (
            <View style={styles.studentListContainer}>
              <View style={styles.sectionInfoContainer}>
                <View style={styles.searchContainer}>
                  <View style={styles.searchBar}>
                    <MaterialIcons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by name, number, parent, or email"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      editable={!isNavigating}
                    />
                    {searchQuery ? (
                      <TouchableOpacity 
                        onPress={handleSearchClear}
                        disabled={isNavigating}
                      >
                        <MaterialIcons name="close" size={20} color="#64748b" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                
                {!isNavigating && (
                  <FlatList
                    key={`student-list-${selectedClassId}`}
                    data={filteredStudents}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.studentsListContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyComponent}
                    removeClippedSubviews={false}
                    initialNumToRender={8}
                    windowSize={3}
                    maxToRenderPerBatch={5}
                    keyboardShouldPersistTaps="handled"
                    extraData={searchQuery}
                  />
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noSelectionContainer}>
              <MaterialIcons name="class" size={60} color="#d1e3fa" />
              <Text style={styles.noSelectionText}>Please select a class to continue</Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  xyz: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  classSelectionContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  classesScrollContainer: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  classCard: {
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    width: CLASS_CARD_SIZE,
    height: CLASS_CARD_SIZE,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  classCardGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  selectedClassCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  classIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedClassIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  className: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    width: '100%',
  },
  selectedClassName: {
    color: '#fff',
    fontWeight: '600',
  },
  studentListContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sectionInfoContainer: {
    flex: 1,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  studentsListContent: {
    padding: 12,
    paddingBottom: 30,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  studentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  studentDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  sectionBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  smallLoader: {
    flex: 0,
    padding: 10,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default memo(PaymentStudentScreen); 