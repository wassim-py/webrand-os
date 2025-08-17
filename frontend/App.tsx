import React from 'react';
import FinancesLedgerScreen from './src/screens/FinancesLedgerScreen';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <>
      <FinancesLedgerScreen />
      <StatusBar style="auto" />
    </>
  );
}
