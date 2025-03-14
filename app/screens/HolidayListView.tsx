import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  StyleSheet, 
  Animated, 
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
  InteractionManager,
  ViewStyle,
  TextStyle,
  Pressable,
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

interface StylesType {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  filterContainer: ViewStyle;
  holidayCard: ViewStyle;
  cardSurface: ViewStyle;
  gradientBanner: ViewStyle;
  bannerContent: ViewStyle;
  durationText: TextStyle;
  statusBadge: ViewStyle;
  statusText: TextStyle;
  cardContent: ViewStyle;
  cardHeader: ViewStyle;
  titleContainer: ViewStyle;
  holidayTitle: TextStyle;
  dateSection: ViewStyle;
  dateContainer: ViewStyle;
  dateTextContainer: ViewStyle;
  dateLabel: TextStyle;
  dateText: TextStyle;
  descriptionContainer: ViewStyle;
  description: TextStyle;
  filterChip: ViewStyle;
  header: TextStyle;
  subHeader: TextStyle;
  listContainer: ViewStyle;
  loadingText: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  headerGradient: ViewStyle;
  iconContainer: ViewStyle;
}

type FilterType = 'all' | 'upcoming' | 'ongoing' | 'past';

interface HolidayItemProps {
  item: Holiday;
  width: number;
  formatDate: (date: string) => string;
  getHolidayStatus: (startDate: string, endDate: string) => { label: string; color: string };
}

const HolidayListView: React.FC = () => {
  const { width } = useWindowDimensions();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fadeAnim] = useState<Animated.Value>(new Animated.Value(0));
  const [slideAnim] = useState<Animated.Value>(new Animated.Value(0));
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const animationsReady = useRef<boolean>(false);
  const isMounted = useRef<boolean>(true);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const getHolidayStatus = useCallback((startDate: string, endDate: string): { label: string; color: string } => {
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
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    InteractionManager.runAfterInteractions(() => {
      if (isMounted.current) {
        animationsReady.current = true;
        fetchHolidays();
      }
    });
    
    return () => {
      isMounted.current = false;
      animationsReady.current = false;
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true
      }).stop();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true
      }).stop();
    };
  }, []);

  const fetchHolidays = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userDataStr);
      const response = await fetch(
        `https://neevschool.sbs/school/getHolidayBySchoolId?schoolId=${userData.schoolId}`
      );
      const result = await response.json();

      if (result.success && isMounted.current) {
        const formattedHolidays = result.data.map((holiday: Holiday) => ({
          ...holiday,
          startDate: holiday.startDate.split('T')[0],
          endDate: holiday.endDate.split('T')[0]
        }));
        setHolidays(formattedHolidays);
        setFilteredHolidays(formattedHolidays);
        
        if (isMounted.current && animationsReady.current) {
          animateEntrance();
        }
      } else {
        console.error('Failed to fetch holidays:', result.message);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const animateEntrance = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  const filterHolidays = useCallback((filter: FilterType) => {
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
  }, [holidays]);

  useEffect(() => {
    if (holidays.length > 0) {
      filterHolidays(activeFilter);
    }
  }, [holidays, activeFilter, filterHolidays]);

  const renderFilterChips = useCallback(() => {
    return (
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
  }, [activeFilter, filterHolidays]);

  const renderHolidayItem = ({ item, index }: { item: Holiday; index: number }) => {
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const status = getHolidayStatus(item.startDate, item.endDate);

    return (
      <View 
        style={[
          styles.holidayCard,
          {
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
                <View style={styles.iconContainer}>
                  <FontAwesome name="star" size={20} color="#ffd700" />
                </View>
                <Text style={styles.holidayTitle}>{item.title}</Text>
              </View>
              
              <View style={styles.dateSection}>
                <View style={styles.dateContainer}>
                  <View style={styles.iconContainer}>
                    <FontAwesome name="calendar-o" size={16} color="#666" />
                  </View>
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>From</Text>
                    <Text style={styles.dateText}>{formatDate(item.startDate)}</Text>
                  </View>
                </View>
                
                <View style={styles.dateContainer}>
                  <View style={styles.iconContainer}>
                    <FontAwesome name="calendar" size={16} color="#666" />
                  </View>
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>To</Text>
                    <Text style={styles.dateText}>{formatDate(item.endDate)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <View style={styles.iconContainer}>
                <FontAwesome name="info-circle" size={16} color="#666" />
              </View>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        </Surface>
      </View>
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

      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
      >
        {filteredHolidays.length > 0 ? (
          filteredHolidays.map(item => (
            <HolidayItem 
              key={item.id} 
              item={item} 
              width={width} 
              formatDate={formatDate}
              getHolidayStatus={getHolidayStatus}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="calendar-times-o" size={50} color="#95a5a6" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? 'No holidays scheduled' 
                : `No ${activeFilter} holidays found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create<StylesType>({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  headerGradient: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subHeader: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  holidayCard: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  cardSurface: {
    borderRadius: 16,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  gradientBanner: {
    padding: 12,
  },
  durationText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    gap: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holidayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  dateSection: {
    gap: 12,
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
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  descriptionContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 12,
  },
  description: {
    flex: 1,
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 22,
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
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChip: {
    marginRight: 8,
    borderRadius: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const HolidayItem: React.FC<HolidayItemProps> = memo(({ item, width, formatDate, getHolidayStatus }) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const status = getHolidayStatus(item.startDate, item.endDate);
  const durationDays = Math.ceil(
    (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 3600 * 24)
  );

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View 
      style={[
        styles.holidayCard,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Surface style={styles.cardSurface}>
        <LinearGradient
          colors={[status.color, adjustColor(status.color, -20)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBanner}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.durationText}>
              {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
          </View>
        </LinearGradient>

        <Pressable 
          style={styles.cardContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <FontAwesome name="star" size={20} color={status.color} />
              </View>
              <Text style={styles.holidayTitle}>{item.title}</Text>
            </View>
            
            <View style={styles.dateSection}>
              <View style={styles.dateContainer}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="calendar-o" size={16} color={status.color} />
                </View>
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={[styles.dateText, { color: status.color }]}>{formatDate(item.startDate)}</Text>
                </View>
              </View>
              
              <View style={styles.dateContainer}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="calendar" size={16} color={status.color} />
                </View>
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={[styles.dateText, { color: status.color }]}>{formatDate(item.endDate)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <View style={styles.iconContainer}>
              <FontAwesome name="info-circle" size={16} color={status.color} />
            </View>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </Pressable>
      </Surface>
    </Animated.View>
  );
});

const adjustColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export default memo(HolidayListView); 