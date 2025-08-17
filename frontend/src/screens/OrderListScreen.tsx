import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';

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

// Based on the Prisma schema
type OrderStatus = 'NEW' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';

interface Order {
  id: string;
  customerName: string;
  orderDate: string;
  status: OrderStatus;
  totalPrice: number;
}

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', customerName: 'John Doe', orderDate: '2025-08-17', status: 'DELIVERED', totalPrice: 80.00 },
  { id: 'ORD-002', customerName: 'Jane Smith', orderDate: '2025-08-17', status: 'SHIPPED', totalPrice: 55.00 },
  { id: 'ORD-003', customerName: 'Peter Jones', orderDate: '2025-08-16', status: 'NEW', totalPrice: 25.00 },
  { id: 'ORD-004', customerName: 'Mary Williams', orderDate: '2025-08-15', status: 'RETURNED', totalPrice: 75.00 },
  { id: 'ORD-005', customerName: 'David Brown', orderDate: '2025-08-14', status: 'CANCELLED', totalPrice: 50.00 },
];

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
  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.row}>
      <View style={styles.orderDetails}>
        <Text style={styles.orderId}>{item.id}</Text>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.date}>{new Date(item.orderDate).toLocaleDateString()}</Text>
      </View>
      <View style={styles.orderStatus}>
        <Text style={styles.price}>${item.totalPrice.toFixed(2)}</Text>
        <StatusBadge status={item.status} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <FlatList
        data={MOCK_ORDERS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightBg, padding: 16 },
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
});

export default OrderListScreen;
