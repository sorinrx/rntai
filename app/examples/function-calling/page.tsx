"use client";

import React, { useState } from "react";
import styles from "../shared/page.module.css";
import Chat from "../../components/chat";
import WeatherWidget from "../../components/weather-widget";
import { getWeather } from "../../utils/weather";
import { getExchangeRate } from "../../utils/exchangeRate";
import { addLead, addMeeting } from "../../utils/bitrix";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import ProtectedPage from "../../components/ProtectedPage";

interface WeatherData {
  location?: string;
  temperature?: number;
  conditions?: string;
}

interface ExchangeRateData {
  currency?: string;
  rate?: number;
}

const FunctionCalling = () => {
  const [weatherData, setWeatherData] = useState<WeatherData>({});
  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRateData | null>(null);
  const [showButtons, setShowButtons] = useState(true);

  const isWeatherEmpty = Object.keys(weatherData).length === 0;
  const isExchangeRateEmpty = !exchangeRateData || Object.keys(exchangeRateData).length === 0;

  const functionCallHandler = async (call: RequiredActionFunctionToolCall) => {
    let result = {};
    try {
      console.log('Function call received:', call);
      if (call?.function?.name === "get_weather") {
        const args = JSON.parse(call.function.arguments);
        const data = getWeather(args.location);
        setWeatherData(data);
        result = { output: data };
      } else if (call?.function?.name === "get_exchange_rate") {
        const data = await getExchangeRate();
        setExchangeRateData(data);
        result = { output: data };
      } else if (call?.function?.name === "bitrix_add_lead") {
        const args = JSON.parse(call.function.arguments);
        const data = await addLead(args);
        result = { output: data };
      } else if (call?.function?.name === "bitrix_add_meeting") {
        const args = JSON.parse(call.function.arguments);
        const data = await addMeeting(args);
        result = { output: data };
      }
    } catch (error) {
      console.error(`Failed to ${call?.function?.name}:`, error);
      result = { error: error.message };
    }
    console.log('Function result:', result);
    return JSON.stringify(result);
  };

  return (
    <ProtectedPage>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.chatContainer}>
            <div className={styles.chat}>
              <Chat functionCallHandler={functionCallHandler} setShowButtons={setShowButtons} />
            </div>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
};

export default FunctionCalling;

