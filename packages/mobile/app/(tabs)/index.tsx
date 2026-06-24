import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBadge, EventCard } from "../../src/components";
import {
  configure,
  fetchCheck,
  fetchUpcoming,
  CheckResponse,
  NewsEvent,
} from "../../src/api";
import { loadSettings } from "../../src/storage";

export default function CheckScreen() {
  const [pair, setPair] = useState("EURUSD");
  const [checkResult, setCheckResult] = useState<CheckResponse | null>(null);
  const [upcoming, setUpcoming] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await loadSettings();
      configure(settings.baseUrl, settings.apiKey);
      setPair(settings.pair);

      const [checkRes, upcomingRes] = await Promise.all([
        fetchCheck({ symbol: settings.pair }),
        fetchUpcoming({ currency: settings.pair }),
      ]);
      setCheckResult(checkRes);
      setUpcoming(upcomingRes.events);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheck = async () => {
    if (!pair.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const settings = await loadSettings();
      configure(settings.baseUrl, settings.apiKey);
      const res = await fetchCheck({ symbol: pair.trim() });
      setCheckResult(res);
      const upcomingRes = await fetchUpcoming({ currency: pair.trim() });
      setUpcoming(upcomingRes.events);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
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
        <Text className="text-white text-3xl font-extrabold tracking-widest mb-1">
          FNEWSTEER
        </Text>
        <Text className="text-gray-400 text-[13px] mb-5 italic">
          Don't paddle out into a hurricane unaware.
        </Text>

        <View className="flex-row gap-2.5 mb-5">
          <TextInput
            className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-xl px-3.5 py-3 text-white text-base font-semibold tracking-wider"
            value={pair}
            onChangeText={setPair}
            placeholder="EURUSD"
            placeholderTextColor="#888888"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            className="bg-blue-500 rounded-xl px-5 justify-center"
            onPress={handleCheck}
            disabled={loading}
          >
            <Text className="text-white font-bold text-sm tracking-wider">
              CHECK
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing && (
          <ActivityIndicator
            size="large"
            color="#3b82f6"
            style={{ marginVertical: 20 }}
          />
        )}

        {error && (
          <View className="bg-red-900/60 border border-red-500 rounded-xl p-3.5 mb-4">
            <Text className="text-red-500 text-[13px]">{error}</Text>
          </View>
        )}

        {checkResult && !loading && (
          <>
            <StatusBadge
              safe={checkResult.safe_to_trade}
              symbol={checkResult.symbol}
            />
            {!checkResult.safe_to_trade &&
              checkResult.blocking_events.length > 0 && (
                <View className="mt-4">
                  <Text className="text-white text-lg font-bold mb-2.5">
                    Blocking Events
                  </Text>
                  {checkResult.blocking_events.map((evt, i) => (
                    <View
                      key={i}
                      className="bg-[#141414] rounded-lg p-3 mb-2 border border-[#2a2a2a]"
                    >
                      <Text className="text-white text-sm font-semibold">
                        {evt.title}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {evt.currency} · {evt.impact} ·{" "}
                        {evt.minutes_to_event !== null
                          ? evt.minutes_to_event > 0
                            ? `${Math.round(evt.minutes_to_event)}m away`
                            : `${Math.abs(
                                Math.round(evt.minutes_to_event)
                              )}m ago`
                          : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
          </>
        )}

        {upcoming.length > 0 && !loading && (
          <View className="mt-6">
            <Text className="text-white text-lg font-bold mb-2.5">
              Upcoming Events
            </Text>
            {upcoming.map((evt, i) => (
              <EventCard key={i} event={evt} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
