import {Point} from "./point";

export interface Asset {
    id: number;
    code: string;
    description: string;
    isMonoaxial: number;
    status?: string;
    points: Point[];
}
