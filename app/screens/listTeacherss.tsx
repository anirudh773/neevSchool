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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, TextInput, Surface, IconButton } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Class } from '../../constants/types';

const { width } = Dimensions.get('window');

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
    primarySubject: string;
    substituteSubjectId: string;
    qualification: string;
    isActive: boolean;
};

const formatClassSection = (className: string, sectionName: string): string => 
    `${className}-Section-${sectionName}`;

interface TeacherCardProps {
    teacher: Teacher;
    onEdit: (teacher: Teacher) => void;
    onDelete: (teacher: Teacher) => void;
    subjects: Subject[];
    classes: Class[];
}

const getSubjectName = (subjectId: string, subjects: Subject[] = []) => {
    if (!subjects?.length) return 'Loading...';
    const subject = subjects.find(s => s.id.toString() == subjectId);
    return subject ? subject.name : 'Unknown Subject';
};

const getClassSectionName = (sectionId: number | undefined, classes: Class[]): string => {
    if (!sectionId || !classes?.length) return 'Not Assigned';
    
    for (const classItem of classes) {
        const section = classItem.sections.find((s: Section) => s.id === sectionId);
        if (section) {
            return `Class ${classItem.name} - Section ${section.name}`;
        }
    }
    return 'Not Assigned';
};

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, onEdit, onDelete, subjects, classes }) => (
    <Surface style={styles.teacherCard}>
        <View style={styles.cardHeader}>
            <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{teacher.name}</Text>
                <Text style={styles.teacherEmail}>{teacher.email}</Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => onEdit(teacher)}
                >
                    <FontAwesome name="edit" size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => onDelete(teacher)}
                >
                    <FontAwesome name="trash" size={16} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
        
        <View style={styles.cardContent}>
            <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                    <FontAwesome name="phone" size={14} color="#5C6BC0" />
                </View>
                <Text style={styles.infoText}>{teacher.mobileNumber}</Text>
            </View>
            <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                    <FontAwesome name="book" size={14} color="#5C6BC0" />
                </View>
                <Text style={styles.infoText}>
                    Primary: {getSubjectName(teacher.primarySubjectId, subjects)}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                    <FontAwesome name="book" size={14} color="#5C6BC0" />
                </View>
                <Text style={styles.infoText}>
                    Substitute: {getSubjectName(teacher.substituteSubjectId, subjects)}
                </Text>
            </View>
            <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                    <FontAwesome name="graduation-cap" size={14} color="#5C6BC0" />
                </View>
                <Text style={styles.infoText}>
                    Class Teacher Of: {getClassSectionName(Number(teacher.classTeacherOf), classes)}
                </Text>
            </View>
        </View>
    </Surface>
);

