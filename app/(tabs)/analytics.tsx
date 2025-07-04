import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Title } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';

export default function AnalyticsScreen() {
  const { text: rawText, name: rawName } = useLocalSearchParams();
  const text = typeof rawText === 'string' ? rawText : '';
  const name = typeof rawName === 'string' ? rawName : '';
  const router = useRouter();

  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const qrRef = useRef<React.ComponentRef<typeof ViewShot>>(null);

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

  const handleShareQR = async () => {
    const ref = qrRef.current;
    if (!ref || typeof ref.capture !== 'function') {
      Alert.alert('QR not ready to share');
      return;
    }

    const uri = await ref.capture();
    await Sharing.shareAsync(uri);
  };

  if (!text || !name) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Missing QR data. Please go back and select a project.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>{name}</Title>

      <Text style={styles.label}>QR Code:</Text>
      <View style={styles.qrWrapper}>
        <ViewShot ref={qrRef}>
          <QRCode value={text} size={200} color={qrColor} backgroundColor={bgColor} />
        </ViewShot>
      </View>

      <Button mode="outlined" onPress={handleShareQR}>
        Share QR
      </Button>

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
    textAlign: 'center',
  },
});
