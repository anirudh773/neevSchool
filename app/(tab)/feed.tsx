"use client"

import React from 'react'
import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Linking,
  ActivityIndicator,
  useWindowDimensions,
  TextInput,
  Alert,
} from "react-native"
import { MaterialIcons, FontAwesome, Feather } from "@expo/vector-icons"
import DateTimePicker from '@react-native-community/datetimepicker'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { launchImageLibraryAsync, MediaType, MediaTypeOptions } from 'expo-image-picker'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface Event {
  id: number;
  school_id: number;
  event_date: string;
  event_name: string;
  description: string;
  youtube_url?: string;
  instargram_url?: string;
  facebook_url?: string;
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  img_url: string;
}

export default function EventListScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState({
    event_name: '',
    description: '',
    event_date: new Date(),
    img_url: '',
    youtube_url: '',
    instargram_url: '',
    facebook_url: '',
    is_pinned: false
  });
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmallScreen = width < 360;
  const isLandscape = height < width;
  const isLargeTablet = width >= 1024;
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const getResponsiveStyles = () => {
    const basePadding = isSmallScreen ? 8 : 16;
    const tabletPadding = isTablet ? 20 : basePadding;
    
    const cardWidth = isLandscape 
      ? width * 0.9
      : (isTablet ? Math.min(width * 0.9, 700) : width * 0.95);
    
    const imageHeightRatio = isLandscape ? 0.3 : (isTablet ? 0.35 : 0.4);
    const imageHeight = Math.min(height * imageHeightRatio, 300);
    
    return {
      headerPadding: isLandscape ? basePadding : tabletPadding,
      cardMargin: isSmallScreen ? 8 : 16,
      cardWidth: cardWidth,
      imageHeight: imageHeight,
      imageWidth: isLandscape ? cardWidth * 0.4 : cardWidth,
      contentWidth: isLandscape ? cardWidth * 0.6 : cardWidth,
      titleSize: isSmallScreen ? 16 : (isTablet ? 24 : 18),
      descriptionSize: isSmallScreen ? 13 : (isTablet ? 16 : 14),
      buttonSize: isSmallScreen ? 16 : (isTablet ? 20 : 18),
      cardLayout: isLandscape ? 'row' as const : 'column' as const,
      padding: isSmallScreen ? 12 : (isTablet ? 20 : 16),
    };
  };

  const responsiveStyles = getResponsiveStyles();

  useEffect(() => {
    fetchUserRole();
    fetchEvents();
  }, []);

  const fetchUserRole = async () => {
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserRole(userData.role);
      }
    } catch (error) {
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }
      const userData = JSON.parse(userDataStr);
      
      const response = await fetch(
        `https://neevschool.sbs/school/getEventsBySchoolId?schoolId=${userData.schoolId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setEvents(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch events');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSocialLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setIsEditing(false);
    setEditingEventId(null);
    setNewEvent({
      event_name: '',
      description: '',
      event_date: new Date(),
      img_url: '',
      youtube_url: '',
      instargram_url: '',
      facebook_url: '',
      is_pinned: false
    });
    setImageUri('');
  };

  const handleSubmitEvent = async () => {
    try {
      setLoading(true);
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (!userDataStr) {
        throw new Error('User data not found');
      }
      const userData = JSON.parse(userDataStr);

      const eventData = {
        schoolId: userData.schoolId,
        eventName: newEvent.event_name,
        eventDate: newEvent.event_date.toISOString().split('T')[0],
        description: newEvent.description,
        youtubeUrl: newEvent.youtube_url,
        instargramUrl: newEvent.instargram_url,
        facebookUrl: newEvent.facebook_url,
        imageUrl: newEvent.img_url,
        isPinned: newEvent.is_pinned
      };

      const response = await fetch('https://neevschool.sbs/school/addEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Event created successfully');
        handleCloseModal();
        fetchEvents(); // Refresh the events list
      } else {
        throw new Error(result.message || 'Failed to create event');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`https://neevschool.sbs/school/updateEvent/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: false
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Event deleted successfully');
        fetchEvents(); // Refresh the events list
      } else {
        throw new Error(result.message || 'Failed to delete event');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEventId) {
      Alert.alert('Error', 'Cannot update event: Missing event ID');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        eventName: newEvent.event_name,
        eventDate: newEvent.event_date.toISOString().split('T')[0],
        description: newEvent.description,
        youtubeUrl: newEvent.youtube_url,
        instargramUrl: newEvent.instargram_url,
        facebookUrl: newEvent.facebook_url,
        imageUrl: newEvent.img_url,
        isPinned: newEvent.is_pinned
      };

      const response = await fetch(`https://neevschool.sbs/school/updateEvent/${editingEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Event updated successfully');
        handleCloseModal();
        fetchEvents(); // Refresh the events list
      } else {
        throw new Error(result.message || 'Failed to update event');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const combineDateAndTime = (date: Date, time: Date) => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    return combined;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      // Combine date and time when date is selected
      const combinedDateTime = combineDateAndTime(date, selectedTime);
      setNewEvent({ ...newEvent, event_date: combinedDateTime });
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
      // Combine date and time when time is selected
      const combinedDateTime = combineDateAndTime(selectedDate, time);
      setNewEvent({ ...newEvent, event_date: combinedDateTime });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pickImage = async (): Promise<void> => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        const uploadedUrl = await uploadImageToFirebase(result.assets[0].uri);
        setImageUri(uploadedUrl);
        setNewEvent({ ...newEvent, img_url: uploadedUrl });
        setUploadingImage(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      setUploadingImage(false);
    }
  };

  const uploadImageToFirebase = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `events/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      throw new Error('Failed to upload image');
    }
  };

  const renderEventCard = (event: Event) => (
    <View 
      key={event.id} 
      style={[
        styles.eventCard, 
        { 
          marginBottom: responsiveStyles.cardMargin,
          width: responsiveStyles.cardWidth,
          flexDirection: responsiveStyles.cardLayout,
          alignSelf: 'center',
          backgroundColor: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: {
              elevation: 6,
            },
          }),
        }
      ]}
    >
      <View 
        style={[
          styles.imageContainer, 
          { 
            height: responsiveStyles.imageHeight,
            width: responsiveStyles.imageWidth,
            position: 'relative',
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => Linking.openURL(event.img_url)}
          style={styles.imageWrapper}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: event.img_url }} 
            style={[
              styles.eventImage,
              { borderRadius: 16 }
            ]} 
          />
          <View style={styles.viewImageOverlay}>
            <Feather name="eye" size={20} color="#fff" />
            <Text style={styles.viewImageText}>View Image</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.imageOverlay}>
          {event.is_pinned && (
                <View style={styles.pinnedBadge}>
              <MaterialIcons name="push-pin" size={16} color="#fff" />
                  <Text style={styles.pinnedText}>PINNED</Text>
            </View>
          )}

          {userRole === 1 && (
            <View style={styles.adminActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditEvent(event)}
              >
                <MaterialIcons name="edit" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  Alert.alert(
                    "Delete Event",
                    "Are you sure you want to delete this event?",
                    [
                      {
                        text: "Cancel",
                        style: "cancel"
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => handleDeleteEvent(event.id)
                      }
                    ]
                  );
                }}
              >
                <MaterialIcons name="delete" size={20} color="#fff" />
              </TouchableOpacity>
              </View>
            )}
        </View>
      </View>

      <View 
        style={[
          styles.eventContent, 
          { 
            padding: responsiveStyles.padding,
            width: responsiveStyles.contentWidth,
          }
        ]}
      >
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { fontSize: responsiveStyles.titleSize }]}>
            {event.event_name}
          </Text>
          <View style={styles.dateContainer}>
            <MaterialIcons name="event" size={16} color="#666" />
            <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
          </View>
        </View>

        <Text style={[styles.eventDescription, { fontSize: responsiveStyles.descriptionSize }]}>
          {event.description}
        </Text>

            <View style={styles.socialLinks}>
          {event.youtube_url && (
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#FFE5E5' }]}
              onPress={() => handleSocialLinkPress(event.youtube_url!)}
            >
              <FontAwesome 
                name="youtube-play" 
                size={responsiveStyles.buttonSize} 
                color="#FF0000" 
              />
              <Text style={[styles.socialText, { fontSize: responsiveStyles.descriptionSize, color: '#FF0000' }]}>
                Watch Video
              </Text>
                </TouchableOpacity>
              )}

          {event.instargram_url && (
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#FCE4F3' }]}
              onPress={() => handleSocialLinkPress(event.instargram_url!)}
            >
              <FontAwesome 
                name="instagram" 
                size={responsiveStyles.buttonSize} 
                color="#C13584" 
              />
              <Text style={[styles.socialText, { fontSize: responsiveStyles.descriptionSize, color: '#C13584' }]}>
                View on Instagram
              </Text>
                </TouchableOpacity>
              )}

          {event.facebook_url && (
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#E3F2FD' }]}
              onPress={() => handleSocialLinkPress(event.facebook_url!)}
            >
              <FontAwesome 
                name="facebook-square" 
                size={responsiveStyles.buttonSize} 
                color="#3b5998" 
              />
              <Text style={[styles.socialText, { fontSize: responsiveStyles.descriptionSize, color: '#3b5998' }]}>
                Check on Facebook
              </Text>
                </TouchableOpacity>
              )}
            </View>
      </View>
    </View>
  );

  const handleEditEvent = (event: Event) => {
    setIsEditing(true);
    setEditingEventId(event.id);
    setNewEvent({
      event_name: event.event_name,
      description: event.description,
      event_date: new Date(event.event_date),
      img_url: event.img_url,
      youtube_url: event.youtube_url || '',
      instargram_url: event.instargram_url || '',
      facebook_url: event.facebook_url || '',
      is_pinned: event.is_pinned
    });
    setImageUri(event.img_url);
    setShowCreateModal(true);
    
    // Set the date and time for Android picker
    const eventDate = new Date(event.event_date);
    setSelectedDate(eventDate);
    setSelectedTime(eventDate);
  };

  const renderCreateEventModal = () => (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { width: isTablet ? '80%' : '90%', maxWidth: 600 }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { fontSize: responsiveStyles.titleSize }]}>
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </Text>
          <TouchableOpacity onPress={handleCloseModal}>
            <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

        <ScrollView style={styles.modalScroll}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Name</Text>
          <TextInput
              style={styles.formInput}
              value={newEvent.event_name}
              onChangeText={(text) => setNewEvent({ ...newEvent, event_name: text })}
            placeholder="Enter event name"
          />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
          <TextInput
              style={[styles.formInput, styles.textArea]}
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
              placeholder="Enter event description"
            multiline
              numberOfLines={4}
          />
        </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date & Time</Text>
            {Platform.OS === 'ios' ? (
              <>
                <DateTimePicker
                  value={newEvent.event_date}
                  mode="datetime"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) {
                      setNewEvent({ ...newEvent, event_date: date });
                    }
                  }}
                  minimumDate={new Date()}
                  style={{ height: 180, marginTop: -8 }}
                />
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
          </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateButton, { marginTop: 8 }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatTime(selectedTime)}
                  </Text>
              </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    onChange={handleTimeChange}
                  />
                )}
              </>
            )}
        </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Image</Text>
            <TouchableOpacity 
              style={styles.imageUploadButton} 
              onPress={pickImage}
              disabled={uploadingImage}
            >
              <FontAwesome name="image" size={24} color="#4A90E2" />
              <Text style={styles.imageUploadText}>
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </Text>
            </TouchableOpacity>
            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setImageUri('');
                    setNewEvent({ ...newEvent, img_url: '' });
                  }}
                >
                  <FontAwesome name="times" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Social Media Links</Text>
            <TextInput
              style={styles.formInput}
              value={newEvent.youtube_url}
              onChangeText={(text) => setNewEvent({ ...newEvent, youtube_url: text })}
              placeholder="YouTube link (optional)"
            />
            <TextInput
              style={styles.formInput}
              value={newEvent.instargram_url}
              onChangeText={(text) => setNewEvent({ ...newEvent, instargram_url: text })}
              placeholder="Instagram link (optional)"
            />
            <TextInput
              style={styles.formInput}
              value={newEvent.facebook_url}
              onChangeText={(text) => setNewEvent({ ...newEvent, facebook_url: text })}
              placeholder="Facebook link (optional)"
            />
        </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setNewEvent({ ...newEvent, is_pinned: !newEvent.is_pinned })}
            >
              <MaterialIcons
                name={newEvent.is_pinned ? "check-box" : "check-box-outline-blank"}
                size={24}
                color="#4a6da7"
              />
              <Text style={styles.checkboxLabel}>Pin this event</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={handleCloseModal}
          >
            <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton, 
              styles.submitButton,
              (!newEvent.event_name || !newEvent.description || !newEvent.img_url) && { opacity: 0.5 }
            ]}
            onPress={isEditing ? handleUpdateEvent : handleSubmitEvent}
            disabled={!newEvent.event_name || !newEvent.description || !newEvent.img_url}
          >
            <Text style={styles.modalButtonText}>
              {isEditing ? 'Update Event' : 'Create Event'}
            </Text>
          </TouchableOpacity>
      </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { padding: responsiveStyles.headerPadding }]}>
        <Text style={[styles.headerTitle, { fontSize: responsiveStyles.titleSize * 1.2 }]}>
          Events
        </Text>
        {userRole === 1 && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateEvent}
          >
            <MaterialIcons 
              name="add" 
              size={responsiveStyles.buttonSize} 
              color="#fff" 
            />
            <Text style={[styles.createButtonText, { fontSize: responsiveStyles.descriptionSize }]}>
              Create Event
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={[styles.loadingText, { fontSize: responsiveStyles.descriptionSize }]}>
            Loading events...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { padding: responsiveStyles.padding }
          ]}
        >
          {events.map(renderEventCard)}
        </ScrollView>
      )}

      {showCreateModal && renderCreateEventModal()}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    ...Platform.select({
      ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
    shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pinnedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#ff9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pinnedText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  eventDate: {
    color: "#666",
    marginBottom: 12,
  },
  eventDescription: {
    lineHeight: 24,
    color: "#444",
    marginBottom: 16,
  },
  socialLinks: {
    marginBottom: 16,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  socialText: {
    marginLeft: 12,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6da7',
    padding: 8,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  createButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#4a6da7',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8F0',
    marginBottom: 12,
  },
  imageUploadText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  eventHeader: {
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  adminActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
    zIndex: 2,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  editButton: {
    backgroundColor: 'rgba(74, 109, 167, 0.8)',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewImageOverlay: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  viewImageText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 14,
  },
});