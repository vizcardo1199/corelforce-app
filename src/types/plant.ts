import {Area} from "./area";

export interface Plant {
    id: number;
    code: string;
    description: string;
    areas: Area[];
}
