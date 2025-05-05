import {Area} from "./area";

export interface Plant {
    id: number;
    code: string;
    description: string;
    assetCount: number;
    assetsCollecteds: number;
    areas: Area[];
}
