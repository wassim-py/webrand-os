import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import apiClient from '../api/client';

const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  secondaryText: '#8A8A8E',
  lightGray: '#EFEFEF',
  moneyIn: '#34C759', // Green for money in
  moneyOut: '#FF3B30', // Red for money out
};

interface LedgerTransaction {
  id: string;
  transactionName: string;
  date: string;
  type: string;
  moneyIn: number;
  moneyOut: number;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: COLORS.primaryText },
    searchInput: { backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 16, fontSize: 16 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 10 },
    transactionInfo: {},
    transactionName: { fontSize: 16, fontWeight: '500', color: COLORS.primaryText },
    transactionDate: { fontSize: 12, color: COLORS.secondaryText, marginTop: 4 },
    amountText: { fontSize: 16, fontWeight: 'bold' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16 },
});

const FinancesLedgerScreen = () => {
    const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/marketing/ledger');
                setTransactions(response.data);
            } catch (err) {
                setError('Failed to fetch financial ledger.');
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, []);

    const filteredTransactions = transactions.filter(tran =>
        tran.transactionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tran.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItem = ({ item }: { item: LedgerTransaction }) => (
        <View style={styles.listItem}>
            <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{item.transactionName}</Text>
                <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()} - {item.type}</Text>
            </View>
            <Text style={[styles.amountText, { color: Number(item.moneyIn) > 0 ? COLORS.moneyIn : COLORS.moneyOut }]}>
                {Number(item.moneyIn) > 0 ? `+$${Number(item.moneyIn).toFixed(2)}` : `-$${Number(item.moneyOut).toFixed(2)}`}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primaryAccent} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Finances Ledger</Text>
            <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <FlatList
                data={filteredTransactions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
            />
        </SafeAreaView>
    );
};

export default FinancesLedgerScreen;
