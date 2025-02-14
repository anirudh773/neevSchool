import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Surface, TextInput, IconButton, Divider } from 'react-native-paper';

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    rollNo: string;
  }
interface MarksData {
  [key: string]: {
    marks?: string;
    remarks?: string;
  };
}

interface StudentCardProps {
    key: number;
  student: Student;
  marksData: MarksData;
  updateStudentData: (id: string, field: 'marks' | 'remarks', value: string) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ 
  key,
  student, 
  marksData, 
  updateStudentData 
}) => {
  return (
    <Surface style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {student.firstName} {student.lastName}
          </Text>
        </View>
        <Text style={styles.rollNo}>Roll No: NEEV_{student.id}</Text>
        <IconButton
          icon="account-circle"
          size={24}
          onPress={() => {}}
          style={styles.studentIcon}
        />
      </View>
      
      <Divider style={styles.cardDivider} />
      
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          label="Marks"
          style={styles.marksInput}
          keyboardType="numeric"
          value={marksData[student.id]?.marks || ''}
          onChangeText={(value: string) => updateStudentData(student.id, 'marks', value)}
          maxLength={10}
        />
        <TextInput
          mode="outlined"
          label="Remarks"
          style={styles.remarksInput}
          value={marksData[student.id]?.remarks || ''}
          onChangeText={(value: string) => updateStudentData(student.id, 'remarks', value)}
          dense
        />
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  studentCard: {
    marginHorizontal: 1,
    marginVertical: 3,
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rollNo: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  studentIcon: {
    margin: 0,
  },
  cardDivider: {
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',  // Align inputs vertically
    gap: 10,   
  },
  marksInput: {
    backgroundColor: 'white',
    flex: 1,              // 30% width
    minWidth: 80,  
  },
  remarksInput: {
    backgroundColor: 'white',
    flex: 6.5,
  },
});

export default StudentCard;