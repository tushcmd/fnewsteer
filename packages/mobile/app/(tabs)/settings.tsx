import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { loadSettings, saveSettings } from "../../src/storage";
import { configure, fetchHealth } from "../../src/api";

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState("https://fnewsteer-api.onrender.com");
  const [apiKey, setApiKey] = useState("");
  const [pair, setPair] = useState("EURUSD");
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
        `Connected! Cache ${
          health.cache_populated ? "populated" : "empty"
        } (${health.cache_age_seconds ?? "—"}s)`
      );
    } catch (e: any) {
      setHealthStatus(`Error: ${e.message}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Text className="text-white text-2xl font-extrabold tracking-wider mb-6">
          Settings
        </Text>

        <Text className="text-gray-400 text-xs font-semibold tracking-wide uppercase mb-1.5">
          API Base URL
        </Text>
        <TextInput
          className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-3.5 py-3 text-white text-[15px] mb-4"
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="https://fnewsteer-api.onrender.com"
          placeholderTextColor="#888888"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text className="text-gray-400 text-xs font-semibold tracking-wide uppercase mb-1.5">
          API Key
        </Text>
        <TextInput
          className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-3.5 py-3 text-white text-[15px] mb-4"
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="your-api-key"
          placeholderTextColor="#888888"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Text className="text-gray-400 text-xs font-semibold tracking-wide uppercase mb-1.5">
          Default Pair
        </Text>
        <TextInput
          className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-3.5 py-3 text-white text-[15px] mb-5"
          value={pair}
          onChangeText={setPair}
          placeholder="EURUSD"
          placeholderTextColor="#888888"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <View className="flex-row gap-2.5 mb-4">
          <TouchableOpacity
            className="flex-1 bg-blue-500 rounded-xl py-3.5 items-center"
            onPress={handleSave}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={saved ? "checkmark-circle" : "save"}
                size={18}
                color="white"
              />
              <Text className="text-white font-bold text-[15px]">
                {saved ? "Saved!" : "Save"}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-[#1e1e1e] rounded-xl py-3.5 items-center border border-[#2a2a2a]"
            onPress={handleTestConnection}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="pulse" size={18} color="white" />
              <Text className="text-white font-semibold text-[15px]">
                Test Connection
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {healthStatus && (
          <View
            className={`rounded-xl p-3.5 mb-6 border ${
              healthStatus.startsWith("Error")
                ? "bg-red-900/60 border-red-500"
                : "bg-green-900/60 border-green-500"
            }`}
          >
            <Text className="text-white text-[13px]">{healthStatus}</Text>
          </View>
        )}

        <View className="border-t border-[#2a2a2a] pt-5 gap-2">
          <Text className="text-white text-base font-bold">About</Text>
          <Text className="text-gray-400 text-[13px] leading-[18px]">
            FNEWSTEER tells your algo bot when NOT to trade by flagging
            high-impact news blackout windows.
          </Text>
          <Text className="text-gray-400 text-[13px] leading-[18px]">
            Configure your API URL and key above. The app connects to your
            FNEWSTEER API instance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
