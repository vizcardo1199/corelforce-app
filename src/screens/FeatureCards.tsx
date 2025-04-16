import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    useColorScheme,
    StyleSheet,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const cardsData = [

    {
        title: 'Corel Force',
        options: ['Collect Data', 'Sync Collected Data'],
        navigateTo: 'CorelForceHomeScreen',
    },
];

const FeatureCards = () => {
    const theme = useColorScheme();
    const navigation = useNavigation();
    const themedStyles = styles(theme);

    return (
        <View style={themedStyles.container}>
            <View style={themedStyles.cardRow}>
                {cardsData.map((item, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInUp.duration(500)}
                        style={themedStyles.card}
                    >
                        <Text style={themedStyles.cardTitle}>{item.title}</Text>
                        <View style={themedStyles.optionsContainer}>
                            {item.options.map((option, idx) => (
                                <Text key={idx} style={themedStyles.optionText}>
                                    • {option}
                                </Text>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={themedStyles.button}
                            onPress={() => navigation.navigate('corelForceDashboardScreen', {
                                screen: "CorelForceHomeScreen"
                            })}
                        >
                            <Text style={themedStyles.buttonText}>Go to {item.title}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </View>
    );
};

const styles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 24,
            backgroundColor: theme === 'dark' ? '#121212' : '#F2F4F8',
            justifyContent: 'center',
        },
        cardRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20, // si no es compatible, reemplaza por marginHorizontal en los cards
        },
        card: {
            backgroundColor: theme === 'dark' ? '#1F1F1F' : '#FFFFFF',
            borderRadius: 20,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
            marginHorizontal: 10,
            marginVertical: 10,
            width: 240,
            minHeight: 240, // <-- Altura mínima común
            justifyContent: 'space-between', // <-- Distribuye espacio vertical
            alignSelf: 'center',
        },
        cardTitle: {
            fontSize: 22,
            fontWeight: '600',
            marginBottom: 12,
            color: theme === 'dark' ? '#FFFFFF' : '#212121',
        },
        optionsContainer: {
            marginBottom: 20,
        },
        optionText: {
            fontSize: 16,
            marginVertical: 4,
            color: theme === 'dark' ? '#CCCCCC' : '#444',
        },
        button: {
            backgroundColor: theme === 'dark' ? '#2979FF' : '#1976D2',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        buttonText: {
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 16,
        },
    });

export default FeatureCards;
