import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import StravaLoginScreen from './screens/StravaLoginScreen';
import StravaProfileScreen from './screens/StravaProfileScreen';

export type RootStackParamList = {
  Home: undefined;
  StravaLogin: undefined;
  StravaProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Accueil' }}
        />
        <Stack.Screen
          name="StravaLogin"
          component={StravaLoginScreen}
          options={{ title: 'Connexion Strava' }}
        />
        <Stack.Screen
          name="StravaProfile"
          component={StravaProfileScreen}
          options={{ title: 'Profil Strava' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
