import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

import {
    BANDS_INFO_STORE_KEY,
    PARAMS_SPEC, PLANT_SELECTED_KEY, PLANTS_KEY,
    SURVEY_VARIABLES_DEFAULT,
    SURVEY_VARIABLES_KEY,
    SYSTEM_CONFIG_DEFAULT,
    SYSTEM_CONFIG_KEY,
} from '../../config/constants';
import {SurveyVariables} from '../../types/survey-variables';
import {SystemConfig} from '../../types/system-config';
import {
    calculateOverall,
    crestFactor,
    peakToPeak,
    processBandsInfo,
    roundedDecimal,
    spectraVelocity,
} from './mathServices.ts';
import {SurveyStore} from '../../types/survey-store';
import {CollectData} from '../../types/collect-data';
import {parse} from 'date-fns';
import {Area} from '../../types/area';
import {Plant} from '../../types/plant';
import {Asset} from '../../types/asset';
import {Point} from '../../types/point';
import {Survey} from "../../types/survey.ts";
import {database} from "../../database";
import {Q} from "@nozbe/watermelondb";


export const getSurveyVariables = async (): Promise<SurveyVariables> => {
    const variablesString = await AsyncStorage.getItem(SURVEY_VARIABLES_KEY);
    if (variablesString) {
        return JSON.parse(variablesString);
    }

    return SURVEY_VARIABLES_DEFAULT;

};

export const saveSurveyVariables = async (surveyVariables: SurveyVariables) => {
    await AsyncStorage.setItem(SURVEY_VARIABLES_KEY, JSON.stringify(surveyVariables));
};

export const getSystemConfig = async (): Promise<SystemConfig> => {
    const variablesString = await AsyncStorage.getItem(SYSTEM_CONFIG_KEY);
    if (variablesString) {
        return JSON.parse(variablesString);
    }

    return SYSTEM_CONFIG_DEFAULT;

};

export const getBandsInfoStore  = async (): Promise<any[]> => {
    return JSON.parse(
        await AsyncStorage.getItem(BANDS_INFO_STORE_KEY) || '[]',
    );
};

export const getBandsInfoFromStore = async (idx: any) => {
    const bandsInfoStore = await getBandsInfoStore();
    return bandsInfoStore[idx];
};

export const  saveBandsInfoStore = async (bandsInfoStore: any) =>{
    await AsyncStorage.setItem('bandsInfoStore', JSON.stringify(bandsInfoStore));
};

export const getPlantIdFromSystemId = async (systemId: number): Promise<number> => {
    const plantsString = await AsyncStorage.getItem(PLANTS_KEY) || '[]';
    const plants: Plant[] = JSON.parse(plantsString || '[]');

    console.log('----------------------');
    console.log(plantsString);
    return plants.find((plant: Plant) => plant.areas.find((area: Area) => area.systems.find((system: any) => system.id === systemId)))?.id || -1;
};

export const getAsset = async (assetId: number): Promise<Asset | undefined> => {
    const plantsString = await AsyncStorage.getItem(PLANTS_KEY) || '[]';
    const plants: Plant[] = JSON.parse(plantsString);

    for (const plant of plants) {
        for (const area of plant.areas) {
            for (const system of area.systems) {
                const found = system.mawois.find((asset) => asset.id === assetId);
                if (found) {
                    return found;
                }
            }
        }
    }

    return undefined; // si no se encuentra
};

export const getPoint = async (pointId: number): Promise<Point | undefined> => {
    const plantsString = await AsyncStorage.getItem(PLANTS_KEY) || '[]';
    const plants: Plant[] = JSON.parse(plantsString);

    for (const plant of plants) {
        for (const area of plant.areas) {
            for (const system of area.systems) {
                for (const asset of system.mawois) {
                    const found = asset.points.find((point) => point.id === pointId);
                    if (found) {
                        return found;
                    }
                }
            }
        }
    }

    // Si no se encuentra, devuelve undefined
    return undefined;
};

