import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, TextInput, Title } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

export default function CustomizeScreen() {
  const { text: rawText, name: rawName } = useLocalSearchParams();
  const text = typeof rawText === 'string' ? rawText : '';
  const name = typeof rawName === 'string' ? rawName : '';
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const router = useRouter();

  useEffect(() => {
    const loadExisting = async () => {
      const all = await AsyncStorage.getItem('custom_qr_map');
      const parsed = all ? JSON.parse(all) : {};
      const key = `${name}|${text}`;
      if (parsed[key]) {
        setQrColor(parsed[key].qrColor || '#000000');
        setBgColor(parsed[key].bgColor || '#ffffff');
      }
    };
    loadExisting();
  }, [name, text]);

  const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{6})$/.test(hex);

  const handleSaveCustomization = async () => {
    if (!isValidHex(qrColor) || !isValidHex(bgColor)) {
      Alert.alert('Invalid Color', 'Please enter valid 6-digit hex colors like #000000.');
      return;
    }

    const all = await AsyncStorage.getItem('custom_qr_map');
    const parsed = all ? JSON.parse(all) : {};

    const key = `${name}|${text}`;
    parsed[key] = { qrColor, bgColor };

    await AsyncStorage.setItem('custom_qr_map', JSON.stringify(parsed));

    router.push({
      pathname: '/analytics',
      params: { text, name },
    });
  };

  if (!text || !name) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Missing project data.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>Customize QR: {name}</Title>

      <QRCode value={text} size={200} color={qrColor} backgroundColor={bgColor} />

      <Text style={styles.label}>QR Code Color:</Text>
      <TextInput
        mode="outlined"
        value={qrColor}
        onChangeText={setQrColor}
        placeholder="#000000"
        style={styles.input}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Background Color:</Text>
      <TextInput
        mode="outlined"
        value={bgColor}
        onChangeText={setBgColor}
        placeholder="#ffffff"
        style={styles.input}
        autoCapitalize="none"
      />

      <Button mode="contained" style={styles.saveButton} onPress={handleSaveCustomization}>
        Save Customization
      </Button>
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
    fontSize: 20,
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    marginTop: 20,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    marginTop: 8,
  },
  saveButton: {
    marginTop: 32,
    width: '100%',
  },
  error: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});
