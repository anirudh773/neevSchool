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
      <Stack.Screen name="screens/addTeacher" options={{ title: 'Add Teacher', headerShown: true }} />
      <Stack.Screen name="screens/listTeacherss" options={{ title: 'List Teacher', headerShown: true }} />
      <Stack.Screen name="screens/ClassAndSectionPage" options={{ title: 'Your Classes', headerShown: true }} />
      <Stack.Screen name="screens/StudentListScreen" options={{ title: 'Students', headerShown: true }} />
      <Stack.Screen name="screens/AddStudentScreen" options={{ title: 'Add Student', headerShown: false }} />
      <Stack.Screen name="screens/TimeTableScreen" options={{ title: 'Create Time Table', headerShown: true }} />
      <Stack.Screen name="screens/HoliDayScreenn" options={{ title: 'List holiday', headerShown: true }} />
      <Stack.Screen name="screens/Admin/CheckAttendence" options={{ title: 'Attendence', headerShown: true }} />
      <Stack.Screen name="screens/Admin/ExamSystem" options={{ title: 'Admin exam', headerShown: true }} />
      <Stack.Screen name="screens/Admin/AddExamScreeen" options={{title: 'Create exam', headerShown: true}} />
      <Stack.Screen name="screens/Admin/FeedMarksScreen" options={{title: 'Feed marks', headerShown: true}} />
      <Stack.Screen name="screens/Admin/ExamDashboard" options={{title: 'Exam Dashboard', headerShown: true}} />
      <Stack.Screen name="screens/Admin/HomeworkDashboard" options={{title: 'Homewok Dashboard', headerShown: true}} />
      <Stack.Screen name="screens/Admin/ControlPanelScreen" options={{title: 'Control Panel', headerShown: true}} /> 
      <Stack.Screen name="screens/Admin/StudentFeeListScreen" options={{title: 'Paid student list', headerShown: false}} />
      <Stack.Screen name="screens/Admin/PendingFeeList" options={{title: 'Pending fee list', headerShown: false}} />
      <Stack.Screen name="screens/Student/AttendenceScreen" options={{ title: 'Your attendence', headerShown: true }} />
      <Stack.Screen name="screens/Student/YourExamsAndMarksScreen" options={{ title: 'Your Exam', headerShown: true }} />
      <Stack.Screen name="screens/Student/YourTimetable" options={{ title: 'Your timetable', headerShown: true }} />
      <Stack.Screen name="screens/Student/StudentHomeworkScreen" options={{ title: 'Your fee', headerShown: true }} />
      <Stack.Screen name="screens/Student/YourFeePage" options={{ title: 'Your Homework', headerShown: true }} />
      <Stack.Screen name="screens/Teacher/FeedAttendence" options={{ title: 'Feed attendence', headerShown: true }} />
      <Stack.Screen name="screens/Teacher/HomeworkManagementSystem" options={{title: 'Homework Management', headerShown: true}} />
      <Stack.Screen name="screens/Teacher/TeacherTimeTable" options={{title: 'Your schedule', headerShown: true}} />
      <Stack.Screen 
        name="screens/HolidayListView" 
        options={{ 
          title: 'School Holidays',
          headerShown: true 
        }} 
      />
      <Stack.Screen name="screens/Admin/Profile" options={{ title: 'Profile'}} />
      <Stack.Screen name="screens/Teacher/Profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="screens/Student/Profile" options={{ title: 'Profile' }} />

      <Stack.Screen name="screens/Cashier/SectionSelectionScreen" options={{title: 'New Admission', headerShown: true}} />
      <Stack.Screen name="screens/Cashier/PaymentStudentScreen" options={{title: 'Fee Submission', headerShown: true}} />
      <Stack.Screen name="screens/Cashier/SubmitPaymentScreen" options={{title: 'Fee Submission', headerShown: false}} />

      <Stack.Screen name="screens/Admin/FeeManagementScreen" options={{title: 'Fee Management', headerShown: true}} />
      <Stack.Screen name="screens/Admin/FeeMasterScreen" options={{title: 'Add fee stucture', headerShown: false}} />
      <Stack.Screen name="screens/Admin/FeeStructuresScreen" options={{title: 'Add fee stucture', headerShown: false}} />
    </Stack>
    
  );
}