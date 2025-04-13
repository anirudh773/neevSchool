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

// Gradient color options for section cards
const SECTION_GRADIENTS = [
  ['#FF5F6D', '#FFC371'] as const, // Orange/Peach
  ['#36D1DC', '#5B86E5'] as const, // Blue
  ['#8E2DE2', '#4A00E0'] as const, // Purple
  ['#11998e', '#38ef7d'] as const, // Green
];

interface Section {
  id: number;
  name: string;
  sectionName?: string;
  displayName?: string;
}

interface DetailedSection {
  sectionId: number;
  sectionName: string;
  studentCount: number;
}

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

interface SectionDetailsResponse {
  success: boolean;
  message?: string;
  data: {
    totalSections: number;
    leastPopulatedSection: DetailedSection;
    allStudents: Student[];
  };
}

interface StudentItemProps {
  item: Student;
}

interface EmptyListProps {
  searchQuery: string;
}

// Memoized student item component to prevent unnecessary re-renders
const StudentItem = memo(({ item }: StudentItemProps) => (
  <View style={styles.studentCard}>
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
  </View>
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

const SectionSelectionScreen = () => {
  const router = useRouter();
  const { youtubeLink } = useLocalSearchParams();
  // Simple, declarative states that drive UI
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [leastPopulatedSection, setLeastPopulatedSection] = useState<DetailedSection | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  
  // Navigation state - simplifies the complex flags from before
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Component lifecycle
  const isMounted = useRef(true);

  // Simple lifecycle cleanup
  useEffect(() => {
    isMounted.current = true;
    
    // Clean up when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load classes on focus
  useFocusEffect(
    useCallback(() => {
      // Reset navigation state when screen comes into focus
      setIsNavigating(false);
      
      // Load classes if needed
      if (classes.length === 0) {
        loadClasses();
      }
      
      return () => {
        // Nothing specific to clean up on blur
      };
    }, [classes.length])
  );

  // Handle class selection effect
  useEffect(() => {
    if (selectedClassId && isMounted.current) {
      InteractionManager.runAfterInteractions(() => {
        if (isMounted.current) {
          fetchLeastPopulatedSection(selectedClassId);
        }
      });
    }
  }, [selectedClassId]);

  // Handle search filtering
  useEffect(() => {
    if (!isMounted.current) return;
    
    if (students && students.length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        student =>
          student.name.toLowerCase().includes(query) ||
          student.mobileNumber.toLowerCase().includes(query) ||
          student.parentName.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query)
      );
      
      if (isMounted.current) {
        setFilteredStudents(filtered);
      }
    } else {
      if (isMounted.current) {
        setFilteredStudents([]);
      }
    }
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
      } else {
        await fetchClassesFromAPI();
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load classes. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchClassesFromAPI = async () => {
    if (!isMounted.current) return;
    
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }
      
      if (!isMounted.current) return;
      
      const userData = JSON.parse(userDataStr);
      const schoolId = userData.schoolId;
      
      const response = await fetch(`https://neevschool.sbs/school/getAllClasses?schoolId=${schoolId}`);
      const result = await response.json();
      
      if (!isMounted.current) return;
      
      if (result.success) {
        setClasses(result.data);
        await SecureStore.setItemAsync('classes', JSON.stringify(result.data));
      } else {
        throw new Error(result.message || 'Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  };

  const fetchLeastPopulatedSection = async (classId: number) => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }
      
      if (!isMounted.current) return;
      
      const userData = JSON.parse(userDataStr);
      const schoolId = userData.schoolId;
      
      const response = await fetch(
        `https://neevschool.sbs/school/getLeastPopulatedSection?schoolId=${schoolId}&classId=${classId}`
      );
      
      const result: SectionDetailsResponse = await response.json();
      
      if (!isMounted.current) return;
      
      if (result.success && result.data) {
        const classObj = classes.find(c => c.id === classId);
        if (classObj && isMounted.current) {
          setSelectedClass(classObj);
        }
        
        if (result.data.leastPopulatedSection && isMounted.current) {
          setLeastPopulatedSection(result.data.leastPopulatedSection);
        } else if (isMounted.current) {
          setLeastPopulatedSection(null);
          console.warn('Least populated section data not found in response');
        }
        
        if (Array.isArray(result.data.allStudents) && isMounted.current) {
          // Create a new array with new object references to avoid mutation issues
          const studentsList = [...result.data.allStudents].map(student => ({...student}));
          setStudents(studentsList);
          setFilteredStudents(studentsList);
        } else if (isMounted.current) {
          console.warn('allStudents is not an array or is missing in response');
          setStudents([]);
          setFilteredStudents([]);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch section details');
      }
    } catch (error) {
      console.error('Error fetching least populated section:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load section details. Please try again.');
        setLeastPopulatedSection(null);
        setStudents([]);
        setFilteredStudents([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleClassSelect = useCallback((classId: number) => {
    if (!isMounted.current || isNavigating) return;
    
    // First clear previous data
    setLeastPopulatedSection(null);
    setStudents([]);
    setFilteredStudents([]);
    setSearchQuery('');
    
    // Then set new class ID (which will trigger the API call)
    setSelectedClassId(classId);
  }, [isNavigating]);

  // Simplified navigation handling - no need for complex timing and ref manipulation
  const handleAddStudent = useCallback(() => {
    if (!selectedClass || !leastPopulatedSection || !isMounted.current || isNavigating) return;
    
    // First mark as navigating to prevent further interactions
    setIsNavigating(true);
    
    // Use a single setTimeout to ensure state is updated before navigating
    setTimeout(() => {
      if (isMounted.current) {
        try {
          // Simple navigation with no direct DOM manipulation
          router.push({
            pathname: '/screens/AddStudentScreen',
            params: {
              classId: selectedClass.id.toString(),
              className: selectedClass.name || selectedClass.displayName || 'Selected Class',
              sectionId: leastPopulatedSection.sectionId.toString(),
              sectionName: leastPopulatedSection.sectionName
            }
          });
        } catch (error) {
          console.error('Navigation error:', error);
          // Reset navigation state if error
          if (isMounted.current) {
            setIsNavigating(false);
          }
        }
      }
    }, 50);
  }, [selectedClass, leastPopulatedSection, router, isNavigating]);

  const handleSearchClear = useCallback(() => {
    if (!isMounted.current || isNavigating) return;
    setSearchQuery('');
  }, [isNavigating]);

  // Memoized callbacks for FlatList to prevent unnecessary re-renders
  const keyExtractor = useCallback((item: Student) => `student-${item.id}`, []);
  
  const renderItem = useCallback(({ item }: { item: Student }) => (
    <StudentItem item={item} />
  ), []);
  
  const renderEmptyComponent = useCallback(() => (
    <EmptyList searchQuery={searchQuery} />
  ), [searchQuery]);

  // Main render function
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.classSelectionContainer}>
      <View style={styles.xyz}>
        <Text style={styles.sectionLabel}>Select Class</Text>
        {youtubeLink && typeof youtubeLink === 'string' && (
              <>
              <YouTubeLink url={youtubeLink} size={20} />
              </>
        )}
        </View>
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
            removeClippedSubviews={false} // Important: prevent native view issues
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
                {selectedClass && leastPopulatedSection ? (
                  <>
                    <View style={styles.classInfoHeader}>
                      <View style={styles.classInfoRow}>
                        <View style={styles.classInfoTextContainer}>
                          <Text style={styles.classInfoText}>
                            Admission in Class: <Text style={styles.highlightText}>{selectedClass.displayName || selectedClass.name}</Text>
                          </Text>
                          <Text style={styles.classInfoText}>
                            Section: <Text style={styles.highlightText}>{leastPopulatedSection.sectionName}</Text>
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.addStudentButton}
                          onPress={handleAddStudent}
                          disabled={isNavigating}
                        >
                          <MaterialIcons name="person-add" size={20} color="#fff" />
                          <Text style={styles.addStudentButtonText}>Add New Admission</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
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
                    
                    {!isNavigating ? (
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
                    ) : (
                      <View style={styles.loaderContainer}>
                        <ActivityIndicator size="small" color="#4A90E2" />
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.loaderContainer}>
                    <MaterialIcons name="info-outline" size={40} color="#64748b" />
                    <Text style={styles.noSelectionText}>
                      Section data is not available. Please try again.
                    </Text>
                  </View>
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
  classInfoHeader: {
    padding: 16,
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
  classInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classInfoTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  classInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  highlightText: {
    color: '#4A90E2',
    fontWeight: '600',
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
    marginBottom: 12,
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
  addStudentButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  addStudentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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

export default memo(SectionSelectionScreen); 