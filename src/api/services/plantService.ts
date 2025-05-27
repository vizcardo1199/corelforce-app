import {GeneralSearchRequest} from '../requests/generalSearchRequest';
import {PaginationRequest} from '../requests/paginationRequest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// @ts-ignore
import qs from 'qs';
import {API_URL} from '../../config/constants';
import {UnauthorizedError} from "../../errors/UnauthorizedError.ts";


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

        const response = await axios.get(fullUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new UnauthorizedError();
            }

            console.error('Error en la respuesta del servidor:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Error al buscar plants.');
        }

        console.error('Error desconocido:', error);
        throw new Error('Error inesperado al buscar plants.');
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


