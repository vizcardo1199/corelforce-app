import {GeneralSearchRequest} from '../requests/generalSearchRequest';
import {PaginationRequest} from '../requests/paginationRequest';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import qs from 'qs';
import {API_URL} from '../../config/constants';


export const searchPlant = async (
    filters: GeneralSearchRequest,
    pagination: PaginationRequest
) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const params = {
            ...pagination,
            filters,
        };

        const fullUrl = `${API_URL}/plants?${qs.stringify(params)}`;
        console.log(fullUrl);

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Error al buscar plants.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw new Error('Error al buscar plants.');
    }
};

export const getDetailPlant = async (id: number) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const fullUrl = `${API_URL}/plants/${id}`;

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Error al obtener detalle.');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error(error);
        throw new Error('Error al obtener detalle.');
    }
};

export const getOfflineDataPlant = async (plantId: number) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const fullUrl = `${API_URL}/offline/points/${plantId}`;

        console.log(fullUrl);

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Error al obtener data offline.');
        }

        const data = await response.json();
        console.log(data);
        return data.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};


