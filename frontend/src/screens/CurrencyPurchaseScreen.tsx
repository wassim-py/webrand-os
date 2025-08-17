import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  primaryAccent: '#6474E5',
  lightGray: '#EFEFEF',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.primaryText },
    input: { backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 15, fontSize: 16 },
    primaryButton: { backgroundColor: COLORS.primaryAccent, padding: 15, borderRadius: 99, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

const CurrencyPurchaseScreen = () => {
    const [currency, setCurrency] = useState('USD');
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');

    const handleSubmit = () => {
        const purchaseData = {
            purchaseDate: new Date().toISOString(),
            currency,
            amountBought: parseFloat(amount),
            exchangeRatePaid: parseFloat(rate),
        };
        console.log("Submitting Currency Purchase:", purchaseData);
        // Clear form
        setAmount('');
        setRate('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Record Currency Purchase</Text>
            <TextInput
                style={styles.input}
                placeholder="Currency (e.g., USD, EUR)"
                value={currency}
                onChangeText={setCurrency}
            />
            <TextInput
                style={styles.input}
                placeholder="Amount Bought"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Exchange Rate Paid"
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
                <Text style={styles.primaryButtonText}>Record Purchase</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default CurrencyPurchaseScreen;
