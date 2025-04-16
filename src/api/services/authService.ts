import { Md5 } from 'ts-md5';
import { API_URL } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email: string, password: string) => {
  try {
    const body = {
      email,
      password: String(new Md5().appendStr(password).end(false)),
      company: 1,
    };

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Error al iniciar sesión.");
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error: any) {
    throw new Error("Error al iniciar sesión. Inténtalo nuevamente: " + API_URL);
  }
};

export const checkAuth = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    console.log("token", token);

    if (!token) {
      throw new Error("Error al obtener detalle.");
    }

    const response = await fetch(`${API_URL}/accounts/check/auth`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener detalle.");
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.log("error controlado");
    console.log("Nombre del error:", error.name);
    console.log("Mensaje del error:", error.message);

    if (error.message === "Network request failed") {
      throw new Error(error.message);
    }

    throw new Error("Error al obtener detalle.");
  }
};
