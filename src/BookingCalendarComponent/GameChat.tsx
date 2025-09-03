import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  useMemo,
  useCallback,
} from "react";
import { ChatMessageEvent, ChatMessageEventType } from "@ably/chat";
import { useMessages } from "@ably/chat/react";
import { Send } from "lucide-react";
import axios from "axios";
import { ChevronLeft } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_Latest } from "./AxiosApi";
import Sidebar from "../components/Sidebar";

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
  userId: string;
  roomType: string;
  roomId: string;
}

export default function GameChat({ roomName, onClose, userId, roomType, roomId }: SimpleChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [sideBarToggle, setSideBarToggle] = useState(false);

  // Cache for ongoing API requests to prevent duplicate calls
  const nameRequestsCache = useRef<Set<string>>(new Set());


  function getUserId() {
    try {
      const t = sessionStorage.getItem("token");
      return t ? JSON.parse(atob(t.split(".")[1])).sub : "Guest";
    } catch {
      return "Guest";
    }
  }

  const recordPresence = async (action: string) => {
    try {
      const backend = await axios.post(
        "https://play-os-backend.forgehub.in/chatV1/presence/record",
        [
          {
            action: action,
            userId: getUserId(),
            roomId: roomId,
            timeStamp: Date.now(),
          },
        ]
      );
      console.log(`${action.toLowerCase()} backend`, backend.data);
    } catch (error) {
      console.error(`Error recording ${action} presence:`, error);
    }
  }

  const { historyBeforeSubscribe, send } = useMessages({
    listener: (event: ChatMessageEvent) => {
      if (event.type === ChatMessageEventType.Created) {
        const newMsg = event.message as unknown as Message;
        setMessages((prev) => [...prev, newMsg]);
        fetchSenderName(newMsg.clientId);
      }
    },
    onDiscontinuity: (error: Error) => {
      console.warn("Discontinuity detected:", error);
      setLoading(true);
    },
  });

    useEffect(() => {
    recordPresence("ENTER");
    return () => {
      recordPresence("EXIT");
    };
  }, [roomName]);

    useEffect(() => {
    const handleBeforeUnload = () => {
      recordPresence("EXIT");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Load message history
  useEffect(() => {
    if (historyBeforeSubscribe && loading) {
      historyBeforeSubscribe({ limit: 50 }).then((result) => {
        const initialMessages: Message[] = result.items as unknown as Message[];
        setMessages(initialMessages);
        setLoading(false);

        // Batch fetch all unique client names
        const uniqueClientIds = [
          ...new Set(initialMessages.map((msg) => msg.clientId)),
        ];
        uniqueClientIds.forEach((clientId) => fetchSenderName(clientId));
      });
    }
  }, [historyBeforeSubscribe, loading]);

  // Auto-scroll to bottom (debounced)
  useEffect(() => {
    console.log(messages, "Message data");
    const timeoutId = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    send({ text: inputValue.trim() }).catch((err: unknown) =>
      console.error("Send error", err)  
    );
    setInputValue("");
    setIsTyping(false);
//        const seenByUser = await axios.patch(
//   `https://play-os-backend.forgehub.in/human/human/mark-seen`,
//   {
//     userId: userId,
//     roomType: roomType, // convert to uppercase safely
//     userType: "team",
//     handled: inputValue.trim()
//   }
// );
// console.log("seenByTeam", seenByUser);



  }, [inputValue, send]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsTyping(e.target.value.length > 0);
  }, []);

  const currentClientId = useMemo(() => {
    try {
      const t = sessionStorage.getItem("token");
      return t ? JSON.parse(atob(t.split(".")[1])).name : "Guest";
    } catch {
      return "Guest";
    }
  }, []);

  const fetchSenderName = useCallback(
    async (clientId: string) => {
      if (
        !clientId ||
        clientId === "Guest" ||
        clientNames[clientId] ||
        nameRequestsCache.current.has(clientId)
      ) {
        return;
      }

      nameRequestsCache.current.add(clientId);

      try {
        const res = await axios.get(`${API_BASE_URL_Latest}/human/${clientId}`);
        if (res.data?.name) {
          setClientNames((prev) => ({ ...prev, [clientId]: res.data.name }));
        } else {
          setClientNames((prev) => ({ ...prev, [clientId]: clientId }));
        }
      } catch (error) {
        console.error("Error fetching sender name", error);
        setClientNames((prev) => ({ ...prev, [clientId]: clientId }));
      } finally {
        nameRequestsCache.current.delete(clientId);
      }
    },
    [clientNames]
  );

  // Memoize sorted messages to prevent unnecessary re-renders
  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages]);

  // Show loading state for initial room setup
  const isLoadingRoom = roomName === "Loading...";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="relative flex h-screen bg-gray-50">
        <Sidebar
          collapsed={sideBarToggle}
          toggleSidebar={() => setSideBarToggle(!sideBarToggle)}
        />
        <div className="flex-1 flex flex-col">
          <div className="bg-white shadow-sm border-none px-4 py-3 flex items-center gap-3">
            <button onClick={onClose}>
              <ChevronLeft />
            </button>
            <div
              className={`w-11 h-11 rounded-full ${
                isLoadingRoom ? "bg-gray-200 animate-pulse" : "bg-blue-100"
              } flex items-center justify-center shadow-inner border-2 ${
                isLoadingRoom ? "border-gray-300" : "border-blue-300"
              } text-2xl font-bold ${
                isLoadingRoom ? "text-gray-500" : "text-blue-700"
              } mr-2`}
            >
              {isLoadingRoom ? "..." : roomName.toUpperCase().charAt(0)}
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-gray-900">
              {roomName}
            </h1>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {(loading || isLoadingRoom) && (
              <div className="flex justify-center py-4">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="text-sm text-blue-600">
                    {isLoadingRoom
                      ? "Setting up chat..."
                      : "Loading messages..."}
                  </p>
                </div>
              </div>
            )}

            {!isLoadingRoom &&
              sortedMessages.map((msg: Message, idx) => {
                const isMine = msg.clientId === currentClientId;
                const timestamp = msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                const avatarUrl =
                  msg.avatarUrl ||
                  "https://randomuser.me/api/portraits/men/78.jpg";
                const displayName = clientNames[msg.clientId] || msg.clientId;

                return (
                  <div
                    key={`${msg.clientId}-${msg.timestamp}-${idx}`}
                    className={`flex items-end ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
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
                      {!isMine && msg.clientId && (
                        <div className="text-xs font-semibold text-blue-700 mb-1">
                          <div>{displayName}</div>
                        </div>
                      )}
                      {msg?.metadata?.context && (
                        <div className="text-sm font-extrabold text-blue-400 mb-1">
                          {Object.entries(msg.metadata.context)
                            .map(([key, val]) =>
                              key === "sessionTemplateTitle" ||
                              key === "openDate"
                                ? `Context: ${val}`
                                : `${key}: ${val}`
                            )
                            .join(", ")}
                        </div>
                      )}
                      <div className="text-gray-900">{msg.text}</div>
                      <div
                        className="text-[11px] mt-1 text-gray-500 self-end"
                        style={{ minWidth: 60, textAlign: "right" }}
                      >
                        {timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

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
                  placeholder="Type a message…"
                  disabled={isLoadingRoom}
                />
                {isTyping && !isLoadingRoom && (
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
                disabled={isLoadingRoom}
              >
                <span className="text-lg">🎤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
