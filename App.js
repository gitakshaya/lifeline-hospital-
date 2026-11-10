import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider, useTheme, BRAND } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import FacilitiesScreen from './src/screens/FacilitiesScreen';
import PlansScreen from './src/screens/PlansScreen';
import ReviewsScreen from './src/screens/ReviewsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import IdCardScreen from './src/screens/IdCardScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.dark ? colors.primary : BRAND.red,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: BRAND.navy },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Lifeline' }} />
      <Tab.Screen name="Facilities" component={FacilitiesScreen} />
      <Tab.Screen name="Plans" component={PlansScreen} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen name="Theme" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { colors, isDark } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: colors.primary, background: colors.bg, card: colors.card, text: colors.text, border: colors.border },
  };
  const header = { headerStyle: { backgroundColor: BRAND.navy }, headerTintColor: '#fff' };
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={header}>
        <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Customer Details' }} />
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
        <Stack.Screen name="IdCard" component={IdCardScreen} options={{ title: 'e-ID Card' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
