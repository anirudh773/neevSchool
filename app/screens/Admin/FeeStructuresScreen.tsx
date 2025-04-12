import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Animated, // For loading animation
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';

// Types
interface FeeStructure {
  id: number;
  classId: number;
  className: string;
  schoolId: number;
  schoolName: string;
  feeTypeId: number;
  feeTypeName: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface Class {
  id: number | string;
  name: string;
}

interface FeeType {
  id: number | string;
  name: string;
}

interface FeeFormData {
  classId: number;
  feeTypeId: number;
  amount: string;
}

const allFeeTypes: FeeType[] = [
  { id: 1, name: "Tuition Fee" },
  { id: 2, name: "Development Fee" },
  { id: 3, name: "Library Fee" },
  { id: 4, name: "Laboratory Fee" },
  { id: 5, name: "Sports Fee" },
  { id: 6, name: "Computer Fee" },
  { id: 7, name: "Transport Fee" },
  { id: 8, name: "Annual Fee" },
];

// Memoized Fee Structure Item Component
const FeeStructureItem = memo(({ item, onEdit, onDelete }: { 
  item: FeeStructure; 
  onEdit: (fee: FeeStructure) => void; 
  onDelete: (id: number) => void; 
}) => (
  <View style={styles.feeItem}>
    <View style={styles.feeItemHeader}>
      <View style={styles.feeTypeContainer}>
        <Text style={styles.feeType}>{item.feeTypeName}</Text>
        <Text style={styles.className}>Class {item.className}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => onEdit(item)}
          style={[styles.actionButton, styles.editButton]}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={[styles.actionButton, styles.deleteButton]}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.feeDetails}>
      <View style={styles.detailRow}>
        <Icon name="currency-inr" size={18} color="#512da8" />
        <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
      </View>
      <View style={styles.detailRow}>
        <Icon name="clock-outline" size={18} color="#512da8" />
        <Text style={styles.date}>
          Updated: {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  </View>
));

