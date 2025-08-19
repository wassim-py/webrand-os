import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View } from 'react-native';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Plus,
  Settings 
} from 'lucide-react-native';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import MarketingScreen from '../screens/MarketingScreen';
import FinanceScreen from '../screens/FinanceScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter',
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard' }}
      />
    </Stack.Navigator>
  );
};

const ProductsStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter',
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="ProductsList" 
        component={ProductsScreen} 
        options={{ title: 'Products & Inventory' }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen} 
        options={{ title: 'Product Details' }}
      />
      <Stack.Screen 
        name="CreateProduct" 
        component={CreateProductScreen} 
        options={{ title: 'Add New Product' }}
      />
    </Stack.Navigator>
  );
};

const OrdersStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter',
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="OrdersList" 
        component={OrdersScreen} 
        options={{ title: 'Orders' }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen} 
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen 
        name="CreateOrder" 
        component={CreateOrderScreen} 
        options={{ title: 'Create Order' }}
      />
    </Stack.Navigator>
  );
};

const MarketingStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter',
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="MarketingMain" 
        component={MarketingScreen} 
        options={{ title: 'Marketing & Campaigns' }}
      />
    </Stack.Navigator>
  );
};

const FinanceStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter',
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="FinanceMain" 
        component={FinanceScreen} 
        options={{ title: 'Finance & Ledger' }}
      />
    </Stack.Navigator>
  );
};

// Custom tab bar button for create order
const CreateOrderButton = ({ onPress }: { onPress: () => void }) => {
  const { theme } = useTheme();
  
  return (
    <View style={{
      position: 'absolute',
      bottom: 25,
      left: '50%',
      marginLeft: -28,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    }}>
      <Plus size={24} color="white" />
    </View>
  );
};

const AppNavigator = () => {
  const { theme, isDark } = useTheme();
  
  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: theme.colors.accent,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.accentSecondary,
        },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 90 : 70,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: {
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let IconComponent;
            
            switch (route.name) {
              case 'Dashboard':
                IconComponent = Home;
                break;
              case 'Products':
                IconComponent = Package;
                break;
              case 'Orders':
                IconComponent = ShoppingCart;
                break;
              case 'Marketing':
                IconComponent = TrendingUp;
                break;
              case 'Finance':
                IconComponent = DollarSign;
                break;
              default:
                IconComponent = Home;
            }
            
            return <IconComponent size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardStack}
          options={{ title: 'Dashboard' }}
        />
        <Tab.Screen 
          name="Products" 
          component={ProductsStack}
          options={{ title: 'Products' }}
        />
        <Tab.Screen 
          name="Orders" 
          component={OrdersStack}
          options={{ title: 'Orders' }}
        />
        <Tab.Screen 
          name="Marketing" 
          component={MarketingStack}
          options={{ title: 'Marketing' }}
        />
        <Tab.Screen 
          name="Finance" 
          component={FinanceStack}
          options={{ title: 'Finance' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;