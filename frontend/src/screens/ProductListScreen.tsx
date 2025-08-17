import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';

interface Variant {
  sku: string;
  productName: string;
  size: string;
  color: string;
  stockOnHand: number;
  standardSellingPrice: number;
}

const MOCK_VARIANTS: Variant[] = [
  { sku: 'TS-BLK-S', productName: 'Classic T-Shirt', size: 'S', color: 'Black', stockOnHand: 100, standardSellingPrice: 25.00 },
  { sku: 'TS-BLK-M', productName: 'Classic T-Shirt', size: 'M', color: 'Black', stockOnHand: 80, standardSellingPrice: 25.00 },
  { sku: 'TS-WHT-M', productName: 'Classic T-Shirt', size: 'M', color: 'White', stockOnHand: 95, standardSellingPrice: 25.00 },
  { sku: 'HD-GRY-L', productName: 'Cozy Hoodie', size: 'L', color: 'Gray', stockOnHand: 40, standardSellingPrice: 55.00 },
  { sku: 'HD-GRY-XL', productName: 'Cozy Hoodie', size: 'XL', color: 'Gray', stockOnHand: 35, standardSellingPrice: 55.00 },
  { sku: 'JN-BLU-32', productName: 'Denim Jeans', size: '32', color: 'Blue', stockOnHand: 60, standardSellingPrice: 75.00 },
];

const ProductListScreen = () => {
  const renderItem = ({ item }: { item: Variant }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.sku]}>{item.sku}</Text>
      <Text style={styles.cell}>{item.productName}</Text>
      <Text style={styles.cell}>{item.size}</Text>
      <Text style={styles.cell}>{item.color}</Text>
      <Text style={styles.cell}>{item.stockOnHand}</Text>
      <Text style={styles.cell}>${item.standardSellingPrice.toFixed(2)}</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.headerCell, styles.sku]}>SKU</Text>
      <Text style={styles.headerCell}>Product Name</Text>
      <Text style={styles.headerCell}>Size</Text>
      <Text style={styles.headerCell}>Color</Text>
      <Text style={styles.headerCell}>Stock</Text>
      <Text style={styles.headerCell}>Price</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Product Variants</Text>
      <FlatList
        data={MOCK_VARIANTS}
        renderItem={renderItem}
        keyExtractor={(item) => item.sku}
        ListHeaderComponent={renderHeader}
        style={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8', // Light mode background
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E', // Primary text
    marginBottom: 16,
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerRow: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8A8A8E', // Secondary text
  },
  sku: {
    flex: 1.5, // Give more space for SKU
  }
});

export default ProductListScreen;
