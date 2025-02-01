import { Stack, Tabs } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerBackVisible: true
    }}>
      <Stack.Screen name="screens/LoadingScreen" options={{ headerShown: false }} />
      <Stack.Screen name="screens/LoginPage" options={{ headerShown: false }} />
      {/* <Stack.Screen name="(drawer)" options={{ headerShown: false }} /> */}
      <Tabs.Screen 
        name="(tab)" 
        options={{ 
          headerShown: false, // Hide header for the tabs screen
        }} 
      />
      <Stack.Screen name="screens/addTeacher" options={{ title: 'Add Teacher', headerShown: false }} />
      <Stack.Screen name="screens/listTeacherss" options={{ title: 'List Teacher', headerShown: false }} />
      <Stack.Screen name="screens/ClassAndSectionPage" options={{ title: 'Your Classes', headerShown: true }} />
      <Stack.Screen name="screens/StudentListScreen" options={{ title: 'Students', headerShown: true }} />
      <Stack.Screen name="screens/AddStudentScreen" options={{ title: 'Add Student', headerShown: false }} />
      <Stack.Screen name="screens/TimeTableScreen" options={{ title: 'Time Table Create', headerShown: false }} />
      <Stack.Screen name="screens/HoliDayScreenn" options={{ title: 'List holiday', headerShown: true }} />
      <Stack.Screen name="screens/Admin/CheckAttendence" options={{ title: 'Attendence', headerShown: true }} />
      <Stack.Screen name="screens/Student/AttendenceScreen" options={{ title: 'Your attendence', headerShown: true }} />
      <Stack.Screen name="screens/Teacher/FeedAttendence" options={{ title: 'Feed attendence', headerShown: true }} />
    </Stack>
    
  );
}