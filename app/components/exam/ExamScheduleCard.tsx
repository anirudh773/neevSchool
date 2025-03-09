import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Surface } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import styles from './ExamScheduleCard.styles';
import { ExamScheduleCardProps } from '@/types/exam';

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

export const ExamScheduleCard: React.FC<ExamScheduleCardProps> = ({
    exam,
    isExpanded,
    animationValue,
    onToggle,
    onViewDetails,
    onEdit
}) => {
    const maxHeight = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 500]
    });

    return (
        <Surface style={styles.examCard}>
            <TouchableOpacity onPress={onToggle} style={styles.cardHeader}>
                <View>
                    <Text style={styles.examName}>{exam.name}</Text>
                    <Text style={styles.examDate}>
                        Date: {exam.date}
                    </Text>
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
                {exam.schedules?.map((subject) => (
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
                        <Text style={styles.actionButtonText}>Feed Marks</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]} 
                        onPress={onEdit}
                    >
                        <FontAwesome name="edit" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity> */}
                </View>
            </Animated.View>
        </Surface>
    );
};

export default ExamScheduleCard; 