// types.ts
interface ExamType {
    id: number;
    examName: string;
    school_id: number;
    description?: string;
    is_active: boolean;
}

interface Subject {
    id: number;
    name: string;
}

interface ExamScheduleForm {
    subject_id: number;
    class_id: number;
    exam_datetime: Date;
    duration_minutes: number;
    max_marks: number;
    passing_marks: number;
    topics: string
}

// CreateExamScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, Dimensions, Alert, Platform } from 'react-native';
import { TextInput, Button, Card, Title, Portal, Modal, IconButton, Surface, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AddExamScreen = () => {
    const router = useRouter();
    const { selectedClasses } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [examDetails, setExamDetails] = useState({
        examName: '',
        id: null as number | null,
        start_date: new Date(),
        end_date: new Date(),
    });

    const [schedules, setSchedules] = useState<ExamScheduleForm[]>([]);
    const [examTypeModalVisible, setExamTypeModalVisible] = useState(false);
    const [subjectModalVisible, setSubjectModalVisible] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState<Partial<ExamScheduleForm>>({});
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showExamDatePicker, setShowExamDatePicker] = useState(false);
    const [showExamTimePicker, setShowExamTimePicker] = useState(false);
    const [examDate, setExamDate] = useState(new Date());
    const [examTime, setExamTime] = useState(new Date());
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [examTypes, setExamTypes] = useState<ExamType[]>([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [examTypesJson, subjectsJson] = await Promise.all([
                SecureStore.getItemAsync('examType'),
                SecureStore.getItemAsync('subjectBySchool')
            ]);

            if (examTypesJson) {
                setExamTypes(JSON.parse(examTypesJson));
            }
            if (subjectsJson) {
                setSubjects(JSON.parse(subjectsJson));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load exam data');
        }
    };

    const handleAddSchedule = () => {
        if (!isScheduleValid(currentSchedule)) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        const newSchedule = currentSchedule as ExamScheduleForm;
        if (newSchedule.exam_datetime < examDetails.start_date || 
            newSchedule.exam_datetime > examDetails.end_date) {
            Alert.alert('Invalid Date', 'Exam date must be within the selected date range');
            return;
        }

        if (checkScheduleConflicts(newSchedule)) {
            return;
        }

        setSchedules([...schedules, newSchedule]);
        setCurrentSchedule({});
        setSubjectModalVisible(false);
    };

    const handleCreateExam = async () => {
        if (!validateExamDetails()) {
            return;
        }

        setLoading(true);
        try {
            const userData = await SecureStore.getItemAsync('userData');
            if (!userData) {
                throw new Error('User data not found');
            }

            const userDatas = JSON.parse(userData);
            if (!userDatas.schoolId) {
                throw new Error('School ID not found');
            }

            const examData = {
                exam_name: examDetails.examName,
                exam_type_id: examDetails.id,
                school_id: parseInt(userDatas.schoolId),
                start_date: examDetails.start_date.toISOString(),
                end_date: examDetails.end_date.toISOString(),
                schedules: schedules.map(schedule => ({
                    subject_id: schedule.subject_id,
                    class_id: +selectedClasses,
                    exam_datetime: schedule.exam_datetime.toISOString(),
                    duration_minutes: schedule.duration_minutes,
                    max_marks: schedule.max_marks,
                    passing_marks: schedule.passing_marks,
                    topics: schedule.topics || ''
                }))
            };

            const response = await fetch('https://neevschool.sbs/school/submitExamBySchoolId', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(examData),
            });

            if (response.ok) {
                Alert.alert('Success', 'Exam created successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                throw new Error('Failed to create exam');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create exam. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const validateExamDetails = () => {
        if (!examDetails.examName) {
            Alert.alert('Validation Error', 'Please enter an exam name');
            return false;
        }
        if (!examDetails.id) {
            Alert.alert('Validation Error', 'Please select an exam type');
            return false;
        }
        if (schedules.length === 0) {
            Alert.alert('Validation Error', 'Please add at least one subject schedule');
            return false;
        }
        if (examDetails.start_date > examDetails.end_date) {
            Alert.alert('Validation Error', 'Start date must be before end date');
            return false;
        }
        return true;
    };

    const isScheduleValid = (schedule: Partial<ExamScheduleForm>): boolean => {
        return !!(
            schedule.subject_id &&
            schedule.duration_minutes &&
            schedule.max_marks &&
            schedule.passing_marks &&
            schedule.exam_datetime
        );
    };

    const checkScheduleConflicts = (newSchedule: ExamScheduleForm): boolean => {
        const newDate = new Date(newSchedule.exam_datetime);
        const existingSchedulesOnDay = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.exam_datetime);
            return scheduleDate.toDateString() === newDate.toDateString();
        });

        if (existingSchedulesOnDay.length >= 2) {
            Alert.alert('Schedule Conflict', 'Maximum 2 exams per day are allowed.');
            return true;
        }

        for (const schedule of existingSchedulesOnDay) {
            const existingStart = new Date(schedule.exam_datetime);
            const existingEnd = new Date(existingStart.getTime() + schedule.duration_minutes * 60000);
            const newStart = new Date(newSchedule.exam_datetime);
            const newEnd = new Date(newStart.getTime() + newSchedule.duration_minutes * 60000);

            if (
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            ) {
                Alert.alert('Schedule Conflict', 'This time slot overlaps with another exam.');
                return true;
            }
        }

        return false;
    };

    const renderDateTimePickers = () => (
        <View style={styles.datePickersContainer}>
            <Button
                mode="outlined"
                onPress={() => setShowStartDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
            >
                {`Start Date: ${examDetails.start_date.toLocaleDateString()}`}
            </Button>

            <Button
                mode="outlined"
                onPress={() => setShowEndDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
            >
                {`End Date: ${examDetails.end_date.toLocaleDateString()}`}
            </Button>

            {showStartDatePicker && (
                <DateTimePicker
                    value={examDetails.start_date}
                    mode="date"
                    onChange={(event, date) => {
                        setShowStartDatePicker(false);
                        if (date) {
                            setExamDetails({ ...examDetails, start_date: date });
                        }
                    }}
                />
            )}

            {showEndDatePicker && (
                <DateTimePicker
                    value={examDetails.end_date}
                    mode="date"
                    minimumDate={examDetails.start_date}
                    onChange={(event, date) => {
                        setShowEndDatePicker(false);
                        if (date) {
                            setExamDetails({ ...examDetails, end_date: date });
                        }
                    }}
                />
            )}
        </View>
    );

    const renderDateTimeSelection = () => {
        const formatTime = (date: Date) => {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const combineDateAndTime = (date: Date, time: Date) => {
            const combined = new Date(date);
            combined.setHours(time.getHours());
            combined.setMinutes(time.getMinutes());
            return combined;
        };

        return (
            <View style={styles.dateTimeContainer}>
                <Button
                    mode="outlined"
                    onPress={() => setShowExamDatePicker(true)}
                    style={styles.dateButton}
                    icon="calendar"
                >
                    {examDate ? `Exam Date: ${examDate.toLocaleDateString()}` : "Select Exam Date"}
                </Button>

                <Button
                    mode="outlined"
                    onPress={() => setShowExamTimePicker(true)}
                    style={styles.dateButton}
                    icon="clock"
                >
                    {examTime ? `Exam Time: ${formatTime(examTime)}` : "Select Exam Time"}
                </Button>

                {showExamDatePicker && (
                    <DateTimePicker
                        value={examDate}
                        mode="date"
                        minimumDate={examDetails.start_date}
                        maximumDate={examDetails.end_date}
                        onChange={(event, selectedDate) => {
                            setShowExamDatePicker(false);
                            if (selectedDate) {
                                setExamDate(selectedDate);
                                const combinedDateTime = combineDateAndTime(selectedDate, examTime);
                                setCurrentSchedule({
                                    ...currentSchedule,
                                    exam_datetime: combinedDateTime
                                });
                            }
                        }}
                    />
                )}

                {showExamTimePicker && (
                    <DateTimePicker
                        value={examTime}
                        mode="time"
                        onChange={(event, selectedTime) => {
                            setShowExamTimePicker(false);
                            if (selectedTime) {
                                setExamTime(selectedTime);
                                const combinedDateTime = combineDateAndTime(examDate, selectedTime);
                                setCurrentSchedule({
                                    ...currentSchedule,
                                    exam_datetime: combinedDateTime
                                });
                            }
                        }}
                    />
                )}
            </View>
        );
    };

    const renderExamTypeModal = () => (
        <Portal>
            <Modal
                visible={examTypeModalVisible}
                onDismiss={() => setExamTypeModalVisible(false)}
                contentContainerStyle={styles.modal}
            >
                <Surface style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Title style={styles.modalTitle}>Select Exam Type</Title>
                        <IconButton
                            icon="close"
                            size={24}
                            onPress={() => setExamTypeModalVisible(false)}
                            style={styles.closeButton}
                        />
                    </View>
                    <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.examTypeGrid}>
                            {examTypes.map((type) => (
                                <Card
                                    key={type.id}
                                    style={[
                                        styles.examTypeCard,
                                        examDetails.id === type.id && styles.selectedExamTypeCard
                                    ]}
                                    onPress={() => {
                                        setExamDetails({ ...examDetails, id: type.id });
                                        setExamTypeModalVisible(false);
                                    }}
                                >
                                    <Card.Content style={styles.examTypeCardContent}>
                                        <Text style={[
                                            styles.examTypeText,
                                            examDetails.id === type.id && styles.selectedExamTypeText
                                        ]}>
                                            {type.examName}
                                        </Text>
                                        {type.description && (
                                            <Text style={styles.examTypeDescription}>
                                                {type.description}
                                            </Text>
                                        )}
                                    </Card.Content>
                                </Card>
                            ))}
                        </View>
                    </ScrollView>
                </Surface>
            </Modal>
        </Portal>
    );

    const renderSubjectModal = () => (
        <Portal>
            <Modal
                visible={subjectModalVisible}
                onDismiss={() => setSubjectModalVisible(false)}
                contentContainerStyle={styles.modal}
            >
                <Surface style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Title style={styles.modalTitle}>Add Subject Schedule</Title>
                        <IconButton
                            icon="close"
                            size={24}
                            onPress={() => setSubjectModalVisible(false)}
                            style={styles.closeButton}
                        />
                    </View>
                    <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.subjectSection}>
                            <Text style={styles.sectionLabel}>Select Subject</Text>
                            <View style={styles.subjectGrid}>
                                {subjects.map((subject) => (
                                    <Card
                                        key={subject.id}
                                        style={[
                                            styles.subjectCard,
                                            currentSchedule.subject_id === subject.id && styles.selectedSubjectCard
                                        ]}
                                        onPress={() => setCurrentSchedule({
                                            ...currentSchedule,
                                            subject_id: subject.id
                                        })}
                                    >
                                        <Card.Content style={styles.subjectCardContent}>
                                            <Text style={[
                                                styles.subjectText,
                                                currentSchedule.subject_id === subject.id && styles.selectedSubjectText
                                            ]}>
                                                {subject.name}
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                ))}
                            </View>
                        </View>

                        <View style={styles.sectionDivider} />

                        <View style={styles.dateTimeSection}>
                            <Text style={styles.sectionLabel}>Select Date & Time</Text>
                            {renderDateTimeSelection()}
                        </View>

                        <View style={styles.sectionDivider} />

                        <View style={styles.detailsSection}>
                            <Text style={styles.sectionLabel}>Exam Details</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Duration (minutes)"
                                    value={currentSchedule.duration_minutes?.toString() || ''}
                                    onChangeText={(text) => setCurrentSchedule({
                                        ...currentSchedule,
                                        duration_minutes: parseInt(text) || 0
                                    })}
                                    keyboardType="numeric"
                                    style={styles.input}
                                    mode="outlined"
                                />

                                <TextInput
                                    label="Topics that will come in exam"
                                    value={currentSchedule.topics?.toString() || ''}
                                    onChangeText={(text) => setCurrentSchedule({
                                        ...currentSchedule,
                                        topics: text
                                    })}
                                    style={styles.input}
                                    mode="outlined"
                                    multiline
                                    numberOfLines={3}
                                />

                                <TextInput
                                    label="Maximum Marks"
                                    value={currentSchedule.max_marks?.toString() || ''}
                                    onChangeText={(text) => setCurrentSchedule({
                                        ...currentSchedule,
                                        max_marks: parseInt(text) || 0
                                    })}
                                    keyboardType="numeric"
                                    style={styles.input}
                                    mode="outlined"
                                />

                                <TextInput
                                    label="Passing Marks"
                                    value={currentSchedule.passing_marks?.toString() || ''}
                                    onChangeText={(text) => setCurrentSchedule({
                                        ...currentSchedule,
                                        passing_marks: parseInt(text) || 0
                                    })}
                                    keyboardType="numeric"
                                    style={styles.input}
                                    mode="outlined"
                                />
                            </View>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleAddSchedule}
                            style={styles.addButton}
                            disabled={!isScheduleValid(currentSchedule)}
                            contentStyle={styles.addButtonContent}
                            icon="plus"
                        >
                            Add to Schedule
                        </Button>
                    </ScrollView>
                </Surface>
            </Modal>
        </Portal>
    );

    return (
        <PaperProvider>
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <Card style={styles.card}>
                        <Card.Content>
                            <Title style={styles.title}>Create New Exam</Title>

                            <TextInput
                                label="Exam Name"
                                value={examDetails.examName}
                                onChangeText={(text) => setExamDetails({ ...examDetails, examName: text })}
                                style={styles.input}
                                mode="outlined"
                            />

                            <Button
                                mode="outlined"
                                onPress={() => setExamTypeModalVisible(true)}
                                style={styles.selectButton}
                                icon="school"
                            >
                                {examDetails.id
                                    ? examTypes.find(t => t.id === examDetails.id)?.examName
                                    : "Select Exam Type"}
                            </Button>

                            {renderDateTimePickers()}

                            <Title style={styles.sectionTitle}>Exam Schedule</Title>

                            {schedules.map((schedule, index) => (
                                <Card key={index} style={styles.scheduleCard}>
                                    <Card.Content style={styles.scheduleContent}>
                                        <View style={styles.scheduleInfo}>
                                            <Text style={styles.scheduleSubject}>
                                                {subjects.find(s => s.id === schedule.subject_id)?.name}
                                            </Text>
                                            <Text style={styles.scheduleDetail}>
                                                Date: {new Date(schedule.exam_datetime).toLocaleString()}
                                            </Text>
                                            <Text style={styles.scheduleDetail}>
                                                Duration: {schedule.duration_minutes} minutes
                                            </Text>
                                            <Text style={styles.scheduleDetail}>
                                                Marks: {schedule.max_marks} (Pass: {schedule.passing_marks})
                                            </Text>
                                            {schedule.topics && (
                                                <Text style={styles.scheduleDetail}>
                                                    Topics: {schedule.topics}
                                                </Text>
                                            )}
                                        </View>
                                        <IconButton
                                            icon="delete"
                                            size={24}
                                            onPress={() => setSchedules(schedules.filter((_, i) => i !== index))}
                                        />
                                    </Card.Content>
                                </Card>
                            ))}

                            <Button
                                mode="outlined"
                                onPress={() => setSubjectModalVisible(true)}
                                style={styles.addButton}
                                icon="plus"
                            >
                                Add Subject
                            </Button>

                            <Button
                                mode="contained"
                                onPress={handleCreateExam}
                                style={styles.submitButton}
                                loading={loading}
                                disabled={loading || !examDetails.examName || !examDetails.id || schedules.length === 0}
                            >
                                Create Exam
                            </Button>
                        </Card.Content>
                    </Card>

                    {renderExamTypeModal()}
                    {renderSubjectModal()}
                </ScrollView>
            </SafeAreaView>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    card: {
        margin: 16,
        elevation: 4,
    },
    title: {
        marginBottom: 24,
        color: '#333',
    },
    sectionTitle: {
        marginTop: 24,
        marginBottom: 16,
        color: '#333',
    },
    input: {
        marginBottom: 16,
    },
    selectButton: {
        marginBottom: 24,
    },
    datePickersContainer: {
        marginBottom: 24,
    },
    dateTimeContainer: {
        marginBottom: 24,
    },
    dateButton: {
        marginBottom: 12,
    },
    scheduleCard: {
        marginBottom: 12,
        elevation: 2,
    },
    scheduleContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    scheduleInfo: {
        flex: 1,
        marginRight: 8,
    },
    scheduleSubject: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    scheduleDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    addButton: {
        marginTop: 8,
    },
    submitButton: {
        marginTop: 24,
        paddingVertical: 8,
        backgroundColor: '#4CAF50',
    },
    modal: {
        padding: 20,
        margin: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 5,
        maxHeight: '90%',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        marginBottom: 0,
        color: '#333',
        fontSize: 24,
    },
    closeButton: {
        margin: 0,
    },
    modalScrollView: {
        maxHeight: '90%',
        padding: 16,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 24,
    },
    examTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    examTypeCard: {
        flex: 1,
        minWidth: SCREEN_WIDTH > 600 ? SCREEN_WIDTH / 4 - 80 : SCREEN_WIDTH / 2 - 80,
        marginBottom: 12,
        elevation: 2,
    },
    selectedExamTypeCard: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
        borderWidth: 2,
    },
    examTypeCardContent: {
        padding: 16,
    },
    examTypeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    selectedExamTypeText: {
        color: '#2196f3',
    },
    examTypeDescription: {
        fontSize: 14,
        color: '#666',
    },
    subjectSection: {
        marginBottom: 24,
    },
    subjectGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    subjectCard: {
        flex: 1,
        minWidth: SCREEN_WIDTH > 600 ? SCREEN_WIDTH / 6 - 40 : SCREEN_WIDTH / 3 - 40,
        marginBottom: 8,
        elevation: 2,
    },
    selectedSubjectCard: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4caf50',
        borderWidth: 2,
    },
    subjectCardContent: {
        padding: 8,
        alignItems: 'center',
    },
    subjectText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
    },
    selectedSubjectText: {
        color: '#4caf50',
        fontWeight: '600',
    },
    dateTimeSection: {
        marginBottom: 24,
    },
    detailsSection: {
        marginBottom: 24,
    },
    inputContainer: {
        gap: 16,
    },
    addButton: {
        marginTop: 8,
        marginBottom: 16,
    },
    addButtonContent: {
        paddingVertical: 8,
    },
});

export default AddExamScreen;