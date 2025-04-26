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
import {Asset} from '../../types/asset';
import {Point} from '../../types/point';
import {Survey} from "../../types/survey.ts";
import {Point as PointModel} from "../../models/Point.model";
import {Asset as AssetModel} from "../../models/Asset.model";
import {database} from "../../database";
import {Q} from "@nozbe/watermelondb";
import {getPointsByAssetId} from "../../services/storage.service.ts";
import {PointSelect} from "../../types/pointSelect.ts";


export const getSurveyVariables = async (): Promise<SurveyVariables> => {
    const variablesString = await AsyncStorage.getItem(SURVEY_VARIABLES_KEY);
    if (variablesString) {
        return JSON.parse(variablesString);
    }

    return SURVEY_VARIABLES_DEFAULT;

};

export const updatePointMeasurementStatus = async (pointId: number, isMeasured: boolean): Promise<void> => {
    try {
        const point = await database.get<PointModel>('points').find(pointId.toString());

        await database.write(async () => {
            await point.update((p) => {
                p.isMeasured = isMeasured;
            });
            // 2. Obtiene el asset del punto
            const asset = await point.asset.fetch() as AssetModel;

            const assetX: Asset = await getPointsByAssetId(asset.id);
            const points: PointSelect[] = Array.from(
                assetX.points.reduce((acc, pointX) => {
                    const codePoint = pointX.code.slice(0, 2); // Directamente usar slice para strings
                    if (!acc.has(codePoint)) {
                        acc.set(codePoint, { id: pointX.id, code: codePoint, description: pointX.description, isMeasured: pointX.isMeasured });
                    }
                    return acc;
                }, new Map()).values()
            );


            // 4. Verifica si todos tienen isMeasured = true
            const allMeasured = points.every((p) => p.isMeasured === true);
            const noneMeasured = points.every((p) => p.isMeasured === false);

            let newIsMeasuredState: 'all' | 'none' | 'partial';

            if (allMeasured) {
                newIsMeasuredState = 'all';
            } else if (noneMeasured) {
                newIsMeasuredState = 'none';
            } else {
                newIsMeasuredState = 'partial';
            }

            if (newIsMeasuredState == 'all' || newIsMeasuredState == 'partial') {
                // 5. Actualiza el asset solo si todos los puntos están medidos
                await asset.update((a) => {
                    a.isMeasured = newIsMeasuredState;
                });
                console.log(`✅ Asset ${asset.id} marcado como isMeasured = ${newIsMeasuredState}`);
            }
        });

        console.log(`✅ Punto ${pointId} actualizado con isMeasured = ${isMeasured}`);
    } catch (error) {
        console.error(`❌ Error actualizando el punto ${pointId}:`, error);
        throw error;
    }
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


export const getAsset = async (assetId: number): Promise<Asset | undefined> => {
    try {
        const assetRecord = await database.get<AssetModel>('assets').find(assetId.toString());
        return {
            id: parseInt(assetRecord.id),
            code: assetRecord.code,
            description: assetRecord.description,
            isMonoaxial: assetRecord.isMonoaxial,
            status: assetRecord.status,
            points: [], // opcional: puedes incluirlos si los necesitas
        };
    } catch (error) {
        console.error(`❌ Asset con ID ${assetId} no encontrado:`, error);
        return undefined;
    }
};

export const getPoint = async (pointId: number): Promise<Point | undefined> => {
    try {
        const pointRecord = await database.get<PointModel>('points').find(pointId.toString());

        return {
            id: parseInt(pointRecord.id),
            code: pointRecord.code,
            description: pointRecord.description,
        };
    } catch (error) {
        console.error(`❌ Point con ID ${pointId} no encontrado:`, error);
        return undefined;
    }
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

/**
 * Encuentra un mawoi (asset) por su ID, incluyendo sus points asociados.
 * @param mawoiId ID del asset
 */
export const findPointForCollectDataByMawoiId = async (mawoiId: number): Promise<any> => {
    try {
        const mawoi = await database.get<AssetModel>('assets').find(mawoiId.toString());

        const points = await mawoi.points.fetch();

        return {
            mawoi: {
                id: parseInt(mawoi.id),
                code: mawoi.code,
                description: mawoi.description,
                isMonoaxial: mawoi.isMonoaxial,
                status: mawoi.status,
                isMeasured: mawoi.isMeasured,
                points: points.map((p: PointModel) => ({
                    id: parseInt(p.id),
                    code: p.code,
                    description: p.description,
                    isMeasured: p.isMeasured,
                })),
            },
        };
    } catch (error) {
        console.error(`❌ Error encontrando mawoi ${mawoiId}:`, error);
        return null;
    }
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

export const findPointForCollectData = async (id: number): Promise<any> => {
    try {
        console.log('pointId', id);

        const pointRecord = await database.get<PointModel>('points').find(id.toString());
        const mawoi = await pointRecord.asset.fetch() as AssetModel;

        return {
            mawoi: {
                id: parseInt(mawoi.id),
                code: mawoi.code,
                description: mawoi.description,
                isMonoaxial: mawoi.isMonoaxial,
                status: mawoi.status,
            },
            point: {
                id: parseInt(pointRecord.id),
                code: pointRecord.code,
                description: pointRecord.description,
                isMeasured: pointRecord.isMeasured,
            },
        };
    } catch (error) {
        console.error(`❌ Error encontrando el point ${id}:`, error);
        return null;
    }
};

export const diffInMinutes = (date1: any, date2: any) => {
    const diffTime = Math.abs(new Date(date2) - new Date(date1));
    return Math.ceil(diffTime / (1000 * 60)); // Diferencia en minutos
};
