import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { LogBox } from 'react-native';

// Ignore the specific Reanimated warning
LogBox.ignoreLogs([
  'It looks like you might be using shared value\'s .value inside reanimated inline style'
]);

export default function Index() {
  return <Redirect href="/landing" />;
}
