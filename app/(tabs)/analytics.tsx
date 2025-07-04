import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Title } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

export default function AnalyticsScreen() {
  const { text, name } = useLocalSearchParams<{ text: string; name: string }>();
  const router = useRouter();
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  
  useEffect(() => {
    const loadCustomization = async () => {
      const all = await AsyncStorage.getItem('custom_qr_map');
      const parsed = all ? JSON.parse(all) : {};
      const key = `${name}|${text}`;
      if (parsed[key]) {
        setQrColor(parsed[key].qrColor || '#000000');
        setBgColor(parsed[key].bgColor || '#ffffff');
      }
    };
    loadCustomization();
  }, [name, text]);
  

  if (!text || !name) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Missing QR data. Please go back and select a project.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>{name}</Title>

      <Text style={styles.label}>QR Code:</Text>
      <View style={styles.qrWrapper}>
        <QRCode value={text} size={200} color={qrColor} backgroundColor={bgColor} />
      </View>

      <Text style={styles.label}>Encoded Content:</Text>
      <Text style={styles.content}>{text}</Text>

      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          onPress={() =>
            router.push({ pathname: '/customize', params: { text, name } })
          }
          style={styles.button}
        >
          Customize
        </Button>
        <Button mode="outlined" onPress={() => {}} style={styles.button}>
          Track
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  content: {
    fontSize: 14,
    marginTop: 4,
    color: '#333',
    textAlign: 'center',
  },
  qrWrapper: {
    marginTop: 12,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  button: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});
