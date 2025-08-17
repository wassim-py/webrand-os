import React from 'react';
import CreateOrderScreen from './src/screens/CreateOrderScreen';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <>
      <CreateOrderScreen />
      <StatusBar style="auto" />
    </>
  );
}
