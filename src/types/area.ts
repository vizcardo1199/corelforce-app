import {System} from "./system";

export interface Area {
    id: number;
    code: string;
    description: string;
    systems: System[];
}
