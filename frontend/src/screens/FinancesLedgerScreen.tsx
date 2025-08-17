import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, SafeAreaView } from 'react-native';

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

const MOCK_TRANSACTIONS: LedgerTransaction[] = [
  { id: '1', transactionName: 'Sale: ORD-001', date: '2025-08-17', type: 'Collected_Revenue', moneyIn: 80.00, moneyOut: 0 },
  { id: '2', transactionName: 'COGS: ORD-001', date: '2025-08-17', type: 'COGS', moneyIn: 0, moneyOut: 40.00 },
  { id: '3', transactionName: 'Purchase: Summer T-Shirts', date: '2025-06-01', type: 'Inventory_Purchase', moneyIn: 0, moneyOut: 2000.00 },
  { id: '4', transactionName: 'Marketing: Summer Sale 2025', date: '2025-06-01', type: 'Marketing_Spend', moneyIn: 0, moneyOut: 5000.00 },
  { id: '5', transactionName: 'Return Fee: ORD-004', date: '2025-08-15', type: 'Return_Fee', moneyIn: 0, moneyOut: 5.00 },
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: COLORS.primaryText },
    searchInput: { backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 16, fontSize: 16 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 10 },
    transactionInfo: {},
    transactionName: { fontSize: 16, fontWeight: '500', color: COLORS.primaryText },
    transactionDate: { fontSize: 12, color: COLORS.secondaryText, marginTop: 4 },
    amountText: { fontSize: 16, fontWeight: 'bold' },
});

const FinancesLedgerScreen = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTransactions, setFilteredTransactions] = useState(MOCK_TRANSACTIONS);

    useEffect(() => {
        const results = MOCK_TRANSACTIONS.filter(tran =>
            tran.transactionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tran.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTransactions(results);
    }, [searchTerm]);

    const renderItem = ({ item }: { item: LedgerTransaction }) => (
        <View style={styles.listItem}>
            <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{item.transactionName}</Text>
                <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()} - {item.type}</Text>
            </View>
            <Text style={[styles.amountText, { color: item.moneyIn > 0 ? COLORS.moneyIn : COLORS.moneyOut }]}>
                {item.moneyIn > 0 ? `+$${item.moneyIn.toFixed(2)}` : `-$${item.moneyOut.toFixed(2)}`}
            </Text>
        </View>
    );

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
