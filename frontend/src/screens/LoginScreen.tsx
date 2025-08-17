import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import apiClient from '../api/client';
import * as SecureStore from 'expo-secure-store';

const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  primaryAccent: '#6474E5',
  lightGray: '#EFEFEF',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg, justifyContent: 'center', padding: 16 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: COLORS.primaryText },
    input: { backgroundColor: COLORS.white, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 15, fontSize: 16 },
    primaryButton: { backgroundColor: COLORS.primaryAccent, padding: 15, borderRadius: 99, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    secondaryButton: { marginTop: 20 },
    secondaryButtonText: { color: COLORS.primaryAccent, textAlign: 'center', fontSize: 16 },
});

// The navigation prop type should be updated in a real app with a navigator setup
const LoginScreen = ({ navigation }: { navigation: any }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { token } = response.data;
            await SecureStore.setItemAsync('userToken', token);
            // This is a placeholder to signal the app to reload.
            // In a real app, a state management library (like Context or Redux) would handle this.
            navigation.replace('MainApp');
        } catch (error) {
            Alert.alert('Login Failed', 'Invalid credentials or server error.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.secondaryButtonText}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LoginScreen;
