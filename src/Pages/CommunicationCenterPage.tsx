import React, { useState, useEffect } from "react";
import * as Ably from "ably";
import { ChatClient, LogLevel } from "@ably/chat";
import { AblyProvider } from "ably/react";
import { ChatClientProvider, ChatRoomProvider } from "@ably/chat/react";
import GameChat from "../BookingCalendarComponent/GameChat";
import Communications from "../CommunicaationsComponent/Communications";

const API_KEY = "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI";

function getClientId() {
  try {
    const t = sessionStorage.getItem("token");
    return t
      ? JSON.parse(atob(t.split(".")[1])).name
      : "Guest";
  } catch {
    return "Guest";
  }
}

const CommunicationPage = () => {
  const clientId = getClientId();
  const [roomName, setRoomName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize roomName from sessionStorage
  useEffect(() => {
    // const initialRoomName = localStorage.getItem("communicationName");
    // if (initialRoomName) {
    //   setRoomName(`room-tribe-${initialRoomName}`);
    // }
    setRoomName("CHAT_SOTD47")
    setIsLoading(false);
  }, []);

  // Listen for sessionStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newRoomName = sessionStorage.getItem("communicationName");
      if (newRoomName && newRoomName !== roomName) {
        setRoomName(`${newRoomName}`);
      }
    };

    // Listen for storage events (works for changes from other tabs)
    window.addEventListener('storage', handleStorageChange);

    // Custom event listener for same-tab changes
    window.addEventListener('sessionStorageUpdate', handleStorageChange);

    

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionStorageUpdate', handleStorageChange);
    };

    
  }, [roomName]);

  // Alternative approach: Poll for changes (if the event approach doesn't work reliably)
  // useEffect(() => {
  //   const checkForRoomNameChange = () => {
  //     const currentRoomName = sessionStorage.getItem("communicationName");
  //     if (currentRoomName && currentRoomName !== roomName) {
  //       setRoomName(`room-tribe-${currentRoomName}`);
  //     }
  //   };

  //   const interval = setInterval(checkForRoomNameChange, 500); // Check every 500ms

  //   return () => clearInterval(interval);
  // }, [roomName]);

  const realtimeClient = new Ably.Realtime({ key: API_KEY, clientId });
  const chatClient = new ChatClient(realtimeClient, { logLevel: LogLevel.Info });

  if (isLoading) {
    return <div>Loading chat room...</div>;
  }

  return (
    <AblyProvider client={realtimeClient}>
      <ChatClientProvider client={chatClient}>
        <ChatRoomProvider 
          key={roomName} // Force re-render when roomName changes
          name={roomName}
        >
          <Communications 
            roomName={sessionStorage.getItem("communicationName") || roomName} 
            onClose={() => {
              console.log("Hi from gamechatpage");
            }} 
          />
        </ChatRoomProvider>
      </ChatClientProvider>
    </AblyProvider>
  );
};

export default CommunicationPage;