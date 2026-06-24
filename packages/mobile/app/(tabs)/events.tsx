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
import { EventCard } from "../../src/components";
import { configure, fetchUpcoming, NewsEvent } from "../../src/api";
import { loadSettings } from "../../src/storage";

const CURRENCIES = [
  "All",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "NZD",
  "CAD",
  "CHF",
];

export default function EventsScreen() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [includeMedium, setIncludeMedium] = useState(false);

  const loadEvents = useCallback(async () => {
    setError(null);
    try {
      const settings = await loadSettings();
      configure(settings.baseUrl, settings.apiKey);
      const currency = filter === "All" ? undefined : filter;
      const res = await fetchUpcoming({ currency, includeMedium });
      setEvents(res.events);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, includeMedium]);

  useEffect(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
      <Text className="text-white text-2xl font-extrabold tracking-wider px-4 pt-2 pb-3">
        Week Calendar
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
      >
        {CURRENCIES.map((c) => (
          <TouchableOpacity
            key={c}
            className={`px-3.5 py-1.5 rounded-full border ${
              filter === c
                ? "bg-blue-500 border-blue-500"
                : "bg-[#141414] border-[#2a2a2a]"
            }`}
            onPress={() => setFilter(c)}
          >
            <Text
              className={`text-[13px] font-semibold ${
                filter === c ? "text-white" : "text-gray-400"
              }`}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          className={`px-3.5 py-1.5 rounded-full border ${
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
            +Medium
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
          <Text className="text-gray-400 text-[13px] mb-3">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </Text>
          {events.map((evt, i) => (
            <EventCard key={`${evt.title}-${evt.event_time}-${i}`} event={evt} />
          ))}
          {events.length === 0 && !error && (
            <Text className="text-gray-400 text-sm text-center mt-10">
              No events found.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
