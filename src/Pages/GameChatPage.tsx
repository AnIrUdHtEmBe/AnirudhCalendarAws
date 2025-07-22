import * as Ably from "ably";
import { ChatClient, LogLevel } from "@ably/chat";
import { AblyProvider } from "ably/react";
import { ChatClientProvider, ChatRoomProvider } from "@ably/chat/react";
import GameChat from "../BookingCalendarComponent/GameChat";
import { useEffect, useState } from "react";
import axios from "axios";

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

const GameChatPage = () => {

  const clientId = getClientId();

  // useEffect(() => {
  //   const fetchRoomName = async () => {
  //     const gameId = localStorage.getItem("gameId");
  //     if (!gameId) {
  //       console.warn("No gameId found in localStorage");
  //       return;
  //     }
  //     try {
  //       const res = await axios.get(`https://play-os-backendv2.forgehub.in/game/${gameId}`);
  //       const chatId = res.data.chatId;
  //       if (chatId) {
  //         setRoomName(`room-game-${chatId}`);
  //       } else {
  //         console.warn("No chatId in game response");
  //       }
  //     } catch (error) {
  //       console.error("Failed to fetch chatId for gameId:", error);
  //     }
  //   };

  //   fetchRoomName();
  // }, []);

  // Create Ably clients only when clientId is ready

const roomName = `room-game-${localStorage.getItem("gameroomChatId")}`

  const realtimeClient = new Ably.Realtime({ key: API_KEY, clientId });
  const chatClient = new ChatClient(realtimeClient, { logLevel: LogLevel.Info });

  if (!roomName) {
    // Optionally show loading or placeholder UI while fetching roomName
    return <div>Loading chat room...</div>;
  }

  return (
    <AblyProvider client={realtimeClient}>
      <ChatClientProvider client={chatClient}>
        <ChatRoomProvider name={roomName}>
          <GameChat roomName={roomName} />
        </ChatRoomProvider>
      </ChatClientProvider>
    </AblyProvider>
  );
};

export default GameChatPage;
