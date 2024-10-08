"use client";

import React, { useState } from "react";
import styles from "./page.module.css"; // use simple styles for demonstration purposes
import Chat from "../../components/chat";
import ProtectedPage from "../../components/ProtectedPage";

const Home = () => {
  const [showButtons, setShowButtons] = useState(true);
  const functionCallHandler = async (call) => {
    // Logica pentru apelurile de funcție
    return JSON.stringify({ output: "dummy response" });
  };

  return (
    <ProtectedPage>
      <main className={styles.main}>
        <div className={styles.container}>
          <Chat functionCallHandler={functionCallHandler} setShowButtons={setShowButtons} />
        </div>
      </main>
    </ProtectedPage>
  );
};

export default Home;
