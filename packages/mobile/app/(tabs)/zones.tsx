import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ZoneCard } from "../../src/components";
import { configure, fetchBlackoutZones, BlackoutZone } from "../../src/api";
import { loadSettings } from "../../src/storage";

export default function ZonesScreen() {
  const [zones, setZones] = useState<BlackoutZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeMedium, setIncludeMedium] = useState(false);

  const loadZones = useCallback(async () => {
    setError(null);
    try {
      const settings = await loadSettings();
      configure(settings.baseUrl, settings.apiKey);
      const res = await fetchBlackoutZones({ includeMedium });
      setZones(res.zones);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [includeMedium]);

  useEffect(() => {
    setLoading(true);
    loadZones();
  }, [loadZones]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadZones();
    setRefreshing(false);
  };

  const now = new Date();
  const activeZones = zones.filter(
    (z) => now >= new Date(z.start) && now <= new Date(z.end)
  );
  const upcomingZones = zones.filter((z) => new Date(z.start) > now);

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
      <Text className="text-white text-2xl font-extrabold tracking-wider px-4 pt-2 pb-3">
        Blackout Zones
      </Text>

      <View className="px-4 pb-3">
        <TouchableOpacity
          className={`px-4 py-2 rounded-full border self-start ${
            includeMedium
              ? "bg-yellow-900/60 border-yellow-500"
              : "bg-[#141414] border-[#2a2a2a]"
          }`}
          onPress={() => setIncludeMedium(!includeMedium)}
        >
          <Text
            className={`text-[13px] font-semibold ${
              includeMedium ? "text-yellow-500" : "text-gray-400"
            }`}
          >
            Include Medium Impact
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ flex: 1, justifyContent: "center" }}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          }
        >
          {error && (
            <View className="bg-red-900/60 border border-red-500 rounded-xl p-3.5 mb-4">
              <Text className="text-red-500 text-[13px]">{error}</Text>
            </View>
          )}

          {activeZones.length > 0 && (
            <View className="mb-5">
              <Text className="text-red-500 text-base font-bold mb-2.5 tracking-wide">
                ACTIVE NOW ({activeZones.length})
              </Text>
              {activeZones.map((z, i) => (
                <ZoneCard key={i} zone={z} />
              ))}
            </View>
          )}

          {upcomingZones.length > 0 && (
            <View className="mb-5">
              <Text className="text-white text-base font-bold mb-2.5 tracking-wide">
                Upcoming ({upcomingZones.length})
              </Text>
              {upcomingZones.map((z, i) => (
                <ZoneCard key={i} zone={z} />
              ))}
            </View>
          )}

          {zones.length === 0 && !error && (
            <Text className="text-gray-400 text-sm text-center mt-10">
              No blackout zones this week.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
