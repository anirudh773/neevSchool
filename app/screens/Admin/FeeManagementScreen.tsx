"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native"
import { useRouter } from "expo-router"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { LinearGradient } from "expo-linear-gradient"
import { Picker } from "@react-native-picker/picker"
import * as SecureStore from 'expo-secure-store';

// Get screen dimensions for responsive design
const { width } = Dimensions.get("window")

// Add this type for class data
type ClassData = {
  id: string;
  name: string;
}

// Simplified month data
const monthsData = [
  { id: "all", name: "All Months" },
  { id: "01", name: "January" },
  { id: "02", name: "February" },
  { id: "03", name: "March" },
  { id: "04", name: "April" },
  { id: "05", name: "May" },
  { id: "06", name: "June" },
  { id: "07", name: "July" },
  { id: "08", name: "August" },
  { id: "09", name: "September" },
  { id: "10", name: "October" },
  { id: "11", name: "November" },
  { id: "12", name: "December" },
]

// Update AnalyticsDataType to match API response
type AnalyticsDataType = {
  totalFeeCollected: number
  pendingFee: number
  overdueAmount: number
  totalStudents: number
  paidStudents: number
  unpaidStudents: number
}

// Update FeeAnalyticsResponse type
type FeeAnalyticsResponse = {
  success: boolean
  data: {
    all: AnalyticsDataType
    classWise: {
      [key: string]: AnalyticsDataType & {
        className: string
      }
    }
  }
}

