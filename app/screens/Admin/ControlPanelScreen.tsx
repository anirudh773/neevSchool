"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Dimensions, Linking, Platform, Clipboard } from "react-native"
import { Button, Card, Divider, TextInput, Searchbar, ActivityIndicator, IconButton } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import moment from "moment"
import * as SecureStore from 'expo-secure-store'

type UserRole = 'teacher' | 'cashier' | 'admin' | 'student'

// Add this type for user status
type UserStatus = 'active' | 'revoked'

// Update User type to include status
type User = {
  id: string
  email: string
  name: string
  userType: UserRole
  parentName?: string
  studentName?: string
  last_login: string
  last_login_fail: string | null
  created_at: string
  status: UserStatus
  mobileNumber?: string
}

interface Dimension {
  width: number;
  height: number;
}

// Dummy data with roles
const dummyUsers: User[] = [
  {
    id: "123456789",
    email: "john.doe@example.com",
    name: "John Doe",
    userType: "student",
    parentName: "John Doe",
    studentName: "Sarah Doe",
    last_login: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    last_login_fail: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    status: 'active',
    mobileNumber: "1234567890"
  },
  {
    id: "987654321",
    email: "jane.smith@example.com",
    name: "Jane Smith",
    userType: "student",
    last_login: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    last_login_fail: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    status: 'active',
    mobileNumber: "9876543210"
  },
  {
    id: "456789123",
    email: "robert.johnson@example.com",
    name: "Robert Johnson",
    userType: "cashier",
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    last_login_fail: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: 'active',
    mobileNumber: "4567891230"
  },
  {
    id: "789123456",
    email: "sarah.williams@example.com",
    name: "Sarah Williams",
    userType: "admin",
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    last_login_fail: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
    status: 'active',
    mobileNumber: "7891234560"
  },
  {
    id: "usr_321654987",
    email: "michael.brown@example.com",
    name: "Michael Brown",
    userType: "teacher",
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    last_login_fail: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    status: 'active',
    mobileNumber: "3216549870"
  },
  {
    id: "usr_654987321",
    email: "emily.davis@example.com",
    name: "Emily Davis",
    userType: "student",
    last_login: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    last_login_fail: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    status: 'active',
    mobileNumber: "6549873210"
  },
  {
    id: "usr_147258369",
    email: "david.miller@example.com",
    name: "David Miller",
    userType: "student",
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    last_login_fail: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    status: 'active',
    mobileNumber: "1472583690"
  },
  {
    id: "usr_258369147",
    email: "olivia.wilson@example.com",
    name: "Olivia Wilson",
    userType: "teacher",
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    last_login_fail: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    status: 'active',
    mobileNumber: "2583691470"
  },
]

const getResponsiveWidth = (screenWidth: number) => {
  if (screenWidth >= 1024) return '45%'  // Desktop
  if (screenWidth >= 768) return '47%'   // Tablet
  return '95%'                           // Mobile
}

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'teacher': return '#4CAF50'
    case 'student': return '#2196F3'
    case 'cashier': return '#FF9800'
    case 'admin': return '#F44336'
    default: return '#607D8B'
  }
}

// Add this helper function for date formatting
const formatDateTime = (dateString: string | null, isLoginFail: boolean = false) => {
  if (!dateString) {
    if (isLoginFail) {
      return {
        date: "Never",
        time: "",
        relative: "Never"
      };
    }
    const now = moment();
    return {
      date: now.format("MMM D, YYYY"),
      time: now.format("h:mm A"),
      relative: "Just now"
    };
  }
  return {
    date: moment(dateString).format("MMM D, YYYY"),
    time: moment(dateString).format("h:mm A"),
    relative: moment(dateString).fromNow()
  };
};

