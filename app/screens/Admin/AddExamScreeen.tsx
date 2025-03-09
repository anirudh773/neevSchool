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
import { View, ScrollView, StyleSheet, Text, Dimensions, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Subheading, Portal, Modal, IconButton, Surface } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreateExamScreenProps {
    route: {
        params: {
            selectedClasses: number[],
            selectedSection: number[]
        }
    }
}

const CreateExamScreen: React.FC<CreateExamScreenProps> = () => {
    let router = useRouter();
    const { selectedClasses } = useLocalSearchParams();
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
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [loading, setLoading] = useState(false)

    const [showExamDatePicker, setShowExamDatePicker] = useState(false);
    const [showExamTimePicker, setShowExamTimePicker] = useState(false);
    const [examDate, setExamDate] = useState(new Date());
    const [examTime, setExamTime] = useState(new Date());
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [examTypes, setExamTypes] = useState<ExamType[]>([])

    useEffect(() => {
        const fetchSecureStoreData = async () => {
            try {
                // Fetch exam types
                const examTypesJson = await SecureStore.getItemAsync('examType');
                if (examTypesJson) {
                    const parsedExamTypes = JSON.parse(examTypesJson);
                    setExamTypes(parsedExamTypes);
                }

                // Fetch subjects
                const subjectsJson = await SecureStore.getItemAsync('subjectBySchool');
                if (subjectsJson) {
                    const parsedSubjects = JSON.parse(subjectsJson);
                    setSubjects(parsedSubjects);
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to load subjects and exam types');
            }
        };

        fetchSecureStoreData();
    }, []);

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

        // Check if the new schedule overlaps with existing schedules
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

    const handleAddSchedule = () => {
        if (isScheduleValid(currentSchedule)) {
            const newSchedule = currentSchedule as ExamScheduleForm;
            
            // Check if the exam date is within the selected date range
            if (newSchedule.exam_datetime < examDetails.start_date || 
                newSchedule.exam_datetime > examDetails.end_date) {
                Alert.alert('Invalid Date', 'Exam date must be within the selected date range.');
                return;
            }

            // Check for scheduling conflicts
            if (checkScheduleConflicts(newSchedule)) {
                return;
            }

            setSchedules([...schedules, newSchedule]);
            setCurrentSchedule({});
            setSubjectModalVisible(false);
        }
    };


    const handleCreateExam = async () => {
        setLoading(true)
        // Validation checks
        if (!examDetails.examName) {
            Alert.alert('Validation Error', 'Please enter an exam name');
            return;
        }
    
        if (!examDetails.id) {
            Alert.alert('Validation Error', 'Please select an exam type');
            return;
        }
    
        if (schedules.length === 0) {
            Alert.alert('Validation Error', 'Please add at least one subject schedule');
            return;
        }
    
        // Ensure exam dates are valid
        if (examDetails.start_date > examDetails.end_date) {
            Alert.alert('Validation Error', 'Start date must be before end date');
            return;
        }
        try {
            // Retrieve school ID from secure store
            const userData = await SecureStore.getItemAsync('userData');
            const userDatas = JSON.parse(userData)
            if (userDatas && !userDatas.schoolId) {
                throw new Error('School ID not found');
            }
    
            // Prepare exam data for submission
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


              const response = await fetch('http://13.202.16.149:8080/school/submitExamBySchoolId', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(examData),
              });
    
            // Handle successful response
            if (response.ok) {
                setLoading(false)
                Alert.alert('Success', 'Exam created successfully', [
                    { 
                        text: 'OK', 
                        onPress: () => {
                            // Reset form or navigate to another screen
                            setExamDetails({
                                examName: '',
                                id: null,
                                start_date: new Date(),
                                end_date: new Date()
                            });
                            setSchedules([]);
                            router.back()
                        } 
                    }
                ]);
            }
        } catch (error) {
            setLoading(false)
            console.error('Exam Creation Error:', error);
            // Handle different types of errors
            Alert.alert('Error in exam Creation');
        }
        setLoading(false)
    }

    const handleDeleteSchedule = (index: number) => {
        setSchedules(schedules.filter((_, i) => i !== index));
    };

    const renderDateTimePickers = () => (
        <>
            <Button
                mode="outlined"
                onPress={() => setShowStartDatePicker(true)}
                style={styles.dateButton}
            >
                {`Start Date: ${examDetails.start_date.toLocaleDateString()}`}
            </Button>

            <Button
                mode="outlined"
                onPress={() => setShowEndDatePicker(true)}
                style={styles.dateButton}
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
        </>
    );

    const renderDateTimeSelection = () => {
        const formatTime = (date: any) => {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };
    
        const combineDateAndTime = (date: any, time: any) => {
            const combined = new Date(date);
            combined.setHours(time.getHours());
            combined.setMinutes(time.getMinutes());
            return combined;
        };
    
        return (
            <>
                <Button
                    mode="outlined"
                    onPress={() => setShowExamDatePicker(true)}
                    style={styles.dateButton}
                >
                    {examDate ? `Exam Date: ${examDate.toLocaleDateString()}` : "Select Exam Date"}
                </Button>
    
                <Button
                    mode="outlined"
                    onPress={() => setShowExamTimePicker(true)}
                    style={styles.dateButton}
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
                                // Combine date and time when date is selected
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
                                // Combine date and time when time is selected
                                const combinedDateTime = combineDateAndTime(examDate, selectedTime);
                                setCurrentSchedule({
                                    ...currentSchedule,
                                    exam_datetime: combinedDateTime
                                });
                            }
                        }}
                    />
                )}
            </>
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
                    <Title style={styles.modalTitle}>Select Exam Type</Title>
                    {examTypes.map((type) => (
                        <Button
                            key={type.id}
                            mode={examDetails.id === type.id ? "contained" : "outlined"}
                            onPress={() => {
                                setExamDetails({ ...examDetails, id: type.id });
                                setExamTypeModalVisible(false);
                            }}
                            style={styles.modalButton}
                        >
                            {type.examName}
                        </Button>
                    ))}
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
                    <Title style={styles.modalTitle}>Add Subject Schedule</Title>
    
                    <View style={styles.subjectSelector}>
                        {subjects.map((subject) => (
                            <Button
                                key={subject.id}
                                mode={currentSchedule.subject_id === subject.id ? "contained" : "outlined"}
                                onPress={() => setCurrentSchedule({
                                    ...currentSchedule,
                                    subject_id: subject.id
                                })}
                                style={styles.subjectButton}
                            >
                                {subject.name}
                            </Button>
                        ))}
                    </View>
    
                    {renderDateTimeSelection()}
    
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
                        keyboardType='default'
                        style={styles.input}
                        mode="outlined"
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
    
                    <Button
                        mode="contained"
                        onPress={handleAddSchedule}
                        style={styles.addButton}
                        disabled={!isScheduleValid(currentSchedule)}
                    >
                        Add to Schedule
                    </Button>
                </Surface>
            </Modal>
        </Portal>
    );

    return (
        <PaperProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView style={styles.container}>
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
                            >
                                {examDetails.id
                                    ? examTypes.find(t => t.id === examDetails.id)?.examName
                                    : "Select Exam Type"}
                            </Button>

                            {renderDateTimePickers()}

                            <Subheading style={styles.subheading}>Exam Schedule</Subheading>

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
                                        </View>
                                        <IconButton
                                            icon="delete"
                                            size={24}
                                            onPress={() => handleDeleteSchedule(index)}
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
                            loading={loading}
                                mode="contained"
                                onPress={handleCreateExam}
                                style={styles.submitButton}
                                disabled={!examDetails.examName || !examDetails.id || selectedClasses.length === 0 || schedules.length === 0}
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
    card: {
        margin: 16,
        elevation: 4,
    },
    title: {
        marginBottom: 24,
    },
    input: {
        marginBottom: 16,
    },
    selectButton: {
        marginBottom: 24,
    },
    dateButton: {
        marginBottom: 16,
    },
    subheading: {
        marginBottom: 12,
        fontWeight: '600',
    },
    scheduleCard: {
        marginBottom: 12,
        elevation: 2,
    },
    scheduleContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    scheduleInfo: {
        flex: 1,
    },
    scheduleSubject: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    scheduleDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
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
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        marginBottom: 16,
    },
    modalButton: {
        marginBottom: 8,
    },
    subjectSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    subjectButton: {
        marginBottom: 8,
        flex: 1,
        minWidth: SCREEN_WIDTH > 600 ? SCREEN_WIDTH / 4 - 60 : SCREEN_WIDTH / 2 - 60,
    },
});

export default CreateExamScreen;