// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

// import adminPortalScreen from '../screens/AdminPortalScreen';
// import studentRegistrationScreen from '../screens/StudentRegistrationScreen';
// import Header from '../components/Header';
// import welcomeScreen from '../screens/WelcomeScreen';
// import loginAsStudent from '../screens/LoginAsStudent';
// import studentPortal from '../screens/StudentPortal';
// import teacherLogin from '../screens/Teacher_Login';
// import loginAsAdmin from '../screens/LoginAsAdmin.js';



// const Stack = createNativeStackNavigator();

// const AppNavigator = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         screenOptions={{
//           header: ({ navigation, route, options, back }) => (
//             <Header title={route.name} />
//           ),
//         }}>
//         <Stack.Screen name="Welcome" component={welcomeScreen} />
//         <Stack.Screen name="AdminPortalScreen" component={adminPortalScreen} />

//         <Stack.Screen name="StudentRegistrationScreen" component={studentRegistrationScreen} />

//         <Stack.Screen name="LoginAsAdmin" component={loginAsAdmin} />

//         <Stack.Screen name="LoginAsTeacher" component={teacherLogin} />
//         <Stack.Screen name="LoginAsStudent" component={loginAsStudent} />
//         <Stack.Screen name="StudentPortal" component={studentPortal} />

//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;
