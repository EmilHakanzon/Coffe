import CoffeeTypeSelector from "@/src/components/CoffeeTypeSelector";
import { CoffeeType, type CoffeeLog } from "@/src/types/coffee";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import styles from "../../src/styles/HomeScreen.styles";
import {
  formDate,
  formtTime,
  getGreeting,
  isReminderTime,
} from "../../src/utils/homeUtils";
export default function HomeScreen() {
  const [selectedCoffeeType, setSelectedCoffeeType] =
    useState<CoffeeType | null>(null);
  const [lastCoffeeTime, setLastCoffeeTime] = useState<Date | null>(null);
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null);
  const [coffeeLog, setCoffeeLog] = useState<CoffeeLog[]>([]);
  const [reminderHours, setReminderHours] = useState(4);
  const [userName, setUserName] = useState("");

  // denna hook körs varje gång homepage blir aktiv och då
  //hämtar den om på nytt.
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const savedReminder = await AsyncStorage.getItem("reminder_hours");
        const saveName = await AsyncStorage.getItem("profile_name");
        const saveLog = await AsyncStorage.getItem("coffee_log");
        if (saveName) setUserName(saveName);
        if (savedReminder) setReminderHours(Number(savedReminder));
        if (saveLog) {
          const parsedLog = JSON.parse(saveLog);
          setCoffeeLog(parsedLog);
          // senaste kaffe tiden om man har loggats
          if (parsedLog.length > 0) {
            setLastCoffeeTime(new Date(parsedLog[0].timestamp));
          } else {
            setLastCoffeeTime(null);
          }
        } else {
          setCoffeeLog([]);
          setLastCoffeeTime(null);
        }
      })();
    }, []),
  );

  // reminder calculate
  useEffect(() => {
    if (lastCoffeeTime) {
      const nextTime = new Date(
        lastCoffeeTime.getTime() + reminderHours * 60 * 60 * 1000,
      );
      setNextReminderTime(nextTime);
    }
  }, [lastCoffeeTime, reminderHours]);

  const handleDrinkCoffee = async () => {
    if (!selectedCoffeeType) {
      Alert.alert("Please select a coffee type before logging!");
      return;
    }
    const now = new Date();
    const newLog: CoffeeLog = {
      id: Date.now().toString(),
      coffeeType: selectedCoffeeType,
      timestamp: now,
    };
    // Uppdetera loggen i AyncStorage, hämtar den gamla coffeeLog
    const updatedLog = [newLog, ...coffeeLog];
    setCoffeeLog(updatedLog);
    setLastCoffeeTime(now);
    await AsyncStorage.setItem("coffee_log", JSON.stringify(updatedLog));

    Alert.alert(
      "Coffe Logged! ☕",
      `Enjoyed your ${selectedCoffeeType.title}! Next reminder in ${reminderHours} hour`,
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
        {userName ? <Text style={styles.greetingName}>{userName}</Text> : null}
      </View>
      {/* Reminder Status */}
      <View style={styles.content}>
        <View
          style={[
            styles.statusCard,
            isReminderTime(nextReminderTime)
              ? styles.reminderActive
              : styles.reminderInactive,
          ]}
        >
          <Ionicons
            name={isReminderTime(nextReminderTime) ? "alarm" : "time-outline"}
            size={32}
            color={isReminderTime(nextReminderTime) ? "#FF6B6B" : "#8B4513"}
          />
          <Text style={styles.statusTitle}>
            {isReminderTime(nextReminderTime)
              ? "Time for Coffee!"
              : "Next Coffee"}
          </Text>
          <Text style={styles.statuTime}>
            {nextReminderTime ? formtTime(nextReminderTime) : "--:--"}
          </Text>
        </View>
        {/* Last Coffe */}
        {lastCoffeeTime && (
          <View style={styles.LastCoffeCard}>
            <Text style={styles.lastCoffeeLabel}>Last Coffee</Text>
            <Text style={styles.lastCoffeeType}>
              {coffeeLog[0]?.coffeeType.title}
            </Text>
            <Text style={styles.lastCoffeeTime}>
              {formDate(lastCoffeeTime)} at {formtTime(lastCoffeeTime)}
            </Text>
          </View>
        )}

        {/* Coffee Select */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Choose Your Coffee ☕</Text>
          <CoffeeTypeSelector
            selectedType={selectedCoffeeType}
            onSelect={setSelectedCoffeeType}
          />
        </View>

        {/* Drink BUtton */}
        <TouchableOpacity
          style={styles.drinkButton}
          onPress={handleDrinkCoffee}
        >
          <Ionicons name="cafe" size={24} color="#FFFFFF" />
          <Text style={styles.drinkButtonText}>
            I Just Had{" "}
            {selectedCoffeeType ? selectedCoffeeType.title : "a coffee"}
          </Text>
        </TouchableOpacity>

        {/* Recent Coffe Summary */}
        {coffeeLog.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Coffee</Text>
            <Text style={styles.summaryCount}>
              {
                coffeeLog.filter(
                  (log) =>
                    new Date(log.timestamp).toDateString() ===
                    new Date().toDateString(),
                ).length
              }{" "}
              Cups
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
