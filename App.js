import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';
import MainContainer from './navigation/MainContainer';
import { initDatabase } from './database/functions/DatabaseConnect';

function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      {Platform.OS === 'android' && <NavigationBar hidden={true} />}
      <MainContainer />
    </SafeAreaProvider>
  );
}

export default App;
