import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';

// Using colors from SRS
const COLORS = {
  lightBg: '#F7F7F8',
  white: '#FFFFFF',
  primaryText: '#1C1C1E',
  secondaryText: '#8A8A8E',
  primaryAccent: '#6474E5',
  lightGray: '#EFEFEF',
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

    const handleAddVariant = () => {
        setVariants([...variants, { sku: '', size: '', color: '', costPrice: '', standardSellingPrice: '', stockOnHand: '' }]);
    };

    const handleVariantChange = (text: string, index: number, field: string) => {
        const newVariants = [...variants];
        newVariants[index][field] = text;
        setVariants(newVariants);
    };

    const handleSubmit = () => {
        console.log('Submitting Product:');
        const productData = {
            productData: { name: productName, category: productCategory },
            // Basic conversion for demo purposes
            variantsData: variants.map(v => ({
                ...v,
                costPrice: parseFloat(v.costPrice) || 0,
                standardSellingPrice: parseFloat(v.standardSellingPrice) || 0,
                stockOnHand: parseInt(v.stockOnHand, 10) || 0,
            })),
        };
        console.log(JSON.stringify(productData, null, 2));
        // In a real app, you'd call the API here
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>Add New Product</Text>

                <Text style={styles.sectionTitle}>Product Details</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Product Name (e.g., Classic T-Shirt)"
                    value={productName}
                    onChangeText={setProductName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Category (e.g., Apparel)"
                    value={productCategory}
                    onChangeText={setProductCategory}
                />

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
                    </View>
                ))}

                <TouchableOpacity style={styles.secondaryButton} onPress={handleAddVariant}>
                    <Text style={styles.secondaryButtonText}>+ Add Another Variant</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
                    <Text style={styles.primaryButtonText}>Submit Product</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddProductScreen;
