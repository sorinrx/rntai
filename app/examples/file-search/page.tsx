"use client";

import React, { useState } from "react";
import styles from "../shared/page.module.css"; // use simple styles for demonstration purposes
import Chat from "../../components/chat";
import ProtectedPage from "../../components/ProtectedPage";

const FileSearch = () => {
  const [showButtons, setShowButtons] = useState(true);
  const functionCallHandler = async (call) => {
    // Logica pentru apelurile de funcție
    return JSON.stringify({ output: "dummy response" });
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

export default FileSearch;
