import {CollectData} from "./collect-data";

export interface SurveyStore {
    assetId?: number;
    assetDescription: string;
    isMonoaxial: boolean;
    pointId?: number;
    pointCode: string;
    pointDescription: string;
    plantId?: number;
    plantDescription?: string;
    collects?: CollectData[];
}
