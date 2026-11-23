import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

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
            paddingBottom: 4,
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarStyle: {
            paddingTop: 6,
            paddingBottom: bottomInset,
            height: 54 + bottomInset,
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