const FeeStructuresScreen = () => {
  const router = useRouter();
  const isMounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  // All state hooks at the top level
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState<FeeFormData>({
    classId: 0,
    feeTypeId: 0,
    amount: '',
  });
  const [isNavigating, setIsNavigating] = useState(false);

  // All callback hooks together
  const keyExtractor = useCallback((item: FeeStructure) => `fee-${item.id}`, []);
  
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon name="cash-remove" size={64} color="#e0e0e0" />
      <Text style={styles.emptyText}>No fee structures found</Text>
    </View>
  ), []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  // Define fetch functions before they are used
  const fetchFeeStructures = useCallback(async () => {
    if (!isMounted.current) return;

    // Cancel any ongoing fetch
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr || !isMounted.current) return;

      const userData = JSON.parse(userDataStr);
      const response = await fetch(
        `https://neevschool.sbs/school/getClassFees?schoolId=${userData.schoolId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          signal: abortController.current.signal
        }
      );

      if (!isMounted.current) return;

      const result = await response.json();
      if (result.success && isMounted.current) {
        setFeeStructures(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch fee structures');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      
      if (isMounted.current) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch fee structures');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const classesStr = await SecureStore.getItemAsync(`schoolClasses`);
      
      if (classesStr && isMounted.current) {
        const classesData = JSON.parse(classesStr);
        setClasses(classesData);
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        // Fallback to predefined data on error
        setClasses([]);
      }
    }
  }, []);

  const fetchFeeTypes = useCallback(async () => {
    try {
      if (!isMounted.current) return;
      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) return;

      const { schoolId } = JSON.parse(userData);
      const response = await fetch(
        `https://neevschool.sbs/school/getFeeMasterData?schoolId=${schoolId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setFeeTypes(result.data);
      }
      
    } catch (error: unknown) {
      if (isMounted.current) {
        console.error('Error handling fee types:', error);
        // Fallback to predefined data on error
        setFeeTypes(allFeeTypes);
      }
    }
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (!isMounted.current || isNavigating) return;
    
    setIsNavigating(true);
    
    // Clear modal first
    setModalVisible(false);
    setEditingFee(null);
    
    // Clear lists with empty arrays
    setFeeStructures([]);
    setClasses([]);
    setFeeTypes([]);
    
    // Clear other states
    setLoading(false);
    setRefreshing(false);
    setActionLoading(false);
    
    // Reset form
    setFormData({ classId: 0, feeTypeId: 0, amount: '' });
    
    // Cleanup network requests
    cleanup();
    
    // Set mounted to false
    isMounted.current = false;
    
    // Use requestAnimationFrame for smoother navigation
    requestAnimationFrame(() => {
      router.back();
    });
  }, [cleanup, router, isNavigating]);

  // Effect for cleanup on unmount
  useEffect(() => {
    return () => {
      if (isMounted.current) {
        cleanup();
        setFeeStructures([]);
        setClasses([]);
        setFeeTypes([]);
        setModalVisible(false);
        setEditingFee(null);
        setFormData({ classId: 0, feeTypeId: 0, amount: '' });
        isMounted.current = false;
      }
    };
  }, [cleanup]);

  // Focus effect for data fetching
  useFocusEffect(
    useCallback(() => {
      if (isNavigating) {
        setIsNavigating(false);
        return;
      }

      isMounted.current = true;
      
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchFeeStructures(),
            fetchClasses(),
            fetchFeeTypes()
          ]);
        } catch (error) {
          if (isMounted.current) {
            console.error('Error fetching data:', error);
          }
        }
      };

      fetchData();

      return () => {
        cleanup();
      };
    }, [fetchFeeStructures, fetchClasses, fetchFeeTypes, cleanup, isNavigating])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeeStructures();
  }, [fetchFeeStructures]);

  const handleEdit = useCallback((fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      classId: fee.classId,
      feeTypeId: fee.feeTypeId,
      amount: fee.amount.toString(),
    });
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback((id: number) => {
    Alert.alert(
      'Delete Fee Structure',
      'Are you sure you want to delete this fee structure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const userDataStr = await SecureStore.getItemAsync('userData');
              if (!userDataStr) return;

              const userData = JSON.parse(userDataStr);
              const response = await fetch(
                `https://neevschool.sbs/school/deleteClassFee/${id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }
              );

              const result = await response.json();
              if (result.success) {
                setFeeStructures(prev => prev.filter(fee => fee.id !== id));
                Alert.alert('Success', 'Fee structure deleted successfully');
              } else {
                throw new Error(result.message || 'Failed to delete fee structure');
              }
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete fee structure');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  }, []);

  const handleSave = async () => {
    if (!formData.amount || (editingFee === null && (!formData.classId || !formData.feeTypeId))) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setActionLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) return;

      const userData = JSON.parse(userDataStr);
      
      const response = await fetch(
        `https://neevschool.sbs/school/createClassFee`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: userData.schoolId,
            classId: editingFee ? editingFee.classId : Number(formData.classId),
            feeTypeId: editingFee ? editingFee.feeTypeId : Number(formData.feeTypeId),
            amount: parseFloat(formData.amount)
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', `Fee structure ${editingFee ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        fetchFeeStructures();
        // Reset form data
        setFormData({ classId: 0, feeTypeId: 0, amount: '' });
        setEditingFee(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save fee structure');
    } finally {
      setActionLoading(false);
    }
  };

  const renderItem = useCallback(({ item }: { item: FeeStructure }) => (
    <FeeStructureItem
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ), [handleEdit, handleDelete]);

  // Modify the return statement to prevent rendering during navigation
  if (!isMounted.current || isNavigating) {
    return null;
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#512da8" />
        <Text style={styles.loadingText}>Loading fee structures...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#512da8" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="arrow-left" size={24} color="#512da8" />
        </TouchableOpacity>
        <Text style={styles.title}>Fee Structures</Text>
        <TouchableOpacity
          onPress={() => {
            if (!isMounted.current) return;
            setEditingFee(null);
            setFormData({ classId: 0, feeTypeId: 0, amount: '' });
            setModalVisible(true);
          }}
          style={styles.addButton}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        data={feeStructures}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#512da8']}
            tintColor="#512da8"
          />
        }
        ListEmptyComponent={ListEmptyComponent}
      />

      {modalVisible && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            if (!isMounted.current) return;
            setModalVisible(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingFee ? 'Edit Fee Structure' : 'Create Fee Structure'}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Class</Text>
                  <View style={[styles.pickerContainer, editingFee && styles.disabledPickerContainer]}>
                    <Picker
                      selectedValue={editingFee ? editingFee.classId : formData.classId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                      style={styles.picker}
                      enabled={!editingFee}
                    >
                      <Picker.Item label="Select Class" value={0} />
                      {classes.map(cls => (
                        <Picker.Item
                          key={cls.id}
                          label={cls.name}
                          value={cls.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Fee Type</Text>
                  <View style={[styles.pickerContainer, editingFee && styles.disabledPickerContainer]}>
                    <Picker
                      selectedValue={editingFee ? editingFee.feeTypeId : formData.feeTypeId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, feeTypeId: value }))}
                      style={styles.picker}
                      enabled={!editingFee}
                    >
                      <Picker.Item label="Select Fee Type" value={0} />
                      {feeTypes.map(type => (
                        <Picker.Item
                          key={type.id}
                          label={type.name}
                          value={type.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Amount</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.amount}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, amount: value.replace(/[^0-9]/g, '') }))}
                    keyboardType="numeric"



                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, actionLoading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {actionLoading && !modalVisible && isMounted.current && (
        <View style={styles.actionLoadingOverlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  addButton: {
    backgroundColor: '#512da8',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  listContainer: {
    padding: 16,
  },
  feeItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  feeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  feeTypeContainer: {
    flex: 1,
  },
  feeType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  className: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#4caf50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  feeDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#512da8',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledPickerContainer: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
});

export default memo(FeeStructuresScreen);
