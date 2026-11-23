import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../variables/theme';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProductsScreen from './screens/ProductsScreen';
import OverviewScreen from './screens/OverviewScreen';

// Screen names
const homeName = "My list";
const productsName = "Products";
const overviewName = "Dashboard";

const Tab = createBottomTabNavigator();

function MainContainer() {
  return (
    <NavigationContainer>
      <StatusBar
        animated={true}
        backgroundColor={colors.primary}
        barStyle="light-content"
      />

      <Tab.Navigator
        initialRouteName={homeName}
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            paddingBottom: 6,
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarStyle: {
            paddingTop: 6,
            height: 60,
            borderTopColor: colors.border,
            backgroundColor: '#ffffff',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            const rn = route.name;

            if (rn === homeName) {
              iconName = focused ? 'list' : 'list-outline';
            } else if (rn === productsName) {
              iconName = focused ? 'cube' : 'cube-outline';
            } else if (rn === overviewName) {
              iconName = focused ? 'analytics' : 'analytics-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name={homeName} component={HomeScreen} />
        <Tab.Screen name={productsName} component={ProductsScreen} />
        <Tab.Screen name={overviewName} component={OverviewScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default MainContainer;
