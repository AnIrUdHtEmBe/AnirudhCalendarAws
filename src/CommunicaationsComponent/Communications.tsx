import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { ChatMessageEvent, ChatMessageEventType } from "@ably/chat";
import { useMessages } from "@ably/chat/react";
import { Send } from "lucide-react";
import axios from "axios";
import { ChevronLeft } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_Latest } from "../BookingCalendarComponent/AxiosApi";
import { IoFootballOutline } from "react-icons/io5";
import { GiBodyBalance } from "react-icons/gi"; // Game Icons

import {
  FaSwimmer,
  FaDumbbell,
  FaBasketballBall,
  FaSkating,
} from "react-icons/fa";
import {
  GiCricketBat,
  GiMuscleUp,
  GiMeditation,
  GiTennisRacket,
  GiTennisCourt,
} from "react-icons/gi";
import { MdSportsTennis } from "react-icons/md";
import { TbSkateboard } from "react-icons/tb";

export const PLAY_CONFIG = {
  startTime: "6:00",
  endTime: "24:00",
  turfGap: 30,
  TURF_BOX_BUFFER_HEIGHT: 40,
};

// Define the message type if not exported from @ably/chat:
type Message = {
  text: string;
  clientId: string;
  timestamp: string;
  [key: string]: any;
};

interface SimpleChatRoomProps {
  roomName: string;
  onClose: () => void;
}

const size = 200;

export const DEFAULT_ICON_SIZE = size;

export const games = [
  {
    name: "Football 7 a side",
    icon: () => <IoFootballOutline size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Box Cricket",
    icon: () => <GiCricketBat size={DEFAULT_ICON_SIZE - 5} />,
  },
  { name: "yoga", icon: () => <GiMeditation size={DEFAULT_ICON_SIZE - 5} /> },
  {
    name: "bodybuilding",
    icon: () => <GiMuscleUp size={DEFAULT_ICON_SIZE - 5} />,
  },
  { name: "strength", icon: () => <FaDumbbell size={DEFAULT_ICON_SIZE - 5} /> },
  {
    name: "Swimmining",
    icon: () => <FaSwimmer size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Roller Skating",
    icon: () => <FaSkating size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Skateboarding",
    icon: () => <TbSkateboard size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Pickleball",
    icon: () => <GiTennisRacket size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Squash",
    icon: () => <GiTennisCourt size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Basketball",
    icon: () => <FaBasketballBall size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Badminton",
    icon: () => <MdSportsTennis size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Cricket Practice Nets",
    icon: () => (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <GiCricketBat size={20} />
        <GiTennisCourt size={20} />
      </div>
    ),
  },
  {
    name: "Physio",
    icon: () => <GiBodyBalance size={DEFAULT_ICON_SIZE - 5} />,
  },
];

