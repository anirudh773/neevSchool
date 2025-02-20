import type React from "react"
import { View, StyleSheet } from "react-native"
import { Surface } from "react-native-paper"
import { Text } from "react-native"

interface Stats {
  totalSubmissions: number
  totalTeachers: number
  totalSubjects: number
}

const StatsSummary: React.FC = () => {
  // In a real app, you'd fetch this data from an API
  const stats: Stats = {
    totalSubmissions: 150,
    totalTeachers: 25,
    totalSubjects: 8,
  }

  return (
    <View style={styles.container}>
      <Surface style={[styles.card, { backgroundColor: '#4CAF50' }]}>
        <Text style={styles.number}>{stats.totalSubmissions}</Text>
        <Text style={styles.label}>Total Submissions</Text>
      </Surface>
      
      <Surface style={[styles.card, { backgroundColor: '#2196F3' }]}>
        <Text style={styles.number}>{stats.totalTeachers}</Text>
        <Text style={styles.label}>Active Teachers</Text>
      </Surface>
      
      <Surface style={[styles.card, { backgroundColor: '#9C27B0' }]}>
        <Text style={styles.number}>{stats.totalSubjects}</Text>
        <Text style={styles.label}>Total Subjects</Text>
      </Surface>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
  },
  card: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  number: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
})

export default StatsSummary

