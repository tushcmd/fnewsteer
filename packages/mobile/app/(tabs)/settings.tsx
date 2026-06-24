import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { loadSettings, saveSettings } from '../../src/storage';
import { configure, fetchHealth } from '../../src/api';

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:8000');
  const [apiKey, setApiKey] = useState('');
  const [pair, setPair] = useState('EURUSD');
  const [saved, setSaved] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSettings().then((s) => {
      setBaseUrl(s.baseUrl);
      setApiKey(s.apiKey);
      setPair(s.pair);
    });
  }, []);

  const handleSave = async () => {
    await saveSettings({ baseUrl, apiKey, pair });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    try {
      configure(baseUrl, apiKey);
      const health = await fetchHealth();
      setHealthStatus(
        `Connected! Cache ${health.cache_populated ? 'populated' : 'empty'} (${health.cache_age_seconds ?? '—'}s)`
      );
    } catch (e: any) {
      setHealthStatus(`Error: ${e.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Settings</Text>

        <Text style={styles.label}>API Base URL</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="http://localhost:8000"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>API Key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="your-api-key"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Text style={styles.label}>Default Pair</Text>
        <TextInput
          style={styles.input}
          value={pair}
          onChangeText={setPair}
          placeholder="EURUSD"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{saved ? 'Saved!' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={handleTestConnection}>
            <Text style={styles.testButtonText}>Test Connection</Text>
          </TouchableOpacity>
        </View>

        {healthStatus && (
          <View style={[styles.healthBox, healthStatus.startsWith('Error') ? styles.healthError : styles.healthOk]}>
            <Text style={styles.healthText}>{healthStatus}</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About</Text>
          <Text style={styles.infoText}>
            FNEWSTEER tells your algo bot when NOT to trade by flagging high-impact news blackout windows.
          </Text>
          <Text style={styles.infoText}>
            Configure your API URL and key above. The app connects to your FNEWSTEER API instance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 24,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  testButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  testButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  healthBox: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
  },
  healthOk: {
    backgroundColor: colors.greenDim,
    borderColor: colors.green,
  },
  healthError: {
    backgroundColor: colors.redDim,
    borderColor: colors.red,
  },
  healthText: {
    fontSize: 13,
    color: colors.text,
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
    gap: 8,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