interface ClassSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (classId: number, sectionId: number) => void;
    editingTeacher: Teacher | null;
    classes: Class[];
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({ 
    visible, 
    onClose, 
    onSelect, 
    editingTeacher,
    classes
}) => (
    <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Class & Section</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <FontAwesome name="times" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                    <ScrollView 
                        style={styles.modalScrollView}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.modalScrollContent}
                    >
                        {classes.map((classItem) => (
                            <View key={classItem.id} style={styles.classGroup}>
                                <Text style={styles.classGroupTitle}>Class {classItem.name}</Text>
                                {classItem.sections && classItem.sections.length > 0 ? (
                                    classItem.sections.map((section: Section) => (
                                        <TouchableOpacity
                                            key={`${classItem.id}-${section.id}`}
                                            style={[
                                                styles.classOption,
                                                editingTeacher?.sectionId === section.id &&
                                                styles.selectedClassOption
                                            ]}
                                            onPress={() => {
                                                onSelect(classItem.id, section.id);
                                            }}
                                        >
                                            <View style={styles.classOptionContent}>
                                                <FontAwesome name="graduation-cap" size={16} color="#666" />
                                                <Text style={[
                                                    styles.classOptionText,
                                                    editingTeacher?.sectionId === section.id &&
                                                    styles.selectedClassOptionText
                                                ]}>
                                                    Section {section.name}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noSectionsContainer}>
                                        <Text style={styles.noSectionsText}>
                                            No sections available
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    </Modal>
);

interface EditModalProps {
    visible: boolean;
    onClose: () => void;
    onUpdate: (data: TeacherUpdateData) => void;
    teacher: Teacher | null;
    selectedClassSection: {
        className: string;
        sectionId: number;
        sectionName: string;
    } | null;
    setSelectedClassSection: (value: {
        className: string;
        sectionId: number;
        sectionName: string;
    } | null) => void;
    setShowClassSelect: (show: boolean) => void;
    classes: Class[];
}

interface TeacherUpdateData {
    name: string;
    email: string;
    primarySubjectId?: string;
    substituteSubjectId?: string;
    classTeacherOf?: number;
}

interface UpdateData {
    name: string;
    email: string;
    classTeacherOf?: number;
}

const getClassSectionDetails = (sectionId: string | number | undefined, classes: Class[]) => {
    if (!sectionId) return null;
    
    for (const classItem of classes) {
        const section = classItem.sections.find((s: Section) => s.id === Number(sectionId));
        if (section) {
            return {
                className: classItem.name,
                sectionId: section.id,
                sectionName: section.name
            };
        }
    }
    return null;
};

const EditModal: React.FC<EditModalProps> = ({ 
    visible, 
    onClose, 
    onUpdate, 
    teacher,
    selectedClassSection,
    setSelectedClassSection,
    setShowClassSelect,
    classes
}) => {
    const [formData, setFormData] = useState<TeacherUpdateData>({
        name: '',
        email: '',
        classTeacherOf: undefined
    });

    useEffect(() => {
        if (teacher) {
            setFormData({
                name: teacher.name,
                email: teacher.email,
                classTeacherOf: teacher.classTeacherOf ? Number(teacher.classTeacherOf) : undefined
            });
            
            if (teacher.classTeacherOf) {
                const classSection = getClassSectionDetails(teacher.classTeacherOf, classes);
                if (classSection) {
                    setSelectedClassSection(classSection);
                }
            } else {
                setSelectedClassSection(null);
            }
        }
    }, [teacher]);

    const handleUpdate = () => {
        if (!formData.name || !formData.email || !teacher) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        
        const updateData = {
            name: teacher?.name || '',
            email: teacher?.email || '',
            classTeacherOf: teacher?.classTeacherOf ? Number(teacher.classTeacherOf) : undefined,
            primarySubjectId: teacher?.primarySubjectId,
            substituteSubjectId: teacher?.substituteSubjectId
        };
        
        onUpdate(updateData);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
            >
                <Surface style={styles.editModalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.editModalTitle}>Edit Teacher Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <FontAwesome name="times" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.editFormContainer}>
                        <View style={styles.editInputGroup}>
                            <Text style={styles.editInputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.editInput}
                                value={formData.name}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                placeholder="Enter teacher's name"
                                mode="outlined"
                                outlineColor="#E0E0E0"
                                activeOutlineColor="#1A237E"
                                left={<TextInput.Icon icon="account" color="#5C6BC0" />}
                            />
                        </View>

                        <View style={styles.editInputGroup}>
                            <Text style={styles.editInputLabel}>Email Address</Text>
                            <TextInput
                                style={styles.editInput}
                                value={formData.email}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                                keyboardType="email-address"
                                placeholder="Enter email address"
                                mode="outlined"
                                outlineColor="#E0E0E0"
                                activeOutlineColor="#1A237E"
                                left={<TextInput.Icon icon="email" color="#5C6BC0" />}
                            />
                        </View>

                        <View style={styles.editInputGroup}>
                            <Text style={styles.editInputLabel}>Class Teacher Of</Text>
                            <TouchableOpacity
                                style={styles.classSelectField}
                                onPress={() => setShowClassSelect(true)}
                            >
                                <FontAwesome 
                                    name="graduation-cap" 
                                    size={20} 
                                    color="#666" 
                                    style={styles.selectIcon}
                                />
                                <Text style={styles.classSelectText}>
                                    {selectedClassSection 
                                        ? `Class ${selectedClassSection.className} - Section ${selectedClassSection.sectionName}`
                                        : 'Select Class & Section'}
                                </Text>
                                <FontAwesome name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View style={styles.editModalFooter}>
                        <TouchableOpacity
                            style={[styles.editModalButton, styles.cancelModalButton]}
                            onPress={onClose}
                        >
                            <FontAwesome name="times" size={18} color="#FFF" />
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.editModalButton, styles.saveModalButton]}
                            onPress={handleUpdate}
                        >
                            <FontAwesome name="check" size={18} color="#FFF" />
                            <Text style={styles.modalButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </Surface>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const LoadingState = () => (
    <View style={styles.loadingContainer}>
        <Surface style={styles.loadingCard}>
            <ActivityIndicator 
                size="large" 
                color="#1A237E" 
                style={styles.loadingIndicator} 
            />
            <View style={styles.loadingTextContainer}>
                <Text style={styles.loadingTitle}>Loading Teachers</Text>
                <Text style={styles.loadingSubtitle}>Please wait while we fetch the data</Text>
            </View>
        </Surface>
    </View>
);

interface Subject {
    id: number;
    name: string;
    description: string;
    icon: string;
}

interface Section {
    id: number;
    name: string;
}

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
    const [selectedClassSection, setSelectedClassSection] = useState<{
        className: string;
        sectionId: number;
        sectionName: string;
    } | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [schoolId, setSchoolId] = useState<number>(1);

    useEffect(() => {
        const initializeUserData = async () => {
            try {
                const userDataStr = await SecureStore.getItemAsync('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    setSchoolId(userData.schoolId);
                }
            } catch (error) {
            }
        };
        
        initializeUserData();
    }, []);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`https://neevschool.sbs/school/getTeachersBySchoolId?schoolId=${schoolId}`);
            const data = await response.json();
            if (data.success) {
                setTeachers(data.data);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch teachers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadSubjects = async () => {
        try {
            const storedSubjects = await SecureStore.getItemAsync('subjectBySchool');
            if (storedSubjects) {
                const parsedSubjects = JSON.parse(storedSubjects);
                setSubjects(parsedSubjects);
                return parsedSubjects;
            }

            const response = await fetch(`https://neevschool.sbs/school/getExamMasterData?schoolId=${schoolId}`);
            const data = await response.json();
            if (data.success) {
                const newSubjects = data.data.subjectBySchool;
                setSubjects(newSubjects);
                await SecureStore.setItemAsync('subjectBySchool', JSON.stringify(newSubjects));
                return newSubjects;
            }
            return [];
        } catch (error) {
            return [];
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const classesData = await SecureStore.getItemAsync('schoolClasses');
                if (classesData) {
                    setClasses(JSON.parse(classesData));
                }

                const response = await fetch(`https://neevschool.sbs/school/getSchudeleMasterData?schoolId=${schoolId}`);
                const result = await response.json();
                
                if (result.success) {
                    await loadSubjects();
                }
            } catch (error) {
            }
        };

        if (schoolId) {
            loadData();
            fetchTeachers();
        }
    }, [schoolId]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchTeachers();
    };

    const handleEdit = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        if (teacher.classTeacherOf) {
            const classSection = getClassSectionDetails(teacher.classTeacherOf, classes);
            if (classSection) {
                setSelectedClassSection(classSection);
            }
        } else {
            setSelectedClassSection(null);
        }
        setShowEditModal(true);
    };

    const handleDelete = async (teacher: Teacher): Promise<void> => {
        Alert.alert(
            "Delete Teacher",
            `Are you sure you want to delete ${teacher.name}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`https://neevschool.sbs/school/updateTeacher/${teacher.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isActive: false })
                            });
                            
                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Success', 'Teacher deleted successfully');
                                fetchTeachers();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete teacher');
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    const handleUpdatemm = async (updateData: TeacherUpdateData): Promise<void> => {
        if (!editingTeacher) return;

        try {
            setEditLoading(true);
            if(updateData && updateData.classTeacherOf) updateData.classTeacherOf = +updateData.classTeacherOf
            const response = await fetch(`https://neevschool.sbs/school/updateTeacher/${editingTeacher.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...updateData,
                    classTeacherOf: updateData.classTeacherOf
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Alert.alert('Success', 'Teacher updated successfully');
                fetchTeachers();
                setShowEditModal(false);
                setSelectedClassSection(null);
            } else {
                setEditLoading(false);
                Alert.alert('Error', data.message || 'Failed to update teacher');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error while updating teacher');
        } finally {
            setEditLoading(false);
        }
    };

    const filteredTeachers = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <LoadingState />;
    }
    if (editLoading) {
        return (
            <View style={styles.editLoadingContainer}>
                <Surface style={styles.editLoadingCard}>
                    <ActivityIndicator size="large" color="#1A237E" />
                    <Text style={[styles.loadingTitle, { marginTop: 16 }]}>
                        Updating Teacher
                    </Text>
                    <Text style={styles.loadingSubtitle}>
                        Please wait while we save the changes
                    </Text>
                </Surface>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Surface style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => router.push('/screens/addTeacher')}
                    >
                        <FontAwesome name="plus" size={16} color="#fff" />
                        <Text style={styles.addButtonText}>Add Teacher</Text>
                    </TouchableOpacity>
                </View>
            </Surface>

            <TextInput
                placeholder="Search teachers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                mode="outlined"
                left={<TextInput.Icon icon="magnify" />} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {filteredTeachers.length > 0 ? (
                    filteredTeachers.map(teacher => (
                        <TeacherCard 
                            key={teacher.id} 
                            teacher={teacher} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete} 
                            subjects={subjects}
                            classes={classes}
                        />
                    ))
                ) : (
                    <Text style={styles.noTeachers}>
                        {searchQuery ? 'No teachers found' : 'No teachers added yet'}
                    </Text>
                )}
            </ScrollView>

            <EditModal
                visible={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingTeacher(null);
                    setSelectedClassSection(null);
                }}
                onUpdate={handleUpdatemm}
                teacher={editingTeacher}
                selectedClassSection={selectedClassSection}
                setSelectedClassSection={setSelectedClassSection}
                setShowClassSelect={setShowClassSelect}
                classes={classes}
            />
            <ClassSelectionModal
                visible={showClassSelect}
                onClose={() => setShowClassSelect(false)}
                onSelect={(classId, sectionId) => {
                    const selectedClass = classes.find(c => c.id === classId);
                    const selectedSection = selectedClass?.sections.find((s: Section) => s.id === sectionId);
                    
                    if (selectedClass && selectedSection) {
                        setEditingTeacher(prev =>
                            prev ? {
                                ...prev,
                                classTeacherOf: sectionId.toString(),
                                sectionId: sectionId
                            } : null
                        );
                        
                        setSelectedClassSection({
                            className: selectedClass.name,
                            sectionId: sectionId,
                            sectionName: selectedSection.name
                        });
                    }
                    setShowClassSelect(false);
                }}
                editingTeacher={editingTeacher}
                classes={classes}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFF',
    },
    header: {
        padding: 10,
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#1A237E',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: Math.min(24, width * 0.06),
        fontWeight: 'bold',
        color: '#1A237E',
        marginBottom: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    teacherCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#1A237E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    teacherInfo: {
        flex: 1,
    },
    teacherName: {
        fontSize: Math.min(18, width * 0.045),
        fontWeight: '600',
        color: '#1A237E',
        marginBottom: 4,
    },
    teacherEmail: {
        fontSize: Math.min(14, width * 0.035),
        color: '#5C6BC0',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    editButton: {
        backgroundColor: '#007AFF',
    },
    deleteButton: {
        backgroundColor: '#FF5252',
    },
    cardContent: {
        padding: 16,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E8EAF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        fontSize: Math.min(14, width * 0.035),
        color: '#424242',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFF',
        padding: 20,
    },
    loadingCard: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#1A237E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        width: '90%',
        maxWidth: 340,
    },
    loadingIndicator: {
        marginBottom: 16,
    },
    loadingTextContainer: {
        alignItems: 'center',
    },
    loadingTitle: {
        fontSize: Math.min(20, width * 0.05),
        fontWeight: 'bold',
        color: '#1A237E',
        marginBottom: 8,
    },
    loadingSubtitle: {
        fontSize: Math.min(14, width * 0.035),
        color: '#5C6BC0',
        textAlign: 'center',
    },
    searchInput: {
        margin: 16,
        backgroundColor: '#fff',
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
        height: '90%',
        width: '100%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#fff',
    },
    modalBody: {
        flex: 1,
        overflow: 'hidden',
    },
    modalScrollView: {
        flex: 1,
    },
    modalScrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    classGroup: {
        marginBottom: 24,
    },
    classGroupTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A237E',
        marginBottom: 12,
        paddingLeft: 8,
    },
    classOption: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#F8FAFF',
    },
    selectedClassOption: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
        borderWidth: 1,
    },
    classOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    classOptionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedClassOptionText: {
        color: '#2196F3',
        fontWeight: '600',
    },
    noSectionsContainer: {
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 8,
    },
    noSectionsText: {
        color: '#666',
        fontStyle: 'italic',
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
    subtitle: {
        fontSize: Math.min(14, width * 0.035),
        color: '#5C6BC0',
    },
    editLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    editLoadingCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    editModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    editModalTitle: {
        fontSize: Math.min(20, width * 0.05),
        fontWeight: 'bold',
        color: '#1A237E',
    },
    editFormContainer: {
        marginTop: 16,
    },
    editInputGroup: {
        marginBottom: 20,
    },
    editInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    editInput: {
        backgroundColor: '#fff',
    },
    classSelectField: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    selectIcon: {
        marginRight: 12,
    },
    classSelectText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    editModalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    editModalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    cancelModalButton: {
        backgroundColor: '#FF5252',
    },
    saveModalButton: {
        backgroundColor: '#4CAF50',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TeacherListing;