import React, {useState} from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TouchableRipple} from 'react-native-paper';
import {getSystemByAreaId} from '../../services/storage.service';
import {useFocusEffect} from '@react-navigation/native';
import {Area} from '../../types/area.ts';


export const CorelForceSystemScreen: React.FC<{
    navigation: any;
    type: string;
    route: any;
}> = (({ navigation, type, route }) => {
    const scheme = useColorScheme();
    const theme = scheme === 'dark' ? darkTheme : lightTheme;

    const [systems, setSystems] = useState<Area[]>([]);
    const [areaDescription, setAreaDescription] = useState<string>('');

    useFocusEffect(
        React.useCallback(() => {
            setAreaDescription(route.params.params.description);
            getSystemByAreaId(route.params.params.id)
                .then(areas => {
                    console.log(areas);
                    setSystems(areas);
                }).catch(error => {
                console.error('Error obteniendo areas:', error);
                setSystems([]);
            });
        }, [])
    );

    const SystemRow = ({ id, description, status, code }: { id: number; description: string; status: string, code: string }) => {

        return (
            <View style={styles.assetRow}>
                <Icon name="robot-industrial" size={24} color="#555" />
                <TouchableRipple style={styles.assetBox}
                                 onPress={() => handleAssetPress(id, description, code)}
                                 rippleColor="rgba(0, 0, 0, .1)"
                                 borderless={false}
                                 underlayColor="transparent">
                    <Text style={styles.assetText}>{description}</Text>
                </TouchableRipple>

            </View>
        );
    };
    const handleAssetPress = (assetId: number, assetDescription: string, code: string) => {
        console.log('🌿 Area presionado:', assetId);
        navigation.navigate('CorelForcePlantAssetScreen', {
            params: {
                id: assetId,
                description: assetDescription,
                code: code,
            },
        });
    };

    return (
        <View style={[styles.container, theme.background]}>
            <View style={styles.header}>
                <Icon name="factory" size={30} color="#003366" />
                <Text style={[styles.title, theme.text]}>Systems: {areaDescription}</Text>
            </View>

            <FlatList
                data={systems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <SystemRow id={item.id} status={item.status} description={item.description}  code={item.code}
             />}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
});


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        alignSelf: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContainer: {
        gap: 12,
    },
    assetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#e8eaf6',
        borderRadius: 8,
        padding: 10,
    },
    assetBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#003366',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    assetText: {
        fontSize: 16,
        fontWeight: '600',
    },
    iconButton: {
        padding: 4,
    },
});

const lightTheme = StyleSheet.create({
    background: { backgroundColor: '#ffffff' },
    text: { color: '#000' },
});

const darkTheme = StyleSheet.create({
    background: { backgroundColor: '#121212' },
    text: { color: '#fff' },
});
