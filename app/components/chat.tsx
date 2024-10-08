import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./chat.module.css";
import Markdown from "react-markdown";
import { MessageProps, ChatProps } from "./types";

// Definirea componentelor UserMessage, AssistantMessage și CodeMessage
const UserMessage = ({ text }: { text: string }) => {
  return <div className={styles.userMessage}>{text}</div>;
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className={styles.assistantMessage}>
      <Markdown>{text}</Markdown>
    </div>
  );
};

const CodeMessage = ({ text }: { text: string }) => {
  return (
    <div className={styles.codeMessage}>
      {text.split("\n").map((line, index) => (
        <div key={index}>
          <span>{`${index + 1}. `}</span>
          {line}
        </div>
      ))}
    </div>
  );
};

const Message = ({ role, text }: MessageProps) => {
  switch (role) {
    case "user":
      return <UserMessage text={text} />;
    case "assistant":
      return <AssistantMessage text={text} />;
    case "code":
      return <CodeMessage text={text} />;
    default:
      return null;
  }
};

const Chat = ({
  functionCallHandler = () => Promise.resolve(""),
  initialMessages = [],
  predefinedQuestion = "",
  setShowButtons,
}: ChatProps) => {
  const [userInput, setUserInput] = useState(predefinedQuestion);
  const [messages, setMessages] = useState<MessageProps[]>(initialMessages);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [showPredefinedButtons, setShowPredefinedButtons] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`/api/assistants/threads`, {
        method: "POST",
      });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    console.log("sendMessage called. isRunning:", isRunning);

    if (!text.trim()) return;

    if (isRunning) {
      alert("Așteaptă finalizarea răspunsului înainte de a trimite un nou mesaj.");
      return;
    }

    setIsRunning(true);
    console.log("Set isRunning to true");

    // Adaugă mesajul utilizatorului
    setMessages((prevMessages) => [...prevMessages, { role: "user", text }]);
    setUserInput("");
    setInputDisabled(true);
    setShowButtons(false);
    setShowPredefinedButtons(false);
    scrollToBottom();

    try {
      // Trimite cererea către server
      const response = await fetch(
        `/api/assistants/threads/${threadId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes("Run activ pe thread")) {
          // Creează un nou thread și reîncearcă
          await createThread();
          alert("Run activ detectat. Se creează un nou thread și se reîncearcă.");
          setIsRunning(false);
          setInputDisabled(false);
          return sendMessage(text); // Reîncearcă cu noul threadId
        } else {
          console.error("Network response was not ok");
          setInputDisabled(false);
          setIsRunning(false);
          return;
        }
      }

      // Citește fluxul de date
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      appendMessage("assistant", "");

      const readStream = async () => {
        let assistantMessage = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "");
              if (dataStr === "[DONE]") {
                setInputDisabled(false);
                setIsRunning(false);
                console.log("Set isRunning to false (completed)");
                return;
              }
              try {
                const data = JSON.parse(dataStr);

                if (data.event === "thread.message.delta") {
                  const contentDelta = data.data.delta.content;
                  for (const content of contentDelta) {
                    if (content.type === "text") {
                      const textValue = content.text.value;
                      assistantMessage += textValue;
                      appendToLastMessage(textValue);
                    }
                  }
                } else if (data.event === "thread.message.completed") {
                  setInputDisabled(false);
                  setIsRunning(false);
                  console.log("Set isRunning to false (message completed)");
                  return;
                }
              } catch (e) {
                console.error("Error parsing JSON:", e);
              }
            }
          }
        }
      };

      await readStream();
    } catch (error) {
      console.error("Error in sendMessage:", error);
    } finally {
      setInputDisabled(false);
      setIsRunning(false);
      console.log("Set isRunning to false (finally)");
    }
  }, [isRunning, threadId, setMessages, setUserInput, setInputDisabled, setShowButtons, setShowPredefinedButtons, scrollToBottom, appendMessage, appendToLastMessage]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(userInput);
  }, [sendMessage, userInput]);

  useEffect(() => {
    if (predefinedQuestion) {
      setUserInput(predefinedQuestion);
      handleSubmit(new Event("submit") as unknown as React.FormEvent);
    }
  }, [predefinedQuestion, handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handlePredefinedQuestion = (question: string) => {
    setUserInput(question);
    sendMessage(question);
  };

  const appendToLastMessage = (text: string) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const lastIndex = updatedMessages.length - 1;
      const lastMessage = updatedMessages[lastIndex];

      if (lastMessage.role === "assistant") {
        updatedMessages[lastIndex] = {
          ...lastMessage,
          text: lastMessage.text + text,
        };
      }

      return updatedMessages;
    });
  };

  const appendMessage = (role: "user" | "assistant" | "code", text: string) => {
    setMessages((prevMessages) => [...prevMessages, { role, text }]);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} text={msg.text} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputArea}>
        {showPredefinedButtons && (
          <div className={styles.buttonContainer}>
            <button
              className={styles.predefinedButton}
              onClick={() => handlePredefinedQuestion("Ce știi să faci?")}
            >
              Ce știi să faci?
            </button>
            <button
              className={styles.predefinedButton}
              onClick={() =>
                handlePredefinedQuestion(
                  "Ce trebuie să-ți dau pentru a pune o întâlnire in Bitrix24 prin tine?"
                )
              }
            >
              Rezervă sala
            </button>
            <button
              className={styles.predefinedButton}
              onClick={() =>
                handlePredefinedQuestion(
                  "Ce trebuie să-ți dau pentru a calcula taxele notariale?"
                )
              }
            >
              Taxe Notariale
            </button>
            <button
              className={styles.predefinedButton}
              onClick={() =>
                handlePredefinedQuestion(
                  "Ce informații trebuie să-ți dau ca să-mi introduci un lead in Bitrix24 ?"
                )
              }
            >
              Adaugă Lead
            </button>
            <button
              className={styles.predefinedButton}
              onClick={() =>
                handlePredefinedQuestion(
                  "Cât este azi cursul euro/leu la BNR ?"
                )
              }
            >
              Cursul BNR
            </button>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className={`${styles.inputForm} ${styles.clearfix}`}
        >
          <textarea
            ref={textareaRef}
            className={styles.input}
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              handleResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your question"
            rows={1}
            disabled={inputDisabled}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={inputDisabled}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;