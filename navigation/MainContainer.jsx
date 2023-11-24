import * as React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProductsScreen from './screens/ProductsScreen';
import OverviewScreen from './screens/OverviewScreen';

//Screen names
const homeName = "My list";
const productsName = "Products";
const overviewName = "Dashboard";

const Tab = createBottomTabNavigator();

function MainContainer() {
  return (
    <NavigationContainer>

      <StatusBar
        animated={true}
        backgroundColor='#1E90FF'
      />

      <Tab.Navigator
        initialRouteName={homeName}
        screenOptions={({ route }) => ({
          // Style
          "tabBarActiveTintColor": "#1E90FF",
          "tabBarInactiveTintColor": "grey",
          "tabBarLabelStyle": {
            "paddingBottom": 10,
            "fontSize": 10
          },
          "tabBarStyle": [
            {
              "paddingTop": 5,
              "display": "flex"
            },
            null
          ],
          // Routes
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let rn = route.name;

            if (rn === homeName) {
              iconName = focused ? 'list' : 'list-outline';
            } else if (rn === productsName) {
              iconName = focused ? 'settings' : 'settings-outline';

            } else if (rn === overviewName) {
              iconName = focused ? 'analytics' : 'analytics-outline';
            }


            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}>

        <Tab.Screen name={homeName} component={HomeScreen} />
        <Tab.Screen name={productsName} component={ProductsScreen} />
        <Tab.Screen name={overviewName} component={OverviewScreen} />

      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default MainContainer;