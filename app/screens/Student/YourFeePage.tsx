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
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// TypeScript interfaces
interface FeeSubmission {
  // Add submission details if needed
}

interface FeeMonth {
  month: string;
  amount: number;
  paid: number;
  status: string;
  dueDate: string | null;
  submissions: FeeSubmission[];
  classFeeId: number;
}

interface FeeType {
  id: number;
  name: string;
  frequency: string;
  frequencyId: number;
  totalAmount: number;
  totalPaid: number;
  totalLateFee: number;
  totalDiscount: number;
  balance: number;
  status: string;
  details: {
    feeId: number;
    month: string;
    dueDate: string;
    amount: number;
    gracePeriod: number;
    submissions: FeeSubmission[];
  }[];
  months: FeeMonth[];
}

interface MonthlySummary {
  amount: number;
  paid: number;
  balance: number;
  status: string;
}

interface FeeDetails {
  studentDetails: {
    id: number;
    name: string;
    class: string;
    section: string;
  };
  academicYear: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  feeTypes: FeeType[];
  monthlySummary: {
    [key: string]: MonthlySummary;
  };
  summary: {
    totalFees: number;
    totalPaid: number;
    totalLateFee: number;
    totalDiscount: number;
    totalBalance: number;
    overallStatus: string;
  };
}

type TabType = 'current' | 'pending' | 'paid';

// Add this after the existing imports
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface Fee {
  classFeeId: number;
  feeTypeId: number;
  feeTypeName: string;
  amount: string;
  actualAmount: string;
  frequency: string;
  month?: number;
  year: number;
  status?: string;
  dueDate?: string | null;
}

interface FeeCardProps {
  fee: Fee;
  type: 'current' | 'pending' | 'paid';
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
  paid: '#00c853',
};

const FeeCard: React.FC<FeeCardProps> = ({ fee, type }) => {
  const getStatusColor = () => {
    if (fee.status === 'PAID') return COLORS.paid;
    if (fee.status === 'PENDING') return COLORS.pending;
    return COLORS[type] || COLORS.current;
  };

  const statusColor = getStatusColor();
  const dueDate = fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : null;

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
            {fee.month !== undefined ? ` • ${monthNames[fee.month - 1]}` : ''}
            {fee.status ? ` • ${fee.status}` : ''}
          </Text>
        </View>
        {dueDate && (
          <Text style={[styles.dueDate, { color: statusColor }]}>
            Due: {dueDate}
          </Text>
        )}
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

interface UserInfo {
  id: number;
  userId: string;
  schoolId: number;
  name: string;
  role: number;
  teacherId: number | null;
}

const YourFeePage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const fetchFeeDetails = useCallback(async () => {
    try {
      setLoading(true);

      if (!userInfo) {
        throw new Error('User info not found');
      }

      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(
        `https://neevschool.sbs/school/student-fees?student_id=${userInfo.studentClass.studentId}&academic_year_id=1`,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();
      if (result.status === 'success') {
        setFeeDetails(result.data.data);
      } else {
        throw new Error(result.message || 'Failed to fetch fee details');
      }
    } catch (error) {
      console.error('Error fetching fee details:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUserInfo(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchFeeDetails();
    }
  }, [userInfo, fetchFeeDetails]);

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
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      
      switch (activeTab) {
        case 'current':
          return {
            title: 'Current Month Fees',
            amount: feeDetails.monthlySummary[currentMonth]?.amount || 0,
            fees: feeDetails.feeTypes
              .filter(feeType => feeType.months.some(month => month.month === currentMonth))
              .map(feeType => {
                const month = feeType.months.find(m => m.month === currentMonth);
                const isPaid = month?.paid !== undefined && month.paid > 0;
                return {
                  classFeeId: month?.classFeeId || 0,
                  feeTypeId: feeType.id,
                  feeTypeName: feeType.name,
                  amount: isPaid ? month?.paid.toString() || '0' : month?.amount.toString() || '0',
                  actualAmount: month?.amount.toString() || '0',
                  frequency: feeType.frequency,
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear(),
                  status: isPaid ? 'PAID' : 'PENDING',
                  dueDate: month?.dueDate || null
                } as Fee;
              })
          };
        case 'pending':
          return {
            title: 'Total Pending',
            amount: feeDetails.summary.totalBalance,
            fees: feeDetails.feeTypes
              .filter(feeType => feeType.status === 'PENDING')
              .flatMap(feeType => 
                feeType.months
                  .filter(month => month.status === 'PENDING')
                  .map(month => ({
                    classFeeId: month.classFeeId,
                    feeTypeId: feeType.id,
                    feeTypeName: feeType.name,
                    amount: month.amount.toString(),
                    actualAmount: month.amount.toString(),
                    frequency: feeType.frequency,
                    month: monthNames.indexOf(month.month) + 1,
                    year: new Date().getFullYear(),
                    status: month.status,
                    dueDate: month.dueDate
                  } as Fee))
              )
          };
        case 'paid':
          return {
            title: 'Paid Fees',
            amount: feeDetails.summary.totalPaid,
            fees: feeDetails.feeTypes
              .filter(feeType => feeType.totalPaid > 0)
              .flatMap(feeType => 
                feeType.months
                  .filter(month => month.paid > 0)
                  .map(month => ({
                    classFeeId: month.classFeeId,
                    feeTypeId: feeType.id,
                    feeTypeName: feeType.name,
                    amount: month.paid.toString(),
                    actualAmount: month.amount.toString(),
                    frequency: feeType.frequency,
                    month: monthNames.indexOf(month.month) + 1,
                    year: new Date().getFullYear(),
                    status: 'PAID',
                    dueDate: month.dueDate
                  } as Fee))
              )
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
        {(['current', 'pending', 'paid'] as const).map((tab) => (
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
  dueDate: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default YourFeePage;