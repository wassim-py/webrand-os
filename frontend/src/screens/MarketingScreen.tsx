import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';

// Using colors from SRS
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

const MOCK_CAMPAIGNS: MarketingCampaign[] = [
    { id: '1', campaignName: 'Summer Sale 2025', budgetAllocated: 5000, startDate: '2025-06-01', endDate: '2025-08-31', status: 'ACTIVE' },
    { id: '2', campaignName: 'Black Friday Push', budgetAllocated: 10000, startDate: '2025-11-20', endDate: '2025-11-30', status: 'PENDING' },
    { id: '3', campaignName: 'Spring Collection Launch', budgetAllocated: 3000, startDate: '2025-03-01', endDate: '2025-04-30', status: 'ENDED' },
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg },
    scrollView: { padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: COLORS.primaryText },
    sectionTitle: { fontSize: 18, fontWeight: '500', marginTop: 20, marginBottom: 10, color: COLORS.primaryText },
    input: { backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 10, fontSize: 16 },
    listItem: { padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 10 },
    campaignName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryText },
    campaignDetails: { fontSize: 14, color: COLORS.secondaryText, marginTop: 4 },
    primaryButton: { backgroundColor: COLORS.primaryAccent, padding: 15, borderRadius: 99, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

const MarketingScreen = () => {
    const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
    const [campaignName, setCampaignName] = useState('');
    const [budget, setBudget] = useState('');

    const handleAddCampaign = () => {
        if (!campaignName || !budget) return;
        const newCampaign: MarketingCampaign = {
            id: (campaigns.length + 1).toString(),
            campaignName,
            budgetAllocated: parseFloat(budget),
            startDate: new Date().toISOString().split('T')[0], // Today
            endDate: '', // Should be a date picker
            status: 'PENDING',
        };
        setCampaigns([...campaigns, newCampaign]);
        setCampaignName('');
        setBudget('');
    };

    const renderItem = ({ item }: { item: MarketingCampaign }) => (
        <View style={styles.listItem}>
            <Text style={styles.campaignName}>{item.campaignName} ({item.status})</Text>
            <Text style={styles.campaignDetails}>Budget: ${item.budgetAllocated.toLocaleString()}</Text>
            <Text style={styles.campaignDetails}>Dates: {item.startDate} to {item.endDate || 'N/A'}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>Marketing Campaigns</Text>

                <FlatList
                    data={campaigns}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false} // Disable scrolling for the list inside a ScrollView
                />

                <View style={{marginTop: 20}}>
                    <Text style={styles.sectionTitle}>Create New Campaign</Text>
                    <TextInput style={styles.input} placeholder="Campaign Name" value={campaignName} onChangeText={setCampaignName} />
                    <TextInput style={styles.input} placeholder="Budget Allocated" value={budget} onChangeText={setBudget} keyboardType="numeric" />
                    <TouchableOpacity style={styles.primaryButton} onPress={handleAddCampaign}>
                        <Text style={styles.primaryButtonText}>Add Campaign</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default MarketingScreen;
