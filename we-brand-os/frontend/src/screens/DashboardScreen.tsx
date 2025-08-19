import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Settings } from 'lucide-react-native';
import Card from '../components/Card';
import KPICard from '../components/KPICard';
import { useTheme } from '../context/ThemeContext';
import { dashboardApi } from '../services/api';
import { KPIs, ChartData, TopProduct, Order, Variant } from '../types';

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Variant[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [overviewRes, chartRes, productsRes, ordersRes, stockRes] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getRevenueProfitChart({ period: 'daily' }),
        dashboardApi.getTopProducts(),
        dashboardApi.getRecentOrders({ limit: 5 }),
        dashboardApi.getLowStockItems({ threshold: 10 }),
      ]);

      setKpis(overviewRes.data.kpis);
      setRevenueData(chartRes.data);
      setTopProducts(productsRes.data);
      setRecentOrders(ordersRes.data);
      setLowStockItems(stockRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.accent + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => theme.colors.text + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.accent,
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return theme.colors.accent;
      case 'SHIPPED':
        return theme.colors.warning;
      case 'DELIVERED':
        return theme.colors.success;
      case 'RETURNED':
        return theme.colors.error;
      case 'CANCELLED':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading dashboard...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            WE Brand OS
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Dashboard Overview
          </Text>
        </View>
        <Settings 
          size={24} 
          color={theme.colors.textSecondary} 
          onPress={toggleTheme}
        />
      </View>

      {/* KPI Cards */}
      {kpis && (
        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <KPICard
              title="Current Capital"
              value={formatCurrency(kpis.currentCapital)}
              color={theme.colors.accent}
            />
            <KPICard
              title="Net Profit"
              value={formatCurrency(kpis.netProfit)}
              color={kpis.netProfit >= 0 ? theme.colors.success : theme.colors.error}
            />
          </View>
          <View style={styles.kpiRow}>
            <KPICard
              title="Gross Profit"
              value={formatCurrency(kpis.grossProfit)}
              color={theme.colors.success}
            />
            <KPICard
              title="Average Order Value"
              value={formatCurrency(kpis.averageOrderValue)}
            />
          </View>
          <View style={styles.kpiRow}>
            <KPICard
              title="Return Rate"
              value={`${kpis.returnRate.toFixed(1)}%`}
              color={kpis.returnRate > 5 ? theme.colors.error : theme.colors.success}
            />
          </View>
        </View>
      )}

      {/* Revenue vs Profit Chart */}
      {revenueData.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Revenue vs Profit
          </Text>
          <LineChart
            data={{
              labels: revenueData.slice(-7).map((item, index) => 
                new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
              ),
              datasets: [
                {
                  data: revenueData.slice(-7).map(item => item.revenue),
                  color: () => theme.colors.accent,
                  strokeWidth: 2,
                },
                {
                  data: revenueData.slice(-7).map(item => item.profit),
                  color: () => theme.colors.success,
                  strokeWidth: 2,
                },
              ],
              legend: ['Revenue', 'Profit'],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card>
      )}

      {/* Top Products Chart */}
      {topProducts.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Top 5 Products by Net Profit
          </Text>
          <BarChart
            data={{
              labels: topProducts.map(product => 
                product.productName.length > 10 
                  ? product.productName.substring(0, 10) + '...'
                  : product.productName
              ),
              datasets: [{
                data: topProducts.map(product => product.netProfit),
              }],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showBarTops={false}
            fromZero
          />
        </Card>
      )}

      {/* Recent Orders and Low Stock */}
      <View style={styles.bottomSection}>
        {/* Recent Orders */}
        <Card style={styles.halfCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Orders
          </Text>
          {recentOrders.map((order) => (
            <View key={order.id} style={styles.orderItem}>
              <View style={styles.orderInfo}>
                <Text style={[styles.orderCustomer, { color: theme.colors.text }]}>
                  {order.customerName}
                </Text>
                <Text style={[styles.orderAmount, { color: theme.colors.textSecondary }]}>
                  {formatCurrency(order.finalPrice || 0)}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) }
                ]}>
                  {order.status}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Low Stock Items */}
        <Card style={styles.halfCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Low Stock Items
          </Text>
          {lowStockItems.map((variant) => (
            <View key={variant.sku} style={styles.stockItem}>
              <View style={styles.stockInfo}>
                <Text style={[styles.stockSku, { color: theme.colors.text }]}>
                  {variant.sku}
                </Text>
                <Text style={[styles.stockProduct, { color: theme.colors.textSecondary }]}>
                  {variant.product?.name}
                </Text>
              </View>
              <View style={[
                styles.stockBadge,
                { 
                  backgroundColor: variant.stockOnHand <= 5 
                    ? theme.colors.error + '20' 
                    : theme.colors.warning + '20'
                }
              ]}>
                <Text style={[
                  styles.stockText,
                  { 
                    color: variant.stockOnHand <= 5 
                      ? theme.colors.error 
                      : theme.colors.warning
                  }
                ]}>
                  {variant.stockOnHand}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  kpiContainer: {
    paddingHorizontal: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chartCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  bottomSection: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 8,
  },
  halfCard: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  orderAmount: {
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stockInfo: {
    flex: 1,
  },
  stockSku: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  stockProduct: {
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
});

export default DashboardScreen;