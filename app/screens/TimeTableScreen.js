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
  
  const [periods, setPeriods] = useState([]);
  const [days, setDays] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // UI state
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [timetable, setTimetable] = useState({});
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showSubjectList, setShowSubjectList] = useState(false);
  const [masterData, setMasterData] = useState(null);

  // Add this state for tracking subject per cell
  const [cellSubjects, setCellSubjects] = useState({});

  // Update the loading state to include timetable operations
  const [isLoading, setIsLoading] = useState({
    classes: true,
    masterData: true,
    timetable: false,
    update: false
  });

  // Add new state for existing timetable
  const [existingTimetable, setExistingTimetable] = useState([]);

  // Load classes data
  useEffect(() => {
    loadClassesData();
  }, []);

  const loadClassesData = async () => {
    try {
      setIsLoading(prev => ({ ...prev, classes: true }));
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
      setIsLoading(prev => ({ ...prev, classes: false }));
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

  // Add function to fetch existing timetable
  const fetchExistingTimetable = async (classId, sectionId) => {
    try {
      setIsLoading(prev => ({ ...prev, timetable: true }));
      const response = await fetch(
        `https://testcode-2.onrender.com/school/getSchoolTimetable?schoolId=1&classId=${classId}&sectionId=${sectionId}`
      );
      const result = await response.json();
      
      if (result.success) {
        setExistingTimetable(result.data);
        
        // Convert existing timetable to our format
        const newTimetable = {};
        const newCellSubjects = {};
        
        result.data.forEach(entry => {
          const key = `${entry.dayName}-${entry.slotName}-${entry.classId}-${entry.sectionId}`;
          
          // Set teacher
          newTimetable[key] = {
            id: entry.teacherId,
            name: entry.teacherName
          };
          
          // Set subject
          newCellSubjects[key] = {
            id: entry.subjectId,
            name: entry.subjectName
          };
        });
        
        setTimetable(newTimetable);
        setCellSubjects(newCellSubjects);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setError('Failed to load existing timetable');
    } finally {
      setIsLoading(prev => ({ ...prev, timetable: false }));
    }
  };

  // Update useEffect when class and section are selected
  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchExistingTimetable(selectedClass.id, selectedSection.id);
    }
  }, [selectedClass, selectedSection]);

  // Add function to update timetable entry
  const updateTimetableEntry = async (entryId, teacherId, subjectId, timeSlotId, dayId) => {
    try {
      setIsLoading(prev => ({ ...prev, update: true }));
      const response = await fetch(
        `https://testcode-2.onrender.com/school/updateSchoolTimetable/${entryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teacherId,
            subjectId,
            timeSlotId,
            dayId,
            isActive: true
          })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        await fetchExistingTimetable(selectedClass.id, selectedSection.id);
        Alert.alert('Success', 'Timetable updated successfully');
      } else {
        throw new Error(result.message || 'Failed to update timetable');
      }
    } catch (error) {
      console.error('Error updating timetable:', error);
      Alert.alert('Error', error.message || 'Failed to update timetable');
    } finally {
      setIsLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Modify handleAssignment to use update API when entry exists
  const handleAssignment = (teacher) => {
    if (selectedCell && selectedClass && selectedSection) {
      const key = `${selectedCell.day}-${selectedCell.period}-${selectedClass.id}-${selectedSection.id}`;
      const cellSubject = cellSubjects[key];
      
      if (!cellSubject) {
        Alert.alert('Error', 'Please select a subject first');
        return;
      }

      // Find existing entry
      const existingEntry = existingTimetable.find(entry => 
        entry.dayName === selectedCell.day && 
        entry.slotName === selectedCell.period
      );

      if (existingEntry) {
        // Update existing entry
        updateTimetableEntry(
          existingEntry.id,
          teacher.id,
          cellSubject.id,
          existingEntry.period,
          existingEntry.dayId
        );
      } else {
        // Handle new entry with previous submit logic
        setTimetable(prev => ({
          ...prev,
          [key]: teacher
        }));
      }
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

  // Add this useEffect at the top of other effects
  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      setIsLoading(prev => ({ ...prev, masterData: true }));
      const response = await fetch('https://testcode-2.onrender.com/school/getSchudeleMasterData?schoolId=1');
      const result = await response.json();
      
      if (result.success) {
        setMasterData(result.data);
        setTeachers(result.data.teachers);
        setSubjects(result.data.subjects);
        setPeriods(result.data.schoolPeriod);
        setDays(result.data.schoolDays);
      } else {
        setError('Failed to load schedule data');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching schedule data:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, masterData: false }));
    }
  };

  // Add function to handle subject selection
  const handleSubjectSelect = (subject) => {
    if (selectedCell && selectedClass && selectedSection) {
      const key = `${selectedCell.day}-${selectedCell.period}-${selectedClass.id}-${selectedSection.id}`;
      setCellSubjects(prev => ({
        ...prev,
        [key]: subject
      }));
    }
    setShowSubjectList(false);
  };

  // Add this function to handle opening subject modal
  const handleSubjectButtonPress = (day, period) => {
    setSelectedCell({ day, period });  // Set the selected cell before opening modal
    setShowSubjectList(true);
  };

  // Add these helper functions after other state declarations
  const getDayId = (dayName) => {
    const day = days.find(d => d.dayName === dayName);
    return day ? day.id : 1;
  };

  const getPeriodNumber = (periodName) => {
    const period = periods.find(p => p.periodName === periodName);
    return period ? period.id : 1;
  };

  // Add submit function
  const handleSubmitSchedule = async () => {
    if (!selectedClass || !selectedSection) {
      Alert.alert('Error', 'Please select class and section first');
      return;
    }

    try {
      setLoading(true);
      const scheduleData = [];

      // Convert timetable data to API format
      Object.entries(timetable).forEach(([key, teacher]) => {
        const [day, period, classId, sectionId] = key.split('-');
        const cellSubject = cellSubjects[key];

        if (teacher && cellSubject) {
          scheduleData.push({
            period: getPeriodNumber(period),
            teacherId: teacher.id,
            subjectId: cellSubject.id,
            dayId: getDayId(day)
          });
        }
      });

      if (scheduleData.length === 0) {
        Alert.alert('Error', 'Please assign at least one schedule');
        return;
      }

      const payload = {
        classId: selectedClass.id,
        sectionId: selectedSection.id,
        schedule: scheduleData
      };
      console.log(payload, 'dsdsdsdsd')

      const response = await fetch(
        'https://testcode-2.onrender.com/school/submitSchoolSchudele?examScId=2',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'examScId': '2'
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Schedule saved successfully');
        // Optionally clear the form or refresh data
        setTimetable({});
        setCellSubjects({});
      } else {
        throw new Error(result.message || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', error.message || 'Failed to save schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add this function to filter teachers based on selected subject
  const getTeachersForSubject = (subjectId) => {
    return teachers.filter(teacher => 
      teacher.primarySubjectId === subjectId || 
      teacher.substituteSubjectId === subjectId
    );
  };

  // Add a loading overlay component
  const LoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A237E" />
        <Text style={styles.loadingText}>Please wait...</Text>
      </View>
    </View>
  );

  if (isLoading.classes || isLoading.masterData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A237E" />
          <Text style={styles.loadingText}>
            {isLoading.masterData ? 'Loading schedule data...' : 'Loading class data...'}
          </Text>
          <Text style={styles.loadingSubText}>
            Please wait while we prepare everything
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color="#FF5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchMasterData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {(isLoading.timetable || isLoading.update) && <LoadingOverlay />}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <FontAwesome name="arrow-left" size={20} color="#64748b" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.cardTitle}>Timetable Management</Text>
            <Text style={styles.cardSubtitle}>Manage class schedules and assignments</Text>
          </View>

          {selectedClass && selectedSection && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmitSchedule}
            >
              <FontAwesome name="save" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
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
                    <View key={period.id} style={styles.headerCell}>
                      <Text style={styles.headerText}>{period.periodName}</Text>
                    </View>
                  ))}
                </View>

                {days.map(day => (
                  <View key={day.id} style={styles.row}>
                    <View style={[styles.cell, styles.firstColumn]}>
                      <Text style={styles.dayText}>{day.dayName}</Text>
                    </View>
                    {periods.map((period) => {
                      const key = `${day.dayName}-${period.periodName}-${selectedClass?.id}-${selectedSection?.id}`;
                      const teacher = timetable[key];
                      const cellSubject = cellSubjects[key];
                      
                      return (
                        <TouchableOpacity
                          key={period.id}
                          style={[styles.cell, styles.periodCell]}
                          onPress={() => handleCellPress(day.dayName, period.periodName)}
                        >
                          {teacher ? (
                            <View style={styles.assignedCell}>
                              <Text style={styles.teacherName}>{teacher.name}</Text>
                              <Text style={styles.subjectText}>{cellSubject?.name}</Text>
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => {
                                  handleDelete(day.dayName, period.periodName);
                                  // Also clear the subject when deleting
                                  const key = `${day.dayName}-${period.periodName}-${selectedClass?.id}-${selectedSection?.id}`;
                                  setCellSubjects(prev => {
                                    const newState = { ...prev };
                                    delete newState[key];
                                    return newState;
                                  });
                                }}
                              >
                                <FontAwesome name="times" size={12} color="#FF5252" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.emptySlotContainer}>
                              {!cellSubject ? (
                                <TouchableOpacity 
                                  style={styles.addButton}
                                  onPress={() => handleSubjectButtonPress(day.dayName, period.periodName)}
                                >
                                  <FontAwesome name="plus" size={14} color="#1A237E" />
                                  <Text style={styles.addButtonText}>Select Subject</Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={styles.assignmentContainer}>
                                  <View style={styles.selectedSubjectContainer}>
                                    <Text style={styles.selectedSubjectText}>{cellSubject.name}</Text>
                                    <TouchableOpacity 
                                      style={styles.changeButton}
                                      onPress={() => handleSubjectButtonPress(day.dayName, period.periodName)}
                                    >
                                      <FontAwesome name="pencil" size={12} color="#666" />
                                    </TouchableOpacity>
                                  </View>
                                  
                                  {!teacher ? (
                                    <TouchableOpacity 
                                      style={styles.selectTeacherButton}
                                      onPress={() => handleCellPress(day.dayName, period.periodName)}
                                    >
                                      <FontAwesome name="user-plus" size={14} color="#1A237E" />
                                      <Text style={styles.selectTeacherText}>Select Teacher</Text>
                                    </TouchableOpacity>
                                  ) : (
                                    <View style={styles.selectedTeacherContainer}>
                                      <Text style={styles.selectedTeacherText}>{teacher.name}</Text>
                                      <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDelete(day.dayName, period.periodName)}
                                      >
                                        <FontAwesome name="times" size={12} color="#FF5252" />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
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
              <>
                <Text style={styles.pickerSubtitle}>
                  {selectedCell.day}, {selectedCell.period} Period
                </Text>
                <Text style={styles.selectedSubjectTitle}>
                  Subject: {cellSubjects[`${selectedCell.day}-${selectedCell.period}-${selectedClass?.id}-${selectedSection?.id}`]?.name}
                </Text>
              </>
            )}
            <ScrollView>
              {selectedCell && (
                <>
                  {getTeachersForSubject(
                    cellSubjects[`${selectedCell.day}-${selectedCell.period}-${selectedClass?.id}-${selectedSection?.id}`]?.id
                  ).length > 0 ? (
                    getTeachersForSubject(
                      cellSubjects[`${selectedCell.day}-${selectedCell.period}-${selectedClass?.id}-${selectedSection?.id}`]?.id
                    ).map(teacher => (
                      <TouchableOpacity
                        key={teacher.id}
                        style={styles.teacherItem}
                        onPress={() => handleAssignment(teacher)}
                      >
                        <Text style={styles.teacherItemName}>{teacher.name}</Text>
                        <Text style={styles.teacherItemSubject}>
                          {teacher.primarySubjectId === cellSubjects[`${selectedCell.day}-${selectedCell.period}-${selectedClass?.id}-${selectedSection?.id}`]?.id 
                            ? 'Primary Subject'
                            : 'Substitute Subject'
                          }
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noTeachersContainer}>
                      <FontAwesome name="info-circle" size={24} color="#666" />
                      <Text style={styles.noTeachersText}>
                        No teachers available for this subject
                      </Text>
                    </View>
                  )}
                </>
              )}
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

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubjectList(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Subject</Text>
            <ScrollView>
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={styles.pickerItem}
                  onPress={() => handleSubjectSelect(subject)}
                >
                  <View style={styles.subjectRow}>
                    <FontAwesome name={subject.icon} size={20} color="#1A237E" />
                    <Text style={styles.pickerItemText}>{subject.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSubjectList(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 90,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstColumn: {
    width: 100,
    backgroundColor: '#f8f9fa',
  },
  headerText: {
    fontWeight: '600',
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 90,
    height: 70,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
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
  emptySlotContainer: {
    padding: 2,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentContainer: {
    width: '100%',
    height: '100%',
    padding: 2,
    gap: 2,
  },
  selectedSubjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 3,
    borderRadius: 4,
    minHeight: 24,
  },
  selectedSubjectText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  changeButton: {
    padding: 2,
  },
  selectTeacherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#E3F2FD',
    padding: 3,
    borderRadius: 4,
    marginTop: 1,
  },
  selectTeacherText: {
    fontSize: 10,
    color: '#1565C0',
    fontWeight: '500',
  },
  selectedTeacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  selectedTeacherText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#F5F6F9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 6,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 8,
    fontWeight: '500',
    color: '#1A237E',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1A237E',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1A237E',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedSubjectTitle: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 16,
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 4,
  },
  noTeachersContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noTeachersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    color: '#1A237E',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TimeTableManager;