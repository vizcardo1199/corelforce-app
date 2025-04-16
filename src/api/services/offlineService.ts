import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import {API_URL} from '../../config/constants';
import {SurveySync} from '../../types/survey-sync';


export const sendSurvey = async (surveysSync: SurveySync) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const fullUrl = `${API_URL}/offline/survey`;
        console.log(fullUrl);

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(surveysSync),
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw new Error('Error survey sync.');
    }
};

