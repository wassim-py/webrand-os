import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import apiClient from '../api/client';

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

const RegisterScreen = ({ navigation }: { navigation: any }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        try {
            await apiClient.post('/auth/register', { email, password });
            Alert.alert('Success', 'You have registered successfully. Please login.');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert('Registration Failed', 'Email may already be in use or server error.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
                <Text style={styles.primaryButtonText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
            </TouchableOpacity>
        </View>
    );
};

export default RegisterScreen;
