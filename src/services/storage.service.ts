import AsyncStorage from '@react-native-async-storage/async-storage';
import {Plant} from '../types/plant';
import {Plant as PlantModel} from '../models/Plant.model';
import {Asset as AssetModel} from '../models/Asset.model';
import {Area as AreaModel} from '../models/Area.model';
import {System as SystemModel} from '../models/System.model';
import {PLANTS_KEY} from '../config/constants';
import {Asset} from '../types/asset';
import {upsertRecord} from '../database/upsert.ts';
import {database} from "../database";
import {Area} from "../types/area.ts";
import {System} from "../types/system.ts";


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

export const getPlantsBasic = async (): Promise<any[]> => {
    // await database.adapter.unsafeResetDatabase();
    const plants = await database.get<PlantModel>('plants').query().fetch();

    const result = [];

    for (const plant of plants) {
        let assetCount = 0;

        const areas = await plant.areas.fetch();
        for (const area of areas) {
            const systems = await area.systems.fetch();
            for (const system of systems) {
                const assets = await system.mawois.fetch();
                assetCount += assets.length;
            }
        }

        result.push({
            id: parseInt(plant.id),
            code: plant.code,
            description: plant.description,
            assetCount,
        });
    }

    return result;
};

export const getAreasByPlantId = async (plantId: number): Promise<Area[]> => {

    const plant = await database.get<PlantModel>('plants').find(plantId.toString());

    const areas = await plant.areas.fetch();

    return areas.map((a) => ({
        id: parseInt(a.id), // recuerda que el ID en Watermelon es string
        code: a.code,
        description: a.description,
        systems: [], // opcional, puedes cargarlos si los necesitas
    }));

};
export const getSystemByAreaId = async (areaId: number): Promise<System[]> => {

    const area = await database.get<AreaModel>('areas').find(areaId.toString());

    const systems = await area.systems.fetch();

    return systems.map((a) => ({
        id: parseInt(a.id), // recuerda que el ID en Watermelon es string
        code: a.code,
        description: a.description,
        systems: [], // opcional, puedes cargarlos si los necesitas
    }));

};

export const getHierarchyInfo = async (systemId: number): Promise<any> => {
    const system = await database.get<SystemModel>('systems').find(systemId.toString());
    const area = await system.area.fetch();

    return {
        system: system.description,
        area: area.description,
    }
}

export const getAssetsBySystemId = async (systemId: number): Promise<any> => {

    const system = await database.get<SystemModel>('systems').find(systemId.toString());

    const assets = await system.mawois.fetch();
    const area = await system.area.fetch();
    const plant = await area.plant.fetch();

    const info = {
        system: system.description,
        area: area.description,
        plant: plant.description,
    }
    const result = assets.map((a) => ({
        id: parseInt(a.id), // recuerda que el ID en Watermelon es string
        code: a.code,
        description: a.description,
        isMonoaxial: a.isMonoaxial,
        isMeasured: a.isMeasured,
        status: a.status,
        points: [], // opcional, puedes cargarlos si los necesitas
    }));

    return { info, assets: result};
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

    console.log(assets);
    return assets.map((a) => ({
        id: parseInt(a.id), // recuerda que el ID en Watermelon es string
        code: a.code,
        description: a.description,
        isMonoaxial: a.isMonoaxial,
        isMeasured: a.isMeasured,
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
                isMeasured: point.isMeasured,
            })),
        };
    } catch (error) {
        console.error('Error fetching asset with points:', error);
        return null;
    }
};
