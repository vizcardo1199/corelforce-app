import {SurveyVariables} from "./survey-variables";

export interface CollectData {
    date?: string | null;
    time?: number;
    uuid?: string;
    synced?: boolean;
    NEXT_X_W?: any[],
    NEXT_X_S?: any[],
    NEXT_Y_W?: any[],
    NEXT_Y_S?: any[],
    NEXT_Z_W?: any[],
    NEXT_Z_S?: any[],
    vars?: SurveyVariables | null;
}
