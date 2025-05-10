import React, {useCallback, useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal, PermissionsAndroid, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Sentry from '@sentry/react-native';
import {
    findPointForCollectData,
    findPointForCollectDataByCode,
    findPointInCollectData,
    generateUUID,
    getAsset,
    getLastBandsInfoFromStore,
    getPlantSelectedStore,
    getPoint, getSurveyFromDB,
    getSurveysLocalStorage,
    getSurveyVariables,
    getSystemConfig,
    processSpectra, updatePointMeasurementStatus,
} from '../../api/services/utilService';
import {CollectData} from '../../types/collect-data';
import {Picker} from '@react-native-picker/picker';
import {BleManager, Device, State, Subscription} from 'react-native-ble-plx';
import {useNavigation} from '@react-navigation/native';
import {deleteCollect, mapByAssetsGroup, saveCollectDataSynced} from '../../api/services/syncSurveyService.ts';
import {SurveySync} from '../../types/survey-sync';
import {Buffer} from 'buffer';
import {format, parse} from 'date-fns/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SurveyStore} from '../../types/survey-store';
import {Asset} from '../../types/asset';
import {Point} from '../../types/point';
import {DRAW_TITLES} from '../../config/constants';
import ConvertIcon from '../../../assets/convert.svg';
import LineChart from '../../components/LineChart';
import {waveformDisplacement, waveformVelocity} from '../../config/utils.ts';
import {crestFactor, peakToPeak} from '../../api/services/mathServices';
import PointIcon from '../../../assets/point-icon.svg';
import {LoadingModal} from '../../components/common/LoadingModal.tsx';
import SyncModal from './SyncModal.tsx';
import {sendSurvey} from '../../api/services/offlineService.ts';
import {BLUETOOTH_PROPS} from '../../services/bluetooth-service.ts';
import {ConfigValuesModal} from '../../components/ConfigValuesModal.tsx';
import {PopoverButton} from '../../components/common/PopoverButton.tsx';
import {POPOVER_COLLECT_INFO} from '../../types/popover-collect-info';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import {database} from "../../database";
import {Q} from "@nozbe/watermelondb";
import {LoadingModalProgress} from "../../components/common/LoadingModalProgress.tsx";

const MOCK_GRAPHS = [+{ id: '1', image: require('../../../assets/location-pin.png') },
    { id: '2', image: require('../../../assets/location-pin.png') },
    { id: '3', image: require('../../../assets/location-pin.png') },
    { id: '4', image: require('../../../assets/location-pin.png') },
];

let pointWithCollectData: CollectData = {
    date: null,
    NEXT_X_W: [],
    NEXT_X_S: [],
    NEXT_Y_W: [],
    NEXT_Y_S: [],
    NEXT_Z_W: [],
    NEXT_Z_S: [],
    vars: null,
};

let convertIndex = {
    NEXT_X_W: 1,
    NEXT_X_S: 1,
    NEXT_Y_W: 1,
    NEXT_Y_S: 1,
    NEXT_Z_W: 1,
    NEXT_Z_S: 1,
};

let receivingData = false;
let UNIT_W = 1; // 1: Acc, 2: Vel, 3: Disp
let UNIT_S = 1; // 1: Acc, 2: Vel, 3: Disp
let currentDataType: string | null = null;
let timeDomainData = [];
let frequencyDomainData = [];
let partialDataBuffer = new ArrayBuffer(0);
let eventActive = 'NEXT_X';
let pointTemp: CollectData | null = null;
let scanning = false;
let connectedDevice: Device | null = null;
const manager = new BleManager();
const UUID_BLE_SERVICE = '91bad492-b950-4226-aa2b-4ede9fa42f59';
const UUID_DATA_CHARACTERISTIC = 'cba1d466-344c-4be3-ab3f-189f80dd7518';
const UUID_SENSOR_CHARACTERISTIC = '19b10001-e8f2-537e-4f6c-d104768a1214';
const MARKERS = [
    'END',
    'TIME_DOMAIN',
    'END_TIME_DOMAIN',
    'FREQUENCY_DOMAIN',
    'END_FREQUENCY_DOMAIN',
];

let listenerEvent: Subscription | null = null;
const screenHeight = Dimensions.get('window').height;
export const CorelForceCollectScreen: React.FC<{
    type: string;
    route: any;
}> = (({  type, route }) => {
    const navigation = useNavigation();
    const scheme = useColorScheme();
    const theme = scheme === 'dark' ? darkTheme : lightTheme;

    route?.params || {};

    const [showPicker, setShowPicker] = useState(false);
    const [assetCode, setAssetCode] = useState<string>('');
    const [assetDescription, setAssetDescription] = useState<string>('');
    const [pointCode, setPointCode] = useState<string>('');
    const [pointDescription, setPointDescription] = useState<string>('');
    const [datesMeasured, setDatesMeasured] = useState<string[]>([]);
    const [dateMeasuredSelected, setDateMeasuredSelected] = useState<string>('');
    const [isSensorConnected, setIsSensorConnected] = useState(false);
    const [dataXWToDraw, setDataXWToDraw] = useState(null);
    const [dataXSToDraw, setDataXSToDraw] = useState(null);
    const [dataYWToDraw, setDataYWToDraw] = useState(null);
    const [dataYSToDraw, setDataYSToDraw] = useState(null);
    const [dataZWToDraw, setDataZWToDraw] = useState(null);
    const [dataZSToDraw, setDataZSToDraw] = useState(null);
    const [popoverCollectInfoXW, setPopoverCollectInfoXW] = useState<POPOVER_COLLECT_INFO>({crestFactor: null, peakToPeak: null});
    const [popoverCollectInfoXS, setPopoverCollectInfoXS] = useState<POPOVER_COLLECT_INFO>({crestFactor: null, peakToPeak: null});
    const [popoverCollectInfoYW, setPopoverCollectInfoYW] = useState<POPOVER_COLLECT_INFO>({crestFactor: null, peakToPeak: null});
    const [popoverCollectInfoYS, setPopoverCollectInfoYS] = useState<POPOVER_COLLECT_INFO>({crestFactor: null, peakToPeak: null});
    const [popoverCollectInfoZW, setPopoverCollectInfoZW] = useState<POPOVER_COLLECT_INFO>({crestFactor: null, peakToPeak: null});
    const [popoverCollectInfoZS, setPopoverCollectInfoZS] = useState<POPOVER_COLLECT_INFO>({crestFactor: null, peakToPeak: null});
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [modalBluetoothVisible, setModalBluetoothVisible] = useState(false);
    const [devices, setDevices] = useState<Device[]>([]);
    const [modalConfigValuesVisible, setModalConfigValuesVisible] = useState(false);
    const [surveysToSync, setSurveysToSync] = useState<SurveySync[]>([]);
    const [modalSyncVisible, setModalSyncVisible] = useState(false);
    const [pointSelected, setPointSelected] = useState<number | null>(null);
    const [modalAlertMessage, setModalAlertMessage] = useState('');
    const [modalAlertVisible, setModalAlertVisible] = useState(false);
    const [assetSelected, setAssetSelected] = useState<number | null>(null);
    const [isReceivingData, setIsReceivingData] = useState(false);
    const [textLoading, setTextLoading] = useState('');
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [noDataMeasured, setNoDataMeasured] = useState(true);
    const [loadingSyncVisible, setLoadingSyncVisible] = useState(false);
    const [lastCollectedDate, setLastCollectedDate] = useState<string>('');
    const [modalVisible, setModalVisible] = useState(false);
    const [dataToShow, setDataToShow] = useState<number[]>([]);
    const [modalAlertDeleteVisible, setModalAlertDeleteVisible] = useState(false);
    const [modalSyncLoadingVisible, setModalSyncLoadingVisible] = useState(false);
    const [modalAlertMessageVisible, setModalAlertMessageVisible] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ completed: 0, total: 0, failed: 0 });
    const [loadingModalVisible, setLoadingModalVisible] = useState(false);

    useEffect(() => {

        console.log('Iniciando medidiciones');
        console.log(route.params.params);
        setAssetCode(route.params.params.assetCode);
        setAssetDescription(route.params.params.assetName);
        setPointCode(route.params.params.pointCode);
        setPointDescription(route.params.params.pointDesc);
        setPointSelected(route.params.params.pointId);
        setAssetSelected(route.params.params.assetId);
        setPointDescription(route.params.params.pointDescription);

        findCollects(route.params.params.assetId!, route.params.params.pointId!);


        connectDeviceFromGlobal()
            .then(() => {
                console.log('Device connected from global');
            })
            .catch((error) => {
                console.error('Error al conectar el dispositivo', error);
            });
    }, []);

    useEffect(() => {
        const onChange = ({ window }) => {
            setScreenWidth(window.width);
        };

        const subscription = Dimensions.addEventListener('change', onChange);

        return () => subscription?.remove(); // Limpieza del listener
    }, []);

    const findCollects = (assetId: number, pointId: number) => {
        getSurveyFromDB(assetId!, pointId)
            .then(async (survey) => {
                console.log('Datos recolectados obtenidos del dispositivo');
                if (survey) {
                    const collects = await survey.collects.fetch(); // 👈 obtén los collects reales

                    if (collects.length > 0) {
                        const dates = collects.map((collect) => collect.date!);
                        setDatesMeasured(dates);
                        setLastCollectedDate(dates[dates.length - 1]);
                        setNoDataMeasured(false);
                        setDateMeasuredSelected(dates[dates.length - 1]);
                    } else {
                        clearGraphs();
                        setDatesMeasured([]);
                        setNoDataMeasured(true);
                    }

                } else {
                    clearGraphs();
                    setDatesMeasured([]);
                    setNoDataMeasured(true);
                }
            })
            .catch((error) => {
                console.error('Error al obtener los datos recolectados', error);
            });
    }
    const requestBluetoothPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                ]);

                const allGranted = Object.values(granted).every(value => value === PermissionsAndroid.RESULTS.GRANTED);
                if (!allGranted) {
                    alert('Se requieren permisos de Bluetooth y ubicación.');
                }

                return allGranted;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }

        // iOS generalmente no requiere permisos explícitos para escanear
        return true;
    };

    const showModalAlertDelete = () => {
        setModalAlertDeleteVisible(true);
    };

    const confirmDelete = async (assetId: number, pointId: number, date: string) => {
        setLoadingModalVisible(true);
        await deleteCollect(assetId, pointId, date);
        findCollects(assetId, pointId);
        setLoadingModalVisible(false);
        setModalAlertDeleteVisible(false);
    }
    const checkBluetoothState = async (): Promise<boolean> => {
        const state = await BluetoothStateManager.getState();
        console.log('Bluetooth State:', state);

        if (state === 'PoweredOff') {
            const userAccepted = await BluetoothStateManager.requestToEnable(); // Abre diálogo del sistema
            console.log('Solicitado encender Bluetooth');
            return userAccepted === 'PoweredOn';
        }

        return state === 'PoweredOn';
    };
    const showModalScanning = async () => {
        const hasPermissions = await requestBluetoothPermissions();
        if (!hasPermissions) return;

        const isBluetoothOn = await checkBluetoothState();
        if (!isBluetoothOn) return;
        scanDevices();
        setModalBluetoothVisible(true);
    };

    const handleTogglePopover = (id: string) => {
        setOpenPopoverId((prev) => (prev === id ? null : id)); // abre si es distinto, cierra si es el mismo
    };
    const hideModalScanning = () => {
        setModalBluetoothVisible(false);
        manager.stopDeviceScan()
            .then(() => scanning = false);
    };

    const openModalWithData = (data: number[]) => {
        setDataToShow(data);
        setModalVisible(true);
    };
    const setBandsInformation = async (pointWithCollectData: any, point: number, mawoiId: number, date: string) => {
        console.log('setBandsInformation');
        let pointInUse = await findPointForCollectData(point);

        if(!pointInUse) {return;}
        console.log('setBandsInformation',point);

        pointInUse = pointInUse.point;
        const vars = pointWithCollectData.vars;
        const FMAX = vars.fMax;

        let bandInfoTemp = {
            mawoiId: mawoiId,
            date: date,
        };

        // await saveOrUpdateBandInformationStore({
        //     ...bandInfoTemp,
        //     ...await calculateBandsInformationInCollectData(
        //         pointWithCollectData.NEXT_X_W,
        //         pointWithCollectData.NEXT_X_S,
        //         pointInUse,
        //         FMAX,
        //         "X",
        //     ),
        // });
        //
        // await saveOrUpdateBandInformationStore({
        //     ...bandInfoTemp,
        //     ...await calculateBandsInformationInCollectData(
        //         pointWithCollectData.NEXT_Y_W,
        //         pointWithCollectData.NEXT_Y_S,
        //         pointInUse,
        //         FMAX,
        //         "Y",
        //     ),
        // });
        //
        // await saveOrUpdateBandInformationStore({
        //     ...bandInfoTemp,
        //     ... await calculateBandsInformationInCollectData(
        //         pointWithCollectData.NEXT_Z_W,
        //         pointWithCollectData.NEXT_Z_S,
        //         pointInUse,
        //         FMAX,
        //         "Z",
        //     ),
        // });
        // console.log(bandInfoTemp);

    };
    const scanDevices = () => {

        if(scanning) {return;}

        scanning = true;
        console.log('Escaneando dispositivos...');
        setDevices(connectedDevice ? [connectedDevice] : []); // Reiniciar lista de dispositivos
        manager.startDeviceScan(null, null, (error, scannedDevice) => {
            if (error) {
                console.error('Error al escanear dispositivos:', error);
                console.error('Error message:', error.message); // Mensaje de error (si existe)
                console.error('Error stack:', error.stack);
                return;
            }
            console.log('Dispositivo encontrado:', scannedDevice.name);

            if(scannedDevice?.id == connectedDevice?.id) {return;}
            // Verifica que el dispositivo no esté ya en la lista
            setDevices((prevDevices) => {
                if (scannedDevice.name && !prevDevices.find((d) => d.id === scannedDevice.id)) {
                    return [...prevDevices, scannedDevice];
                }
                return prevDevices;
            });
        });

        // Detener el escaneo después de 10 segundos
        setTimeout(() => {
            manager.stopDeviceScan()
                .then(() => scanning = false);
        }, 10000);
    };
    const showModalAlert = (message: string) => {
        setModalAlertMessage(message);
        setModalAlertVisible(true);
    };

    function concatBuffers(buffer1, buffer2) {
        const totalLength = buffer1.byteLength + buffer2.byteLength;
        const resultBuffer = new Uint8Array(totalLength);

        // Copiar el primer buffer
        resultBuffer.set(new Uint8Array(buffer1), 0);
        // Copiar el segundo buffer
        resultBuffer.set(new Uint8Array(buffer2), buffer1.byteLength);

        return resultBuffer.buffer; // Devuelve el ArrayBuffer resultante
    }
    const collectData = async () => {


        if(pointSelected == null) {
            showModalAlert('Select a point to collect data');
            return;
        }
        if (!connectedDevice) {
            showModalScanning();
            return;
        }
        clearGraphs();

        let pointInUse = await findPointInCollectData(assetSelected!, pointSelected!);

        if(pointInUse){
            await setBandsInformation(pointInUse.point, pointSelected!, assetSelected!, dateMeasuredSelected);
        }

        setIsReceivingData(true);
        setTextLoading('Connecting...');
        eventActive = 'NEXT_X';
        await collectDataFromDevice();
    };

    const processData = (data: any) => {
        try {
            let message: any;
            try {
                message = Buffer.from(data, 'base64').toString('utf-8');
                // console.log('Datos recibidos:', message);
            } catch (error) {
                console.error('Error al procesar datos:', error);
            }

            if (message && MARKERS.includes(message)) {
                console.log('Received data...', message);
                if (message === 'TIME_DOMAIN') {
                    console.log('Init data in time domain.');
                    setTextLoading(`Receiving ${eventActive} data...`);
                    // updateMessage(eventActive);
                    currentDataType = 'time_domain';
                    timeDomainData = [];
                    partialDataBuffer = new ArrayBuffer(0);
                } else if (message === 'END_TIME_DOMAIN') {
                    console.log('End data in time domain.');
                    currentDataType = null;
                    partialDataBuffer = new ArrayBuffer(0);
                    pointWithCollectData[eventActive + '_W'] = timeDomainData;
                    getDataToDraw(eventActive + '_W').then(() => {
                        console.log('Data to draw');
                    }).catch((err) => {
                        console.log('Error al obtener datos a dibujar', err);
                    });
                    // drawAxios(eventActive + "_W"), 100;
                } else if (message === 'FREQUENCY_DOMAIN') {
                    console.log('Init data in frequency domain.');
                    // updateMessage(eventActive);
                    setTextLoading(`Receiving ${eventActive} data...`);
                    currentDataType = 'frequency_domain';
                    frequencyDomainData = [];
                    partialDataBuffer = new ArrayBuffer(0);
                } else if (message === 'END_FREQUENCY_DOMAIN') {
                    console.log('End data in frequency domain.');
                    currentDataType = null;
                    partialDataBuffer = new ArrayBuffer(0);
                    pointWithCollectData[eventActive + '_S'] =
                        processSpectra(frequencyDomainData);
                    getDataToDraw(eventActive + '_S').then(() => {
                        console.log('Data to draw');
                    }).catch((err) => {
                        console.log('Error al obtener datos a dibujar', err);
                    });
                    // drawAxios(eventActive + "_S"), 100;
                    receivingData = false;

                    console.log(eventActive);
                    if (eventActive != 'NEXT_Z') {
                        // call next function
                        eventActive = eventActive.includes('_X') ? 'NEXT_Y' : 'NEXT_Z';
                        // writeOnCharacteristic("NEXT_X");
                        writeOnSensorCharacteristic(eventActive)
                            .then(() => {
                                console.log('NEXT_X sent');
                            });

                    } else {
                        console.log('iniciando guardado de datos');
                        // set storage latest collect data
                        setLocalStorageLatestCollectData()
                            .then(() => {
                                console.log('Datos recolectados guardados en el dispositivo');
                                setNoDataMeasured(false);
                            })
                            .catch((error) => {
                                Sentry.captureException(error);
                                console.error('Error al guardar los datos recolectados', error);
                            })
                            .finally(() => {
                                setIsReceivingData(false);
                                setTextLoading('');
                                listenerEvent?.remove();
                            });

                    }
                }
            } else {
                // Asumir que son datos binarios
                if (
                    currentDataType === 'time_domain' ||
                    currentDataType === 'frequency_domain'
                ) {
                    partialDataBuffer = concatBuffers(partialDataBuffer, Buffer.from(data, 'base64'));

                    // Desempaquetar los doubles cuando tengamos suficientes bytes
                    while (partialDataBuffer.byteLength >= 8) {
                        const chunk = partialDataBuffer.slice(0, 8);
                        partialDataBuffer = partialDataBuffer.slice(8);

                        const miniDataView = new DataView(chunk);

                        const value = miniDataView.getFloat64(0, true);

                        if (currentDataType === 'time_domain') {
                            timeDomainData.push(value);
                            // console.log("timeDomainData", timeDomainData);
                        } else if (currentDataType === 'frequency_domain') {
                            frequencyDomainData.push(value);
                        }
                    }
                } else {
                    console.log('Datos binarios recibidos sin tipo específico. Ignorando.');
                }
            }
        }catch (error) {
            Sentry.captureException(error);
            console.error('Error al procesar datos', error);
            setIsReceivingData(false);
            setTextLoading('');
            listenerEvent?.remove();
        }
    };

    const setLocalStorageLatestCollectData = async () => {
        let fecha = format(new Date(), 'yyyy-MM-dd hh:mm:ss a');
        const surveys = database.get('surveys');
        const plantSelectedId = await getPlantSelectedStore();
        const asset: Asset = (await getAsset(assetSelected!))!;
        const point: Point = (await getPoint(pointSelected!))!;
        pointWithCollectData.vars = await getSurveyVariables();
        const existingSurvey = await surveys
            .query(
                Q.where('asset_id', assetSelected),
                Q.where('point_id', pointSelected)
            )
            .fetch();

        await database.write(async () => {
            let survey;
            if (existingSurvey.length === 0) {
                console.log('creating new survey');
                survey = await surveys.create(s => {
                    s.assetId = assetSelected;
                    s.assetDescription = asset.description;
                    s.isMonoaxial = asset.isMonoaxial === 1;
                    s.pointId = pointSelected;
                    s.pointCode = point.code;
                    s.pointDescription = point.description;
                    s.plantId = plantSelectedId;
                    s.plantDescription = ''; // puedes agregarla si tienes esta info
                });
            } else {
                console.log('updating existing survey');
                survey = existingSurvey[0];
            }

            await survey.collections.get('collects').create(c => {
                c.survey.set(survey);
                c.uuid = generateUUID();
                c.date = fecha;
                c.time = new Date().getTime();
                c.synced = false;
                c.nextXW = JSON.stringify(pointWithCollectData.NEXT_X_W ?? []);
                c.nextXS = JSON.stringify(pointWithCollectData.NEXT_X_S ?? []);
                c.nextYW = JSON.stringify(pointWithCollectData.NEXT_Y_W ?? []);
                c.nextYS = JSON.stringify(pointWithCollectData.NEXT_Y_S ?? []);
                c.nextZW = JSON.stringify(pointWithCollectData.NEXT_Z_W ?? []);
                c.nextZS = JSON.stringify(pointWithCollectData.NEXT_Z_S ?? []);
                c.vars = JSON.stringify(pointWithCollectData.vars ?? {});
            });
        });

        setDatesMeasured(datesMeasured.concat(fecha));
        setLastCollectedDate(fecha);
        await updatePointMeasurementStatus(pointSelected!, true);
    };

    const getDataToDraw = async (eventActive: string) => {

        console.log('getDataToDraw');
        const preDataToDraw = pointTemp ||  pointWithCollectData;
        const configStore = await getSystemConfig();

        const vars = await getSurveyVariables();

        const FMAX = vars.fMax;
        const nRevs = vars.rev;
        const RPM = vars.rpm;
        const MIN_TO_SECONDS = 60000;

        const data = preDataToDraw[eventActive].map((valueY, index) => {
            let y = valueY;
            let x = eventActive.includes('_S')
                ? (index * FMAX) / preDataToDraw[eventActive].length
                : (index * MIN_TO_SECONDS * nRevs) /
                (RPM * preDataToDraw[eventActive].length);

            if (configStore.frequency == 1) {
                x = x / 60; // Convert to Hertz
            }

            if (configStore.amplitude == 1) {
                y = y * 25.4; // Convert to metric
            }

            const factorMap = {
                1: 0.5,
                3: 0.35355,
            };

            const unitType = eventActive.includes('_S') ? UNIT_S : UNIT_W;
            let typeKey;

            if (unitType === 1) {
                typeKey = 'accType';
            } else if (unitType === 2) {
                typeKey = 'velType';
            } else if (unitType === 3) {
                typeKey = 'disType';
            }

            if (typeKey && factorMap[configStore[typeKey]]) {
                y *= factorMap[configStore[typeKey]];
            }

            return {
                y,
                x,
            };

        });

        if (eventActive == 'NEXT_X_W') {
            setDataXWToDraw(data);
            setPopoverCollectInfoXW(await showWaveFormData('NEXT_X_W', pointSelected));
        } else if (eventActive == 'NEXT_X_S') {
            setDataXSToDraw(data);
            setPopoverCollectInfoXS(await showWaveFormData('NEXT_X_S', pointSelected));
        } else if (eventActive == 'NEXT_Y_W') {
            setDataYWToDraw(data);
            setPopoverCollectInfoYW(await showWaveFormData('NEXT_Y_W', pointSelected));
        } else if (eventActive == 'NEXT_Y_S') {
            setDataYSToDraw(data);
            setPopoverCollectInfoYS(await showWaveFormData('NEXT_Y_S', pointSelected));
        } else if (eventActive == 'NEXT_Z_W') {
            setDataZWToDraw(data);
            setPopoverCollectInfoZW(await showWaveFormData('NEXT_Z_W', pointSelected));
        } else if (eventActive == 'NEXT_Z_S') {
            setDataZSToDraw(data);
            setPopoverCollectInfoZS(await showWaveFormData('NEXT_Z_S', pointSelected));
        }

    };

    const collectDataFromDevice = async () => {
        if (!connectedDevice) {
            console.log('No se encontró el dispositivo BLE');
            return;
        }

        await connectedDevice.discoverAllServicesAndCharacteristics();

        listenerEvent = connectedDevice.monitorCharacteristicForService(
            UUID_BLE_SERVICE,
            UUID_DATA_CHARACTERISTIC,
            (error, characteristic) => {
                if (error) {
                    console.error('Error al suscribirse a notificaciones:', error.message);
                    return;
                }

                if (characteristic && characteristic.value) {
                    processData(characteristic.value);
                }
            }
        );
        const variables = await getSurveyVariables();
        await writeOnSensorCharacteristic(`SET_SAMPLES=${variables.samples}`);
        await writeOnSensorCharacteristic(`SET_NLINES=${variables.lines}`);
        await writeOnSensorCharacteristic(`SET_NREVS=${variables.rev}`);
        await writeOnSensorCharacteristic(`SET_FMAX=${variables.fMax}`);
        await writeOnSensorCharacteristic(`SET_RPM=${variables.rpm}`);
        await writeOnSensorCharacteristic('NEXT_X');

    };
    const writeOnSensorCharacteristic = async (value: string) => {
        await connectedDevice!.writeCharacteristicWithResponseForService(
            UUID_BLE_SERVICE,
            UUID_SENSOR_CHARACTERISTIC,
            Buffer.from(value, 'utf-8').toString('base64')
        );
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.row}>

                    <TouchableOpacity
                        style={isSensorConnected ? styles.bluetoothConnectedButton : styles.bluetoothOffButton}
                        onPress={() => showModalScanning()}
                    >

                        <Icon
                            name="bluetooth-b"
                            size={16}
                            style={styles.filterButtonIcon}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setModalConfigValuesVisible(true)}
                    >

                        <Icon
                            name="cogs"
                            size={16}
                            style={styles.filterButtonIcon}
                        />
                    </TouchableOpacity>
                </View>

            ),
        });
    }, [navigation, isSensorConnected]);
    const hideModalAlert = () => {
        setModalAlertVisible(false);
    };


    const clearGraphs = () => {
        setDataXWToDraw(null);
        setDataXSToDraw(null);
        setDataYWToDraw(null);
        setDataYSToDraw(null);
        setDataZWToDraw(null);
        setDataZSToDraw(null);
        pointTemp = null;
        // setDateMeasuredSelected(null);
        pointWithCollectData = { date: null, NEXT_X_W: [], NEXT_X_S: [], NEXT_Y_W: [], NEXT_Y_S: [], NEXT_Z_W: [], NEXT_Z_S: []};
    };
    const convertWaveformDraws = async (data: string) => {

        if(!pointTemp){
            pointTemp = {};
        }

        convertIndex[data] = convertIndex[data] + 1;

        if (convertIndex[data] > 3) {
            convertIndex[data] = 1;
            pointTemp[data] = pointWithCollectData[data];
        }

        if(convertIndex[data] == 2) {
            pointTemp[data] = waveformVelocity(pointWithCollectData[data]);
        } else if (convertIndex[data] == 3) {
            pointTemp[data] = waveformDisplacement(pointWithCollectData[data]);
        }
        await getDataToDraw(data);
    };

    const showModalSync = async () => {

        setModalSyncLoadingVisible(true);
        const plantId = await getPlantSelectedStore();

        const surveys = await mapByAssetsGroup(plantId);


        console.log(surveys);
        setSurveysToSync(surveys);
        setModalSyncLoadingVisible(false);

        if (surveys.length > 0) {
            setModalSyncVisible(true);
        } else {
            showModalAlert('No data to sync');
        }
    };

    const showWaveFormData = async (chartName: string, point: any): Promise<POPOVER_COLLECT_INFO> => {

        const pattern = 'yyyy-MM-dd hh:mm:ss a';
        let pointInUse = await findPointForCollectData(point);

        pointInUse = pointInUse.point;

        let pointCode = pointInUse.code.substr(0, 2);
        let pointsCode = [pointCode + 'H', pointCode + 'X'];

        if (chartName.includes('_Y')) {
            pointsCode = [pointCode + 'V', pointCode + 'Y'];
        } else if (chartName.includes('_Z')) {
            pointsCode = [pointCode + 'A', pointCode + 'Z'];
        }


        let lastBandsInfo = await getLastBandsInfoFromStore(chartName, assetSelected!, pointCode, parse(dateMeasuredSelected!, pattern, new Date()));

        const pointForBands = await findPointForCollectDataByCode(
            assetSelected!,
            pointsCode,
        );

        if (!lastBandsInfo && pointForBands && pointForBands.point) {
            lastBandsInfo = pointForBands.point.lastBandInfo;
        }

        let charts_y = pointWithCollectData[chartName];

        const _crestFactor = crestFactor(charts_y);
        const _pkTopk = peakToPeak(charts_y);
        const pkTopk = `+${_pkTopk.max}/-${_pkTopk.min} (${_pkTopk.pkTopk})`;

        console.log('_crestFactor, _pkTopk, pkTopk', _crestFactor, _pkTopk, pkTopk);
        console.log('last: ',lastBandsInfo);
        return {crestFactor: _crestFactor, peakToPeak: pkTopk, lastCrest: lastBandsInfo?.crestFactor, lastPkPk: lastBandsInfo?.peakToPeak || lastBandsInfo?.pkTopk};

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


    const drawdata = async () => {

        await getDataToDraw('NEXT_X_W');
        await getDataToDraw('NEXT_X_S');
        await getDataToDraw('NEXT_Y_W');
        await getDataToDraw('NEXT_Y_S');
        await getDataToDraw('NEXT_Z_W');
        await getDataToDraw('NEXT_Z_S');

    };
    useEffect(() => {

        pointTemp = null;
        getSurveyFromDB(assetSelected!, pointSelected!)
            .then(async (survey) => {
                if (survey) {
                    const collects = await survey.collects.fetch(); // Obtener los collects asociados

                    const collect = collects.find((collect: any) => collect.date === dateMeasuredSelected);
                    if (collect) {
                        pointWithCollectData = {
                            date: collect.date,
                            time: collect.time,
                            uuid: collect.uuid,
                            synced: collect.synced,
                            NEXT_X_W: JSON.parse(collect.nextXW),
                            NEXT_X_S: JSON.parse(collect.nextXS),
                            NEXT_Y_W: JSON.parse(collect.nextYW),
                            NEXT_Y_S: JSON.parse(collect.nextYS),
                            NEXT_Z_W: JSON.parse(collect.nextZW),
                            NEXT_Z_S: JSON.parse(collect.nextZS),
                            vars: JSON.parse(collect.vars),
                        };

                        drawdata()
                            .then(() => {
                                console.log('Datos dibujados');
                            })
                            .catch((error) => {
                                console.error('Error al dibujar los datos', error);
                            });
                    }
                }
            })
            .catch((error) => {
                console.error('Error al obtener los datos recolectados', error);
            });



    }, [dateMeasuredSelected]);
    const connectDevice = async (device: Device) => {
        console.log(connectedDevice);

        if (connectedDevice?.id == device.id) {
            await connectedDevice.cancelConnection();
            connectedDevice = null;
            BLUETOOTH_PROPS.device = null;
            return;
        }

        hideModalScanning();

        // Paso 1: Conectar
        connectedDevice = await device.connect();
        BLUETOOTH_PROPS.device = connectedDevice;

        // ✅ Paso 2: Solicitar MTU (aquí)
        try {
            const mtu = await connectedDevice.requestMTU(247);
            console.log("✅ MTU solicitado:", mtu);
        } catch (error) {
            console.warn("⚠️ No se pudo solicitar el MTU:", error);
        }

        // Paso 3: Descubrir servicios
        await connectedDevice.discoverAllServicesAndCharacteristics();

        setIsSensorConnected(true);

        connectedDevice.onDisconnected((error) => {
            console.error('El dispositivo se ha desconectado:', error);
            setIsSensorConnected(false);
            connectedDevice = null;
        });
    };
    const connectDeviceFromGlobal = async () => {
        if(!BLUETOOTH_PROPS.device) {
            console.log('No se encontró el dispositivo BLE');
            return;
        }

        connectedDevice = BLUETOOTH_PROPS.device;
        const isConnected = await connectedDevice.isConnected();
        console.log('isConnected', await connectedDevice.isConnected());

        if(!isConnected) {
            connectedDevice = await connectedDevice.connect();
            BLUETOOTH_PROPS.device = connectedDevice;
            console.log('Device connected from global');
        }
        setIsSensorConnected(true);

    };
    const renderSelectorDates = useCallback(() => (
        <View style={styles.pickerViewContainer}><Picker
            selectedValue={ dateMeasuredSelected}
            onValueChange={(value) => setDateMeasuredSelected(value)}
            style={styles.picker}
        >
            {datesMeasured.map((date: any) => (
                <Picker.Item
                    key={date}
                    label={date}
                    value={date}
                    style={styles.pickerItem}
                />
            ))}
        </Picker></View>), [datesMeasured, dateMeasuredSelected]);

    const renderGraphs = useCallback(() => (
        noDataMeasured ? (<View>
                <Text>No hay datos para dibujar</Text>
            </View>) : (<View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoText}>Last Collected:</Text>
                    <Text style={styles.infoText}>{lastCollectedDate}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoText}>Last Overall:</Text>
                    <Text style={styles.infoText}>0.23 ips</Text>
                </View>
                <View style={styles.header}>
                    <Text style={[styles.title, theme.text]}>{pointCode} - {pointDescription}</Text>
                </View>

                <View style={styles.pointInfo}>
                    <PointIcon name="pin" size={24} color="#555"/>
                    {renderSelectorDates()}
                    <Icon name="camera" size={24} color="black"/>
                    <TouchableOpacity  onPress={() => showModalAlertDelete(true)}>
                        <Icon name="trash" size={30} color="red"/>
                    </TouchableOpacity>

                </View>


                {showPicker && (
                    <View />
                )}

                <View style={styles.container}>
                    {dataXWToDraw &&
                        <View>

                            <View style={styles.headerGraphContainer}>
                                <Text style={styles.titleGraph} onPress={() => openModalWithData(pointWithCollectData.NEXT_X_W!)}>
                                    {DRAW_TITLES.NEXT_X_W}
                                </Text>
                                <View style={styles.headerActionButton}>
                                    <TouchableOpacity
                                        style={styles.convertButton}
                                        onPress={() => convertWaveformDraws('NEXT_X_W')}
                                    >
                                        <ConvertIcon />
                                    </TouchableOpacity>
                                    <PopoverButton
                                        crestFactor={popoverCollectInfoXW.crestFactor}
                                        lastCrest={popoverCollectInfoXW.lastCrest}
                                        peakToPeak={popoverCollectInfoXW.peakToPeak}
                                        lastPkPk={popoverCollectInfoXW.lastPkPk}
                                        isOpen={openPopoverId === 'XW'}
                                        onToggle={handleTogglePopover}
                                        id="XW"
                                    />

                                    {/*<TouchableOpacity*/}
                                    {/*    style={styles.convertButton}*/}
                                    {/*    onPress={() => showWaveFormData("NEXT_X_W", pointSelected)}*/}
                                    {/*>*/}
                                    {/*    <BandIcon></BandIcon>*/}
                                    {/*</TouchableOpacity>*/}
                                      </View>

                            </View>
                            <LineChart
                                data={dataXWToDraw}
                                chartHeight={250}
                                chartWidth={screenWidth - 35}
                                chartMargin={20}
                            />
                        </View>}

                    {dataXSToDraw &&
                        <View>
                            <View style={styles.headerGraphContainer}>
                                <Text style={styles.titleGraph} onPress={() => openModalWithData(pointWithCollectData.NEXT_X_S!)}>
                                    {DRAW_TITLES.NEXT_X_S}
                                </Text>
                                <View style={styles.headerActionButton}>
                                    <TouchableOpacity
                                        style={styles.convertButton}
                                        onPress={() => convertWaveformDraws('NEXT_X_S')}
                                    >
                                        <ConvertIcon />
                                    </TouchableOpacity>
                                    <PopoverButton
                                        crestFactor={popoverCollectInfoXS.crestFactor}
                                        lastCrest={popoverCollectInfoXS.lastCrest}
                                        peakToPeak={popoverCollectInfoXS.peakToPeak}
                                        lastPkPk={popoverCollectInfoXS.lastPkPk}
                                        isOpen={openPopoverId === 'XS'}
                                        onToggle={handleTogglePopover}
                                        id="XS"
                                    />

                                </View>

                            </View>
                            <LineChart
                                data={dataXSToDraw}
                                chartHeight={250}
                                chartWidth={screenWidth - 35}
                                chartMargin={20}
                            />
                        </View>}

                    {dataYWToDraw &&
                        <View>
                            <View style={styles.headerGraphContainer}>
                                <Text style={styles.titleGraph}  onPress={() => openModalWithData(pointWithCollectData.NEXT_Y_W!)}>
                                    {DRAW_TITLES.NEXT_Y_W}
                                </Text>
                                <View style={styles.headerActionButton}>
                                    <TouchableOpacity
                                        style={styles.convertButton}
                                        onPress={() => convertWaveformDraws('NEXT_Y_W')}
                                    >
                                        <ConvertIcon />
                                    </TouchableOpacity>
                                    <PopoverButton
                                        crestFactor={popoverCollectInfoYW.crestFactor}
                                        lastCrest={popoverCollectInfoYW.lastCrest}
                                        peakToPeak={popoverCollectInfoYW.peakToPeak}
                                        lastPkPk={popoverCollectInfoYW.lastPkPk}
                                        isOpen={openPopoverId === 'YW'}
                                        onToggle={handleTogglePopover}
                                        id="YW"
                                    />

                                </View>

                            </View>
                            <LineChart
                                data={dataYWToDraw}
                                chartHeight={250}
                                chartWidth={screenWidth - 35}
                                chartMargin={20}
                            />
                        </View>}

                    {dataYSToDraw &&
                        <View>
                            <View style={styles.headerGraphContainer}>
                                <Text style={styles.titleGraph}  onPress={() => openModalWithData(pointWithCollectData.NEXT_Y_S!)}>
                                    {DRAW_TITLES.NEXT_Y_S}
                                </Text>
                                <View style={styles.headerActionButton}>
                                    <TouchableOpacity
                                        style={styles.convertButton}
                                        onPress={() => convertWaveformDraws('NEXT_Y_S')}
                                    >
                                        <ConvertIcon />
                                    </TouchableOpacity>
                                    <PopoverButton
                                        crestFactor={popoverCollectInfoYS.crestFactor}
                                        lastCrest={popoverCollectInfoYS.lastCrest}
                                        peakToPeak={popoverCollectInfoYS.peakToPeak}
                                        lastPkPk={popoverCollectInfoYS.lastPkPk}
                                        isOpen={openPopoverId === 'YS'}
                                        onToggle={handleTogglePopover}
                                        id="YS"
                                    />

                                </View>

                            </View>
                            <LineChart
                                data={dataYSToDraw}
                                chartHeight={250}
                                chartWidth={screenWidth - 35}
                                chartMargin={20}
                            />
                        </View>}

                    {dataZWToDraw &&
                        <View>
                            <View style={styles.headerGraphContainer}>
                                <Text style={styles.titleGraph}  onPress={() => openModalWithData(pointWithCollectData.NEXT_Z_W!)}>
                                    {DRAW_TITLES.NEXT_Z_W}
                                </Text>
                                <View style={styles.headerActionButton}>
                                    <TouchableOpacity
                                        style={styles.convertButton}
                                        onPress={() => convertWaveformDraws('NEXT_Z_W')}
                                    >
                                        <ConvertIcon />
                                    </TouchableOpacity>
                                    <PopoverButton
                                        crestFactor={popoverCollectInfoZW.crestFactor}
                                        lastCrest={popoverCollectInfoZW.lastCrest}
                                        peakToPeak={popoverCollectInfoZW.peakToPeak}
                                        lastPkPk={popoverCollectInfoZW.lastPkPk}
                                        isOpen={openPopoverId === 'ZW'}
                                        onToggle={handleTogglePopover}
                                        id="ZW"
                                    />

                                </View>

                            </View>
                            <LineChart
                                data={dataZWToDraw}
                                chartHeight={250}
                                chartWidth={screenWidth - 35}
                                chartMargin={20}
                            />
                        </View>}

                    {dataZSToDraw &&
                        <View>
                            <View style={styles.headerGraphContainer}>
                                <Text style={styles.titleGraph}  onPress={() => openModalWithData(pointWithCollectData.NEXT_Z_S!)}>
                                    {DRAW_TITLES.NEXT_Z_S}
                                </Text>
                                <View style={styles.headerActionButton}>
                                    <TouchableOpacity
                                        style={styles.convertButton}
                                        onPress={() => convertWaveformDraws('NEXT_Z_S')}
                                    >
                                        <ConvertIcon />
                                    </TouchableOpacity>
                                    <PopoverButton
                                        crestFactor={popoverCollectInfoZS.crestFactor}
                                        lastCrest={popoverCollectInfoZS.lastCrest}
                                        peakToPeak={popoverCollectInfoZS.peakToPeak}
                                        lastPkPk={popoverCollectInfoZS.lastPkPk}
                                        isOpen={openPopoverId === 'ZS'}
                                        onToggle={handleTogglePopover}
                                        id="ZS"
                                        />

                                </View>

                            </View>
                            <LineChart
                                data={dataZSToDraw}
                                chartHeight={250}
                                chartWidth={screenWidth - 35}
                                chartMargin={20}
                            />
                        </View>}
                </View>
            </View>)
    ), [noDataMeasured, dataXWToDraw, dataXSToDraw, dataYWToDraw, dataYSToDraw, dataZWToDraw, dataZSToDraw, pointSelected, pointCode, pointDescription, screenWidth, showPicker, convertWaveformDraws, showWaveFormData]);

    const renderDevice = ({ item }) => (
        <TouchableOpacity
            style={[styles.deviceItem, item.id == connectedDevice?.id ? styles.deviceItemSelected : null]}
            onPress={() => connectDevice(item)}
        >
            <Text style={styles.deviceName}>{item.name || 'Dispositivo sin nombre'}</Text>
            <Text style={styles.deviceId}>{item.id}</Text>
        </TouchableOpacity>
    );

    return (
            <ScrollView>
                <View style={[styles.container, theme.background]}>
                <Modal animationType="fade" transparent={true} visible={modalAlertDeleteVisible}>
                    <View style={styles.modalAlertContainer}>
                        <View style={styles.modalAlertView}>
                            <Text style={styles.modalAlertText}>are you sure you want to delete collected data?</Text>
                            <TouchableOpacity style={styles.modalAlertButton} onPress={() => setModalAlertDeleteVisible(false)}>
                                <Text style={styles.modalAlertButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalAlertButton} onPress={async () => await confirmDelete(assetSelected!, pointSelected!, dateMeasuredSelected!)}>
                                <Text style={styles.modalAlertButtonText}>Delete</Text>
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
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={modalAlertMessageVisible}
                    >
                        <View style={styles.loadingModalContainer}>
                            <View style={styles.loadingModalView}>
                                <Text style={styles.loadingModalText}>{modalAlertMessage}</Text>
                            </View>
                        </View>
                    </Modal>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isReceivingData}
                >
                    <View style={styles.loadingModalContainer}>
                        <View style={styles.loadingModalView}>
                            <ActivityIndicator size="large" color="#007bff"/>
                            <Text style={styles.loadingModalText}>{textLoading}</Text>
                        </View>
                    </View>
                </Modal>
                    <LoadingModal visible={loadingModalVisible}></LoadingModal>
                    <LoadingModalProgress
                        visible={loadingSyncVisible}
                        progressText={`Syncing ${syncProgress.completed} of ${syncProgress.total} surveys...`}
                    />
                    <Modal visible={modalVisible} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Values</Text>

                                <FlatList
                                    data={dataToShow}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <Text style={styles.valueItem}>{item}</Text>
                                    )}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                />

                                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                <SyncModal
                    visible={modalSyncVisible}
                    onClose={() => setModalSyncVisible(false)}
                    surveys={surveysToSync}
                    onSync={handleSync}
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
                    <ConfigValuesModal
                        visible={modalConfigValuesVisible}
                        onClose={() => setModalConfigValuesVisible(false)}
                        onSelectAsset={() => console.log('Values saved')}
                    />
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalBluetoothVisible}
                    onRequestClose={hideModalScanning}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.contentContainer}>
                            <View style={styles.header}>
                                <Text style={styles.headerText}>Select a Device</Text>
                            </View>

                            <FlatList
                                data={devices}
                                keyExtractor={(item) => item.id}
                                renderItem={renderDevice}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No se encontraron dispositivos</Text>
                                }
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={() => hideModalScanning()}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                <View style={styles.header}>
                    <Text style={[styles.title, theme.text]}>
                        {assetCode} - {assetDescription}
                    </Text>
                </View>

                <TouchableOpacity style={styles.collectButton} onPress={() => collectData()}>
                    <Text style={styles.collectButtonText}>Collect Data</Text>
                </TouchableOpacity>

                    {renderGraphs()}
            </View>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
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
        marginBottom: 10,
    },
    modalAlertButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },

    openButton: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000099',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '85%',
        maxHeight: screenHeight * 0.8,
        borderRadius: 12,
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    valueItem: {
        fontSize: 16,
        paddingVertical: 4,
        color: '#333',
    },

    container: { flex: 1, padding: 16, paddingTop: 30 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
    },
    deviceItemSelected: {
        backgroundColor: '#91a5bd',
    },
    headerActionButton: {
        flexDirection: 'row',
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
    deviceItem: {
        padding: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginVertical: 5,
        backgroundColor: '#f9f9f9',
    },
    convertButton: {
        borderWidth: 2,
        borderColor: 'green',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginLeft: 10,
    },
    titleGraph: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    headerGraphContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    deviceId: {
        fontSize: 12,
        color: '#666',
    },
    bluetoothOffButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'gray',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginRight: 10,

    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
    closeButton: {
        alignSelf: 'center',
        padding: 12,
        marginTop: 10,
        backgroundColor: '#ff5722', // Un color llamativo
        borderRadius: 25,
        width: '50%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fondo oscuro más opaco
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        width: '85%',
        height: '85%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },

    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    bluetoothConnectedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'green',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginRight: 10,

    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginRight: 10,
    },
    filterButtonIcon: {
        color: '#fff',
    },
    title: { fontSize: 18, fontWeight: 'bold' },
    collectButton: {
        backgroundColor: 'green',
        paddingVertical: 10,
        borderRadius: 8,
        marginVertical: 10,
        alignItems: 'center',
    },
    picker: {
        height: 50,
        width: '100%', // Usar el 100% del contenedor asignado

    },
    pickerItem: {
        width: '100%',
    },
    pickerViewContainer: {
        borderWidth: 2,
        borderColor: '#007bff',
        borderRadius: 10,
        marginTop: 10,
        flex: 1,
    },
    collectButtonText: { color: '#fff', fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
    infoText: { fontSize: 14, fontWeight: '500' },
    pointInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 12,
    },
    pointBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#003366',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 8,
    },
    pointId: { fontWeight: 'bold', fontSize: 16 },
    pointDesc: { fontSize: 14, color: '#333' },
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingVertical: 6,
    },
    graphRow: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
    },
    graphImage: {
        width: '80%',
        height: 120,
    },
    graphActions: {
        gap: 8,
        marginLeft: 10,
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
