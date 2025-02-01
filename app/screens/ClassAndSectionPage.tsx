import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Class } from '@/constants/types';

interface Section {
  id: number;
  name: string;
}

interface ClassData extends Class {
  sections: Section[];
}

const { width } = Dimensions.get('window');
// Adjusted for better spacing with 2 cards per row
const cardWidth = (width - 60) / 2; // 40 = horizontal padding (16 * 2) + gap between cards (8)

const ClassSectionsScreen = () => {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classesData = await SecureStore.getItemAsync('schoolClasses');
        if (classesData) {
          setClasses(JSON.parse(classesData));
        }
      } catch (error) {
        console.error('Error loading classes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  const handleClassPress = (classData: ClassData) => {
    setSelectedClass(classData);
    setModalVisible(true);
  };

  const handleSectionPress = (classId: number, sectionId: number) => {
    console.log('////////////////////changes', classId, sectionId)
    // router.push('/screens/StudentListScreen')
    router.push({
        pathname: '/screens/StudentListScreen',
        params: { classId, sectionId }
      });
    setModalVisible(false);
  };

  const renderClassCard = (classItem: ClassData) => (
    <TouchableOpacity
      key={classItem.id}
      style={styles.card}
      onPress={() => handleClassPress(classItem)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.className}>{`Class-${classItem.name}`}</Text>
          <View style={styles.iconContainer}>
            <FontAwesome name="graduation-cap" size={20} color="#3b82f6" />
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.sectionInfo}>
            <FontAwesome name="users" size={14} color="#64748b" />
            <Text style={styles.sectionCount}>
              {classItem.sections.length} {classItem.sections.length === 1 ? 'Section' : 'Sections'}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color="#64748b" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderModalContent = () => {
    if (!selectedClass) return null;

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <FontAwesome name="graduation-cap" size={24} color="#3b82f6" />
            <Text style={styles.modalTitle}>{selectedClass.name} Sections</Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          >
            <FontAwesome name="times-circle" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {selectedClass.sections && selectedClass.sections.length > 0 ? (
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.sectionGrid}>
              {selectedClass.sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={styles.sectionCard}
                  onPress={() => handleSectionPress(selectedClass.id, section.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionContent}>
                    <FontAwesome name="users" size={16} color="#3b82f6" />
                    <Text style={styles.sectionName}>Section {section.name}</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={14} color="#3b82f6" />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.noSectionsContainer}>
            <FontAwesome name="info-circle" size={24} color="#64748b" />
            <Text style={styles.noSections}>No sections available</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Select a class to view sections</Text>
        </View>
        
        <View style={styles.gridContainer}>
          {classes.map(renderClassCard)}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            {renderModalContent()}
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: cardWidth,
    height: cardWidth * 0.6,
    borderRadius: 19,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 8,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  sectionGrid: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  noSectionsContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  noSections: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
  },
  dropdownDisabled: {
    opacity: 0.5,
  },
});

export default ClassSectionsScreen;