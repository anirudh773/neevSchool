import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Modal,
    RefreshControl,
    Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Class } from '@/constants/types';

type Teacher = {
    id: number;
    name: string;
    email: string;
    mobileNumber: string;
    classTeacherOf: string;
    primarySubjectId: string;
    qualifications: string;
    joiningDate: string;
};

type SubjectId = '1' | '2' | '3' | '4';

// Define subjects with specific type
const subjects: any = {
    '1': 'Mathematics',
    '2': 'Science',
    '3': 'English',
    '4': 'Social Studies'
};

const TeacherListing: React.FC = () => {
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [classes, setClasses] = useState<Class[]>([]);
    const [showClassSelect, setShowClassSelect] = useState(false);

    const [selectedClassSection, setSelectedClassSection] = useState<{
        className: string;
        sectionId: number;
        sectionName: string;
    } | null>(null);

     // Helper function to format class-section display
     const formatClassSection = (className: string, sectionName: string) => 
        `${className}-Section-${sectionName}`;

    const fetchTeachers = async () => {
        try {
            const response = await fetch('https://testcode-2.onrender.com/school/getTeachersBySchoolId?schoolId=1', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log(data.data)
            if (response.ok && data.success) {
                setTeachers(data.data);
            } else {
                Alert.alert('Error', 'Failed to fetch teachers');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        const loadClasses = async () => {
            try {
                const classesData = await SecureStore.getItemAsync('schoolClasses');
                if (classesData) {
                    setClasses(JSON.parse(classesData));
                }
            } catch (error) {
                console.error('Error loading classes:', error);
            }
        };

        loadClasses();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchTeachers();
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleEdit = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setShowEditModal(true);
    };

    const handleDelete = async (teacherId: number) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this teacher?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch('https://testcode-2.onrender.com/school/updateTeachers', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    teacherUpdates: [{
                                        id: teacherId,
                                        isActive: 0
                                    }]
                                })
                            });

                            if (response.ok) {
                                setTeachers(teachers.filter(t => t.id !== teacherId));
                                Alert.alert('Success', 'Teacher deleted successfully');
                            } else {
                                Alert.alert('Error', 'Failed to delete teacher');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Network error while deleting teacher');
                        }
                    }
                }
            ]
        );
    };

    const handleUpdate = async () => {
        if (!editingTeacher) return;

        try {
            const response = await fetch('https://testcode-2.onrender.com/updateTeachers', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teacherUpdates: [{
                        id: editingTeacher.id,
                        name: editingTeacher.name,
                        email: editingTeacher.email,
                        mobileNumber: editingTeacher.mobileNumber
                    }]
                })
            });

            if (response.ok) {
                setTeachers(teachers.map(t =>
                    t.id === editingTeacher.id ? editingTeacher : t
                ));
                setShowEditModal(false);
                Alert.alert('Success', 'Teacher updated successfully');
            } else {
                Alert.alert('Error', 'Failed to update teacher');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error while updating teacher');
        }
    };

    const ClassSelectionModal = () => (
        <Modal
            visible={showClassSelect}
            transparent
            animationType="slide"
            onRequestClose={() => setShowClassSelect(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Class & Section</Text>
                    <ScrollView>
                        {classes.map((classItem) => (
                            <View key={classItem.id}>
                                {classItem.sections.length > 0 ? (
                                    classItem.sections.map((section) => (
                                        <TouchableOpacity
                                            key={`${classItem.id}-${section.id}`}
                                            style={[
                                                styles.classOption,
                                                editingTeacher?.sectionId === section.id && 
                                                styles.selectedClassOption
                                            ]}
                                            onPress={() => {
                                                setEditingTeacher(prev => 
                                                    prev ? {
                                                        ...prev,
                                                        classTeacherOf: classItem.name,
                                                        sectionId: section.id
                                                    } : null
                                                );
                                                setSelectedClassSection({
                                                    className: classItem.name,
                                                    sectionId: section.id,
                                                    sectionName: section.name
                                                });
                                                setShowClassSelect(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.classOptionText,
                                                editingTeacher?.sectionId === section.id && 
                                                styles.selectedClassOptionText
                                            ]}>
                                                {formatClassSection(classItem.name, section.name)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noSectionsContainer}>
                                        <Text style={styles.noSectionsText}>
                                            {classItem.name} - No sections available
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowClassSelect(false)}
                    >
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const filteredTeachers = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const TeacherCard = ({ teacher }: { teacher: Teacher }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.teacherName}>{teacher.name}</Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        onPress={() => handleEdit(teacher)}
                        style={[styles.actionButton, styles.editButton]}
                    >
                        <FontAwesome name="edit" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleDelete(teacher.id)}
                        style={[styles.actionButton, styles.deleteButton]}
                    >
                        <FontAwesome name="trash" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
    
            <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                    <FontAwesome name="envelope" size={14} color="#666" />
                    <Text style={styles.infoText}>{teacher.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <FontAwesome name="phone" size={14} color="#666" />
                    <Text style={styles.infoText}>{teacher.mobileNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                    <FontAwesome name="book" size={14} color="#666" />
                    <Text style={styles.infoText}>
                        Class {teacher.classTeacherOf} - {subjects[teacher.primarySubjectId]}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <FontAwesome name="calendar" size={14} color="#666" />
                    <Text style={styles.infoText}>
                        Joined: {new Date(teacher.joiningDate).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </View>
    );

    const EditModal = () => (
        <Modal
            visible={showEditModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowEditModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Edit Teacher</Text>

                    <TextInput
                        label="Name"
                        value={editingTeacher?.name || ''}
                        onChangeText={(text) =>
                            setEditingTeacher(prev => prev ? { ...prev, name: text } : null)
                        }
                        style={styles.modalInput}
                        mode="outlined"
                    />

                    <TextInput
                        label="Email"
                        value={editingTeacher?.email || ''}
                        onChangeText={(text) =>
                            setEditingTeacher(prev => prev ? { ...prev, email: text } : null)
                        }
                        keyboardType="email-address"
                        style={styles.modalInput}
                        mode="outlined"
                    />

                    <TextInput
                        label="Mobile Number"
                        value={editingTeacher?.mobileNumber || ''}
                        onChangeText={(text) =>
                            setEditingTeacher(prev => prev ? { ...prev, mobileNumber: text } : null)
                        }
                        keyboardType="phone-pad"
                        style={styles.modalInput}
                        mode="outlined"
                    />
                    <TouchableOpacity
                        style={styles.classSelectButton}
                        onPress={() => setShowClassSelect(true)}
                    >
                        <Text style={styles.classSelectLabel}>Class Teacher Of</Text>
                        <Text style={styles.classSelectValue}>
                            {editingTeacher?.classTeacherOf || 'Select Class'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setShowEditModal(false)}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton]}
                            onPress={handleUpdate}
                        >
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <FontAwesome name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Teachers</Text>
                <TouchableOpacity
                    onPress={() => router.push('/screens/addTeacher')}
                    style={styles.addButton}
                >
                    <FontAwesome name="plus" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <TextInput
                placeholder="Search teachers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                mode="outlined"
                left={<TextInput.Icon icon="magnify" />}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {filteredTeachers.length > 0 ? (
                    filteredTeachers.map(teacher => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))
                ) : (
                    <Text style={styles.noTeachers}>
                        {searchQuery ? 'No teachers found' : 'No teachers added yet'}
                    </Text>
                )}
            </ScrollView>

            <EditModal />
            <ClassSelectionModal />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerText: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    backButton: {
        padding: 8,
    },
    addButton: {
        padding: 8,
    },
    searchInput: {
        margin: 16,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    teacherName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        borderRadius: 6,
        marginLeft: 8,
    },
    editButton: {
        backgroundColor: '#007AFF',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    cardContent: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        color: '#666',
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalInput: {
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    noTeachers: {
        textAlign: 'center',
        color: '#666',
        marginTop: 32,
    },
    classSelectButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        marginBottom: 16,
    },
    classSelectLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    classSelectValue: {
        fontSize: 16,
        color: '#000',
    },
    classOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    classOptionText: {
        fontSize: 16,
        color: '#000',
    },
    sectionText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    selectedClassOption: {
        backgroundColor: '#e3f2fd',
    },
    selectedClassOptionText: {
        color: '#1976d2',
        fontWeight: 'bold',
    },
    noSectionsContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f5f5f5',
    },
    noSectionsText: {
        color: '#666',
        fontStyle: 'italic',
    }
});

export default TeacherListing;