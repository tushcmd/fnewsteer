import React from "react";
import { View, Text } from "react-native";
import { BlackoutZone } from "../api/types";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

function impactDot(impact: string) {
  switch (impact) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

export function ZoneCard({ zone }: { zone: BlackoutZone }) {
  const now = new Date();
  const start = new Date(zone.start);
  const end = new Date(zone.end);
  const isActive = now >= start && now <= end;
  const isPast = now > end;

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
      <View className="flex-row items-center mb-1.5 gap-2">
        <View className={`w-2.5 h-2.5 rounded-full ${impactDot(zone.impact)}`} />
        <Text className="text-blue-500 text-[13px] font-bold">
          {zone.currency}
        </Text>
        <Text className="text-gray-400 text-xs ml-auto">
          {formatDate(zone.start)}
        </Text>
      </View>

      <Text className="text-white text-sm font-semibold mb-1">
        {zone.event}
      </Text>

      <View className="flex-row items-center justify-between">
        <Text className="text-gray-400 text-[13px]">
          {formatTime(zone.start)} – {formatTime(zone.end)}
        </Text>
        {isActive && (
          <Text className="text-red-500 text-[11px] font-extrabold tracking-widest">
            ACTIVE
          </Text>
        )}
      </View>
    </View>
  );
}
