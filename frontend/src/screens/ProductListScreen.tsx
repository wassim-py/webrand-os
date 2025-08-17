import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import apiClient from '../api/client';

interface Variant {
  sku: string;
  product: {
    name: string;
  };
  size: string;
  color: string;
  stockOnHand: number;
  standardSellingPrice: number;
}

const ProductListScreen = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const response = await apiClient.get('/products');
        setVariants(response.data);
      } catch (err) {
        setError('Failed to fetch product variants.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, []);

  const renderItem = ({ item }: { item: Variant }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.sku]}>{item.sku}</Text>
      <Text style={styles.cell}>{item.product.name}</Text>
      <Text style={styles.cell}>{item.size}</Text>
      <Text style={styles.cell}>{item.color}</Text>
      <Text style={styles.cell}>{item.stockOnHand}</Text>
      <Text style={styles.cell}>${Number(item.standardSellingPrice).toFixed(2)}</Text>
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
      <Text style={styles.title}>Product Variants</Text>
      <FlatList
        data={variants}
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
    backgroundColor: '#F7F7F8',
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
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
    color: '#8A8A8E',
  },
  sku: {
    flex: 1.5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default ProductListScreen;
