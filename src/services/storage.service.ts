import AsyncStorage from '@react-native-async-storage/async-storage';
import {Plant} from '../types/plant';
import {PLANTS_KEY} from '../config/constants';
import {System} from '../types/system';
import {Area} from '../types/area';
import {Asset} from '../types/asset';
import {database} from "../database";

export const getPlantsBasic = async (): Promise<Plant[]> => {

    await database.write(async () => {
        await database.unsafeResetDatabase();
    });
    const plantsString = await AsyncStorage.getItem(PLANTS_KEY);
    const plants = JSON.parse(plantsString || '[]');

    return plants.map((plant: Plant) => ({
        id: plant.id,
        description: plant.description,
        code: plant.code,
    }));
};

export const getAssetsByPlantId = async (plantId: number): Promise<Asset[]> => {
    const plantsString = await AsyncStorage.getItem(PLANTS_KEY);
    const plants = JSON.parse(plantsString || '[]');

    return plants.filter((plant: Plant) => plant.id === plantId).map((plant: Plant) => plant.areas)
        .flat().map((area: Area) => area.systems).flat().map((system: System) => system.mawois).flat()
        .map((mawoi: Asset) => ({
            id: mawoi.id,
            code: mawoi.code,
            description: mawoi.description,
        }));
};
export const getPointsByAssetId = async (assetIdId: number): Promise<Asset> => {
    const plantsString = await AsyncStorage.getItem(PLANTS_KEY);
    const plants = JSON.parse(plantsString || '[]');

    return plants.map((plant: Plant) => plant.areas)
        .flat().map((area: Area) => area.systems).flat().map((system: System) => system.mawois).flat()
        .filter((mawoi: Asset) => mawoi.id === assetIdId)
        .map((mawoi: Asset) => ({
            id: mawoi.id,
            code: mawoi.code,
            description: mawoi.description,
            points: mawoi.points,
        }))[0];
};
