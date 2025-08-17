import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../api/client';

const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  secondaryText: '#8A8A8E',
  primaryAccent: '#6474E5',
  lightGray: '#EFEFEF',
  error: '#FF3B30',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg },
    scrollView: { padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.primaryText },
    sectionTitle: { fontSize: 18, fontWeight: '500', marginTop: 20, marginBottom: 10, color: COLORS.primaryText },
    input: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        marginBottom: 10,
        fontSize: 16,
        color: COLORS.primaryText,
    },
    variantContainer: {
        padding: 15,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    variantRow: {
        flexDirection: 'row',
        marginHorizontal: -5,
    },
    variantInput: {
        flex: 1,
        marginHorizontal: 5,
    },
    primaryButton: {
      backgroundColor: COLORS.primaryAccent,
      padding: 15,
      borderRadius: 99, // Pill-shaped
      alignItems: 'center',
      marginTop: 20,
    },
    primaryButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
    secondaryButton: {
      padding: 10,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: COLORS.primaryAccent,
      fontSize: 16,
      fontWeight: '500',
    }
});

const AddProductScreen = () => {
    const [productName, setProductName] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [variants, setVariants] = useState([{ sku: '', size: '', color: '', costPrice: '', standardSellingPrice: '', stockOnHand: '' }]);
    const [loading, setLoading] = useState(false);

    const handleAddVariant = () => {
        setVariants([...variants, { sku: '', size: '', color: '', costPrice: '', standardSellingPrice: '', stockOnHand: '' }]);
    };

    const handleVariantChange = (text: string, index: number, field: string) => {
        const newVariants = [...variants];
        newVariants[index][field] = text;
        setVariants(newVariants);
    };

    const removeVariant = (index: number) => {
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        setVariants(newVariants);
    };

    const handleSubmit = async () => {
        if (!productName || !productCategory || variants.some(v => !v.sku || !v.size || !v.color || !v.costPrice || !v.standardSellingPrice || !v.stockOnHand)) {
            Alert.alert('Validation Error', 'Please fill all fields for the product and all its variants.');
            return;
        }

        const productData = {
            productData: { name: productName, category: productCategory },
            variantsData: variants.map(v => ({
                sku: v.sku,
                size: v.size,
                color: v.color,
                costPrice: parseFloat(v.costPrice),
                standardSellingPrice: parseFloat(v.standardSellingPrice),
                stockOnHand: parseInt(v.stockOnHand, 10),
            })),
        };

        setLoading(true);
        try {
            await apiClient.post('/products', productData);
            Alert.alert('Success', 'Product created successfully!');
            // Reset form
            setProductName('');
            setProductCategory('');
            setVariants([{ sku: '', size: '', color: '', costPrice: '', standardSellingPrice: '', stockOnHand: '' }]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create product. The SKU might already exist.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>Add New Product</Text>

                <Text style={styles.sectionTitle}>Product Details</Text>
                <TextInput style={styles.input} placeholder="Product Name (e.g., Classic T-Shirt)" value={productName} onChangeText={setProductName} />
                <TextInput style={styles.input} placeholder="Category (e.g., Apparel)" value={productCategory} onChangeText={setProductCategory} />

                <Text style={styles.sectionTitle}>Variants</Text>
                {variants.map((variant, index) => (
                    <View key={index} style={styles.variantContainer}>
                        <TextInput style={styles.input} placeholder="SKU" value={variant.sku} onChangeText={(text) => handleVariantChange(text, index, 'sku')} />
                        <View style={styles.variantRow}>
                            <TextInput style={[styles.input, styles.variantInput]} placeholder="Size" value={variant.size} onChangeText={(text) => handleVariantChange(text, index, 'size')} />
                            <TextInput style={[styles.input, styles.variantInput]} placeholder="Color" value={variant.color} onChangeText={(text) => handleVariantChange(text, index, 'color')} />
                        </View>
                        <TextInput style={styles.input} placeholder="Stock on Hand" value={variant.stockOnHand} onChangeText={(text) => handleVariantChange(text, index, 'stockOnHand')} keyboardType="numeric" />
                        <View style={styles.variantRow}>
                            <TextInput style={[styles.input, styles.variantInput]} placeholder="Cost Price" value={variant.costPrice} onChangeText={(text) => handleVariantChange(text, index, 'costPrice')} keyboardType="numeric" />
                            <TextInput style={[styles.input, styles.variantInput]} placeholder="Selling Price" value={variant.standardSellingPrice} onChangeText={(text) => handleVariantChange(text, index, 'standardSellingPrice')} keyboardType="numeric" />
                        </View>
                        {variants.length > 1 && <TouchableOpacity onPress={() => removeVariant(index)}><Text style={{color: COLORS.error, textAlign: 'right'}}>Remove Variant</Text></TouchableOpacity>}
                    </View>
                ))}

                <TouchableOpacity style={styles.secondaryButton} onPress={handleAddVariant}>
                    <Text style={styles.secondaryButtonText}>+ Add Another Variant</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Submit Product</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddProductScreen;
