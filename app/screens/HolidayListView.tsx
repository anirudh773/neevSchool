import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Animated, 
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Surface, Chip } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';

interface Holiday {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

type FilterType = 'all' | 'upcoming' | 'ongoing' | 'past';

const HolidayListView: React.FC = () => {
  const { width } = useWindowDimensions();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userDataStr);
      const response = await fetch(
        `https://13.202.16.149:8080/school/getHolidayBySchoolId?schoolId=${userData.schoolId}`
      );
      const result = await response.json();

      if (result.success) {
        const formattedHolidays = result.data.map((holiday: Holiday) => ({
          ...holiday,
          startDate: holiday.startDate.split('T')[0],
          endDate: holiday.endDate.split('T')[0]
        }));
        setHolidays(formattedHolidays);
        setFilteredHolidays(formattedHolidays);
        animateEntrance();
      } else {
        console.error('Failed to fetch holidays:', result.message);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true
      })
    ]).start();
  };

  const filterHolidays = (filter: FilterType) => {
    setActiveFilter(filter);
    const today = new Date();
    
    switch (filter) {
      case 'upcoming':
        setFilteredHolidays(holidays.filter(holiday => new Date(holiday.startDate) > today));
        break;
      case 'ongoing':
        setFilteredHolidays(holidays.filter(holiday => {
          const start = new Date(holiday.startDate);
          const end = new Date(holiday.endDate);
          return start <= today && end >= today;
        }));
        break;
      case 'past':
        setFilteredHolidays(holidays.filter(holiday => new Date(holiday.endDate) < today));
        break;
      default:
        setFilteredHolidays(holidays);
    }
  };

  const getHolidayStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start <= today && end >= today) {
      return { label: 'Ongoing', color: '#4CAF50' };
    } else if (start > today) {
      return { label: 'Upcoming', color: '#2196F3' };
    } else {
      return { label: 'Past', color: '#9E9E9E' };
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    filterHolidays(activeFilter);
  }, [holidays]);

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip 
          selected={activeFilter === 'all'}
          onPress={() => filterHolidays('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip 
          selected={activeFilter === 'upcoming'}
          onPress={() => filterHolidays('upcoming')}
          style={styles.filterChip}
        >
          Upcoming
        </Chip>
        <Chip 
          selected={activeFilter === 'ongoing'}
          onPress={() => filterHolidays('ongoing')}
          style={styles.filterChip}
        >
          Ongoing
        </Chip>
        <Chip 
          selected={activeFilter === 'past'}
          onPress={() => filterHolidays('past')}
          style={styles.filterChip}
        >
          Past
        </Chip>
      </ScrollView>
    </View>
  );

  const renderHolidayItem = ({ item, index }: { item: Holiday; index: number }) => {
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const status = getHolidayStatus(item.startDate, item.endDate);

    return (
      <Animated.View 
        style={[
          styles.holidayCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50 * (index + 1), 0]
                })
              }
            ],
            width: width - 32
          }
        ]}
      >
        <Surface style={styles.cardSurface}>
          <LinearGradient
            colors={['#f6d365', '#fda085']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBanner}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.durationText}>{durationDays} {durationDays === 1 ? 'Day' : 'Days'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                <Text style={styles.statusText}>{status.label}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <FontAwesome name="star" size={20} color="#ffd700" style={styles.titleIcon} />
                <Text style={styles.holidayTitle}>{item.title}</Text>
              </View>
              
              <View style={styles.dateSection}>
                <View style={styles.dateContainer}>
                  <FontAwesome name="calendar-o" size={16} color="#666" />
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>From</Text>
                    <Text style={styles.dateText}>{formatDate(item.startDate)}</Text>
                  </View>
                </View>
                
                <View style={styles.dateContainer}>
                  <FontAwesome name="calendar" size={16} color="#666" />
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>To</Text>
                    <Text style={styles.dateText}>{formatDate(item.endDate)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <FontAwesome name="info-circle" size={16} color="#666" style={styles.descriptionIcon} />
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        </Surface>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading holidays...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.headerGradient}
      >
        <Text style={styles.header}>School Holidays</Text>
        <Text style={styles.subHeader}>Stay updated with upcoming holidays</Text>
      </LinearGradient>

      {renderFilterChips()}

      <FlatList
        data={filteredHolidays}
        renderItem={renderHolidayItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="calendar-times-o" size={50} color="#95a5a6" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? 'No holidays scheduled' 
                : `No ${activeFilter} holidays found`}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHolidays();
            }}
            colors={['#4facfe']}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerGradient: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  holidayCard: {
    marginBottom: 16,
  },
  cardSurface: {
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  gradientBanner: {
    padding: 8,
    alignItems: 'center',
  },
  durationText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    gap: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    marginRight: 4,
  },
  holidayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  dateSection: {
    gap: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  descriptionContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  descriptionIcon: {
    marginTop: 2,
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    marginRight: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default HolidayListView; 