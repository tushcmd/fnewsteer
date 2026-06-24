import React from "react";
import { View, Text } from "react-native";
import { NewsEvent } from "../api/types";

function impactColor(impact: string) {
  switch (impact) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

export function EventCard({ event }: { event: NewsEvent }) {
  const now = new Date();
  const windowStart = new Date(event.window_start);
  const windowEnd = new Date(event.window_end);
  const isActive = now >= windowStart && now <= windowEnd;
  const isPast = now > windowEnd;

  return (
    <View
      className={`bg-[#141414] rounded-xl p-3.5 mb-2.5 border ${
        isActive
          ? "border-red-500 bg-red-950/30"
          : isPast
          ? "border-[#2a2a2a] opacity-50"
          : "border-[#2a2a2a]"
      }`}
    >
      <View className="flex-row items-center mb-2 gap-2">
        <View className={`px-2 py-0.5 rounded ${impactColor(event.impact)}`}>
          <Text className="text-white text-[11px] font-bold uppercase">
            {event.impact}
          </Text>
        </View>
        <Text className="text-blue-500 text-[13px] font-bold">
          {event.currency}
        </Text>
        <Text className="text-gray-400 text-xs ml-auto">
          {formatDate(event.event_time)}
        </Text>
      </View>

      <Text className="text-white text-[15px] font-semibold mb-1.5">
        {event.title}
      </Text>

      <Text className="text-white text-[13px] font-medium">
        {formatTime(event.event_time)}
      </Text>
      <Text className="text-gray-400 text-xs">
        Window: {formatTime(event.window_start)} – {formatTime(event.window_end)}{" "}
        ({event.window_minutes}m)
      </Text>

      {(event.forecast || event.previous) && (
        <View className="flex-row flex-wrap gap-2.5 mt-2 pt-2 border-t border-[#2a2a2a]">
          {event.forecast && (
            <Text className="text-gray-400 text-xs">
              Forecast: {event.forecast}
            </Text>
          )}
          {event.previous && (
            <Text className="text-gray-400 text-xs">
              Previous: {event.previous}
            </Text>
          )}
          {event.actual && (
            <Text className="text-green-500 text-xs font-semibold">
              Actual: {event.actual}
            </Text>
          )}
        </View>
      )}

      {isActive && (
        <Text className="text-red-500 text-[11px] font-extrabold tracking-widest mt-2 text-center">
          BLACKOUT ACTIVE
        </Text>
      )}
    </View>
  );
}
