import React, { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
// import { PermissionsAndroid, Platform } from 'react-native';

import { TextInput, Button, Text, Caption } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

type TeacherData = {
  name: string;
  mobileNumber: string;
  email: string;
  resumeUrl: string;
  classTeacherOf: string;
  primarySubjectId: string;
  substituteSubjectId: string;
  qualifications: string;
  joiningDate: string;
  schoolId: number;
};

const RegisterTeacher: React.FC = () => {

  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: "Gallery Permission",
          message: "App needs access to your gallery to select a file.",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  requestGalleryPermission()

  const [teacherData, setTeacherData] = useState<TeacherData>({
    name: '',
    mobileNumber: '',
    email: '',
    resumeUrl: '',
    classTeacherOf: '2', // Default value
    primarySubjectId: '1',
    substituteSubjectId: '2',
    qualifications: '1',
    joiningDate: '25-01-2024',
    schoolId: 1, // Dummy school ID
  });
  const [imageFile, setImageFile] = useState('');

  const [uploading, setUploading] = useState<boolean>(false);

  // Handle input changes
  const handleInputChange = (name: keyof TeacherData, value: string) => {
    setTeacherData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle file selection (resume upload)
  const selectFile = () => {
    console.log("File selection triggered");
    
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (response) => {
        console.log("File selection triggered----------------");
      if (response.didCancel) {
        console.log("File selection canceled");
        return;
      }
      if (response.errorCode || !response.assets) {
        console.error("File selection error:", response.errorCode);
        Alert.alert('Error', 'File selection failed. Please try again.');
        return;
      }
  
      // Process the selected file
      const file = response.assets[0] as Asset;
      console.log("Selected file:", file);
      uploadFile(file.uri as string, file.fileName || `resume_${Date.now()}`);
    });


  };

  const testPicker = async () => {
    console.log("Testing launchImageLibrary");
    let res = await launchImageLibrary({ mediaType: 'photo', includeBase64: false })

    console.log(res);
    // launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (response) => {
    //   console.log("Response from launchImageLibrary:", response);
    // });
  };
  

  // Upload file to Firebase Storage
  const uploadFile = async (uri: string, fileName: string) => {
    try {
      setUploading(true);
  
      // Convert the local file URI to a Blob
      const response = await fetch(uri);
      const blob = await response.blob();
  
      // Initialize Firebase Storage and create a reference
      const storage = getStorage(); // Ensure Firebase is initialized
      const fileRef = ref(storage, `images/${fileName}`);
  
      // Start the file upload
      const uploadTask = uploadBytesResumable(fileRef, blob);
  
      // Listen for upload state changes
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Optional: Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          // Handle upload errors
          setUploading(false);
          Alert.alert('Error', 'Failed to upload file.');
          console.error(error);
        },
        async () => {
          // Get the download URL after successful upload
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setTeacherData((prevData) => ({ ...prevData, resumeUrl: downloadURL }));
          setImageFile(downloadURL); // Optional if you have another state for image preview
          setUploading(false);
          Alert.alert('Success', 'Resume uploaded successfully!');
        }
      );
    } catch (error) {
      setUploading(false);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
      console.error(error);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const response = await fetch('https://testcode-2.onrender.com/school/addTeacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Teacher registered successfully!');
        setTeacherData({
          name: '',
          mobileNumber: '',
          email: '',
          resumeUrl: '',
          classTeacherOf: '2',
          primarySubjectId: '1',
          substituteSubjectId: '2',
          qualifications: '1',
          joiningDate: '25-01-2024',
          schoolId: 1,
        });
      } else {
        Alert.alert('Error', result.message || 'Something went wrong.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.heading, { fontSize: 24 }]}>Register Teacher</Text>


      <TextInput
        label="Name"
        value={teacherData.name}
        onChangeText={(text) => handleInputChange('name', text)}
        style={styles.input}
      />

      <TextInput
        label="Mobile Number"
        value={teacherData.mobileNumber}
        onChangeText={(text) => handleInputChange('mobileNumber', text)}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        label="Email"
        value={teacherData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        label="Joining Date"
        value={teacherData.joiningDate}
        onChangeText={(text) => handleInputChange('joiningDate', text)}
        style={styles.input}
      />

      <Picker
        selectedValue={teacherData.classTeacherOf}
        onValueChange={(itemValue) => handleInputChange('classTeacherOf', itemValue)}
        style={styles.picker}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <Picker.Item key={i + 1} label={`Class ${i + 1}`} value={`${i + 1}`} />
        ))}
      </Picker>

      <TextInput
        label="Resume"
        value={teacherData.resumeUrl}
        editable={false}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={selectFile}
        loading={uploading}
        style={styles.uploadButton}
      >
        {uploading ? 'Uploading...' : 'Upload Resume'}
      </Button>

      <Button
        mode="contained"
        onPress={testPicker}
        style={styles.uploadButton}
      >
        Test Picker
      </Button>

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={uploading || !teacherData.resumeUrl}
      >
        Submit
      </Button>

      <Caption style={styles.caption}>All fields are required</Caption>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  heading: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderColor: '#ddd',
    borderWidth: 1,
    height: 50,
  },
  uploadButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#6200ee',
  },
  caption: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
    color: '#555',
  },
});

export default RegisterTeacher