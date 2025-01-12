import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Insurance Section */}
      <View>
        <Text style={styles.sectionTitle}>Admin User</Text>
        <View style={styles.grid}>
          {[
            { name: 'Add Teacher', icon: 'graduation-cap' },
            { name: 'Fee Report', icon: 'money' },
            { name: 'Feed Marks', icon: 'file-text' },
            { name: 'Due Report', icon: 'clock-o' },
            { name: 'Feed Attendance', icon: 'calendar' },
            { name: 'Add Student', icon: 'id-card' },
            { name: 'Absent students', icon: 'user-times' }
          ].map((item, index) => (
            <View key={index} style={styles.insuranceCard}>
              <FontAwesome name={item.icon} size={30} color="#FF6F61" />
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>School</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Trending Section */}
      <View>
        <Text style={styles.sectionTitle}>Trending now</Text>
        <TouchableOpacity style={styles.trendingCard}>
          <Text style={styles.trendingTitle}>New Books and blogs</Text>
          <Text style={styles.trendingSubtitle}>Trending Exams</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.talkToExpertButton}>
          <FontAwesome name="phone" size={20} color="white" />
          <Text style={styles.talkToExpertText}>Talk To Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 10 },
  header: { marginBottom: 20 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subHeader: { fontSize: 16, color: '#666', marginVertical: 5 },
  recentSearches: { flexDirection: 'row', marginVertical: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 8, padding: 10, marginRight: 10, alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginVertical: 5 },
  cardSubtitle: { fontSize: 12, color: '#666' },
  seeAllText: { fontSize: 14, color: 'blue', textAlign: 'right' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  insuranceCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  trendingCard: { backgroundColor: '#D9F2FF', padding: 15, borderRadius: 8, marginVertical: 10 },
  trendingTitle: { fontSize: 16, fontWeight: 'bold' },
  trendingSubtitle: { fontSize: 14, color: '#666' },
  talkToExpertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 20,
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  talkToExpertText: { color: 'white', marginLeft: 5 },
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
