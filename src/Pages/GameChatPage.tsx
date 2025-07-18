import * as Ably from "ably";
import { ChatClient, LogLevel } from "@ably/chat";
import { AblyProvider } from "ably/react";
import { ChatClientProvider, ChatRoomProvider } from "@ably/chat/react";
import GameChat from "../BookingCalendarComponent/GameChat";
import { useEffect } from "react";

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
const clientId = getClientId();

let roomName = "room-game-" + (localStorage.getItem("currentGameName") || "DefaultRoom");

const realtimeClient = new Ably.Realtime({ key: API_KEY, clientId });
const chatClient = new ChatClient(realtimeClient, { logLevel: LogLevel.Info });

const GameChatPage = () => (
  
  <AblyProvider client={realtimeClient}>
    <ChatClientProvider client={chatClient}>
      <ChatRoomProvider name={roomName}>
        <GameChat roomName={roomName} />
      </ChatRoomProvider>
    </ChatClientProvider>
  </AblyProvider>
);

export default GameChatPage;
