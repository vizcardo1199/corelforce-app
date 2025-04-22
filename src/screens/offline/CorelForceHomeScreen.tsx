import React, {useState} from 'react';
import {
    View,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableRipple } from 'react-native-paper';
import {getPlantsBasic} from '../../services/storage.service';
import {Plant} from '../../types/plant.ts';
import {useFocusEffect} from '@react-navigation/native';
import {PlantListModal} from '../database_setup/plant/PlantListModal';


export const CorelForceHomeScreen: React.FC<{
    navigation: any;
    type: string;
    route: any;
}> = (({ navigation, type, route }) => {

    const scheme = useColorScheme();
    const themeStyles = scheme === 'dark' ? darkTheme : lightTheme;

    const [plants, setPlants] = useState<Plant[]>([]);
    const [modalPlantVisible, setModalPlantVisible] = useState(false);

    useFocusEffect(
        React.useCallback(() => {

            getPlants();
        }, [])
    );

    const getPlants = () => {
        console.log('getPlants');

        getPlantsBasic()
            .then(plants => {
                console.log('Plantas obtenidas');
                console.log(plants);
                setPlants(plants);
            })
            .catch(error => {
                console.error('Error obteniendo plantas:', error);
                setPlants([]);
            });
    };

    const PlantItem = ({ name, onPress, onReload, onMap, onCalendar }: any) => {
        return (
            <View style={styles.itemContainer}>
                <TouchableRipple
                    onPress={onPress}
                    rippleColor="rgba(0, 0, 0, .1)"
                    style={styles.card}
                    borderless={false}
                    underlayColor="transparent"
                >
                    <Text style={styles.plantName}>{name}</Text>
                </TouchableRipple>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={onReload}>
                        <Icon name="reload" size={24} style={styles.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onMap}>
                        <Icon name="map-marker" size={24} style={styles.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onCalendar}>
                        <Icon name="calendar-month" size={24} style={styles.icon} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };
    const handlePlantPress = (plant: Plant) => {
        console.log('🌿 Planta presionada:', plant.description);
        navigation.navigate('CorelForcePlantAssetScreen', {
            params: {
                id: plant.id,
                description: plant.description,
            },
        });
    };

    return (
        <View style={[styles.container, themeStyles.container]}>
            <PlantListModal
                visible={modalPlantVisible}
                download={true}
                onClose={() => {
                    setModalPlantVisible(false);
                    getPlants();
                }}
                onSelectPlant={() => setModalPlantVisible(false)}
            />
            <Text style={[styles.title, themeStyles.text]}>PLANTS</Text>

            <TouchableOpacity style={styles.addButton} onPress={() => setModalPlantVisible(true)}>
                <Text style={styles.addButtonText}>Add Plant</Text>
            </TouchableOpacity>

            <FlatList
                data={plants}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PlantItem
                        name={item.description}
                        onPress={() => handlePlantPress(item)}
                        onReload={() => console.log('↻ Recargar', item.description)}
                        onMap={() => console.log('📍 Ver ubicación', item.description)}
                        onCalendar={() => console.log('📅 Ver calendario', item.description)}
                    />
                )}
            />
        </View>
    );
});


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        alignSelf: 'center',
    },
    addButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignSelf: 'flex-end',
        borderRadius: 8,
        marginBottom: 10,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    card: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#eaeaea',
        marginRight: 10,
    },
    plantName: {
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    icon: {
        color: '#007bff',
    },
});

const darkTheme = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
    },
    text: {
        color: '#ffffff',
    },
});

const lightTheme = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
    },
    text: {
        color: '#000000',
    },
});
