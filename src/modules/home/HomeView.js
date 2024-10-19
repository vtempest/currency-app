import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import create from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Path } from 'react-native-svg';

const useStore = create(
  persist(
    (set) => ({
      conversionRates: [],
      setConversionRates: (rates) => set({ conversionRates: rates }),
    }),
    {
      name: 'currency-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

const fetchConversionRates = async () => {
  try {
    const response = await axios.get('https://www.floatrates.com/daily/usd.json');
    return Object.values(response.data).map((rate) => ({
      ...rate,
      rate: parseFloat(rate.rate),
    }));
  } catch (error) {
    console.error('Error fetching conversion rates:', error);
    return [];
  }
};

const CurrencyIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

const UpdateIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 2v6h-6" />
    <Path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <Path d="M3 22v-6h6" />
    <Path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </Svg>
);

const CurrencyItem = ({ item }) => (
  <View style={styles.item}>
    <View style={styles.itemHeader}>
      <CurrencyIcon />
      <Text style={styles.title}>{item.name} ({item.code})</Text>
    </View>
    <View style={styles.itemContent}>
      <Text>Rate: {item.rate.toFixed(4)}</Text>
      <View style={styles.updateInfo}>
        <UpdateIcon />
        <Text style={styles.updateText}>Last update: {new Date(item.date).toLocaleString()}</Text>
      </View>
    </View>
  </View>
);

export default function App() {
  const { conversionRates, setConversionRates } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      const rates = await fetchConversionRates();
      setConversionRates(rates);
      setIsLoading(false);
    };

    fetchRates();
    const interval = setInterval(fetchRates, 10000); // Fetch every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const sortedRates = [...conversionRates].sort((a, b) => a.rate - b.rate);
  const lowestRate = sortedRates[0];
  const highestRate = sortedRates[sortedRates.length - 1];

  if (isLoading && conversionRates.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading currency rates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.header}>Currency Conversion Rates (USD)</Text>
      {isLoading && (
        <ActivityIndicator size="small" color="#0000ff" style={styles.updatingIndicator} />
      )}
      {lowestRate && (
        <View style={styles.extremeRate}>
          <Text>Lowest: {lowestRate.name} ({lowestRate.code}) - {lowestRate.rate.toFixed(4)}</Text>
        </View>
      )}
      {highestRate && (
        <View style={styles.extremeRate}>
          <Text>Highest: {highestRate.name} ({highestRate.code}) - {highestRate.rate.toFixed(4)}</Text>
        </View>
      )}
      <FlatList
        data={conversionRates}
        renderItem={({ item }) => <CurrencyItem item={item} />}
        keyExtractor={(item) => item.code}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  updatingIndicator: {
    marginBottom: 10,
  },
  item: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    marginVertical: 8,
    borderRadius: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  itemContent: {
    marginLeft: 34,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  updateText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#666',
  },
  extremeRate: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginBottom: 8,
    borderRadius: 5,
  },
});