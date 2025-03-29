import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// TypeScript interfaces
interface Fee {
  classFeeId: number;
  feeTypeId: number;
  feeTypeName: string;
  amount: string;
  actualAmount: string;
  frequency: string;
  month?: number;
  year: number;
}

interface FeeSection {
  fees: Fee[];
  total: number;
}

interface PendingFees {
  currentMonth: Fee[];
  otherPending: Fee[];
  total: number;
}

interface FeeDetails {
  paidFees: FeeSection;
  pendingFees: PendingFees;
  upcomingFees: FeeSection;
}

type TabType = 'current' | 'pending' | 'upcoming';

// Add this after the existing imports
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Mock data with proper typing
const mockFeeData: FeeDetails = {
  paidFees: {
    fees: [
      { classFeeId: 1, feeTypeId: 1, feeTypeName: 'Tuition Fee', amount: '5000', actualAmount: '5000', frequency: 'Monthly', month: 1, year: 2023 },
      { classFeeId: 2, feeTypeId: 2, feeTypeName: 'Development Fee', amount: '3000', actualAmount: '3000', frequency: 'Monthly', month: 2, year: 2023 },
      { classFeeId: 3, feeTypeId: 3, feeTypeName: 'Library Fee', amount: '2500', actualAmount: '2500', frequency: 'Monthly', month: 3, year: 2023 },
    ],
    total: 10500
  },
  pendingFees: {
    currentMonth: [
      { classFeeId: 4, feeTypeId: 1, feeTypeName: 'Tuition Fee', amount: '5000', actualAmount: '5000', frequency: 'Monthly', month: 4, year: 2023 },
      { classFeeId: 5, feeTypeId: 2, feeTypeName: 'Computer Fee', amount: '3000', actualAmount: '3000', frequency: 'Monthly', month: 5, year: 2023 },
    ],
    otherPending: [],
    total: 8000
  },
  upcomingFees: {
    fees: [
      { classFeeId: 6, feeTypeId: 1, feeTypeName: 'Monthly Fee', amount: '3000', actualAmount: '3000', frequency: 'Monthly', month: 5, year: 2023 },
    ],
    total: 3000
  }
};

interface FeeCardProps {
  fee: Fee;
  type: 'current' | 'pending' | 'upcoming';
}

// Update the color palette to be more minimal
const COLORS = {
  primary: '#2962ff', // Vibrant blue
  surface: '#ffffff',
  background: '#f8f9fc',
  text: '#1a1a1a',
  textSecondary: '#757575',
  border: '#e0e0e0',
  // Status colors
  current: '#2962ff',
  pending: '#f44336',
  upcoming: '#00c853',
};

const FeeCard: React.FC<FeeCardProps> = ({ fee, type }) => {
  const getStatusColor = () => {
    return COLORS[type] || COLORS.current;
  };

  const statusColor = getStatusColor();

  return (
    <View style={[styles.feeCard, { borderColor: statusColor }]}>
      <View style={styles.feeCardHeader}>
        <Text style={styles.feeType}>{fee.feeTypeName}</Text>
        <Text style={[styles.amount, { color: statusColor }]}>
          ₹{parseFloat(fee.amount).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.feeInfo}>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {fee.frequency}
            {fee.month ? ` • ${monthNames[fee.month - 1]}` : ''}
          </Text>
        </View>
        <Text style={styles.year}>{fee.year}</Text>
      </View>
    </View>
  );
};

// Update the SummaryCard component
const SummaryCard: React.FC<{
  title: string;
  amount: number;
  type: TabType;
}> = ({ title, amount, type }) => (
  <View style={[styles.summaryCard, { borderColor: COLORS[type] }]}>
    <Text style={styles.summaryTitle}>{title}</Text>
    <Text style={[styles.summaryAmount, { color: COLORS[type] }]}>
      ₹{amount.toLocaleString()}
    </Text>
  </View>
);

const YourFeePage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeeDetails = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(new Date().setMonth(new Date().getMonth() + 3))
        .toISOString().split('T')[0];

      const response = await fetch(
        `https://neevschool.sbs/school/getStudentFeeDetails?studentId=1&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const result = await response.json();
      if (result.success) {
        setFeeDetails(result.data);
      }
    } catch (error) {
      console.error('Error fetching fee details:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeDetails();
  }, [fetchFeeDetails]);

  const renderContent = () => {
    if (loading || !feeDetails) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading fee details...</Text>
        </View>
      );
    }

    const getContentByTab = () => {
      switch (activeTab) {
        case 'current':
          return {
            title: 'Current Month Fees',
            amount: feeDetails.pendingFees.currentMonth.reduce(
              (sum, fee) => sum + parseFloat(fee.amount), 0
            ),
            fees: feeDetails.pendingFees.currentMonth
          };
        case 'pending':
          return {
            title: 'Total Pending',
            amount: feeDetails.pendingFees.total,
            fees: feeDetails.pendingFees.otherPending
          };
        case 'upcoming':
          return {
            title: 'Upcoming Fees',
            amount: feeDetails.upcomingFees.total,
            fees: feeDetails.upcomingFees.fees
          };
      }
    };

    const content = getContentByTab();

    return (
      <View style={styles.tabContent}>
        <SummaryCard 
          title={content.title} 
          amount={content.amount} 
          type={activeTab}
        />
        {content.fees.map(fee => (
          <FeeCard 
            key={`${fee.classFeeId}-${fee.feeTypeId}-${fee.month || ''}`}
            fee={fee} 
            type={activeTab} 
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fee Details</Text>
      </View>

      <View style={styles.tabs}>
        {(['current', 'pending', 'upcoming'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  feeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.background,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  year: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  tabContent: {
    flex: 1,
  },
  backButton: {
    padding: SCREEN_WIDTH * 0.02,
    borderRadius: SCREEN_WIDTH * 0.02,
    backgroundColor: COLORS.primary + '20',
  },
});

export default YourFeePage;