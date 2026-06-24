import React from "react";
import { View, Text } from "react-native";

export function StatusBadge({ safe, symbol }: { safe: boolean; symbol: string }) {
  return (
    <View
      className={`flex-row items-center py-4 px-5 rounded-xl gap-2.5 ${
        safe
          ? "bg-green-900/60 border border-green-500"
          : "bg-red-900/60 border border-red-500"
      }`}
    >
      <View
        className={`w-3 h-3 rounded-full ${
          safe ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <Text
        className={`text-base font-bold tracking-widest ${
          safe ? "text-green-500" : "text-red-500"
        }`}
      >
        {safe ? "SAFE TO TRADE" : "DO NOT TRADE"}
      </Text>
      <Text className="text-gray-400 text-sm font-semibold ml-auto">
        {symbol}
      </Text>
    </View>
  );
}
