import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Plus, Search, Package } from 'lucide-react-native';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { productApi } from '../services/api';
import { Product, Variant } from '../types';

const ProductsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'products' | 'variants'>('variants');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, variantsRes] = await Promise.all([
        productApi.getAll(),
        productApi.getAllVariants(),
      ]);

      setProducts(productsRes.data);
      setVariants(variantsRes.data);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredVariants = variants.filter(variant =>
    variant.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    variant.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatusColor = (stock: number) => {
    if (stock <= 5) return theme.colors.error;
    if (stock <= 10) return theme.colors.warning;
    return theme.colors.success;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading products...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search products or SKUs..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.accent }]}
          onPress={() => navigation.navigate('CreateProduct')}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'variants' && { backgroundColor: theme.colors.accent }
          ]}
          onPress={() => setViewMode('variants')}
        >
          <Text style={[
            styles.toggleText,
            { color: viewMode === 'variants' ? 'white' : theme.colors.textSecondary }
          ]}>
            All Variants
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'products' && { backgroundColor: theme.colors.accent }
          ]}
          onPress={() => setViewMode('products')}
        >
          <Text style={[
            styles.toggleText,
            { color: viewMode === 'products' ? 'white' : theme.colors.textSecondary }
          ]}>
            By Product
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {viewMode === 'variants' ? (
          // Variants View
          <>
            {filteredVariants.map((variant) => (
              <Card key={variant.sku} style={styles.variantCard}>
                <View style={styles.variantHeader}>
                  <View style={styles.variantInfo}>
                    <Text style={[styles.variantSku, { color: theme.colors.text }]}>
                      {variant.sku}
                    </Text>
                    <Text style={[styles.variantProduct, { color: theme.colors.textSecondary }]}>
                      {variant.product?.name} • {variant.size} • {variant.color}
                    </Text>
                  </View>
                  <View style={[
                    styles.stockBadge,
                    { backgroundColor: getStockStatusColor(variant.stockOnHand) + '20' }
                  ]}>
                    <Text style={[
                      styles.stockText,
                      { color: getStockStatusColor(variant.stockOnHand) }
                    ]}>
                      {variant.stockOnHand} in stock
                    </Text>
                  </View>
                </View>
                
                <View style={styles.variantDetails}>
                  <View style={styles.priceInfo}>
                    <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                      Cost Price
                    </Text>
                    <Text style={[styles.priceValue, { color: theme.colors.text }]}>
                      {formatCurrency(variant.costPrice)}
                    </Text>
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                      Selling Price
                    </Text>
                    <Text style={[styles.priceValue, { color: theme.colors.accent }]}>
                      {formatCurrency(variant.standardSellingPrice)}
                    </Text>
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                      Profit Margin
                    </Text>
                    <Text style={[styles.priceValue, { color: theme.colors.success }]}>
                      {formatCurrency(variant.standardSellingPrice - variant.costPrice)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        ) : (
          // Products View
          <>
            {products.map((product) => (
              <Card 
                key={product.id} 
                style={styles.productCard}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                >
                  <View style={styles.productHeader}>
                    <Package size={24} color={theme.colors.accent} />
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: theme.colors.text }]}>
                        {product.name}
                      </Text>
                      <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>
                        {product.category} • {product.variants?.length || 0} variants
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.productStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Total Stock
                      </Text>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {product.variants?.reduce((sum, v) => sum + v.stockOnHand, 0) || 0}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Variants
                      </Text>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {product.variants?.length || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            ))}
          </>
        )}
        
        {(viewMode === 'variants' ? filteredVariants : products).length === 0 && (
          <View style={styles.emptyContainer}>
            <Package size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No products found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Add your first product to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  variantCard: {
    marginBottom: 8,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  variantInfo: {
    flex: 1,
  },
  variantSku: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  variantProduct: {
    fontSize: 14,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  variantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInfo: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  productCard: {
    marginBottom: 8,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  productCategory: {
    fontSize: 14,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter',
    marginTop: 4,
  },
});

export default ProductsScreen;