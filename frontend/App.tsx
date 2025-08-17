import React from 'react';
import AddProductScreen from './src/screens/AddProductScreen';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <>
      <AddProductScreen />
      <StatusBar style="auto" />
    </>
  );
}
