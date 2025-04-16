import {Asset} from "./asset";

export interface System {
    id: number;
    code: string;
    description: string;
    mawois: Asset[];
}
