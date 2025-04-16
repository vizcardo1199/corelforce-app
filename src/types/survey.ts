import {CollectData} from "./collect-data";

export type Survey = {
    assetId: number;
    assetDescription: string;
    startDate: number;
    endDate: number;
    isMonoaxial: boolean;
    points: {
        pointId: number;
        code: string;
        pointDescription: string;
        uuid: string;
        collect: CollectData;
    }[];
};
