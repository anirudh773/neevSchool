export interface Schedule {
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

export interface Exam {
    id: number;
    name: string;
    date: string;
    status: 'Ongoing' | 'Upcoming' | 'Completed';
    participation: string;
    class: string;
    schedules: Schedule[];
}

export interface ExamScheduleCardProps {
    exam: Exam;
    isExpanded: boolean;
    animationValue: Animated.Value;
    onToggle: () => void;
    onViewDetails: () => void;
    onEdit: () => void;
} 