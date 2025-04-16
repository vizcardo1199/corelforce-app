import React, { useEffect, useState } from 'react';
import {View, Text, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FeatureCards from './FeatureCards.tsx';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [userName, setUserName] = useState<string>('');
    const [userImage, setUserImage] = useState<string>('');

    useEffect(() => {
        // Función para obtener los datos del usuario
        const fetchUserData = async () => {
            try {
                const name = await AsyncStorage.getItem('userName');
                const imageUrl = await AsyncStorage.getItem('userImage');
                if (name) {setUserName(name);}
                if (imageUrl) {setUserImage(imageUrl);}
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        // Llamar la función de manera segura sin devolver la promesa
        fetchUserData();
    }, []);

    return (
        <View style={homeStyles.container}>
            <FeatureCards />
        </View>
    );
};

const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5', // Fondo claro
    },
    welcomeText: {
        fontSize: 24,
        color: '#ff4500', // Rojo anaranjado para resaltar
        fontWeight: 'bold',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    logoutButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#ff4500',
        borderRadius: 8,
    },
    logoutText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
});

export default HomeScreen;
