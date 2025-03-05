import React, { useState } from "react"
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView } from "react-native"
import { DataTable, Text, Surface, Divider } from "react-native-paper"
import FontAwesome from "react-native-vector-icons/FontAwesome"

interface HomeworkSubmission {
  id: string
  class: string
  section: string
  subject: string
  date: string
  description: string
  imageUri?: string
  documentUri?: string
  documentName?: string
  status: "Submitted" | "Pending"
}

interface TodaysSubmissionsProps {
  submissions: HomeworkSubmission[]
  selectedDate?: Date,
  pending: number
}

const TodaysSubmissions: React.FC<TodaysSubmissionsProps> = ({ 
  submissions,
  selectedDate = new Date(),
  pending
}) => {
  const [selectedHomework, setSelectedHomework] = useState<HomeworkSubmission | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const formatDateToMatch = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const filteredSubmissions = submissions.filter(submission => 
    submission.date === formatDateToMatch(selectedDate)
  );

  const handleRowPress = (submission: HomeworkSubmission) => {
    setSelectedHomework(submission)
    setModalVisible(true)
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <FontAwesome name="calendar" size={24} color="#1A237E" />
          <Text style={styles.title}>Today's Homework</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <FontAwesome name="check-circle" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>
              {filteredSubmissions.filter(s => s.status === "Submitted").length}
            </Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <FontAwesome name="clock-o" size={24} color="#FFA000" />
            </View>
            <Text style={styles.statNumber}>
              {pending}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>
      
      <DataTable style={styles.table}>
        <DataTable.Header style={styles.tableHeader}>
          <DataTable.Title 
            textStyle={styles.headerText}
            style={styles.columnClass}
          >
            Class & Subject
          </DataTable.Title>
          <DataTable.Title 
            textStyle={styles.headerText}
            style={styles.columnStatus}
          >
            Status
          </DataTable.Title>
          <DataTable.Title 
            textStyle={styles.headerText}
            style={styles.columnAction}
          >
            Action
          </DataTable.Title>
        </DataTable.Header>

        {filteredSubmissions.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="folder-open-o" size={48} color="#9E9E9E" />
            <Text style={styles.emptyStateText}>No homework submissions for today</Text>
          </View>
        ) : (
          filteredSubmissions.map((submission) => (
            <DataTable.Row key={submission.id} style={styles.row}>
              <DataTable.Cell 
                textStyle={styles.cellText}
                style={styles.columnClass}
              >
                <View>
                  <View style={styles.classInfo}>
                    <FontAwesome name="graduation-cap" size={16} color="#1A237E" />
                    <Text style={styles.classText}>
                      Class {submission.class}-{submission.section}
                    </Text>
                  </View>
                  <Text style={styles.subjectText}>{submission.subject}</Text>
                </View>
              </DataTable.Cell>

              <DataTable.Cell style={styles.columnStatus}>
                <View style={styles.statusWrapper}>
                  <View style={[
                    styles.statusContainer,
                    submission.status === "Submitted" ? styles.submittedStatus : styles.pendingStatus
                  ]}>
                    <FontAwesome 
                      name={submission.status === "Submitted" ? "check" : "clock-o"} 
                      size={12} 
                      color={submission.status === "Submitted" ? "#2E7D32" : "#EF6C00"} 
                      style={styles.statusIcon}
                    />
                    <Text style={[
                      styles.statusText,
                      submission.status === "Submitted" ? styles.submittedText : styles.pendingText
                    ]}>
                      {submission.status}
                    </Text>
                  </View>
                </View>
              </DataTable.Cell>

              <DataTable.Cell style={styles.columnAction}>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => handleRowPress(submission)}
                >
                  <FontAwesome name="eye" size={16} color="#1A237E" />
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </DataTable.Cell>
            </DataTable.Row>
          ))
        )}
      </DataTable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Surface style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Homework Details</Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <FontAwesome name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              {selectedHomework && (
                <View style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Class:</Text>
                    <Text style={styles.detailText}>
                      {selectedHomework.class}-{selectedHomework.section}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Subject:</Text>
                    <Text style={styles.detailText}>{selectedHomework.subject}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailText}>{selectedHomework.description}</Text>
                  </View>
                  
                  {(selectedHomework.imageUri || selectedHomework.documentUri) && (
                    <View style={styles.attachmentsSection}>
                      <Text style={styles.attachmentsTitle}>Attachments</Text>
                      <View style={styles.attachmentsList}>
                        {selectedHomework.imageUri && (
                          <View style={styles.attachmentItem}>
                            <FontAwesome name="image" size={16} color="#4A90E2" />
                            <Text style={styles.attachmentText}>Image</Text>
                          </View>
                        )}
                        {selectedHomework.documentUri && (
                          <View style={styles.attachmentItem}>
                            <FontAwesome name="file" size={16} color="#4A90E2" />
                            <Text style={styles.attachmentText}>
                              {selectedHomework.documentName || 'Document'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </Surface>
        </View>
      </Modal>
    </Surface>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  headerContainer: {
    margin: 10,
    padding: 20,
    backgroundColor: '#F5F6F9',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A237E',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F6F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 24,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A237E',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableHeader: {
    backgroundColor: '#F5F6F9',
    height: 56,
  },
  columnClass: {
    flex: 2.5,
    paddingLeft: 16,
  },
  columnStatus: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  columnAction: {
    flex: 1.9,
    justifyContent: 'center',
    paddingLeft: 15,
    alignItems: 'center',
  },
  headerText: {
    color: '#1A237E',
    fontWeight: '700',
    fontSize: 14,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    height: 72,
    minHeight: 72,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  classText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A237E',
  },
  statusWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  statusContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIcon: {
    marginRight: 2,
  },
  submittedStatus: {
    backgroundColor: '#E8F5E9',
  },
  pendingStatus: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  submittedText: {
    color: '#2E7D32',
  },
  pendingText: {
    color: '#EF6C00',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#F5F6F9',
    borderRadius: 8,
    marginLeft: -8,
  },
  viewButtonText: {
    color: '#1A237E',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 72, 72, 0.5)',
    padding: 5,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A237E',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  attachmentsSection: {
    marginTop: 16,
  },
  attachmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 8,
  },
  attachmentsList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F6F9',
    padding: 12,
    borderRadius: 8,
  },
  attachmentText: {
    fontSize: 14,
    color: '#4A90E2',
  },
})

export default TodaysSubmissions

