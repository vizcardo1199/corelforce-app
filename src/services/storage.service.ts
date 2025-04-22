import AsyncStorage from '@react-native-async-storage/async-storage';
import {Plant} from '../types/plant';
import {Plant as PlantModel} from '../models/Plant.model';
import {Asset as AssetModel} from '../models/Asset.model';
import {PLANTS_KEY} from '../config/constants';
import {Asset} from '../types/asset';
import {upsertRecord} from '../database/upsert.ts';
import {database} from "../database";


export const insertPlantWithAll = async (db,  plants: Plant[])=> {
    await db.write(async () => {

        for (const plant of plants) {
            const plantRecord = await upsertRecord(db.get('plants'), plant.id, (p: any) => {
                p.code = plant.code;
                p.description = plant.description;
            });

            for (const area of plant.areas) {
                const areaRecord = await upsertRecord(db.get('areas'), area.id, (a: any) => {
                    a.code = area.code;
                    a.description = area.description;
                    a.plant.set(plantRecord);
                });

                for (const system of area.systems) {
                    const systemRecord = await upsertRecord(db.get('systems'), system.id, (s: any) => {
                        s.code = system.code;
                        s.description = system.description;
                        s.area.set(areaRecord);
                    });

                    for (const asset of system.mawois) {
                        const assetRecord = await upsertRecord(db.get('assets'), asset.id, (a: any) => {
                            a.code = asset.code;
                            a.description = asset.description;
                            a.isMonoaxial = asset.isMonoaxial;
                            a.status = asset.status;
                            a.system.set(systemRecord);
                        });

                        for (const point of asset.points) {
                            await upsertRecord(db.get('points'), point.id, (p: any) => {
                                p.code = point.code;
                                p.description = point.description;
                                p.asset.set(assetRecord);
                            });
                        }
                    }
                }
            }
        }
    });
}
export const getPlantsBasicOld = async (): Promise<Plant[]> => {


    const plantsString = await AsyncStorage.getItem(PLANTS_KEY);
    const plants = JSON.parse(plantsString || '[]');

    return plants.map((plant: Plant) => ({
        id: plant.id,
        description: plant.description,
        code: plant.code,
    }));
};

export const getPlantsBasic = async (): Promise<Plant[]> => {
    const collection = database.get<PlantModel>('plants');

    const records = await collection.query().fetch();

    const plants: Plant[] = records.map(p => ({
        id: parseInt(p.id), // record.id es string, lo convertimos a number
        code: p.code,
        description: p.description,
        areas: [], // opcional, puedes cargar las áreas por separado si las necesitas
    }));

    return plants;
};

export const getAssetsByPlantId = async (plantId: number): Promise<Asset[]> => {
    const plant = await database.get<PlantModel>('plants').find(plantId.toString());

    const areas = await plant.areas.fetch();

    const systems = (
        await Promise.all(areas.map(async (area) => await area.systems.fetch()))
    ).flat();

    const assets = (
        await Promise.all(systems.map(async (system) => await system.mawois.fetch()))
    ).flat();

    return assets.map((a) => ({
        id: parseInt(a.id), // recuerda que el ID en Watermelon es string
        code: a.code,
        description: a.description,
        isMonoaxial: a.isMonoaxial,
        status: a.status,
        points: [], // opcional, puedes cargarlos si los necesitas
    }));
};
export const getPointsByAssetId = async (assetId: number): Promise<Asset | null> => {
    try {
        const assetRecord = await database.get<AssetModel>('assets').find(assetId.toString());
        const points = await assetRecord.points.fetch();

        return {
            id: parseInt(assetRecord.id),
            code: assetRecord.code,
            description: assetRecord.description,
            isMonoaxial: assetRecord.isMonoaxial,
            status: assetRecord.status,
            points: points.map((point) => ({
                id: parseInt(point.id),
                code: point.code,
                description: point.description,
            })),
        };
    } catch (error) {
        console.error('Error fetching asset with points:', error);
        return null;
    }
};