export const savePlantSelectedStore = async (plantSelectedId: number) => {
    await AsyncStorage.setItem(PLANT_SELECTED_KEY, plantSelectedId.toString());
};

export const getPlantSelectedStore = async (): Promise<number> => {
    const plantSelectedId = await AsyncStorage.getItem(PLANT_SELECTED_KEY);
    return plantSelectedId ? parseInt(plantSelectedId) : -1;
};

export const addBandsInfoToStore = async (bandsInfo: any) => {
    const bandsInfoStore = await getBandsInfoStore();
    bandsInfoStore.push(bandsInfo);
    await saveBandsInfoStore(bandsInfoStore);
};

export const updateBandsInfoStore = async (idx: any, bandsInfo: any) => {
    const bandsInfoStore = await getBandsInfoStore();
    bandsInfoStore[idx] = { ...bandsInfoStore[idx], ...bandsInfo };
    await saveBandsInfoStore(bandsInfoStore);
};

export const saveOrUpdateBandInformationStore = async (bandInfoTemp: any) => {
    const bandInfoIdx = await searchBandInfoInStore(
        bandInfoTemp.mawoiId,
        bandInfoTemp.pointCode,
        bandInfoTemp.date,
    );

    if (bandInfoIdx < 0) {
        await addBandsInfoToStore(bandInfoTemp);
    } else {
        await updateBandsInfoStore(bandInfoIdx, bandInfoTemp);
    }
};

export const generateUUID = () => {
    return uuid.v4();
};
export const calculateBandsInformationInCollectData = async (
    waveform_y: number[],
    spectrum_y: number[],
    pointInUse: any,
    FMAX: any,
    COORD: any,
) => {
    const bandsInfo = Object.values(pointInUse.bandsInfo);
    const pointCode = pointInUse.code.substr(0, 2);
    let bandInfoTemp: any = {
        pointCode: pointCode + COORD,
    };
    let coords = [pointCode + 'H', pointCode + 'X'];
    if (COORD == 'Y') {
        coords = [pointCode + 'V', pointCode + 'Y'];
    } else if (COORD == 'Z') {
        coords = [pointCode + 'A', pointCode + 'Z'];
    }
    bandInfoTemp.crestFactor = roundedDecimal(crestFactor(waveform_y), 3);
    bandInfoTemp.pkTopk = roundedDecimal(peakToPeak(waveform_y).pkTopk, 3);
    bandInfoTemp.overall = roundedDecimal(calculateOverall(spectrum_y), 3);

    const bandsInfoX = bandsInfo.filter((band) =>
        coords.includes(band.pointCode),
    );

    bandsInfoX.forEach((band) => {
        const data = spectrum_y;
        let velocities: any[] = spectraVelocity(data);
        velocities = velocities.map((v, idx) => ({
            vs_measure_y: v,
            vs_measure_x: (idx * FMAX) / spectrum_y.length,
        }));

        const bandInfo: any = processBandsInfo(pointInUse.rpm, velocities, band);
        bandInfoTemp[bandInfo.biv_code] = roundedDecimal(bandInfo.biv_value, 3);
    });

    return bandInfoTemp;
};

export const searchBandInfoInStore = async (mawoiId: number, pointCode: any, date: Date) => {
    const bandsInfoStore = await getBandsInfoStore();

    console.log('searchBandInfoInStore',mawoiId, pointCode, date);
    console.log(bandsInfoStore);
    return bandsInfoStore.findIndex(
        (bandInfo) =>
            bandInfo.mawoiId == mawoiId &&
            bandInfo.pointCode == pointCode &&
            bandInfo.date < date,
    );
};

export const getLastBandsInfoFromStore = async (chartName: any, mawoiId: number, pointCode: string, dateSelect: Date) => {

    const lastBandsIdx = await searchBandInfoInStore(
        mawoiId,
        pointCode +
        (chartName.includes('_X') ? 'X' : chartName.includes('_Y') ? 'Y' : 'Z'),
        dateSelect,
    );

    console.log('lastBandsIdx',lastBandsIdx);
    let lastBandsInfo = null;
    if (lastBandsIdx >= 0) {
        lastBandsInfo = await getBandsInfoFromStore(lastBandsIdx);
    }
    return lastBandsInfo;
};

