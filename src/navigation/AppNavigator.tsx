import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerNavigator } from './DrawerNavigator.tsx';
import LoginScreen from '../screens/LoginScreen';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen.tsx';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }} // Ocultar el header en la pantalla de Login
        />
        <Stack.Screen
          name="HomeContainer"
          component={DrawerNavigator}
          options={{ headerShown: false }} // Ocultar el header ya que el Drawer tiene su propio encabezado
        />


      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
