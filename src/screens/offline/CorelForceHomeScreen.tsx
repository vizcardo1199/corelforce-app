import React, {useState} from 'react';
import {
    View,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    useColorScheme, ActivityIndicator, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableRipple } from 'react-native-paper';
import {getPlantsBasic} from '../../services/storage.service';
import {Plant} from '../../types/plant.ts';
import {useFocusEffect} from '@react-navigation/native';
import {PlantListModal} from '../database_setup/plant/PlantListModal';
import {getPlantSelectedStore, setPlantSelectedStore} from "../../api/services/utilService.ts";
import {mapByAssetsGroup, saveCollectDataSynced} from "../../api/services/syncSurveyService.ts";
import {SurveySync} from "../../types/survey-sync.ts";
import SyncModal from "./SyncModal.tsx";
import {sendSurvey} from "../../api/services/offlineService.ts";
import {LoadingModalProgress} from "../../components/common/LoadingModalProgress.tsx";
import {CorelForceAreaScreen} from "./CorelForceAreaScreen.tsx";


export const CorelForceHomeScreen: React.FC<{
    navigation: any;
    type: string;
    route: any;
}> = (({ navigation, type, route }) => {

    const scheme = useColorScheme();
    const themeStyles = scheme === 'dark' ? darkTheme : lightTheme;

    const [plants, setPlants] = useState<Plant[]>([]);
    const [modalPlantVisible, setModalPlantVisible] = useState(false);
    const [modalSyncLoadingVisible, setModalSyncLoadingVisible] = useState(false);
    const [surveysToSync, setSurveysToSync] = useState<SurveySync[]>([]);
    const [modalSyncVisible, setModalSyncVisible] = useState(false);
    const [modalAlertMessage, setModalAlertMessage] = useState('');
    const [modalAlertVisible, setModalAlertVisible] = useState(false);
    const [loadingSyncVisible, setLoadingSyncVisible] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ completed: 0, total: 0, failed: 0 });


    useFocusEffect(
        React.useCallback(() => {

            getPlants();
        }, [])
    );

    const showModalSync = async (plantId: number) => {

        console.log('showModalSync', plantId);
        setModalSyncLoadingVisible(true);

        const surveys = await mapByAssetsGroup(plantId);


        console.log(surveys);
        setSurveysToSync(surveys);
        setModalSyncLoadingVisible(false);

        if (surveys.length > 0) {
            console.log('setModalSyncVisible', true);
            setModalSyncVisible(true);
        } else {
            showModalAlert('No data to sync');
        }
    };
    const showModalAlert = (message: string) => {
        setModalAlertMessage(message);
        setModalAlertVisible(true);
    };
    const hideModalAlert = () => {
        setModalAlertVisible(false);
    };
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
    const handleSync = async (surveysSync: SurveySync[]) => {
        const counter = { successCount: 0, failedCount: 0 } ;
        if (surveysSync.length > 0) {
            surveysSync.forEach(survey => survey.synced = null);

            setLoadingSyncVisible(true);
            setSyncProgress({ completed: 0, total: surveysSync.length, failed: 0 });

            try {
                const successfulUuids: string[] = [];
                const batchSize = 10; // Batch size

                for (let i = 0; i < surveysSync.length; i += batchSize) {
                    const batch = surveysSync.slice(i, i + batchSize); // Take a group of 10

                    const sendSurveyPromises = batch.map((survey) =>
                        sendSurvey(survey)
                            .then(() => {
                                successfulUuids.push(...survey.uuids);
                                survey.synced = true; // ✅ Mark as synced successfully
                                counter.successCount++;
                            })
                            .catch((error) => {
                                console.error(`❌ Failed to send survey ${survey.mawoiId}:`, error);
                                survey.synced = false; // ❌ Mark as failed
                                setSyncProgress((prev) => ({
                                    ...prev,
                                    failed: prev.failed + 1,
                                }));
                                counter.failedCount++;
                            })
                            .finally(() => {
                                setSyncProgress((prev) => ({
                                    ...prev,
                                    completed: prev.completed + 1,
                                }));
                            })
                    );

                    await Promise.allSettled(sendSurveyPromises);
                }

                if (successfulUuids.length > 0) {
                    await saveCollectDataSynced(surveysSync.filter(s => s.synced === true), surveysSync.filter(s => s.synced === false));
                }

                console.log(`✅ Surveys sent successfully: ${successfulUuids.length}`);
            } catch (error) {
                console.error('❌ Unexpected error during synchronization:', error);
            } finally {
                setLoadingSyncVisible(false);
            }
        }
        console.log('✅ Surveys sent failed:', counter.failedCount);
        console.log('✅ Surveys sent successfully:', counter.successCount);
        return { successCount: counter.successCount, failedCount: counter.failedCount };
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
                    <View>
                        <Text style={styles.plantName}>{name}</Text>
                    </View>

                </TouchableRipple>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={onReload}>
                        <Icon name="sync" size={24} style={styles.icon} />
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
    const handlePlantPress = async (plant: Plant) => {
        console.log('🌿 Planta presionada:', plant.description);
        await setPlantSelectedStore(plant.id);
        navigation.navigate('CorelForceAreaScreen', {
            params: {
                id: plant.id,
                description: plant.description,
            },
        });
    };

    return (
        <View style={[styles.container, themeStyles.container]}>
            <SyncModal
                visible={modalSyncVisible}
                onClose={() => setModalSyncVisible(false)}
                surveys={surveysToSync}
                onSync={handleSync}
            />
            <LoadingModalProgress
                visible={loadingSyncVisible}
                progressText={`Syncing ${syncProgress.completed} of ${syncProgress.total} surveys...`}
            />
            <Modal animationType="fade" transparent={true} visible={modalAlertVisible}>
                <View style={styles.modalAlertContainer}>
                    <View style={styles.modalAlertView}>
                        <Text style={styles.modalAlertText}>{modalAlertMessage}</Text>
                        <TouchableOpacity style={styles.modalAlertButton} onPress={hideModalAlert}>
                            <Text style={styles.modalAlertButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalSyncLoadingVisible}
            >
                <View style={styles.loadingModalContainer}>
                    <View style={styles.loadingModalView}>
                        <ActivityIndicator size="large" color="#007bff"/>
                        <Text style={styles.loadingModalText}>Processing...</Text>
                    </View>
                </View>
            </Modal>
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
                        onReload={() => showModalSync(item.id)}
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
    modalAlertContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalAlertView: {
        width: 300,
        padding: 30,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalAlertText: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 30,
    },
    modalAlertButton: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        elevation: 2,
        marginHorizontal: 10,
        backgroundColor: '#007bff',
    },
    modalAlertButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    loadingModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    loadingModalView: {
        width: 200,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    loadingModalText: {
        marginTop: 10,
        fontSize: 16,
        color: '#007bff',
        fontWeight: 'bold',
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