export default function AdminUserScreen() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null)
  const [dimensions, setDimensions] = useState<Dimension>({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  })
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [expandedDetails, setExpandedDetails] = useState<string[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const fetchUsers = async (searchString?: string) => {
    try {
      setLoading(true);
      setSearchError(null);
      let userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userDataStr);
      if (!userData.schoolId) throw new Error('School ID not found');
      
      const url = `https://neevschool.sbs/school/getUsersBySchool?schoolId=${userData.schoolId}${searchString ? `&searchString=${searchString}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        if (result.data.length === 0 && searchString) {
          setSearchError('No user found with this phone number. Please check and try again.');
          setFilteredUsers([]);
          return;
        }

        const formattedUsers = result.data.map((user: any) => ({
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          userType: user.userType,
          parentName: user.parentName,
          last_login: user.last_login,
          last_login_fail: user.last_login_fail,
          created_at: user.created_at,
          status: user.status ? 'active' : 'revoked',
          mobileNumber: user.mobileNumber
        }));
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setSearchError('Failed to fetch users. Please try again.');
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Apply phone number search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((user) => 
        user.mobileNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.userType === roleFilter);
    }

    // Apply activity filter
    if (filterType) {
      switch (filterType) {
        case 'last_login':
          filtered.sort((a, b) => new Date(b.last_login || '').getTime() - new Date(a.last_login || '').getTime());
          break;
        case 'login_fails':
          filtered = filtered.filter(user => user.last_login_fail !== null);
          filtered.sort((a, b) => {
            if (!a.last_login_fail) return 1;
            if (!b.last_login_fail) return -1;
            return new Date(b.last_login_fail).getTime() - new Date(a.last_login_fail).getTime();
          });
          break;
      }
    }

    setFilteredUsers(filtered);
  }, [search, users, roleFilter, filterType]);

  const handleSearch = async (text: string) => {
    setSearch(text);
    setSearchError(null);
    
    if (text.length === 0) {
      await fetchUsers(); // Reset to all users when search is cleared
      return;
    }

    // First search in current users
    const searchLower = text.toLowerCase();
    const foundInCurrentUsers = users.some(user => 
      user.mobileNumber?.toLowerCase().includes(searchLower)
    );

    // If not found in current users and we have a complete phone number, search via API
    if (!foundInCurrentUsers && text.length >= 10) {
      await fetchUsers(text);
    }
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height })
    })
    return () => subscription?.remove()
  }, [])

  const sharePasswordViaWhatsApp = async (userId: string, password: string) => {
    try {
      const message = `Your password has been reset. Your new password is: ${password}`
      const whatsappUrl = Platform.select({
        ios: `whatsapp://send?phone=${userId}&text=${encodeURIComponent(message)}`,
        android: `whatsapp://send?phone=${userId}&text=${encodeURIComponent(message)}`,
        default: `https://api.whatsapp.com/send?phone=${userId}&text=${encodeURIComponent(message)}`
      })

      const canOpen = await Linking.canOpenURL(whatsappUrl)
      if (canOpen) {
        await Linking.openURL(whatsappUrl)
      } else {
        // Fallback: Copy to clipboard using react-native Clipboard
        Clipboard.setString(message)
        showAlert(
          "WhatsApp Not Available",
          "Message copied to clipboard. Please send it manually.",
          [{ text: "OK" }]
        )
      }
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error)
      showAlert("Error", "Failed to share password via WhatsApp")
    }
  }

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    Alert.alert(
      title,
      message,
      buttons || [{ text: "OK" }],
      { 
        cancelable: true,
        onDismiss: () => {}
      }
    )
  }

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (!validatePassword(newPassword)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://neevschool.sbs/school/updatePassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showAlert(
          "Password Reset Success",
          `Password for ${selectedUser.email} has been reset successfully.`,
          [
            {
              text: "Share via WhatsApp",
              onPress: async () => {
                await sharePasswordViaWhatsApp(selectedUser.id, newPassword);
                setModalVisible(false);
                setNewPassword("");
                setPasswordError(null);
                setShowPassword(false);
                setLoading(false);
              }
            },
            {
              text: "Close",
              style: "cancel",
              onPress: () => {
                setModalVisible(false);
                setNewPassword("");
                setPasswordError(null);
                setShowPassword(false);
                setLoading(false);
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      if (error instanceof Error) {
        showAlert("Error", error.message);
      } else {
        showAlert("Error", "Failed to reset password. Please try again.");
      }
      setLoading(false);
    }
  };

  const applyFilter = (type: string) => {
    setFilterType(type === filterType ? null : type);
  }

  const applyRoleFilter = (role: UserRole) => {
    setRoleFilter(role === roleFilter ? null : role);
  }

  const handleRevokeAccess = async (user: User) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete user ${user.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`https://neevschool.sbs/school/deleteUser?userId=${user.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.mobileNumber,
                  password: "kkr@kbc" // This should be handled securely
                }),
              });

              const result = await response.json();
              
              if (result.success) {
                const updatedUsers = users.filter(u => u.id !== user.id);
                setUsers(updatedUsers);
                setFilteredUsers(updatedUsers);
                showAlert("Success", `User ${user.name} has been deleted successfully`);
              } else {
                throw new Error(result.message || 'Failed to delete user');
              }
            } catch (error) {
              if (error instanceof Error) {
                showAlert("Error", error.message);
              } else {
                showAlert("Error", "Failed to delete user. Please try again.");
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleDetails = (userId: string) => {
    setExpandedDetails(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const renderUserItem = (user: User) => {
    const cardWidth = getResponsiveWidth(dimensions.width)
    const roleColor = getRoleColor(user.userType as UserRole)
    const userTypeDisplay = user.userType ? user.userType.toUpperCase() : 'USER'
    
    const lastLogin = formatDateTime(user.last_login)
    const lastLoginFail = formatDateTime(user.last_login_fail, true)
    
    return (
      <Card key={user.id} style={[styles.userCard, { width: cardWidth }]}>
        <Card.Content>
          {user.status !== 'revoked' && (
            <TouchableOpacity
              style={styles.revokeButtonContainer}
              onPress={() => handleRevokeAccess(user)}
            >
              <MaterialIcons name="block" size={14} color="#ffffff" />
              <Text style={styles.revokeButtonText}>click to Revoke user</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.userId}>contact: {user.mobileNumber}</Text>

          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              
              {user.userType === 'student' && user.parentName && user.studentName && (
                <View style={styles.parentInfo}>
                  <Text style={styles.studentText}>Student: {user.studentName}</Text>
                </View>
              )}
            </View>
            <View style={styles.userActions}>
              <View style={styles.userTypeContainer}>
                <Text style={[styles.userTypeText, { backgroundColor: `${roleColor}20`, color: roleColor }]}>
                  {userTypeDisplay}
                </Text>
                {user.status === 'revoked' && (
                  <Text style={styles.revokedBadge}>ACCESS REVOKED</Text>
                )}
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.changePasswordButton]}
                  onPress={() => {
                    setSelectedUser(user)
                    setModalVisible(true)
                  }}
                >
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="lock-reset" size={14} color="#fff" />
                    <Text style={styles.buttonText}>Reset Password</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          <TouchableOpacity 
            style={styles.detailsToggle}
            onPress={() => toggleDetails(user.id)}
          >
            <Text style={styles.detailsToggleText}>
              User Activity Details
            </Text>
            <MaterialIcons 
              name={expandedDetails.includes(user.id) ? "expand-less" : "expand-more"} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>

          {expandedDetails.includes(user.id) && (
            <View style={styles.userDetails}>
              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <MaterialIcons name="login" size={15} color="#4CAF50" />
                  <Text style={styles.detailHeaderText}>Last Login</Text>
                </View>
                <View style={styles.detailTimeInfo}>
                  <Text style={styles.detailDate}>{typeof lastLogin === 'object' ? lastLogin.date : lastLogin}</Text>
                  <Text style={styles.detailTime}>{typeof lastLogin === 'object' ? lastLogin.time : ''}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <MaterialIcons name="error-outline" size={15} color="#FF5252" />
                  <Text style={styles.detailHeaderText}>Failed Login</Text>
                </View>
                <View style={styles.detailTimeInfo}>
                  <Text style={styles.detailDate}>{typeof lastLoginFail === 'object' ? lastLoginFail.date : lastLoginFail}</Text>
                  <Text style={styles.detailTime}>{typeof lastLoginFail === 'object' ? lastLoginFail.time : ''}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <MaterialIcons name="event" size={18} color="#666" />
                  <Text style={styles.detailHeaderText}>Account Created</Text>
                </View>
                <Text style={styles.detailDate}>
                  {moment(user.created_at).format("MMM D, YYYY")}
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    )
  }

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterType) count++;
    if (roleFilter) count++;
    return count;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchAndFilterContainer}>
        <Searchbar
          placeholder="Search by phone number..."
          onChangeText={handleSearch}
          value={search}
          style={styles.searchContainer}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <TouchableOpacity 
          style={styles.filterTrigger}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialIcons name="filter-list" size={24} color="#666" />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {searchError && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color="#F44336" />
          <Text style={styles.errorText}>{searchError}</Text>
          {search.length < 10 && (
            <Text style={styles.errorSubText}>Please enter a complete 10-digit phone number</Text>
          )}
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Users</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => {
                  setFilterType(null);
                  setRoleFilter(null);
                }}>
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setFilterModalVisible(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filter by Activity</Text>
              <View style={styles.filterOptions}>
                {[
                  { id: 'last_login', label: 'Last Login', icon: 'login', color: '#4CAF50' },
                  { id: 'support_request', label: 'Support Requests', icon: 'help', color: '#2196F3' },
                  { id: 'login_fails', label: 'Failed Logins', icon: 'error', color: '#F44336' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.filterOptionButton,
                      filterType === item.id && { backgroundColor: item.color }
                    ]}
                    onPress={() => applyFilter(item.id)}
                  >
                    <MaterialIcons 
                      name={item.icon as any} 
                      size={20} 
                      color={filterType === item.id ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.filterOptionText,
                      filterType === item.id && styles.filterOptionTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filter by Role</Text>
              <View style={styles.filterOptions}>
                {[
                  { role: 'teacher', label: 'Teachers', icon: 'school', color: '#4CAF50' },
                  { role: 'parent', label: 'Parents', icon: 'people', color: '#2196F3' },
                  { role: 'cashier', label: 'Cashiers', icon: 'account-balance', color: '#FF9800' },
                  { role: 'admin', label: 'Admins', icon: 'admin-panel-settings', color: '#F44336' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.role}
                    style={[
                      styles.filterOptionButton,
                      roleFilter === item.role && { backgroundColor: item.color }
                    ]}
                    onPress={() => applyRoleFilter(item.role as UserRole)}
                  >
                    <MaterialIcons 
                      name={item.icon as any} 
                      size={20} 
                      color={roleFilter === item.role ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.filterOptionText,
                      roleFilter === item.role && styles.filterOptionTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView 
        style={styles.userList}
        contentContainerStyle={styles.userListContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <View style={styles.userGrid}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(renderUserItem)
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="person-off" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No users found</Text>
                {search.length > 0 && search.length < 10 ? (
                  <Text style={styles.emptySubText}>Please enter a complete 10-digit phone number</Text>
                ) : null}
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setSearch('')
                    setFilterType(null)
                    setRoleFilter(null)
                    setSearchError(null)
                  }}
                  style={styles.clearFiltersButton}
                >
                  Clear Filters
                </Button>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false)
          setNewPassword("")
          setPasswordError(null)
          setShowPassword(false)
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="lock-reset" size={28} color="#6200ee" />
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false)
                  setNewPassword("")
                  setPasswordError(null)
                  setShowPassword(false)
                }}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalUserInfo}>
              <MaterialIcons name="person" size={20} color="#666" />
              <Text style={styles.modalSubtitle}>{selectedUser?.name}</Text>
            </View>
            <Text style={styles.modalEmail}>{selectedUser?.email}</Text>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.passwordLabel}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text)
                  validatePassword(text)
                }}
                secureTextEntry={!showPassword}
                style={[
                  styles.passwordInput,
                  passwordError && styles.passwordInputError
                ]}
                placeholder="Enter new password (min. 8 characters)"
                placeholderTextColor="#999"
                left={<TextInput.Icon icon="lock" color="#6200ee" />}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                    color="#666"
                  />
                }
                mode="outlined"
                outlineColor={passwordError ? "#F44336" : "#ddd"}
                activeOutlineColor={passwordError ? "#F44336" : "#6200ee"}
              />
              {passwordError && (
                <View style={styles.passwordErrorContainer}>
                  <MaterialIcons name="error-outline" size={16} color="#F44336" />
                  <Text style={styles.passwordErrorText}>{passwordError}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setModalVisible(false)
                  setNewPassword("")
                  setPasswordError(null)
                  setShowPassword(false)
                }} 
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonLabel}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={loading}
                disabled={!newPassword || !!passwordError}
                style={[
                  styles.resetButton,
                  (!newPassword || !!passwordError) && styles.resetButtonDisabled
                ]}
                labelStyle={styles.resetButtonLabel}
                contentStyle={styles.resetButtonContent}
                icon="lock-reset"
                uppercase={false}
                rippleColor="rgba(255, 255, 255, 0.2)"
                compact
              >
                Reset
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    elevation: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 0,
  },
  filterTrigger: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearFiltersText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: '48%',
    flex: 1,
  },
  filterOptionText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userList: {
    flex: 1,
  },
  userListContent: {
    paddingVertical: 16,
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  userCard: {
    marginBottom: 16,
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 24,
  },
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  userActions: {
    alignItems: 'flex-end',
    minWidth: 60,
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userId: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    zIndex: 1,
  },
  parentInfo: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  parentText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  studentText: {
    fontSize: 13,
    color: "#666",
  },
  userTypeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 8,
  },
  userDetails: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  detailSection: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  detailTimeInfo: {
    marginLeft: 24,
  },
  detailDate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  detailRelative: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    width: '100%',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#888",
    marginBottom: 16,
  },
  clearFiltersButton: {
    borderColor: '#6200ee',
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 12,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 18,
    color: "#333",
    fontWeight: '600',
    marginLeft: 8,
  },
  modalEmail: {
    fontSize: 14,
    color: "#666",
    textAlign: 'center',
    marginBottom: 24,
  },
  passwordInputContainer: {
    marginBottom: 24,
  },
  passwordLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordInput: {
    backgroundColor: "#fff",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  cancelButtonLabel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#6200ee",
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    height: 52,
    marginHorizontal: 2,
  },
  resetButtonDisabled: {
    backgroundColor: '#e0e0e0',
    elevation: 0,
    shadowOpacity: 0,
  },
  resetButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resetButtonContent: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  actionButton: {
    borderRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '600',
    marginLeft: 2,
  },
  changePasswordButton: {
    backgroundColor: '#6200ee',
  },
  revokeButtonContainer: {
    position: 'absolute',
    top: -1,
    left: -1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    padding: 1,
    borderRadius: 4,
    margin: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  revokeButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  revokedBadge: {
    color: '#dc3545',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#ffebee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    padding: 4,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  errorSubText: {
    color: '#F44336',
    fontSize: 12,
    opacity: 0.8,
    width: '100%',
  },
  emptySubText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  passwordInputError: {
    backgroundColor: '#fff',
  },
  passwordErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  passwordErrorText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '500',
  },
})