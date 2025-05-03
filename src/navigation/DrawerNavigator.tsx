// Menú Lateral Personalizado
import HomeScreen from '../screens/HomeScreen.tsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import { View, StyleSheet, Image, Text } from 'react-native';
import React, { useState} from 'react';


const logo = require('../../assets/logo.png');
import Home from '../../assets/home.svg';
import Offline from '../../assets/offline.svg';
import Logout from '../../assets/logout.svg';
import {CorelForceHomeScreen} from '../screens/offline/CorelForceHomeScreen';
import {createStackNavigator} from '@react-navigation/stack';
import {getFocusedRouteNameFromRoute, useFocusEffect} from '@react-navigation/native';
import {CorelForcePlantAssetScreen} from "../screens/offline/CorelForcePlantAssetScreen.tsx";
import {CorelForcePointScreen} from "../screens/offline/CorelForcePointScreen.tsx";
import {CorelForceCollectScreen} from "../screens/offline/CorelForceCollectScreen.tsx";
import {CorelForceAreaScreen} from "../screens/offline/CorelForceAreaScreen.tsx";
import {CorelForceSystemScreen} from "../screens/offline/CorelForceSystemScreen.tsx";
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const CustomDrawerContent = (props: any) => {
  const [showSubOptions, setShowSubOptions] = useState<boolean>(false);
  const { state, navigation } = props;
  const currentRoute = state.routeNames[state.index];
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

    useFocusEffect(
        React.useCallback(() => {
            AsyncStorage.getItem('userName')
                .then(userName => {
                    setUserName(userName);
                });

            AsyncStorage.getItem('userEmail')
                .then(userEmail => {
                    setUserEmail(userEmail);
                });


        }, [])
    );


  return (
    <DrawerContentScrollView {...props} style={drawerStyles.containerSideNav}>
        <View style={drawerStyles.headerContainer}>
            <Image source={logo} style={drawerStyles.profileImage} />
            <View>
                <Text style={drawerStyles.userName}>{userName}</Text>
                <Text style={drawerStyles.userEmail}>{userEmail}</Text>
            </View>

        </View>
      <DrawerItemList {...props} />
      {showSubOptions && (
        <View style={drawerStyles.subOptionsContainer} />
      )}
      <DrawerItem
        label="Sign Out"
        icon={() => <Logout fill={drawerStyles.noFocus.color} style={drawerStyles.menuIcon} />}
        labelStyle={[drawerStyles.noFocus]}
        style={drawerStyles.itemDrawer}
        onPress={async () => {
          await AsyncStorage.setItem('userToken', '');
          props.navigation.replace('Login');
        }}
      />
    </DrawerContentScrollView>
  );
};

export const  CorelForceStack: React.FC = () => {
    return (
        <Stack.Navigator initialRouteName="CorelForceHomeScreen">
            <Stack.Screen name="CorelForceHomeScreen" component={CorelForceHomeScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="CorelForcePlantAssetScreen" component={CorelForcePlantAssetScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="CorelForcePointScreen" component={CorelForcePointScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="CorelForceCollectScreen" component={CorelForceCollectScreen} options={{ headerShown: true, title: 'Corel Force' }}/>
            <Stack.Screen name="CorelForceAreaScreen" component={CorelForceAreaScreen} options={{ headerShown: false, title: 'Corel Force - Area' }}/>
            <Stack.Screen name="CorelForceSystemScreen" component={CorelForceSystemScreen} options={{ headerShown: false, title: 'Corel Force - System' }}/>
        </Stack.Navigator>
    );

};
// Navegación Principal con Menú Lateral
export const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
        screenOptions={({ route }) => {
            const hideHeaderOnTheseRoutes = ['CorelForceCollectScreen'];
            const currentRouteName = getFocusedRouteNameFromRoute(route);

            const shouldHideHeader = hideHeaderOnTheseRoutes.includes(currentRouteName ?? '');

            return {
                headerShown: !shouldHideHeader,
                drawerActiveTintColor: '#000000',
                drawerInactiveTintColor: '#7f8c8d',
                drawerActiveBackgroundColor: '#ffffff',
                drawerItemStyle: {
                    borderRadius: 10, // Aplica bordes redondeados a los ítems
                    marginHorizontal: 25, // Añade espacio horizontal para resaltar el diseño

                },
            };
        }}

      drawerContent={(props) => <CustomDrawerContent {...props} />}
      initialRouteName="Home"
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home',
            drawerIcon: ({focused}) => (
                <Home fill={!focused ? drawerStyles.noFocus.color : '#000'}  style={drawerStyles.menuIcon} />
            )}}

      />

        <Drawer.Screen
            name="corelForceDashboardScreen"
            component={CorelForceStack}
            options={{

                title: 'Corel Force',
                drawerIcon: ({focused}) => (
                    <Offline fill={!focused ? drawerStyles.noFocus.color : '#000'}  style={drawerStyles.menuIcon} />
                )}}

        />

    </Drawer.Navigator>
  );
};

const drawerStyles = StyleSheet.create({
    headerContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#e0e8ee',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        flexDirection: 'row',
    },
    containerSideNav: {
        backgroundColor: '#e0e8ee',
    },
    noFocus: {
        color: '#7e7e7e',
    },
    itemDrawer: {
        marginHorizontal: 25,
        borderRadius: 10,
    },
    profileImage: {
        width: 50,
        height: 40,
        borderRadius: 25,
        marginBottom: 10,
        marginRight: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    subOptionsContainer: {
        paddingLeft: 50,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        fontSize: 14,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    menuIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
});

