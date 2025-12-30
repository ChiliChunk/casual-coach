import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StravaLoginScreen from './screens/StravaLoginScreen';
import StravaProfileScreen from './screens/StravaProfileScreen';
import PlanScreen from './screens/PlanScreen';

export type RootStackParamList = {
  StravaLogin: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Plan: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Plan') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'rgba(45, 45, 45, 0.95)',
          borderTopColor: 'rgba(252, 76, 2, 0.3)',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: 'rgba(26, 26, 26, 0.98)',
        },
        headerTintColor: '#FF6B35',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{ title: 'Plan' }}
      />
      <Tab.Screen
        name="Profile"
        component={StravaProfileScreen}
        options={{ title: 'Activités' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" translucent={false} />
      <NavigationContainer>
      <Stack.Navigator
        initialRouteName="StravaLogin"
        screenOptions={{
          headerStyle: {
            backgroundColor: 'rgba(26, 26, 26, 0.98)',
          },
          headerTintColor: '#FF6B35',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="StravaLogin"
          component={StravaLoginScreen}
          options={{ title: 'Connexion Strava' }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
