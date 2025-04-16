import {SurveyVariables} from "./survey-variables";

export interface CollectData {
    date?: string | null;
    time?: number;
    uuid?: string;
    synced?: boolean;
    NEXT_X_W?: number[],
    NEXT_X_S?: number[],
    NEXT_Y_W?: number[],
    NEXT_Y_S?: number[],
    NEXT_Z_W?: number[],
    NEXT_Z_S?: number[],
    vars?: SurveyVariables | null;
}
