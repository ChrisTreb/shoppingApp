import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from './screens/HomeScreen';
import ListsScreen from './screens/ListsScreen';
import ProductsScreen from './screens/ProductsScreen';

//Screen names
const homeName = "Ma liste de courses";
const listsName = "Générer ma liste";
const productsName = "Gérer mes produits";

const Tab = createBottomTabNavigator();

function MainContainer() {
  return (
    <NavigationContainer>
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

            } else if (rn === listsName) {
              iconName = focused ? 'create' : 'create-outline';

            } else if (rn === productsName) {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}>

        <Tab.Screen name={homeName} component={HomeScreen} />
        <Tab.Screen name={listsName} component={ListsScreen} />
        <Tab.Screen name={productsName} component={ProductsScreen} />

      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default MainContainer;