export default function Communications({
  roomName,
  onClose,
}: SimpleChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [mySport, setMySports] = useState<any[]>([]);
  const chatType = "tribe";
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const { historyBeforeSubscribe, send } = useMessages({
    listener: (event: ChatMessageEvent) => {
      if (event.type === ChatMessageEventType.Created) {
        const newMsg = event.message as unknown as Message;
        setMessages((prev) => [...prev, event.message as unknown as Message]);
        fetchSenderName(newMsg.clientId);
      }
    },
    onDiscontinuity: (error: Error) => {
      console.warn("Discontinuity detected:", error);
      setLoading(true);
    },
  });

  // Load message history
  useEffect(() => {
    if (historyBeforeSubscribe && loading) {
      historyBeforeSubscribe({ limit: 50 }).then((result) => {
        const initialMessages: Message[] = result.items as unknown as Message[];
        setMessages(initialMessages);
        setLoading(false);
        initialMessages.forEach((msg) => fetchSenderName(msg.clientId));
      });
    }
  }, [historyBeforeSubscribe, loading]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getIconForSport = (sportName: string) => {
    const name = sportName.toLowerCase();
    if (name.includes("box cricket")) return GiCricketBat;
    if (name.includes("physio")) return GiBodyBalance;
    if (name.includes("roller skating")) return FaSkating;
    if (name.includes("squash")) return GiTennisCourt;
    if (name.includes("basketball")) return FaBasketballBall;
    if (name.includes("cricket practice nets") || name.includes("cricket nets"))
      return GiCricketBat;
    if (name.includes("strength")) return FaDumbbell;
    if (name.includes("football")) return IoFootballOutline;
    if (name.includes("yoga")) return GiMeditation;
    if (name.includes("badminton")) return MdSportsTennis;
    if (name.includes("skateboarding")) return TbSkateboard;
    if (name.includes("pickleball")) return GiTennisRacket;
    if (name.includes("bodybuilding")) return GiMuscleUp;
    if (name.includes("swimming") || name.includes("swimmining"))
      return FaSwimmer;
    if (name.includes("cricket")) return GiCricketBat;
    if (name.includes("tennis")) return GiTennisRacket;

    // Default icon for unmatched sports
    return () => <div className="text-xl">🏃</div>;
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    send({ text: inputValue.trim() }).catch((err: unknown) =>
      console.error("Send error", err)
    );
    setInputValue("");
    setIsTyping(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  function getClientId() {
    try {
      const t = sessionStorage.getItem("token");
      return t ? JSON.parse(atob(t.split(".")[1])).name : "Guest";
    } catch {
      return "Guest";
    }
  }

  const fetchSenderName = async (clientId: string) => {
    if (!clientId || clientId === "Guest" || clientNames[clientId]) return; // already fetched or guest

    try {
      const res = await axios.get(`${API_BASE_URL_Latest}/human/${clientId}`);
      if (res.data?.name) {
        setClientNames((prev) => ({ ...prev, [clientId]: res.data.name }));
      } else {
        setClientNames((prev) => ({ ...prev, [clientId]: clientId })); // fallback to clientId
      }
    } catch (error) {
      console.error("Error fetching sender name", error);
      setClientNames((prev) => ({ ...prev, [clientId]: clientId })); // fallback
    }
  };

  useEffect(() => {
    if (chatType === "tribe") {
      async function fetchSportDetails() {
        try {
          const res = await axios.get(`${API_BASE_URL_Latest}/sports/all`);
          const data = res.data;
          setMySports(data);
          console.log("communication sports", data);
          setActiveChat("CHAT_BTAV33")
          // Optionally set the first sport as active by default
          // if (data.length > 0 && data[0].chatId) {
          //   setActiveChat("CHAT_BTAV33");
          // }
        } catch (error) {
          console.error("Error fetching sport details", error);
          setMySports([]);
        }
      }
      fetchSportDetails();
    }
  }, [chatType]);

  

  // Updated handleIconClick function
  const handleIconClick = (sport: any) => {
    console.log("Icon clicked for sport:", sport);
    console.log("ChatId from icon click:", sport.chatId);
    
    if (sport.chatId) {
      setActiveChat(sport.chatId);
      console.log("Active chat set to:", sport.chatId);
      
      // Update sessionStorage and dispatch custom event
      sessionStorage.setItem("communicationName", sport.chatId);
      localStorage.setItem("communicationName", sport.chatId);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('sessionStorageUpdate', {
        detail: { key: 'communicationName', value: sport.chatId }
      }));
    } else {
      console.warn("No chatId found for sport:", sport.name);
    }
  };

  function extractChatId(roomName: string) {
  const prefix = "";
  // console.log("original roomname", roomName);
  
  // console.log(roomName.startsWith(prefix) ? roomName.substring(prefix.length) : roomName, "undefined!");
  
  return roomName.startsWith(prefix) ? roomName.substring(prefix.length) : roomName;
}


console.log(
  roomName
    ? (mySport.find(s => s.chatId === roomName)?.name || 'Box Cricket')
    : activeChat,
  "Header roomname"
);


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div
        className="mx-15 mt-4 flex overflow-x-auto overflow-y-hidden"
        style={{
          height: "80px",
          scrollbarWidth: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {mySport.map((sport, index) => {
          const IconComponent = getIconForSport(sport.name);
          return (
            <div
              key={`${sport.chatId || sport.name}-${index}`}
              onClick={() => handleIconClick(sport)}
              className={`flex-shrink-0 cursor-pointer rounded-md w-16 h-16 mx-2 flex items-center justify-center transition-all duration-200 ${
                extractChatId(roomName) === sport.chatId
                  ? "bg-[#00f0ff] shadow-lg transform scale-105"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <IconComponent />
            </div>
          );
        })}
      </div>
      
      <div className="bg-white shadow-sm border-none px-4 py-3 flex items-center gap-3">
        <button onClick={onClose}>
          <ChevronLeft />
        </button>
        {/* <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shadow-inner border-2 border-blue-300 text-2xl font-bold text-blue-700 mr-2">
          {roomName.toUpperCase().charAt(0)}
        </div> */}
        <h1 className="text-2xl font-bold tracking-wide text-gray-900">
          {roomName ? `${mySport.find(s => s.chatId === roomName)?.name || 'Box Cricket'}` : activeChat}
          
        </h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-blue-600">Loading messages...</p>
            </div>
          </div>
        )}

        {roomName ? (
          // Show messages for the active chat
          [...messages]
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            .map((msg: Message, idx) => {
              const isMine = msg.clientId === getClientId();
              const date = new Date(msg.timestamp || msg.createdAt || 0);

                  const day = date.getDate(); // 25
                  const month = date.toLocaleString("en-US", {
                    month: "short",
                  }); // Aug

                  const time = date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const timestamp = `${day} ${month} - ${time}`;

                  

              // Avatar (static or with msg.avatarUrl if you have per-user photo)
              const avatarUrl =
                msg.avatarUrl || "https://randomuser.me/api/portraits/men/78.jpg";

              return (
                <div
                  key={idx}
                  className={`flex items-end ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar - only for others */}
                  {!isMine && (
                    <img
                      src={avatarUrl}
                      alt={msg.clientId}
                      className="w-8 h-8 rounded-full mr-3 mb-6 border-2 border-white shadow-sm object-cover"
                      style={{ alignSelf: "flex-start" }}
                    />
                  )}

                  <div
                    className={`relative max-w-[60%] min-w-[210px] px-4 py-2 rounded-2xl break-words whitespace-normal flex flex-col ${
                      isMine
                        ? "bg-green-100 text-gray-900 rounded-br-none ml-auto"
                        : "bg-blue-50 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    {/* Name label (only others) */}
                    {!isMine && msg.clientId && (
                      <div className="text-xs font-semibold text-blue-700 mb-1">
                        <div>{clientNames[msg.clientId] || msg.clientId}</div>
                      </div>
                    )}
                    {/* Message text */}
                    <div className="text-gray-900">{msg.text}</div>
                    {/* Timestamp: bottom right of bubble */}
                    <div
                      className="text-[11px] mt-1 text-gray-500 self-end"
                      style={{ minWidth: 60, textAlign: "right" }}
                    >
                      {timestamp}
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          // Show message when no chat is selected
          <div className="flex justify-center py-8">
            <div className="bg-gray-100 px-6 py-4 rounded-lg text-center">
              <p className="text-gray-600">Select a sport to start chatting!</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100/90 border-t border-blue-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex-shrink-0 bg-blue-200 hover:bg-blue-300 transition rounded-full w-9 h-9 flex items-center justify-center text-blue-600 shadow"
            aria-label="Add Attachment"
          >
            <span className="text-lg">+</span>
          </button>

          <div className="flex-1 relative">
            <input
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-white border border-blue-200 rounded-full px-6 py-3 text-base shadow-md focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-blue-400/50 pr-14 placeholder:text-blue-300 font-medium transition"
              placeholder={roomName ? "Type a message…" : "Select a sport first…"}
              disabled={!roomName}
            />
            {isTyping && roomName && (
              <button
                type="button"
                onClick={sendMessage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-500 hover:bg-teal-500 text-white rounded-full shadow-lg transition active:scale-95"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            type="button"
            className="flex-shrink-0 bg-teal-200 hover:bg-teal-300 transition rounded-full w-9 h-9 flex items-center justify-center text-teal-700 shadow"
            aria-label="Record Voice"
            disabled={!roomName}
            
          >
            {/* Voice icon (use 🎤 for emoji, or Lucide <Mic />) */}
            <span className="text-lg">🎤</span>
          </button>
        </div>
      </div>
    </div>
  );
}