import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { login } from '../api/services/authService';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import TopRightDeco from './assets/TopRightDeco.tsx';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Detectar el esquema de color del sistema (light o dark)
  const colorScheme = useColorScheme();
  const theme = useColorScheme();
  console.log(colorScheme);
  const isDark = theme === 'dark';
  // Estilos dinámicos según el tema
  // const styles = isDarkMode ? darkStyles : lightStyles;

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data) {
        // Guardar la información del usuario en AsyncStorage
        await AsyncStorage.setItem("userToken", data.data.token);
        await AsyncStorage.setItem("userName", data.data.user.name || '');
        await AsyncStorage.setItem("userEmail", data.data.user.email || '');
        await AsyncStorage.setItem("userImage", data.data.user.imageCompany || '');
        await AsyncStorage.setItem("userMenu", JSON.stringify(data.data.menu));
        navigation.replace("HomeContainer");
      } else {
        // eslint-disable-next-line no-alert
        alert("Credenciales incorrectas");
      }
    } catch (error: any) {
      // eslint-disable-next-line no-alert
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        {/* Fondo decorativo */}
        <TopRightDeco />

        {/* Cabecera */}
        <Text style={[styles.title, isDark && styles.titleDark]}>Login</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Please sign in to continue.</Text>

        {/* Input Email */}
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          <Icon name="mail" size={20} color={isDark ? '#ccc' : '#999'} style={styles.icon} />
          <TextInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => setEmail(text)}
              placeholderTextColor={isDark ? '#888' : '#aaa'}
              style={[styles.input, isDark && styles.inputDark]}
          />
        </View>

        {/* Input Password */}
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          <Icon name="lock" size={20} color={isDark ? '#ccc' : '#999'} style={styles.icon} />
          <TextInput
              placeholder="Password"
              value={password}
              onChangeText={(text) => setPassword(text)}
              placeholderTextColor={isDark ? '#888' : '#aaa'}
              secureTextEntry
              style={[styles.input, isDark && styles.inputDark]}
          />
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>FORGOT</Text>
          </TouchableOpacity>
        </View>

        {/* Botón Login alineado a la derecha */}
        <View style={styles.loginWrapper}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}
                            disabled={loading}>
            <LinearGradient
                colors={['#fdbb2d', '#f68d1e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
              {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                  <Text style={styles.loginText}>LOGIN  ➜</Text>
              )}

            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
          Don’t have an account? <Text style={styles.signUp}>Sign up</Text>
        </Text>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  decorativeImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 140,
    zIndex: -1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 25,
  },
  subtitleDark: {
    color: '#bbb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  inputContainerDark: {
    backgroundColor: '#1e1e1e',
    shadowColor: '#000',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  inputDark: {
    color: '#fff',
  },
  forgotBtn: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
  forgotText: {
    fontSize: 12,
    color: '#f68d1e',
    fontWeight: '500',
  },
  loginWrapper: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  loginButton: {
    width: '60%',
  },
  gradient: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 35,
    color: '#999',
  },
  footerTextDark: {
    color: '#ccc',
  },
  signUp: {
    color: '#f68d1e',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
