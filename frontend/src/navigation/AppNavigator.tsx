import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Platform, View, ActivityIndicator, Button } from 'react-native';
import { Home, ShoppingCart, Package, DollarSign, Briefcase, BookOpen, Settings } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import ProductListScreen from '../screens/ProductListScreen';
import OrderListScreen from '../screens/OrderListScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import MarketingScreen from '../screens/MarketingScreen';
import CurrencyPurchaseScreen from '../screens/CurrencyPurchaseScreen';
import FinancesLedgerScreen from '../screens/FinancesLedgerScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Types
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<RootStackParamList>();

// --- Main App Navigator (The one with tabs/drawer) ---
const commonScreens = {
    Dashboard: { component: DashboardScreen, icon: (c, s) => <Home color={c} size={s} /> },
    Products: { component: ProductListScreen, icon: (c, s) => <Package color={c} size={s} /> },
    Orders: { component: OrderListScreen, icon: (c, s) => <ShoppingCart color={c} size={s} /> },
    'New Order': { component: CreateOrderScreen, icon: (c, s) => <DollarSign color={c} size={s} /> },
    Marketing: { component: MarketingScreen, icon: (c, s) => <Briefcase color={c} size={s} /> },
    'Currency Purchases': { component: CurrencyPurchaseScreen, icon: (c, s) => <BookOpen color={c} size={s} /> },
    Ledger: { component: FinancesLedgerScreen, icon: (c, s) => <Settings color={c} size={s} /> },
};

const TabNavigator = () => (
    <Tab.Navigator screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => commonScreens[route.name as keyof RootStackParamList].icon(color, size),
        tabBarActiveTintColor: '#6474E5',
        tabBarInactiveTintColor: '#8A8A8E',
        headerShown: false,
    })}>
        {Object.entries(commonScreens).map(([name, config]) => (
            <Tab.Screen key={name} name={name as keyof RootStackParamList} component={config.component} />
        ))}
    </Tab.Navigator>
);

const DrawerNavigator = () => (
    <Drawer.Navigator screenOptions={({ route }) => ({
        drawerIcon: ({ color, size }) => commonScreens[route.name as keyof RootStackParamList].icon(color, size),
        drawerActiveTintColor: '#6474E5',
        drawerInactiveTintColor: '#8A8A8E',
    })}>
        {Object.entries(commonScreens).map(([name, config]) => (
            <Drawer.Screen key={name} name={name as keyof RootStackParamList} component={config.component} />
        ))}
    </Drawer.Navigator>
);

const MainApp = () => Platform.OS === 'web' ? <DrawerNavigator /> : <TabNavigator />;

// --- Auth Navigator ---
const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

// --- Root Navigator (Decides which stack to show) ---
const AppNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);

    useEffect(() => {
        const bootstrapAsync = async () => {
            let token: string | null = null;
            try {
                token = await SecureStore.getItemAsync('userToken');
            } catch (e) {
                // Restoring token failed
            }
            setUserToken(token);
            setIsLoading(false);
        };
        bootstrapAsync();
    }, []);

    // This effect will re-run when the user logs in/out,
    // as we'll be manipulating the token in SecureStore.
    useEffect(() => {
        const interceptor = apiClient.interceptors.request.use(
            async (config) => {
                const token = await SecureStore.getItemAsync('userToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // A simple way to "listen" for login/logout from anywhere
        const checkToken = async () => {
            const token = await SecureStore.getItemAsync('userToken');
            setUserToken(token);
        };

        const interval = setInterval(checkToken, 1000); // Check every second

        return () => {
            apiClient.interceptors.request.eject(interceptor);
            clearInterval(interval);
        };
    }, []);

    if (isLoading) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken == null ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : (
                    <Stack.Screen name="MainApp" component={MainApp} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
