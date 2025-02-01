import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const TimeTableManager = () => {
    const router = useRouter();
  // State for data
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [periods] = useState(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']);
  const [days] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [teachers] = useState([
    { id: 1, name: 'Mr. Smith', subject: 'Mathematics' },
    { id: 2, name: 'Mrs. Johnson', subject: 'English' },
    { id: 3, name: 'Ms. Davis', subject: 'Science' },
  ]);

  // UI state
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [timetable, setTimetable] = useState({});
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // Load classes data
  useEffect(() => {
    loadClassesData();
  }, []);

  const loadClassesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const classesData = await SecureStore.getItemAsync('schoolClasses');
      if (classesData) {
        const parsedData = JSON.parse(classesData);
        setClasses(parsedData || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load class data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get available sections for selected class
  const availableSections = selectedClass 
    ? classes.find(c => c.id === selectedClass.id)?.sections || []
    : [];

  const handleCellPress = (day, period) => {
    setSelectedCell({ day, period });
    setShowTeacherModal(true);
  };

  const handleAssignment = (teacher) => {
    if (selectedCell && selectedClass && selectedSection) {
      const key = `${selectedCell.day}-${selectedCell.period}-${selectedClass.id}-${selectedSection.id}`;
      setTimetable({
        ...timetable,
        [key]: teacher
      });
    }
    setShowTeacherModal(false);
    setSelectedCell(null);
  };

  const handleDelete = (day, period) => {
    Alert.alert(
      'Delete Assignment',
      'Are you sure you want to remove this assignment?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const key = `${day}-${period}-${selectedClass.id}-${selectedSection.id}`;
            const newTimetable = { ...timetable };
            delete newTimetable[key];
            setTimetable(newTimetable);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading class data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadClassesData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#64748b" />
        </TouchableOpacity>
          <Text style={styles.cardTitle}>Timetable Management</Text>
          <Text style={styles.cardSubtitle}>Manage class schedules and assignments</Text>
        </View>

        <View style={styles.selectors}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowClassPicker(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedClass ? `Class ${selectedClass.name}` : 'Select Class'}
            </Text>
            <FontAwesome name="chevron-down" size={12} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdown, !selectedClass && styles.dropdownDisabled]}
            onPress={() => selectedClass && setShowSectionPicker(true)}
            disabled={!selectedClass}
          >
            <Text style={styles.dropdownText}>
              {selectedSection ? `Section ${selectedSection.name}` : 'Select Section'}
            </Text>
            <FontAwesome name="chevron-down" size={12} color="#666" />
          </TouchableOpacity>
        </View>

        {selectedClass && selectedSection ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.tableContainer}>
                <View style={styles.headerRow}>
                  <View style={[styles.headerCell, styles.firstColumn]}>
                    <Text style={styles.headerText}>Day/Period</Text>
                  </View>
                  {periods.map(period => (
                    <View key={period} style={styles.headerCell}>
                      <Text style={styles.headerText}>{period}</Text>
                    </View>
                  ))}
                </View>

                {days.map(day => (
                  <View key={day} style={styles.row}>
                    <View style={[styles.cell, styles.firstColumn]}>
                      <Text style={styles.dayText}>{day}</Text>
                    </View>
                    {periods.map(period => {
                      const key = `${day}-${period}-${selectedClass.id}-${selectedSection.id}`;
                      const teacher = timetable[key];
                      return (
                        <TouchableOpacity
                          key={period}
                          style={[styles.cell, styles.periodCell]}
                          onPress={() => handleCellPress(day, period)}
                        >
                          {teacher ? (
                            <View style={styles.assignedCell}>
                              <Text style={styles.teacherName}>{teacher.name}</Text>
                              <Text style={styles.subjectText}>{teacher.subject}</Text>
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDelete(day, period)}
                              >
                                <FontAwesome name="times" size={12} color="#FF4444" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <FontAwesome name="plus" size={14} color="#666" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Please select both class and section to view the timetable
            </Text>
          </View>
        )}
      </View>

      {/* Class Picker Modal */}
      <Modal
        visible={showClassPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClassPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Class</Text>
            <ScrollView>
              {classes.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedClass(cls);
                    setSelectedSection(null);
                    setShowClassPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>Class {cls.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowClassPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Section Picker Modal */}
      <Modal
        visible={showSectionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSectionPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Section</Text>
            <ScrollView>
              {availableSections.map(section => (
                <TouchableOpacity
                  key={section.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedSection(section);
                    setShowSectionPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>Section {section.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSectionPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Teacher Assignment Modal */}
      <Modal
        visible={showTeacherModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTeacherModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Assign Teacher</Text>
            {selectedCell && (
              <Text style={styles.pickerSubtitle}>
                {selectedCell.day}, {selectedCell.period} Period
              </Text>
            )}
            <ScrollView>
              {teachers.map(teacher => (
                <TouchableOpacity
                  key={teacher.id}
                  style={styles.teacherItem}
                  onPress={() => handleAssignment(teacher)}
                >
                  <Text style={styles.teacherItemName}>{teacher.name}</Text>
                  <Text style={styles.teacherItemSubject}>{teacher.subject}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTeacherModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectors: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownText: {
    color: '#333',
    fontSize: 14,
  },
  tableContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
  },
  headerCell: {
    width: 110,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  firstColumn: {
    width: 120,
    backgroundColor: '#f8f9fa',
  },
  headerText: {
    fontWeight: '600',
    color: '#333',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 110,
    height: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodCell: {
    backgroundColor: 'white',
  },
  dayText: {
    fontWeight: '500',
    color: '#333',
  },
  assignedCell: {
    width: '100%',
    height: '100%',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  subjectText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  teacherItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teacherItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  teacherItemSubject: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TimeTableManager;