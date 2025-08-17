import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import apiClient from '../api/client';
import * as SecureStore from 'expo-secure-store';
import { Button } from 'react-native';

const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  secondaryText: '#8A8A8E',
  primaryAccent: '#6474E5',
  coral: '#FF8C69',
};

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: COLORS.primaryAccent,
  backgroundGradientFrom: COLORS.primaryAccent,
  backgroundGradientTo: COLORS.coral,
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: COLORS.white },
};

const KpiCard = ({ title, value }: { title: string; value: string }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiTitle}>{title}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
  </View>
);

const DashboardScreen = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    // The navigator will automatically detect the change and switch screens.
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/dashboard');
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <ActivityIndicator style={styles.centered} size="large" />;
  if (error) return <View style={styles.centered}><Text>{error}</Text></View>;
  if (!data) return <View style={styles.centered}><Text>No data available.</Text></View>;

  const { kpis, charts } = data;

  const lineChartData = {
    labels: charts.revenueVsProfit.map(d => d.label),
    datasets: [{ data: charts.revenueVsProfit.map(d => d.revenue) }, { data: charts.revenueVsProfit.map(d => d.profit) }],
    legend: ["Revenue", "Profit"]
  };

  const barChartData = {
    labels: charts.top5Products.map(p => p.name.substring(0, 10)), // Truncate name
    datasets: [{ data: charts.top5Products.map(p => p.profit) }],
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
            <Button title="Logout" onPress={handleLogout} color={COLORS.primaryAccent} />
        </View>
        <View style={styles.kpiContainer}>
            <KpiCard title="Current Capital" value={`$${Number(kpis.currentCapital).toLocaleString()}`} />
            <KpiCard title="Net Profit" value={`$${Number(kpis.netProfit).toLocaleString()}`} />
            <KpiCard title="Gross Profit" value={`$${Number(kpis.grossProfit).toLocaleString()}`} />
            <KpiCard title="AOV" value={`$${Number(kpis.averageOrderValue).toFixed(2)}`} />
            <KpiCard title="Return Rate" value={`${Number(kpis.returnRate).toFixed(2)}%`} />
        </View>

        <Text style={styles.sectionTitle}>Revenue vs. Profit</Text>
        <LineChart data={lineChartData} width={screenWidth - 32} height={220} chartConfig={chartConfig} bezier style={styles.chart} />

        <Text style={styles.sectionTitle}>Top 5 Products by Profit</Text>
        <BarChart data={barChartData} width={screenWidth - 32} height={250} chartConfig={chartConfig} style={styles.chart} yAxisLabel="$" fromZero />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryText },
  sectionTitle: { fontSize: 18, fontWeight: '500', color: COLORS.primaryText, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingHorizontal: 8 },
  kpiCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 15, margin: 8, width: '45%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  kpiTitle: { fontSize: 14, color: COLORS.secondaryText, marginBottom: 5 },
  kpiValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primaryText },
  chart: { borderRadius: 16, alignSelf: 'center' },
});

export default DashboardScreen;
