"use client";
import React, { useState } from "react";
import styles from "./page.module.css";
import Chat from "../../components/chat";
import { getWeather } from "../../utils/weather";
import { getExchangeRate } from "../../utils/exchangeRate";
import { getCurrentDateTime } from "../../utils/dateTime";
import { addLead, checkAndAddMeeting, getCalendarEventsForRooms } from "../../utils/bitrix";
import ProtectedPage from "../../components/ProtectedPage";
import { getCompanyInfo } from "../../utils/termeneApi";

const FunctionCalling = () => {
  const [messages, setMessages] = useState([]);
  const [predefinedQuestion, setPredefinedQuestion] = useState("");

  const functionCallHandler = async (call) => {
    let result = {};
    try {
      console.log('Function call received:', call);
      if (call?.function?.name === "get_weather") {
        const args = JSON.parse(call.function.arguments);
        const data = getWeather(args.location);
        result = { output: data };
      } else if (call?.function?.name === "get_exchange_rate") {
        const data = await getExchangeRate();
        result = { output: data };
      } else if (call?.function?.name === "bitrix_add_lead") {
        const args = JSON.parse(call.function.arguments);
        const data = await addLead(args);
        result = { output: data };
      } else if (call?.function?.name === "bitrix_add_meeting") {
        const args = JSON.parse(call.function.arguments);
        const data = await checkAndAddMeeting(args);
        result = { output: data };
      } else if (call?.function?.name === "get_current_datetime") {
        const data = getCurrentDateTime();
        result = { output: data };
      } else if (call?.function?.name === "bitrix_get_calendar_events") {
        const args = JSON.parse(call.function.arguments);
        const data = await getCalendarEventsForRooms(args.rooms, args.from, args.to);
        result = data;
      } else if (call?.function?.name === "get_company_info") {
        console.log('Apelând get_company_info cu argumentele:', call.function.arguments);
        const args = JSON.parse(call.function.arguments);
        console.log('CUI extras:', args.cui);
        const data = await getCompanyInfo(args.cui);
        console.log('Date primite de la getCompanyInfo:', data);
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
        <div className={styles.chatContainer}>
          <div className={styles.chat}>
            <Chat
              functionCallHandler={functionCallHandler}
              initialMessages={messages}
              predefinedQuestion={predefinedQuestion}
              setShowButtons={() => {}}
            />
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
};

export default FunctionCalling;