// Main Fee Management Screen
const FeeManagementScreen = () => {
  const [classes, setClasses] = useState<ClassData[]>([
    { id: "all", name: "All Classes" } // Default "All Classes" option
  ])
  const [loading, setLoading] = useState(true)
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false)
  const [selectedClass, setSelectedClass] = useState("All Classes")
  const [currentAnalytics, setCurrentAnalytics] = useState<AnalyticsDataType>({
    totalFeeCollected: 0,
    pendingFee: 0,
    overdueAmount: 0,
    totalStudents: 0,
    paidStudents: 0,
    unpaidStudents: 0
  })
  const [analyticsData, setAnalyticsData] = useState<FeeAnalyticsResponse['data']>({
    all: {
      totalFeeCollected: 0,
      pendingFee: 0,
      overdueAmount: 0,
      totalStudents: 0,
      paidStudents: 0,
      unpaidStudents: 0
    },
    classWise: {}
  })
  const router = useRouter()

  // Add function to fetch classes from SecureStore
  const fetchClasses = async () => {
    try {
      const storedClasses = await SecureStore.getItemAsync('schoolClasses');
      if (storedClasses) {
        const parsedClasses: ClassData[] = JSON.parse(storedClasses)
        // Format class names for display only
        const formattedClasses = parsedClasses.map(classItem => {
          let name = classItem.name;
          // Handle special cases for LKG, UKG, PG
          if (name === "LKG" || name === "L.K.G") return { ...classItem, name: "LKG" };
          if (name === "UKG" || name === "U.K.G") return { ...classItem, name: "UKG" };
          if (name === "PG" || name === "P.G") return { ...classItem, name: "PG" };
          // For numeric classes, add "Class" prefix
          return {
            ...classItem,
            name: /^\d+$/.test(name) ? `Class ${name}` : name
          };
        });
        
        // Ensure "All Classes" is always the first option
        setClasses([
          { id: "all", name: "All Classes" },
          ...formattedClasses
        ])
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to load classes. Please try again."
      )
    }
  }

  // Add function to fetch fee analytics
  const fetchFeeAnalytics = async () => {
    setFetchingAnalytics(true);
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }

      const userData = JSON.parse(userDataStr);
      if (!userData.schoolId) {
        throw new Error('School ID not found');
      }

      const response = await fetch(`https://neevschool.sbs/school/getFeeAnalytics?schoolId=${userData.schoolId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result: FeeAnalyticsResponse = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
        // Set initial analytics for "All Classes"
        setCurrentAnalytics(result.data.all);
      } else {
        throw new Error('Failed to fetch fee analytics');
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to fetch fee analytics"
      );
    } finally {
      setFetchingAnalytics(false);
    }
  }

  // Update useEffect to fetch both classes and analytics
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchClasses(),
          fetchFeeAnalytics()
        ]);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    initializeData();
  }, []);

  // Update analytics when class changes
  useEffect(() => {
    if (selectedClass === "All Classes") {
      setCurrentAnalytics(analyticsData.all);
    } else {
      const selectedClassData = classes.find(c => c.name === selectedClass);
      if (selectedClassData && analyticsData.classWise[selectedClassData.id]) {
        setCurrentAnalytics(analyticsData.classWise[selectedClassData.id]);
      }
    }
  }, [selectedClass, analyticsData, classes]);

  const navigateToFeeStructures = () => {
    router.push("/screens/Admin/FeeStructuresScreen")
  }

  const navigateToAddFeeStructure = () => {
    router.push("/screens/Admin/FeeMasterScreen")
  }

  
  const navigateToPaidFeeStructure = () => {
    router.push("/screens/Admin/StudentFeeListScreen")
  } 

  const navigateToPendingFeeScreen = () => {
    router.push("/screens/Admin/PendingFeeList")
  } 
  // Format number as currency
  const formatCurrency = (value: number) => {
    return "₹" + value.toLocaleString("en-IN")
  }

  // Fee Analytics section
  const renderFeeSummary = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fee Analytics</Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Class</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(value as string);
                }}
                style={styles.picker}
                dropdownIconColor="#512da8"
                enabled={!fetchingAnalytics}
              >
                {classes.map((classItem) => (
                  <Picker.Item 
                    key={classItem.id} 
                    label={classItem.name} 
                    value={classItem.name} 
                    color="#333" 
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* Analytics Cards */}
      <View style={styles.analyticsCards}>
        {fetchingAnalytics ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#512da8" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={["#7953d2", "#512da8"]}
              style={[styles.analyticsCard, styles.primaryCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.analyticsCardContent}>
                <Text style={styles.analyticsCardLabel}>Total Fee Collected</Text>
                <Text style={styles.analyticsCardValue}>{formatCurrency(currentAnalytics.totalFeeCollected)}</Text>
                <View style={styles.analyticsCardFooter}>
                  <Text style={styles.analyticsCardFooterText}>{currentAnalytics.paidStudents} students paid</Text>
                </View>
              </View>
              <View style={styles.analyticsCardIconContainer}>
                <Icon name="currency-inr" size={width > 600 ? 36 : 28} color="rgba(255,255,255,0.2)" />
              </View>
            </LinearGradient>

            <View style={styles.smallCardsContainer}>
              <LinearGradient
                colors={["#ff8a65", "#ff5722"]}
                style={[styles.analyticsCard, styles.smallCard]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.analyticsCardContent}>
                  <Text style={styles.analyticsCardLabel}>Pending Fee</Text>
                  <Text style={styles.analyticsCardValue}>{formatCurrency(currentAnalytics.pendingFee)}</Text>
                  <View style={styles.analyticsCardFooter}>
                    <Text style={styles.analyticsCardFooterText}>{currentAnalytics.unpaidStudents} students pending</Text>
                  </View>
                </View>
                <View style={styles.analyticsCardIconContainer}>
                  <Icon name="timer-sand" size={width > 600 ? 28 : 22} color="rgba(255,255,255,0.2)" />
                </View>
              </LinearGradient>

              <LinearGradient
                colors={["#ff5252", "#f44336"]}
                style={[styles.analyticsCard, styles.smallCard]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.analyticsCardContent}>
                  <Text style={styles.analyticsCardLabel}>Overdue Amount</Text>
                  <Text style={styles.analyticsCardValue}>{formatCurrency(currentAnalytics.overdueAmount)}</Text>
                  <View style={styles.analyticsCardFooter}>
                    <Text style={styles.analyticsCardFooterText}>Total overdue</Text>
                  </View>
                </View>
                <View style={styles.analyticsCardIconContainer}>
                  <Icon name="alert-circle" size={width > 600 ? 28 : 22} color="rgba(255,255,255,0.2)" />
                </View>
              </LinearGradient>
            </View>
          </>
        )}
      </View>
    </View>
  )

  // Quick Action Cards
  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { width: width > 600 ? "23%" : "48%" }]}
          onPress={navigateToAddFeeStructure}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#512da8", "#673ab7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <Icon name="plus-circle-outline" size={width > 600 ? 32 : 24} color="white" />
            <Text style={styles.actionTitle}>Add Fee</Text>
            <Text style={styles.actionSubtitle}>Create new fee structure</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { width: width > 600 ? "23%" : "48%" }]}
          onPress={navigateToFeeStructures}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#0288d1", "#03a9f4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <Icon name="view-list" size={width > 600 ? 32 : 24} color="white" />
            <Text style={styles.actionTitle}>Fee Structures</Text>
            <Text style={styles.actionSubtitle}>Manage fee structures</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { width: width > 600 ? "23%" : "48%" }]}
          onPress={navigateToPaidFeeStructure}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#00897b", "#26a69a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <Icon name="check-circle" size={width > 600 ? 32 : 24} color="white" />
            <Text style={styles.actionTitle}>Paid fee</Text>
            <Text style={styles.actionSubtitle}>List of student who paid fee</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { width: width > 600 ? "23%" : "48%" }]}
          onPress={navigateToPendingFeeScreen}
          activeOpacity={0.8}
        >
          <LinearGradient
           colors={["#ef5350", "#d32f2f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <Icon name="timer-sand" size={width > 600 ? 32 : 24} color="white" />
            <Text style={styles.actionTitle}>Pending Fee</Text>
            <Text style={styles.actionSubtitle}>List of student who is not paying fee</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#512da8" />
        <Text style={styles.loadingText}>Loading fee management...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#512da8" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {renderFeeSummary()}
        {renderQuickActions()}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={navigateToAddFeeStructure}>
        <Icon name="plus" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#512da8",
    paddingVertical: 16,
    paddingHorizontal: width * 0.05,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: width > 600 ? 24 : 20,
    fontWeight: "bold",
    color: "white",
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  sectionContainer: {
    backgroundColor: "white",
    margin: width * 0.04,
    marginBottom: width * 0.02,
    borderRadius: 12,
    padding: width * 0.04,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: width > 600 ? 22 : 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  filterContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: width * 0.03,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterRow: {
    marginBottom: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: width > 600 ? 15 : 13,
    fontWeight: "500",
    color: "#444",
    marginBottom: 6,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    backgroundColor: "#fff",
    height: 50,
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: {
    color: "#333",
    backgroundColor: "#fff",
    height: 50,
    width: "100%",
  },
  analyticsCards: {
    flexDirection: width > 900 ? "row" : "column",
    justifyContent: "space-between",
  },
  analyticsCard: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: width > 900 ? 0 : 12,
  },
  primaryCard: {
    backgroundColor: "#7953d2",
    flex: width > 900 ? 1 : undefined,
    marginRight: width > 900 ? 12 : 0,
  },
  analyticsCardContent: {
    padding: width * 0.04,
    flex: 1,
  },
  analyticsCardLabel: {
    fontSize: width > 600 ? 16 : 14,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  analyticsCardValue: {
    fontSize: width > 600 ? 22 : 18,
    fontWeight: "bold",
    color: "white",
  },
  analyticsCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  analyticsCardFooterText: {
    fontSize: width > 600 ? 14 : 12,
    color: "white",
    opacity: 0.9,
  },
  analyticsCardIconContainer: {
    position: "absolute",
    right: 16,
    top: 16,
    width: width > 600 ? 60 : 40,
    height: width > 600 ? 60 : 40,
    borderRadius: width > 600 ? 30 : 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  smallCardsContainer: {
    flexDirection: width > 600 ? "row" : "column",
    flex: width > 900 ? 1 : undefined,
  },
  smallCard: {
    flex: width > 600 ? 1 : undefined,
    marginBottom: width > 600 ? 0 : 12,
    marginRight: width > 600 ? 12 : 0,
  },
  quickActionsContainer: {
    backgroundColor: "white",
    margin: width * 0.04,
    marginTop: width * 0.02,
    borderRadius: 12,
    padding: width * 0.04,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionGradient: {
    padding: width * 0.03,
    height: width > 600 ? 140 : 120,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontSize: width > 600 ? 18 : 16,
    fontWeight: "bold",
    color: "white",
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: width > 600 ? 14 : 12,
    color: "white",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#512da8",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
})

export default FeeManagementScreen

