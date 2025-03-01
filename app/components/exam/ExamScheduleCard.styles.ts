import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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