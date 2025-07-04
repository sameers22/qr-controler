import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Divider, TextInput, Title } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';

export default function GenerateScreen() {
  const [text, setText] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [search, setSearch] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const qrRef = useRef(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    handleSearch(search);
  }, [projects, search]);

  const loadProjects = async () => {
    const stored = await AsyncStorage.getItem('qr_projects');
    if (stored) {
      const parsed = JSON.parse(stored);
      setProjects(parsed);
    }
  };

  const saveProjects = async (list: any[]) => {
    setProjects(list);
    await AsyncStorage.setItem('qr_projects', JSON.stringify(list));
  };

  const saveProject = async () => {
    const newEntry = {
      name: projectName.trim(),
      text: text.trim(),
      time: new Date().toLocaleString(),
    };
    const updated = [newEntry, ...projects.slice(0, 19)];
    await saveProjects(updated);
    setProjectName('');
    setShowProjectModal(false);
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const handleGenerate = () => {
    if (!text.trim()) return;
    setShowQR(true);
    Alert.alert(
      'Save Project',
      'Do you want to save this QR code project?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => setShowProjectModal(true) },
      ],
      { cancelable: true }
    );
  };

  const handleClear = () => {
    setText('');
    setShowQR(false);
  };

  const handleProjectPress = async (item: any) => {
    await AsyncStorage.setItem('active_project', JSON.stringify(item));
    router.push({ pathname: '/analytics', params: { text: item.text, name: item.name } });
  };

  const handleDeleteProject = (indexToDelete: number) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleted = projects[indexToDelete];
            const updated = projects.filter((_, i) => i !== indexToDelete);
            await saveProjects(updated);

            const active = await AsyncStorage.getItem('active_project');
            if (active) {
              const activeProject = JSON.parse(active);
              if (activeProject.name === deleted.name && activeProject.text === deleted.text) {
                await AsyncStorage.removeItem('active_project');
              }
            }
          },
        },
      ]
    );
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setFilteredProjects(projects);
    } else {
      const lower = query.toLowerCase();
      const filtered = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.text.toLowerCase().includes(lower)
      );
      setFilteredProjects(filtered);
    }
  };

  const handleEditChange = (field: 'name' | 'text', value: string, index: number) => {
    const updated = [...projects];
    updated[index][field] = value;
    updated[index].time = new Date().toLocaleString();
    setProjects(updated);
  };

  const saveEditedProject = async () => {
    await saveProjects(projects);
    setEditIndex(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Title style={styles.heading}>QR Code Generator</Title>

      <TextInput
        label="Enter URL or text"
        mode="outlined"
        value={text}
        onChangeText={(val) => {
          setText(val);
          if (!val.trim()) setShowQR(false);
        }}
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          onPress={handleGenerate}
          style={styles.button}
          disabled={!text.trim()}
        >
          Generate QR
        </Button>
        <Button mode="outlined" onPress={handleClear} style={styles.button}>
          Clear
        </Button>
      </View>

      {showQR && (
        <View style={styles.qrContainer}>
          <ViewShot ref={qrRef}>
            <QRCode value={text} size={200} />
          </ViewShot>
        </View>
      )}

      <Divider style={{ marginVertical: 24 }} />
      <TextInput
        placeholder="Search saved projects..."
        mode="outlined"
        value={search}
        onChangeText={handleSearch}
        style={{ marginBottom: 16 }}
      />

      <Title style={styles.historyTitle}>Saved Projects</Title>
      <FlatList
        ref={flatListRef}
        data={filteredProjects}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.historyItem}>
            {editIndex === index ? (
              <>
                <RNTextInput
                  value={item.name}
                  onChangeText={(val) => handleEditChange('name', val, index)}
                  style={styles.editField}
                  placeholder="Project Name"
                />
                <RNTextInput
                  value={item.text}
                  onChangeText={(val) => handleEditChange('text', val, index)}
                  style={styles.editField}
                  placeholder="QR Content"
                />
                <View style={styles.editActions}>
                  <Button onPress={saveEditedProject}>Save</Button>
                  <Button onPress={() => setEditIndex(null)}>Cancel</Button>
                </View>
              </>
            ) : (
              <TouchableOpacity onPress={() => handleProjectPress(item)}>
                <Text style={styles.historyText}>{item.name}</Text>
                <Text style={styles.historySubText}>{item.text}</Text>
                <Text style={styles.historyTime}>{item.time}</Text>
                <ViewShot style={{ marginTop: 8 }}>
                  <QRCodeRenderer name={item.name} text={item.text} />
                </ViewShot>
                <View style={styles.actionRow}>
                  <Button onPress={() => setEditIndex(index)}>Edit</Button>
                  <Button
                    onPress={() => handleDeleteProject(index)}
                    labelStyle={{ color: 'red' }}
                  >
                    Delete
                  </Button>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No saved QR projects found.</Text>}
      />

      {/* Save Project Modal */}
      <Modal visible={showProjectModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Project Name</Text>
            <TextInput
              mode="outlined"
              placeholder="e.g. My Menu QR"
              value={projectName}
              onChangeText={setProjectName}
              style={{ marginBottom: 12 }}
            />
            <Button
              mode="contained"
              onPress={saveProject}
              disabled={!projectName.trim()}
            >
              Save Project
            </Button>
            <Button
              onPress={() => setShowProjectModal(false)}
              style={{ marginTop: 8 }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// 🔹 QR Renderer with color/background support
const QRCodeRenderer = ({ name, text }: { name: string; text: string }) => {
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  useEffect(() => {
    const loadCustomization = async () => {
      const stored = await AsyncStorage.getItem('custom_qr');
      if (stored) {
        const custom = JSON.parse(stored);
        if (custom.name === name && custom.text === text) {
          setQrColor(custom.qrColor);
          setBgColor(custom.bgColor);
        }
      }
    };
    loadCustomization();
  }, []);

  return <QRCode value={text} size={80} color={qrColor} backgroundColor={bgColor} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  heading: { textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
  input: { marginBottom: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 32 },
  button: { flex: 1 },
  qrContainer: { alignItems: 'center' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  historyText: { fontSize: 16, fontWeight: '600' },
  historySubText: { fontSize: 14, color: '#333' },
  historyTime: { fontSize: 12, color: '#888' },
  modalBackdrop: { flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '80%', elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  deleteButton: { marginTop: 8, alignSelf: 'flex-end' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 8 },
  editField: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginVertical: 6 },
  editActions: { flexDirection: 'row', gap: 16, justifyContent: 'flex-end' },
});
