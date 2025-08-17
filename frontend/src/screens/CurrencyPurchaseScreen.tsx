import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import apiClient from '../api/client';

const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  secondaryText: '#8A8A8E',
  primaryAccent: '#6474E5',
  lightGray: '#EFEFEF',
};

interface CurrencyPurchase {
    id: string;
    purchaseDate: string;
    currency: string;
    amountBought: number;
    exchangeRatePaid: number;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.primaryText },
    sectionTitle: { fontSize: 18, fontWeight: '500', marginTop: 20, marginBottom: 10, color: COLORS.primaryText },
    input: { backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 15, fontSize: 16 },
    primaryButton: { backgroundColor: COLORS.primaryAccent, padding: 15, borderRadius: 99, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    listItem: { padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 10 },
    itemText: { fontSize: 16, color: COLORS.primaryText },
});

const CurrencyPurchaseScreen = () => {
    const [purchases, setPurchases] = useState<CurrencyPurchase[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [currency, setCurrency] = useState('USD');
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/marketing/currency-purchases');
            setPurchases(response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch currency purchases.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!currency || !amount || !rate) {
            Alert.alert('Validation Error', 'Please fill all fields.');
            return;
        }

        const purchaseData = {
            purchaseDate: new Date().toISOString(),
            currency,
            amountBought: parseFloat(amount),
            exchangeRatePaid: parseFloat(rate),
        };

        setSubmitting(true);
        try {
            const response = await apiClient.post('/marketing/currency-purchases', purchaseData);
            setPurchases([response.data, ...purchases]);
            // Clear form
            setAmount('');
            setRate('');
        } catch (error) {
            Alert.alert('Error', 'Failed to record purchase.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderItem = ({ item }: { item: CurrencyPurchase }) => (
        <View style={styles.listItem}>
            <Text style={styles.itemText}>
                Bought {Number(item.amountBought).toLocaleString()} {item.currency} at {Number(item.exchangeRatePaid)}
            </Text>
            <Text style={{ color: COLORS.secondaryText, fontSize: 12, marginTop: 4 }}>
                {new Date(item.purchaseDate).toLocaleDateString()}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Record Currency Purchase</Text>
            <TextInput style={styles.input} placeholder="Currency (e.g., USD, EUR)" value={currency} onChangeText={setCurrency} />
            <TextInput style={styles.input} placeholder="Amount Bought" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Exchange Rate Paid" value={rate} onChangeText={setRate} keyboardType="numeric" />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Record Purchase</Text>}
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Recent Purchases</Text>
            {loading ? <ActivityIndicator size="large" /> : (
                <FlatList
                    data={purchases}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                />
            )}
        </SafeAreaView>
    );
};

export default CurrencyPurchaseScreen;
