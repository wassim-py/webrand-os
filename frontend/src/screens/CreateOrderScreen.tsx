import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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

interface Variant {
  sku: string;
  product: { name: string };
  standardSellingPrice: number;
}

interface ShippingZone {
  wilaya: string;
  stopdeskPrice: number;
  domicilePrice: number;
}

interface LineItem {
  sku: string;
  quantity: string;
  price: number;
}

const CreateOrderScreen = () => {
  // Data State
  const [variants, setVariants] = useState<Variant[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [wilaya, setWilaya] = useState<string | undefined>();
  const [shippingMethod, setShippingMethod] = useState('DOMICILE');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ sku: '', quantity: '1', price: 0 }]);

  // Calculated State
  const [subtotal, setSubtotal] = useState(0);
  const [shippingPrice, setShippingPrice] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [variantsRes, zonesRes] = await Promise.all([
          apiClient.get('/products'),
          apiClient.get('/shipping-zones'),
        ]);
        setVariants(variantsRes.data);
        setShippingZones(zonesRes.data);
        if (zonesRes.data.length > 0) {
          setWilaya(zonesRes.data[0].wilaya);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load necessary data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const newSubtotal = lineItems.reduce((acc, item) => acc + (item.price * parseInt(item.quantity || '0', 10)), 0);
    setSubtotal(newSubtotal);

    const zone = shippingZones.find(z => z.wilaya === wilaya);
    const newShippingPrice = zone ? (shippingMethod === 'DOMICILE' ? Number(zone.domicilePrice) : Number(zone.stopdeskPrice)) : 0;
    setShippingPrice(newShippingPrice);

    setTotal(newSubtotal + newShippingPrice);
  }, [lineItems, wilaya, shippingMethod, shippingZones]);

  const handleLineItemChange = (value: string, index: number, field: 'sku' | 'quantity') => {
    const newItems = [...lineItems];
    if (field === 'sku') {
      newItems[index].sku = value;
      const variantDetails = variants.find(v => v.sku === value);
      newItems[index].price = variantDetails ? Number(variantDetails.standardSellingPrice) : 0;
    } else {
      newItems[index].quantity = value;
    }
    setLineItems(newItems);
  };

  const addLineItem = () => setLineItems([...lineItems, { sku: '', quantity: '1', price: 0 }]);
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!customerName || !phoneNumber || !address || !wilaya || lineItems.some(item => !item.sku || !item.quantity)) {
        Alert.alert('Validation Error', 'Please fill all required fields and ensure line items are complete.');
        return;
    }

    const orderData = {
        customerName,
        phoneNumber,
        address,
        wilaya,
        shippingMethod,
        lineItems: lineItems.map(li => ({
            sku: li.sku,
            quantity: parseInt(li.quantity, 10),
            actualSalePrice: li.price,
        })),
    };

    try {
        await apiClient.post('/orders', orderData);
        Alert.alert('Success', 'Order created successfully!');
        // Reset form or navigate away
    } catch (error) {
        Alert.alert('Error', 'Failed to create order.');
    }
  };

  if (loading) return <ActivityIndicator style={{flex: 1, justifyContent: 'center'}} size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Create New Order</Text>

        <Text style={styles.sectionTitle}>Customer Details</Text>
        <TextInput style={styles.input} placeholder="Customer Name" value={customerName} onChangeText={setCustomerName} />
        <TextInput style={styles.input} placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />

        <Text style={styles.sectionTitle}>Shipping</Text>
        <View style={styles.pickerContainer}><Picker selectedValue={wilaya} onValueChange={(itemValue) => setWilaya(itemValue)}><Picker.Item label="Select Wilaya..." value={undefined} />{shippingZones.map(zone => <Picker.Item key={zone.wilaya} label={zone.wilaya} value={zone.wilaya} />)}</Picker></View>
        <View style={styles.pickerContainer}><Picker selectedValue={shippingMethod} onValueChange={(itemValue) => setShippingMethod(itemValue)}><Picker.Item label="Domicile" value="DOMICILE" /><Picker.Item label="Stopdesk" value="STOPDESK" /></Picker></View>

        <Text style={styles.sectionTitle}>Line Items</Text>
        {lineItems.map((item, index) => (
            <View key={index} style={styles.lineItemContainer}>
                <View style={styles.pickerContainer}><Picker selectedValue={item.sku} onValueChange={(value) => handleLineItemChange(value, index, 'sku')}><Picker.Item label="Select Product..." value="" />{variants.map(v => <Picker.Item key={v.sku} label={`${v.sku} - ${v.product.name}`} value={v.sku} />)}</Picker></View>
                <View style={styles.lineItemRow}>
                    <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Quantity" value={item.quantity} onChangeText={(text) => handleLineItemChange(text, index, 'quantity')} keyboardType="numeric" />
                    <Text style={{fontSize: 16}}>${(item.price * parseInt(item.quantity || '0', 10)).toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={() => removeLineItem(index)}><Text style={{color: COLORS.error, textAlign: 'right'}}>Remove</Text></TouchableOpacity>
            </View>
        ))}
        <TouchableOpacity onPress={addLineItem}><Text style={styles.secondaryButtonText}>+ Add Product</Text></TouchableOpacity>

        <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}><Text>Subtotal</Text><Text>${subtotal.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text>Shipping</Text><Text>${shippingPrice.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={{fontWeight: 'bold'}}>Total</Text><Text style={{fontWeight: 'bold'}}>${total.toFixed(2)}</Text></View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}><Text style={styles.primaryButtonText}>Create Order</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightBg },
    scrollView: { padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.primaryText },
    sectionTitle: { fontSize: 18, fontWeight: '500', marginTop: 15, marginBottom: 10, color: COLORS.primaryText },
    input: { backgroundColor: COLORS.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 10, fontSize: 16 },
    pickerContainer: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 10 },
    lineItemContainer: { padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.lightGray },
    lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    summaryContainer: { padding: 15, backgroundColor: COLORS.white, borderRadius: 16, marginTop: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    primaryButton: { backgroundColor: COLORS.primaryAccent, padding: 15, borderRadius: 99, alignItems: 'center', marginTop: 20 },
    primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    secondaryButtonText: { color: COLORS.primaryAccent, fontSize: 16, fontWeight: '500', textAlign: 'center', padding: 10 },
});

export default CreateOrderScreen;
