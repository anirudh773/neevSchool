import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

const AdminDashboard = () => {
  const [timeFilter, setTimeFilter] = useState('day');
  const [classFilter, setClassFilter] = useState('all');
  const [showTimeFilterModal, setShowTimeFilterModal] = useState(false);
  const [showClassFilterModal, setShowClassFilterModal] = useState(false);
  const router = useRouter();

  // Sample data - replace with actual API data
  const attendanceData = [
    { name: 'Mon', students: 85, teachers: 95, fees: 12000 },
    { name: 'Tue', students: 88, teachers: 98, fees: 15000 },
    { name: 'Wed', students: 92, teachers: 96, fees: 18000 },
    { name: 'Thu', students: 90, teachers: 97, fees: 13000 },
    { name: 'Fri', students: 86, teachers: 94, fees: 16000 },
  ];

  const StatCard = ({ title, value, icon, trend }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <FontAwesome name={icon} size={16} color="#666" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[
        styles.statTrend,
        { color: trend >= 0 ? '#22c55e' : '#ef4444' }
      ]}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from previous {timeFilter}
      </Text>
    </View>
  );

  const FilterModal = ({ visible, onClose, title, options, selectedValue, onSelect }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalOption,
                selectedValue === option.value && styles.selectedOption
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text style={[
                styles.modalOptionText,
                selectedValue === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with Filters */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard Overview</Text>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowTimeFilterModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {timeFilter === 'day' ? 'Daily' : timeFilter === 'week' ? 'Weekly' : 'Monthly'}
              </Text>
              <FontAwesome name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowClassFilterModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {classFilter === 'all' ? 'All Classes' : `Class ${classFilter}`}
              </Text>
              <FontAwesome name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Student Attendance" 
            value="88%" 
            icon="users"
            trend={2.5}
          />
          <StatCard 
            title="Teacher Attendance" 
            value="96%" 
            icon="book"
            trend={-1.2}
          />
          <StatCard 
            title="Fees Collected" 
            value="₹64,000" 
            icon="dollar"
            trend={4.8}
          />
          <StatCard 
            title="Due Fees" 
            value="₹12,000" 
            icon="calendar"
            trend={-2.3}
          />
        </View>

        {/* Tables */}
        <View style={styles.tables}>
          <View style={styles.table}>
            <Text style={styles.tableTitle}>Student Attendance Details</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell]}>Class</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Present</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Absent</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>%</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Class 1</Text>
              <Text style={styles.tableCell}>45</Text>
              <Text style={styles.tableCell}>5</Text>
              <Text style={styles.tableCell}>90%</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Class 2</Text>
              <Text style={styles.tableCell}>42</Text>
              <Text style={styles.tableCell}>3</Text>
              <Text style={styles.tableCell}>93%</Text>
            </View>
          </View>

          <View style={styles.table}>
            <Text style={styles.tableTitle}>Fee Collection Details</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell]}>Class</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Collected</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Pending</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Total</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Class 1</Text>
              <Text style={styles.tableCell}>₹25,000</Text>
              <Text style={styles.tableCell}>₹5,000</Text>
              <Text style={styles.tableCell}>₹30,000</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Class 2</Text>
              <Text style={styles.tableCell}>₹28,000</Text>
              <Text style={styles.tableCell}>₹2,000</Text>
              <Text style={styles.tableCell}>₹30,000</Text>
            </View>
          </View>
        </View>

        {/* Filter Modals */}
        <FilterModal
          visible={showTimeFilterModal}
          onClose={() => setShowTimeFilterModal(false)}
          title="Select Time Period"
          options={[
            { label: 'Daily', value: 'day' },
            { label: 'Weekly', value: 'week' },
            { label: 'Monthly', value: 'month' }
          ]}
          selectedValue={timeFilter}
          onSelect={setTimeFilter}
        />

        <FilterModal
          visible={showClassFilterModal}
          onClose={() => setShowClassFilterModal(false)}
          title="Select Class"
          options={[
            { label: 'All Classes', value: 'all' },
            { label: 'Class 1', value: '1' },
            { label: 'Class 2', value: '2' },
            { label: 'Class 3', value: '3' }
          ]}
          selectedValue={classFilter}
          onSelect={setClassFilter}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  filterButtonText: {
    color: '#374151',
    fontSize: 14,
  },
  statsGrid: {
    padding: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 12,
  },
  tables: {
    padding: 16,
    gap: 16,
  },
  table: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedOption: {
    backgroundColor: '#f3f4f6',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: 'bold',
  },
});

export default AdminDashboard;