import React, { useState, useEffect } from 'react';
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

// --- Mock Data ---
const MOCK_VARIANTS_DB = {
  'TS-BLK-M': { productName: 'Classic T-Shirt', standardSellingPrice: 25.00 },
  'HD-GRY-L': { productName: 'Cozy Hoodie', standardSellingPrice: 55.00 },
  'JN-BLU-32': { productName: 'Denim Jeans', standardSellingPrice: 75.00 },
};

const MOCK_SHIPPING_ZONES = {
  'Algiers': { stopdeskPrice: 4.00, domicilePrice: 6.00 },
  'Oran': { stopdeskPrice: 5.00, domicilePrice: 7.00 },
};
// --- End Mock Data ---


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg },
    scrollView: { padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.primaryText },
    sectionTitle: { fontSize: 18, fontWeight: '500', marginTop: 15, marginBottom: 10, color: COLORS.primaryText },
    input: { backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 10, fontSize: 16 },
    lineItemContainer: { padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.lightGray },
    lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryContainer: { padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginTop: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    summaryText: { fontSize: 16, color: COLORS.secondaryText },
    summaryTotal: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryText },
    primaryButton: { backgroundColor: COLORS.primaryAccent, padding: 15, borderRadius: 99, alignItems: 'center', marginTop: 20 },
    primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    secondaryButtonText: { color: COLORS.primaryAccent, fontSize: 16, fontWeight: '500', textAlign: 'center', padding: 10 },
});

const CreateOrderScreen = () => {
    // Form State
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [wilaya, setWilaya] = useState('Algiers'); // Mocked
    const [shippingMethod, setShippingMethod] = useState('DOMICILE'); // Mocked
    const [lineItems, setLineItems] = useState([{ sku: '', quantity: '1', price: 0 }]);

    // Calculated State
    const [subtotal, setSubtotal] = useState(0);
    const [shippingPrice, setShippingPrice] = useState(0);
    const [total, setTotal] = useState(0);

    // Real-time calculation effect
    useEffect(() => {
        // Calculate subtotal
        const newSubtotal = lineItems.reduce((acc, item) => acc + (item.price * parseInt(item.quantity || '0', 10)), 0);
        setSubtotal(newSubtotal);

        // Calculate shipping
        const zone = MOCK_SHIPPING_ZONES[wilaya];
        const newShippingPrice = zone ? (shippingMethod === 'DOMICILE' ? zone.domicilePrice : zone.stopdeskPrice) : 0;
        setShippingPrice(newShippingPrice);

        // Calculate total
        setTotal(newSubtotal + newShippingPrice);
    }, [lineItems, wilaya, shippingMethod]);


    const handleLineItemChange = (text: string, index: number, field: 'sku' | 'quantity') => {
        const newItems = [...lineItems];
        newItems[index][field] = text;

        // If SKU changes, update the price from our mock DB
        if (field === 'sku') {
            const variantDetails = MOCK_VARIANTS_DB[text];
            newItems[index].price = variantDetails ? variantDetails.standardSellingPrice : 0;
        }

        setLineItems(newItems);
    };

    const addLineItem = () => {
        setLineItems([...lineItems, { sku: '', quantity: '1', price: 0 }]);
    };

    const handleSubmit = () => {
        console.log("Submitting Order:", { customerName, phoneNumber, address, wilaya, shippingMethod, lineItems, total });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>Create New Order</Text>

                <Text style={styles.sectionTitle}>Customer Details</Text>
                <TextInput style={styles.input} placeholder="Customer Name" value={customerName} onChangeText={setCustomerName} />
                <TextInput style={styles.input} placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
                {/* Wilaya and Shipping Method would be dropdowns in a real app */}

                <Text style={styles.sectionTitle}>Line Items</Text>
                {lineItems.map((item, index) => (
                    <View key={index} style={styles.lineItemContainer}>
                        <TextInput style={styles.input} placeholder="Enter SKU (e.g., TS-BLK-M)" value={item.sku} onChangeText={(text) => handleLineItemChange(text, index, 'sku')} />
                        <View style={styles.lineItemRow}>
                            <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Quantity" value={item.quantity} onChangeText={(text) => handleLineItemChange(text, index, 'quantity')} keyboardType="numeric" />
                            <Text style={{fontSize: 16, color: COLORS.primaryText}}>${(item.price * parseInt(item.quantity || '0', 10)).toFixed(2)}</Text>
                        </View>
                    </View>
                ))}
                <TouchableOpacity onPress={addLineItem}>
                    <Text style={styles.secondaryButtonText}>+ Add Product</Text>
                </TouchableOpacity>

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}><Text style={styles.summaryText}>Subtotal</Text><Text style={styles.summaryText}>${subtotal.toFixed(2)}</Text></View>
                    <View style={styles.summaryRow}><Text style={styles.summaryText}>Shipping</Text><Text style={styles.summaryText}>${shippingPrice.toFixed(2)}</Text></View>
                    <View style={styles.summaryRow}><Text style={[styles.summaryText, {fontWeight: 'bold'}]}>Total</Text><Text style={styles.summaryTotal}>${total.toFixed(2)}</Text></View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}><Text style={styles.primaryButtonText}>Create Order</Text></TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CreateOrderScreen;