export const findPointForCollectDataByCode = async (mawoiId: any, pointsCode: any) => {
    let plantsStore: any = await AsyncStorage.getItem('plants') || '[]';
    plantsStore = JSON.parse(plantsStore);
    for (let plant of plantsStore) {
        for (let area of plant.areas) {
            for (let system of area.systems) {
                for (let mawoi of system.mawois) {
                    if (mawoi.id == mawoiId) {
                        for (let point of mawoi.points) {
                            if (pointsCode.includes(point.code)) {
                                return {
                                    mawoi,
                                    point,
                                };
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
};

export const findPointForCollectDataByMawoiId = async (mawoiId: any): Promise<any> => {
    let plantsStore: any = await AsyncStorage.getItem('plants') || '[]';
    plantsStore = JSON.parse(plantsStore);
    for (let plant of plantsStore) {
        for (let area of plant.areas) {
            for (let system of area.systems) {
                for (let mawoi of system.mawois) {
                    if (mawoi.id == mawoiId) {
                        return {
                            mawoi,
                        };
                    }
                }
            }
        }
    }
    return null;
};


export const processSpectra = (arr: any, fixedMultiplier = PARAMS_SPEC.FIXED ) => {
    fixedMultiplier = fixedMultiplier ?? PARAMS_SPEC.FIXED;
    const result = arr.map((value: any) => value * fixedMultiplier);

    // Convertir el resultado a una cadena separada por comas
    return result;
};

export const getSurveysLocalStorage = async (assetId: number, pointId: number): Promise<SurveyStore | null> => {
    const surveysString = await AsyncStorage.getItem('surveys');
    const surveys: SurveyStore[] = JSON.parse(surveysString || '[]');

    return surveys.find((survey: SurveyStore) => survey.assetId === assetId && survey.pointId === pointId) || null;
};

export const getSurveyFromDB = async (assetId: number, pointId: number): Promise<Survey | null> => {
    const surveysCollection = database.get<Survey>('surveys');

    const result = await surveysCollection
        .query(
            Q.where('asset_id', assetId),
            Q.where('point_id', pointId)
        )
        .fetch();

    return result.length > 0 ? result[0] : null;
};
export const findPointInCollectData = async (assetId: number, pointId: number): Promise<any | null> => {
    const pattern = 'yyyy-MM-dd hh:mm:ss a';
    let mawoisWithDataBase = await getSurveysLocalStorage(assetId, pointId);
    console.log('assetId, pointId',assetId, pointId);
    console.log('mawoisWithDataBase',mawoisWithDataBase);
    let mawoisWithData = mawoisWithDataBase?.collects
        ?.map((collect: CollectData) => {
            return {
                mawoi: mawoisWithDataBase?.assetId,
                date: parse(collect.date!, pattern, new Date()),
                point: collect,
            };
        }).sort((a, b) => b.date - a.date);

    if(!mawoisWithData || mawoisWithData.length == 0) {return null;}

    return mawoisWithData[0];

};

export const findPointForCollectData = async (id: any): Promise<any> => {
    const plants = JSON.parse(await AsyncStorage.getItem('plants') || '[]');

    console.log('pointId',id);
    for (let plant of plants) {
        for (let area of plant.areas) {
            for (let system of area.systems) {
                for (let mawoi of system.mawois) {

                    for (let point of mawoi.points) {
                        // console.log(point);
                        if (point.id == id) {
                            return {
                                mawoi,
                                point,
                            };
                        }
                    }
                }
            }
        }
    }
    return null;
};

export const diffInMinutes = (date1: any, date2: any) => {
    const diffTime = Math.abs(new Date(date2) - new Date(date1));
    return Math.ceil(diffTime / (1000 * 60)); // Diferencia en minutos
};
