import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import FeatureCard from './FeatureCard';

const FeatureCardExample: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.cardList}>
        <FeatureCard
          title="Assignment Dashboard"
          description="View and manage all your assignments"
          icon="notebook"
          gradientColors={['#4776E6', '#8E54E9']}
          onPress={() => Alert.alert('Assignments', 'Opening assignments dashboard')}
        />

        <FeatureCard
          title="Exam Schedule"
          description="View upcoming exams and test dates"
          icon="calendar-clock"
          gradientColors={['#FF416C', '#FF4B2B']}
          onPress={() => Alert.alert('Exams', 'Opening exam schedule')}
        />

        <FeatureCard
          title="Class Attendance"
          description="Track your attendance and reports"
          icon="account-check"
          gradientColors={['#11998e', '#38ef7d']}
          onPress={() => Alert.alert('Attendance', 'Opening attendance records')}
        />

        <FeatureCard
          title="Course Materials"
          description="Access your study materials and resources"
          icon="book-open-variant"
          gradientColors={['#7F7FD5', '#86A8E7', '#91EAE4']}
          onPress={() => Alert.alert('Materials', 'Opening course materials')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  cardList: {
    padding: 16,
  },
});

export default FeatureCardExample; 