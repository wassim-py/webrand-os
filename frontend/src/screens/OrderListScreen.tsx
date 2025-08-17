import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import apiClient from '../api/client';

// Using colors from SRS
const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  secondaryText: '#8A8A8E',
  primaryAccent: '#6474E5', // Periwinkle Blue for 'NEW' or 'SHIPPED'
  coral: '#FF8C69', // Soft Coral for 'DELIVERED'
  gray: '#8D8D93', // Gray for 'CANCELLED' or 'RETURNED'
};

type OrderStatus = 'NEW' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';

interface Order {
  id: string;
  customerName: string;
  orderDate: string;
  status: OrderStatus;
  lineItems: {
    quantity: number;
    actualSalePrice: number;
  }[];
}

const statusColors: { [key in OrderStatus]: string } = {
  NEW: COLORS.primaryAccent,
  SHIPPED: COLORS.primaryAccent,
  DELIVERED: COLORS.coral,
  RETURNED: COLORS.gray,
  CANCELLED: COLORS.gray,
};

const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <View style={[styles.badge, { backgroundColor: statusColors[status] }]}>
    <Text style={styles.badgeText}>{status}</Text>
  </View>
);

const OrderListScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get('/orders');
        setOrders(response.data);
      } catch (err) {
        setError('Failed to fetch orders.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const calculateTotalPrice = (lineItems: Order['lineItems']) => {
    return lineItems.reduce((total, item) => total + item.quantity * Number(item.actualSalePrice), 0);
  };

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.row}>
      <View style={styles.orderDetails}>
        <Text style={styles.orderId}>{item.id}</Text>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.date}>{new Date(item.orderDate).toLocaleDateString()}</Text>
      </View>
      <View style={styles.orderStatus}>
        <Text style={styles.price}>${calculateTotalPrice(item.lineItems).toFixed(2)}</Text>
        <StatusBadge status={item.status} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6474E5" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightBg, padding: 16 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryText, marginBottom: 16 },
  list: { backgroundColor: '#FFFFFF', borderRadius: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  orderDetails: {},
  orderStatus: { alignItems: 'flex-end' },
  orderId: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryText },
  customerName: { fontSize: 14, color: COLORS.secondaryText, marginTop: 4 },
  date: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryText, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  errorText: { color: 'red', fontSize: 16 },
});

export default OrderListScreen;
