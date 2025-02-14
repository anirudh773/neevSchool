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
    Linking,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, TextInput } from 'react-native-paper';
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
    resumeUrl?: string;
    sectionId?: number;
};

type SubjectId = '1' | '2' | '3' | '4';

const subjects: Record<SubjectId, string> = {
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
    const [editLoading, setEditLoading] = useState(false);
    // const [editingTeacher, setEditingTeacher] = useState(null);
    const [selectedClassSection, setSelectedClassSection] = useState<{
        className: string;
        sectionId: number;
        sectionName: string;
    } | null>(null);

    const formatClassSection = (className: string, sectionName: string) =>
        `${className}-Section-${sectionName}`;

    const handleViewResume = (resumeUrl?: string) => {
        if (resumeUrl) {
            Linking.openURL(resumeUrl).catch(() => {
                Alert.alert('Error', 'Unable to open resume');
            });
        } else {
            Alert.alert('Info', 'No resume available for this teacher');
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await fetch('https://testcode-2.onrender.com/school/getTeachersBySchoolId?schoolId=1', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
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
        fetchTeachers();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchTeachers();
    };

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

    const handleUpdatemm = async () => {
        if (!editingTeacher) return;

        try {
            setEditLoading(true)
            const updateData = {
                teacherUpdates: [{
                    id: editingTeacher.id,
                    name: editingTeacher.name,
                    email: editingTeacher.email,
                    mobileNumber: editingTeacher.mobileNumber,
                    classTeacherOf: +editingTeacher.sectionId
                }]
            };

            const response = await fetch('https://testcode-2.onrender.com/school/updateTeachers', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            setEditLoading(false)

            if (response.ok && data.success) {
                setTeachers(teachers.map(t =>
                    t.id === editingTeacher.id ? editingTeacher : t
                ));
                setShowEditModal(false);
                Alert.alert('Success', 'Teacher updated successfully');
                fetchTeachers();
            } else {
                setShowEditModal(false);
                Alert.alert('Error', data.message || 'Failed to update teacher');
            }
        } catch (error) {
            setEditLoading(false)
            setShowEditModal(false);
            console.error('Update error:', error);
            Alert.alert('Error', 'Network error while updating teacher');
        }
    };

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
                        Class {teacher.classTeacherOf} - {subjects[teacher.primarySubjectId as SubjectId]}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <FontAwesome name="calendar" size={14} color="#666" />
                    <Text style={styles.infoText}>
                        Joined: {new Date(teacher.joiningDate).toLocaleDateString()}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.resumeButton}
                    onPress={() => handleViewResume(teacher.resumeUrl)}
                >
                    <FontAwesome name="file-text" size={14} color="#fff" />
                    <Text style={styles.resumeButtonText}>View Resume</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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

    const EditModal = () => {
        // Local state to track form values
        const [formData, setFormData] = useState({
            name: '',
            email: '',
            mobileNumber: '',
            classTeacherOf: ''
        });

        // Update local state when editingTeacher changes
        useEffect(() => {
            if (editingTeacher) {
                setFormData({
                    name: editingTeacher.name || '',
                    email: editingTeacher.email || '',
                    mobileNumber: editingTeacher.mobileNumber || '',
                    classTeacherOf: editingTeacher.classTeacherOf || ''
                });
            }
        }, [editingTeacher]);

        const handleInputChange = (field: any, value: any) => {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleUpdate = async () => {
            await handleUpdatemm()
            // Update the teacher with formData
            // Your update logic here
            setShowEditModal(false);
            setEditingTeacher(null);
        };

        return (
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowEditModal(false);
                    setEditingTeacher(null);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>Edit Teacher</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.name}
                                    onChangeText={(text) => handleInputChange('name', text)}
                                    placeholder="Name"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.email}
                                    onChangeText={(text) => handleInputChange('email', text)}
                                    keyboardType="email-address"
                                    placeholder="Email"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mobile Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.mobileNumber}
                                    onChangeText={(text) => handleInputChange('mobileNumber', text)}
                                    keyboardType="phone-pad"
                                    placeholder="Mobile Number"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Class Teacher Of</Text>
                                <TouchableOpacity
                                    style={styles.classSelectButton}
                                    onPress={() => setShowClassSelect(true)}
                                >
                                    <Text style={styles.classSelectValue}>
                                        {selectedClassSection ?
                                            formatClassSection(selectedClassSection.className, selectedClassSection.sectionName) :
                                            (formData.classTeacherOf || 'Select Class')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => {
                                        setShowEditModal(false);
                                        setEditingTeacher(null);
                                    }}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.saveButton]}
                                    onPress={handleUpdate}
                                >
                                    <Text style={styles.buttonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" style={styles.loadingIndicator} />
                <Text style={styles.loadingText}>Loading Master data...</Text>
            </View>
        );
    }
    if (editLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" style={styles.loadingIndicator} />
                <Text style={styles.loadingText}>Updating teacher data...</Text>
            </View>
        );
    }

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
                left={<TextInput.Icon icon="magnify" />} />

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
        maxHeight: '90%',
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
    },
    loadingIndicator: {
        marginBottom: 20,
    },
    loadingText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '500',
    },
    resumeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
        justifyContent: 'center',
        gap: 8,
    },
    resumeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderColor: 'gray',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
});

export default TeacherListing;