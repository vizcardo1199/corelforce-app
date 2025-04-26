import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import {API_URL} from '../../config/constants';
import axios from 'axios';
import {SurveySync} from '../../types/survey-sync';


export const sendSurvey = async (surveysSync: SurveySync) => {
    try {
        const token = await AsyncStorage.getItem('userToken');


        const fullUrl = `${API_URL}/offline/survey`;
        const response = await axios({
            method: 'post',
            url: fullUrl,
            data: surveysSync,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            timeout: 180000,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error('Error survey sync.');
    }
};

