import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TouchableRipple} from "react-native-paper";
import {getPointsByAssetId} from "../../services/storage.service";
import {PointSelect} from "../../types/pointSelect";
import {useFocusEffect} from "@react-navigation/native";

const statusIcon = {
    ok: { name: 'check-circle', color: 'green' },
    error: { name: 'close-circle', color: 'red' },
};



export const CorelForcePointScreen: React.FC<{
    navigation: any;
    type: string;
    route: any;
}> = (({ navigation, type, route }) => {
    const scheme = useColorScheme();
    const theme = scheme === 'dark' ? darkTheme : lightTheme;

    const [points, setPoints] = useState<PointSelect[]>([]);
    const [assetDescription, setAssetDescription] = useState<string>('');
    const [assetId, setAssetId] = useState<number>(0);
    const [assetCode, setAssetCode] = useState<string>('');
    useEffect(() => {


    }, []);
    const pointHandler = (pointId: number, code: string, description: string) => {
        navigation.navigate('CorelForceCollectScreen', {
            params: {
                assetId: assetId,
                assetCode: assetCode,
                assetName: assetDescription,
                pointId: pointId,
                pointCode: code,
                pointDescription: description
            }
        })
    }

    useFocusEffect(
        React.useCallback(() => {

            console.log('consultando points');
            console.log(route.params.params);
            setAssetDescription(route.params.params.description);
            setAssetId(route.params.params.id);
            setAssetCode(route.params.params.code);
            getPointsByAssetId(route.params.params.id)
                .then(asset => {
                    const points: PointSelect[] = Array.from(
                        asset.points.reduce((acc, point) => {
                            const codePoint = point.code.slice(0, 2); // Directamente usar slice para strings
                            if (!acc.has(codePoint)) {
                                acc.set(codePoint, { id: point.id, code: codePoint, description: point.description, isMeasured: point.isMeasured });
                            }
                            return acc;
                        }, new Map()).values()
                    );
                    console.log(points)
                    setPoints(points);
                });
        }, [])
    );


    const ComponentRow = ({ id, code, description, isMeasured }: { id: string; code: string, description: string, isMeasured: boolean }) => {
        const { name, color } = statusIcon[isMeasured ? 'ok' : 'error'];

        return (
            <View style={styles.componentRow} onPress={pointHandler}>
                <Icon name="pin" size={24} color="#555" />
                <TouchableRipple style={styles.componentBox} onPress={() => pointHandler(id, code, description)}>
                    <Text style={styles.componentText}>{code}</Text>
                </TouchableRipple>
                <Icon name={name} size={24} color={color} />
                <TouchableOpacity style={styles.iconButton}>
                    <Icon name="camera" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Icon name="cube-outline" size={24} color="red" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, theme.background]}>
            <View style={styles.header}>
                <Text style={[styles.title, theme.text]}>
                    {assetDescription}
                </Text>
            </View>

            <FlatList
                data={points}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ComponentRow id={item.id} code={item.code} description={item.description} isMeasured={item.isMeasured} />
                )}
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
    componentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#e8eaf6',
        borderRadius: 8,
        padding: 10,
    },
    componentBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#003366',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    componentText: {
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
