import { BACK_URL } from '@env';
import {SurveyVariables} from '../types/survey-variables';
import {SystemConfig} from '../types/system-config';

export const API_URL = BACK_URL;

export const SURVEY_VARIABLES_KEY = 'surveyVariables';
export const SYSTEM_CONFIG_KEY = 'systemConfig';
export const PLANT_SELECTED_KEY = 'plantSelectedId';
export const PLANTS_KEY = 'plants';
export const BANDS_INFO_STORE_KEY = 'bandsInfoStore';
export const SURVEY_VARIABLES_DEFAULT: SurveyVariables = {
    rpm: 1200,
    fMax: 96000,
    lines: 1600,
    rev: 4,
    samples: 1024,
    waiting: 10,
};
export const SYSTEM_CONFIG_DEFAULT: SystemConfig = {
    amplitude: 2,
    accType: 2,
    velType: 2,
    disType: 2,
    frequency: 2,
};

export const DRAW_TITLES = {
  NEXT_X_W: 'X Acc (Waveform)',
  NEXT_X_S: 'X Acc (Spectrum)',
  NEXT_Y_W: 'Y Acc (Waveform)',
  NEXT_Y_S: 'Y Acc (Spectrum)',
  NEXT_Z_W: 'Z Acc (Waveform)',
  NEXT_Z_S: 'Z Acc (Spectrum)',
};

export const PARAMS_SPEC = {
  THRESHOLD: 0.055,
  MULTIPLIER: 0.3,
  A: 0.16,
  B: 2.333,
  C: 0.7,
  D: 0.006,
  FIXED: 0.000012,
};

export const AMPLITUDE_VALUES = [
  {
    key: 1,
    value: 'System METRIC',
  },
  {
    key: 2,
    value: 'System ENGLISH',
  },
];

export const FREQUENCY_VALUES = [
  {
    key: 1,
    value: 'Frequency in Hertz (Hz)',
  },
  {
    key: 2,
    value: 'Frequency in CPM',
  },
];

export const VELOCITY_TYPE_VALUES = [
  {
    key: 1,
    value: 'Peak',
  },
  {
    key: 2,
    value: 'Peak to Peak',
  },
  {
    key: 3,
    value: 'RMS',
  },
];

export const ACCELERATION_TYPE_VALUES = [
  {
    key: 1,
    value: 'Peak',
  },
  {
    key: 2,
    value: 'Peak to Peak',
  },
  {
    key: 3,
    value: 'RMS',
  },
];
export const LINES_VALUES = [
    200,
    400,
    800,
    1600,
];
export const SAMPLES_VALUES = [
    512,
    1024,
    2048,
    4096,
];

export const DISPLACEMENT_TYPE_VALUES = [
  {
    key: 1,
    value: 'Peak',
  },
  {
    key: 2,
    value: 'Peak to Peak',
  },
  {
    key: 3,
    value: 'RMS',
  },
];

export const ALARM_FACTOR_VALUES = [{
  key: 1,
    value: 'SMOOTH',
  }, {
    key: 2,
    value: 'MEDIUM',
  }, {
    key: 3,
    value: 'ROUGH',
  },

];

export const LANGUAGE_VALUES = [
  {
    key: 1,
    value: 'English',
  },
  {
    key: 2,
    value: 'Español',
  },
  {
    key: 3,
    value: 'русский',
  },
  {
    key: 4,
    value: 'Français',
  },
  {
    key: 5,
    value: 'Deutsche',
  },
  {
    key: 6,
    value: 'हिंदी',
  },
  {
    key: 7,
    value: '中文',
  },
  {
    key: 8,
    value: 'Italiano',
  },
  {
    key: 9,
    value: '日本語',
  },
  {
    key: 10,
    value: 'Português',
  },
  {
    key: 11,
    value: 'Türk',
  },
];
