import type React from "react"
import { View, StyleSheet } from "react-native"
import { Surface } from "react-native-paper"
import { Text } from "react-native"

interface StatsSummaryProps {
  stats: {
    totalHomeWork: number;
    activeTeachers: number;
    totalClasses: number;
    submitted: number;
    pending: number;
  }
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      <Surface style={[styles.card, { backgroundColor: '#4CAF50' }]}>
        <Text style={styles.number}>{stats.totalHomeWork}</Text>
        <Text style={styles.label}>Total Homework</Text>
      </Surface>
      
      <Surface style={[styles.card, { backgroundColor: '#2196F3' }]}>
        <Text style={styles.number}>{stats.activeTeachers}</Text>
        <Text style={styles.label}>Active Teachers</Text>
      </Surface>
      
      <Surface style={[styles.card, { backgroundColor: '#9C27B0' }]}>
        <Text style={styles.number}>{stats.totalClasses}</Text>
        <Text style={styles.label}>Total Classes</Text>
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

