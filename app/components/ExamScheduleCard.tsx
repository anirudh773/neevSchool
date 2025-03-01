import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Surface } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Schedule {
    id: number;
    subject_id: number;
    subject_name: string;
    duration_minutes: number;
    max_marks: number;
    passing_marks: number;
    is_marks_submitted: boolean;
    exam_datetime: string;
    class_id: number;
}

interface ExamScheduleCardProps {
    exam: {
        id: number;
        name: string;
        date: string;
        status: 'Ongoing' | 'Upcoming' | 'Completed';
        participation: string;
        class: string;
        schedules: Schedule[];
    };
    isExpanded: boolean;
    animationValue: Animated.Value;
    onToggle: () => void;
    onViewDetails: () => void;
    onEdit: () => void;
}

const ExamScheduleCard: React.FC<ExamScheduleCardProps> = ({
    exam,
    isExpanded,
    animationValue,
    onToggle,
    onViewDetails,
    onEdit
}) => {
    const maxHeight = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 500] // Adjust this value based on your content
    });

    const getStatusColor = (status: 'Ongoing' | 'Upcoming' | 'Completed'): string => {
        switch (status) {
            case 'Ongoing':
                return '#4CAF50';
            case 'Upcoming':
                return '#2196F3';
            case 'Completed':
                return '#9C27B0';
            default:
                return '#666';
        }
    };

    return (
        <Surface style={styles.examCard}>
            <TouchableOpacity onPress={onToggle} style={styles.cardHeader}>
                <View>
                    <Text style={styles.examName}>{exam.name}</Text>
                    <Text style={styles.examDate}>Date: {new Date(exam.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exam.status) }]}>
                        <Text style={styles.statusText}>{exam.status}</Text>
                    </View>
                    <FontAwesome 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={16} 
                        color="#666" 
                    />
                </View>
            </TouchableOpacity>

            <Animated.View style={[styles.subjectsList, { maxHeight, overflow: 'hidden' }]}>
                {exam.schedules && exam.schedules.map((subject) => (
                    <View key={subject.id} style={styles.subjectItem}>
                        <View style={styles.subjectHeader}>
                            <Text style={styles.subjectName}>{subject.subject_name}</Text>
                            <View style={[
                                styles.submissionStatus,
                                { backgroundColor: subject.is_marks_submitted ? '#e0f2e9' : '#fff3e0' }
                            ]}>
                                <Text style={[
                                    styles.submissionText,
                                    { color: subject.is_marks_submitted ? '#2e7d32' : '#ed6c02' }
                                ]}>
                                    {subject.is_marks_submitted ? 'Marks Submitted' : 'Pending'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.subjectDetails}>
                            <Text style={styles.subjectInfo}>
                                Duration: {subject.duration_minutes} mins | Max Marks: {subject.max_marks} | Passing: {subject.passing_marks}
                            </Text>
                            <Text style={styles.examDateTime}>
                                Date: {new Date(subject.exam_datetime).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                ))}

                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.viewButton]} 
                        onPress={onViewDetails}
                    >
                        <FontAwesome name="eye" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]} 
                        onPress={onEdit}
                    >
                        <FontAwesome name="edit" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    examCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    examName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    examDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    subjectsList: {
        paddingHorizontal: 16,
    },
    subjectItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    submissionStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    submissionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    subjectDetails: {
        gap: 4,
    },
    subjectInfo: {
        fontSize: 13,
        color: '#666',
    },
    examDateTime: {
        fontSize: 13,
        color: '#666',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        paddingVertical: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    viewButton: {
        backgroundColor: '#2196F3',
    },
    editButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ExamScheduleCard; 