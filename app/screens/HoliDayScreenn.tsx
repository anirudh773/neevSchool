import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ScrollView,
  Dimensions,
  Alert,
  Animated,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import { Surface } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Types
interface Holiday {
  id: string;
  schoolId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  holidayUrl?: string | null;
}

interface NewHolidayState {
  id?: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

const HolidayList: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isAddModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [newHoliday, setNewHoliday] = useState<NewHolidayState>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date()
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userDataStr);
      const response = await fetch(`https://testcode-2.onrender.com/school/getHolidayBySchoolId?schoolId=${userData.schoolId}`);
      const result = await response.json();

      if (result.success) {
        const formattedHolidays = result.data.map((holiday: Holiday) => ({
          ...holiday,
          startDate: holiday.startDate.split('T')[0],
          endDate: holiday.endDate.split('T')[0]
        }));
        setHolidays(formattedHolidays);
      }
    } catch (error) {
      console.error('Error fetching holidays', error);
      Alert.alert('Error', 'Could not fetch holidays');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setIsEditMode(true);
    setNewHoliday({
      id: holiday.id,
      title: holiday.title,
      description: holiday.description,
      startDate: new Date(holiday.startDate),
      endDate: new Date(holiday.endDate)
    });
    setAddModalVisible(true);
  };

  const handleSaveHoliday = async () => {
    if (!newHoliday.title || !newHoliday.description) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (newHoliday.startDate >= newHoliday.endDate) {
      Alert.alert('Error', 'End date must be after start date.');
      return;
    }

    try {
      setActionLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userDataStr);
      const holidayData = {
        schoolId: userData.schoolId,
        title: newHoliday.title,
        description: newHoliday.description,
        startDate: formatDate(newHoliday.startDate),
        endDate: formatDate(newHoliday.endDate)
      };

      console.log(holidayData)

      const url = isEditMode 
        ? `https://testcode-2.onrender.com/school/updateHoliday/${newHoliday.id}`
        : 'https://testcode-2.onrender.com/school/addHoliday';

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayData)
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', `Holiday ${isEditMode ? 'updated' : 'added'} successfully`);
        await fetchHolidays();
        setAddModalVisible(false);
        setIsEditMode(false);
        resetForm();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error saving holiday', error);
      Alert.alert('Error', `Could not ${isEditMode ? 'update' : 'add'} holiday`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHoliday = (holidayId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this holiday?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await fetch(`https://testcode-2.onrender.com/school/updateHoliday/${holidayId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: false })
              });

              const result = await response.json();
              if (result.success) {
                Alert.alert('Success', 'Holiday deleted successfully');
                await fetchHolidays();
              } else {
                throw new Error(result.message);
              }
            } catch (error) {
              console.error('Error deleting holiday:', error);
              Alert.alert('Error', 'Failed to delete holiday');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setNewHoliday({
      id: '',
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date()
    });
  };

  const renderHolidayItem = ({ item, index }: { item: Holiday; index: number }) => (
    <Animated.View 
      style={[
        styles.holidayItem, 
        { 
          opacity: fadeAnim,
          transform: [
            { 
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            },
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * (index + 1), 0]
              })
            }
          ]
        }
      ]}
    >
      <View style={styles.holidayContent}>
        <Text style={styles.holidayTitle}>{item.title}</Text>
        <Text style={styles.holidayDate}>
          {formatDate(new Date(item.startDate))} - 
          {formatDate(new Date(item.endDate))}
        </Text>
        <Text style={styles.holidayDescription}>{item.description}</Text>
      </View>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => handleEditHoliday(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDeleteHoliday(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderModal = () => (
    <Modal
      transparent={true}
      visible={isAddModalVisible}
      animationType="slide"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContainer, { width: width * 0.9, maxHeight: height * 0.8 }]}>
          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Holiday' : 'Add New Holiday'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Holiday Title"
              value={newHoliday.title}
              onChangeText={(text) => setNewHoliday({...newHoliday, title: text})}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Holiday Description"
              value={newHoliday.description}
              onChangeText={(text) => setNewHoliday({...newHoliday, description: text})}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
            
            <View style={styles.datePickerContainer}>
              <Text style={styles.dateLabel}>Start Date:</Text>
              <TouchableOpacity 
                style={styles.dateTouchable}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(newHoliday.startDate)}</Text>
              </TouchableOpacity>
            </View>
            
            {showStartDatePicker && (
              <DateTimePicker
                value={newHoliday.startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) {
                    setNewHoliday({...newHoliday, startDate: selectedDate});
                  }
                }}
              />
            )}
            
            <View style={styles.datePickerContainer}>
              <Text style={styles.dateLabel}>End Date:</Text>
              <TouchableOpacity 
                style={styles.dateTouchable}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(newHoliday.endDate)}</Text>
              </TouchableOpacity>
            </View>
            
            {showEndDatePicker && (
              <DateTimePicker
                value={newHoliday.endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) {
                    setNewHoliday({...newHoliday, endDate: selectedDate});
                  }
                }}
              />
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSaveHoliday}
              >
                <Text style={styles.submitButtonText}>
                  {isEditMode ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAddModalVisible(false);
                  setIsEditMode(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading holidays...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {actionLoading && (
        <View style={styles.actionLoadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      
      <Text style={styles.header}>School Holidays</Text>
      <FlatList
        data={holidays}
        renderItem={renderHolidayItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No holidays scheduled</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHolidays();
            }}
            colors={['#3498db']}
          />
        }
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          setIsEditMode(false);
          setNewHoliday({ 
            title: '', 
            description: '', 
            startDate: new Date(), 
            endDate: new Date() 
          });
          setAddModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#3498db',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
    letterSpacing: 0.5,
  },
  holidayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 15,
    borderRadius: 16,
    shadowColor: '#34495e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  holidayContent: {
    flex: 1,
    marginRight: 15,
  },
  holidayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  holidayDate: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginBottom: 5,
  },
  holidayDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 70,
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalContent: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 25,
    color: '#2c3e50',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#2c3e50',
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  dateLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  dateTouchable: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#2ecc71',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    marginTop: 50,
    fontSize: 16,
    fontWeight: '500',
  },
  actionLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

export default HolidayList;