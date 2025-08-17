import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import apiClient from '../api/client';
import { Picker } from '@react-native-picker/picker';

const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  secondaryText: '#8A8A8E',
  primaryAccent: '#6474E5',
  lightGray: '#EFEFEF',
};

type CampaignStatus = 'ACTIVE' | 'PENDING' | 'PAUSED' | 'ENDED';

interface MarketingCampaign {
  id: string;
  campaignName: string;
  budgetAllocated: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
}

interface Product {
    id: string;
    name: string;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg },
    scrollView: { padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: COLORS.primaryText },
    sectionTitle: { fontSize: 18, fontWeight: '500', marginTop: 20, marginBottom: 10, color: COLORS.primaryText },
    input: { backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 10, fontSize: 16 },
    pickerContainer: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 10 },
    listItem: { padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 10 },
    campaignName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryText },
    campaignDetails: { fontSize: 14, color: COLORS.secondaryText, marginTop: 4 },
    primaryButton: { backgroundColor: COLORS.primaryAccent, padding: 15, borderRadius: 99, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

const MarketingScreen = () => {
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [campaignName, setCampaignName] = useState('');
    const [budget, setBudget] = useState('');
    const [productId, setProductId] = useState<string | undefined>();
    const [startDate, setStartDate] = useState(''); // Should be a date picker
    const [endDate, setEndDate] = useState(''); // Should be a date picker

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [campaignsRes, productsRes] = await Promise.all([
                apiClient.get('/marketing/campaigns'),
                apiClient.get('/products'), // Assuming this returns all products
            ]);
            setCampaigns(campaignsRes.data);
            setProducts(productsRes.data.map((p: any) => ({ id: p.productId, name: p.product.name })));
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch marketing data.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCampaign = async () => {
        if (!campaignName || !budget || !startDate || !endDate) {
            Alert.alert('Validation Error', 'Please fill all required fields.');
            return;
        }

        const newCampaign = {
            campaignName,
            budgetAllocated: parseFloat(budget),
            productId,
            startDate,
            endDate,
            status: 'PENDING',
        };

        try {
            const response = await apiClient.post('/marketing/campaigns', newCampaign);
            setCampaigns([...campaigns, response.data]);
            // Reset form
            setCampaignName('');
            setBudget('');
            setProductId(undefined);
            setStartDate('');
            setEndDate('');
        } catch (error) {
            Alert.alert('Error', 'Failed to create campaign.');
        }
    };

    const renderItem = ({ item }: { item: MarketingCampaign }) => (
        <View style={styles.listItem}>
            <Text style={styles.campaignName}>{item.campaignName} ({item.status})</Text>
            <Text style={styles.campaignDetails}>Budget: ${Number(item.budgetAllocated).toLocaleString()}</Text>
            <Text style={styles.campaignDetails}>Dates: {new Date(item.startDate).toLocaleDateString()} to {new Date(item.endDate).toLocaleDateString()}</Text>
        </View>
    );

    if (loading) return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" />;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>Marketing Campaigns</Text>

                <FlatList
                    data={campaigns}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                />

                <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionTitle}>Create New Campaign</Text>
                    <TextInput style={styles.input} placeholder="Campaign Name" value={campaignName} onChangeText={setCampaignName} />
                    <TextInput style={styles.input} placeholder="Budget Allocated" value={budget} onChangeText={setBudget} keyboardType="numeric" />
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={productId} onValueChange={(itemValue) => setProductId(itemValue)}>
                            <Picker.Item label="Select Product (Optional)" value={undefined} />
                            {products.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
                        </Picker>
                    </View>
                    <TextInput style={styles.input} placeholder="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
                    <TextInput style={styles.input} placeholder="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />

                    <TouchableOpacity style={styles.primaryButton} onPress={handleAddCampaign}>
                        <Text style={styles.primaryButtonText}>Add Campaign</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default MarketingScreen;
