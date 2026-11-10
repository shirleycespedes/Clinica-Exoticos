import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { setupNotificationListeners } from './src/screen/notificationService';
import LoginScreen from './src/screen/LoginScreen';
import DashboardScreen from './src/screen/DashboardScreen';
import RegisterScreen from './src/screen/RegisterScreen';
import ForgotPasswordScreen from './src/screen/ForgotPasswordScreen';
import MascotasScreen from './src/screen/MascotasScreen';
import ExpedientesScreen from './src/screen/ExpedientesScreen';
import AgendarCitaScreen from './src/screen/AgendarCitaScreen';
import CitasScreen from './src/screen/CitasScreen';
import ConsultasScreen from './src/screen/ConsultasScreen';
import PerfilScreen from './src/screen/PerfilScreen';
import UsuariosScreen from './src/screen/UsuariosScreen';
import TiendaScreen from './src/screen/TiendaScreen';
import InventarioScreen from './src/screen/InventarioScreen';
import NotificationBanner from './src/screen/NotificationBanner';

// Inject CSS style for Web to use single window scrollbar and remove height/overflow locks
if (Platform.OS === 'web') {
    const style = window.document.createElement('style');
    style.textContent = `
        html, body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            height: auto !important;
            min-height: 100vh !important;
        }
        #root, #root > div {
            height: auto !important;
            min-height: 100vh !important;
            overflow: visible !important;
        }
    `;
    window.document.head.appendChild(style);
}

export const navigationRef = createNavigationContainerRef();
const Stack = createStackNavigator();

export default function App() {
    useEffect(() => {
        if (Platform.OS !== 'web') {
            const cleanup = setupNotificationListeners(navigationRef);
            return () => {
                if (typeof cleanup === 'function') {
                    cleanup();
                }
            };
        }
    }, []);

    return (
        <NavigationContainer ref={navigationRef}>
            <NotificationBanner navigationRef={navigationRef} />
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Register" 
                    component={RegisterScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="ForgotPassword" 
                    component={ForgotPasswordScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Dashboard" 
                    component={DashboardScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Mascotas" 
                    component={MascotasScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Expedientes" 
                    component={ExpedientesScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="AgendarCita" 
                    component={AgendarCitaScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Citas" 
                    component={CitasScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Consultas" 
                    component={ConsultasScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Perfil" 
                    component={PerfilScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Usuarios" 
                    component={UsuariosScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Tienda" 
                    component={TiendaScreen} 
                    options={{ headerShown: false }}
                />
                <Stack.Screen 
                    name="Inventario" 
                    component={InventarioScreen} 
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
