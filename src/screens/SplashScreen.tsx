import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {checkAuth} from "../api/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SplashScreen: React.FC<{ navigation: any }> = ({navigation}) => {

    useEffect(() => {
        const checkUserSession = async () => {

            checkAuth()
                .then(() => {
                    navigation.replace('HomeContainer');
                })
                .catch((err) => {
                        if (err.message == "Network Error") {

                            AsyncStorage.getItem('plants')
                                .then((plants) => {
                                    if(plants) {
                                        navigation.replace('dashboardOfflineScreen');
                                        return;
                                    }
                                    navigation.replace('Login');
                                })
                                .catch((error) => {
                                    navigation.replace('Login');
                                    console.error("Error al obtener los datos recolectados", error);
                                })

                        } else {
                            navigation.replace('Login');
                        }

                    }
                )
        };

        checkUserSession();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#ff4500"/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5', // Fondo claro
    },
});

export default SplashScreen;
