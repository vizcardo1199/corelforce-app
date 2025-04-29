export type SurveySync = {
    surveyId?: number;
    synced?: boolean | null;
    date: number;
    mawoiId: number;
    assetDescription: string;
    points: string[];
    uuids: string[];
    vars: { fmax: string; rpm: string; revolution: string; pointId: string }[];
    spectrum: { pointId: number; measure_y: number; pointCode: string }[];
    waveform: { pointId: number; measure_y: number; pointCode: string }[];
}
