import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Dumbbell,
  Heart,
  Trophy,
  Utensils,
  Settings,
  Send,
} from "lucide-react";
import * as Ably from "ably";
import {
  ChatClient,
  LogLevel,
  ChatMessageEvent,
  ChatMessageEventType,
} from "@ably/chat";
import {
  ChatClientProvider,
  ChatRoomProvider,
  useMessages,
} from "@ably/chat/react";

const API_KEY = "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI";

interface RoomData {
  chatId: string;
  roomName: string;
  roomType: string;
  seenByUserAt: number;
  seenByTeamAt: number;
  handledHistory: any[];
  handledAt: number;
}

interface Message {
  id: string;
  text: string;
  timestamp: number;
  sender: string;
  isOwn: boolean;
  context?: {
    openDate?: string;
    sessionTemplateTitle?: string;
  };
}

interface ChatRoomProps {
  roomData: RoomData | null;
  userId: string;
  loggedInUser: string;
  currentClientId: string;
}

interface ChatRoomWrapperProps {
  roomData: RoomData | null;
  userId: string;
  loggedInUser: string;
  roomType: string;
  currentClientId: string;
}

const token = localStorage.getItem("token");
if(token){
  const payload = JSON.parse(atob(token.split(".")[1]));
  console.log("subsbu", payload.sub)
}



// Helper function to get client ID
const getClientId = (): string => {
  try {
    // First try localStorage userId
    const userId = sessionStorage.getItem("token");
if (userId) {
      const payload = JSON.parse(atob(userId.split(".")[1]));
      return payload.sub || "Guest";
    }


    // Fallback to token parsing
    const token = sessionStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || "Guest";
    }

    return "Guest";
  } catch (error) {
    console.error("Error getting client ID:", error);
    return "Guest";
  }
};

const hostName = localStorage.getItem("hostName");

// Individual Chat Room Component
const ChatRoom: React.FC<ChatRoomProps> = ({
  roomData,
  userId,
  loggedInUser,
  currentClientId,
}) => {
  const [newMessage, setNewMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Use Ably Chat React hook
  const { send, historyBeforeSubscribe } = useMessages({
    listener: (event: ChatMessageEvent) => {
      console.log("📨 Message event received:", event);

      if (event.type === ChatMessageEventType.Created) {
        const newMsg: Message = {
          id: `${Date.now()}-${Math.random()}`,
          text: event.message.text,
          timestamp: new Date(
            event.message.timestamp || event.message.createdAt || Date.now()
          ).getTime(),
          sender: event.message.clientId,
          isOwn: event.message.clientId === currentClientId,
          context:
            event.message.metadata?.context &&
            typeof event.message.metadata.context === "object"
              ? {
                  openDate: (event.message.metadata.context as any).openDate,
                  sessionTemplateTitle: (event.message.metadata.context as any)
                    .sessionTemplateTitle,
                }
              : undefined,
        };

        console.log("🔄 Adding new message:", newMsg);
        setMessages((prev) => [...prev, newMsg]);
      }
    },
  });

  // Load initial messages
  useEffect(() => {
    if (!historyBeforeSubscribe || !loading) return;

    const loadMessages = async () => {
      try {
        console.log("📥 Loading messages for room:", roomData?.roomName);
        const result = await historyBeforeSubscribe({ limit: 60 });

        // Sort messages by timestamp (oldest first, newest last)
        // Sort messages by timestamp (oldest first, newest last)
        // Sort messages by timestamp (oldest first, newest last)
        const initialMessages: Message[] = result.items
          .map((msg: any, index: number) => ({
            id: `${roomData?.chatId || "room"}-${index}`,
            text: msg.text,
            timestamp: new Date(
              msg.timestamp || msg.createdAt || Date.now()
            ).getTime(),
            sender: msg.clientId,
            isOwn: msg.clientId === currentClientId,
            context:
              msg.metadata?.context && typeof msg.metadata.context === "object"
                ? {
                    openDate: (msg.metadata.context as any).openDate,
                    sessionTemplateTitle: (msg.metadata.context as any)
                      .sessionTemplateTitle,
                  }
                : undefined,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        console.log("📋 Loaded messages:", initialMessages.length);
        setMessages(initialMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [historyBeforeSubscribe, loading, currentClientId, roomData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !send) {
      console.log("❌ Cannot send message - empty or no send function");
      return;
    }

    try {
      console.log("📤 Sending message:", newMessage.trim());
      await send({ text: newMessage.trim() });
      setNewMessage("");
      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  }, [newMessage, send]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!roomData) {
    return (
      <div className="p-4 text-center text-gray-500 flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          No room data available
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 min-h-0">
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isOwn ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] ${
                  message.isOwn ? "items-end" : "items-start"
                } flex flex-col`}
              >
                {/* Message Bubble */}
                <div
                  className={`px-3 py-2 rounded-lg text-sm break-words ${
                    message.isOwn
                      ? "bg-green-100 text-green-900 rounded-br-sm"
                      : "bg-blue-100 text-blue-900 rounded-bl-sm"
                  }`}
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                >
                  {/* Context Header inside message */}
                  {message.context &&
                    (message.context.openDate ||
                      message.context.sessionTemplateTitle) && (
                      <div
                        className={`text-xs px-2 py-1 rounded mb-2 border-l-2 ${
                          message.isOwn
                            ? "bg-green-50 text-green-700 border-green-300"
                            : "bg-blue-50 text-blue-700 border-blue-300"
                        }`}
                      >
                        <span className="font-medium">Context: </span>
                        {message.context.openDate &&
                        message.context.sessionTemplateTitle
                          ? `${message.context.openDate} ${message.context.sessionTemplateTitle}`
                          : message.context.openDate ||
                            message.context.sessionTemplateTitle}
                      </div>
                    )}

                  {/* Message Text */}
                  <div className="whitespace-pre-wrap">{message.text}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.isOwn ? "text-green-600" : "text-blue-600"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Input - Fixed UI with integrated send button */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="absolute right-1 top-1 flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat Room Wrapper with Provider
const ChatRoomWrapper: React.FC<ChatRoomWrapperProps> = ({
  roomData,
  userId,
  loggedInUser,
  roomType,
  currentClientId,
}) => {
  if (!roomData || !userId) {
    return (
      <div className="flex-1 min-h-0 p-4 text-center text-gray-500">
        No room available
      </div>
    );
  }

  // Create room name: roomType-roomName-chatId-userId
  const roomName = `${roomData.roomType}-${roomData.roomName}-${roomData.chatId}-${userId}`;

  console.log("🏠 Creating room with name:", roomName);

  return (
    <ChatRoomProvider name={roomName}>
      <ChatRoom
        roomData={roomData}
        userId={userId}
        loggedInUser={loggedInUser}
        currentClientId={currentClientId}
      />
    </ChatRoomProvider>
  );
};

const UserChats: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<{
    name: string;
    userId?: string;
  } | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get current client ID (logged in user)
  const currentClientId = useMemo(() => getClientId(), []);

  // Create Ably clients with proper client ID
  const realtimeClient = useMemo(() => {
    return new Ably.Realtime({ key: API_KEY, clientId: currentClientId });
  }, [currentClientId]);

  const chatClient = useMemo(() => {
    return new ChatClient(realtimeClient, {
      logLevel: LogLevel.Info,
    });
  }, [realtimeClient]);

  useEffect(() => {
    // Get the selected customer from localStorage
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.name && user.userId) {
          setSelectedUser(user);
          setUserId(user.userId);
        } else {
          // Fallback for demo
          setSelectedUser({ name: "Customer Name" });
          setUserId("USER_ALBI32");
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        setSelectedUser({ name: "Customer Name" });
        setUserId("USER_ALBI32");
      }
    } else {
      // Fallback for demo
      setSelectedUser({ name: "Customer Name" });
      setUserId("USER_ALBI32");
    }

    // Get the logged-in user from sessionStorage
    const hostName = sessionStorage.getItem("hostName");
    if (hostName) {
      setLoggedInUser(hostName);
    } else {
      // Fallback for demo
      setLoggedInUser("test2");
    }

    console.log("🔑 Current client ID (logged in user):", currentClientId);
  }, [currentClientId]);

  useEffect(() => {
    if (!userId) return;

    const fetchRoomData = async () => {
      try {
        setLoading(true);
        console.log("📡 Fetching room data for userId:", userId);

        const response = await fetch(
          `https://play-os-backend.forgehub.in/human/human/${userId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: RoomData[] = await response.json();
        console.log("📋 Room data received:", data);

        setRoomsData(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching room data:", error);
        setError("Failed to load chat rooms");
        // Set empty array for development
        setRoomsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [userId]);

  const getColumnHeaderStyle = (type: string): string => {
    switch (type) {
      case "FITNESS":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "WELLNESS":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "SPORTS":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "NUTRITION":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "RM":
        return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getColumnIcon = (type: string): React.ReactNode => {
    switch (type) {
      case "FITNESS":
        return <Dumbbell className="w-5 h-5" />;
      case "WELLNESS":
        return <Heart className="w-5 h-5" />;
      case "SPORTS":
        return <Trophy className="w-5 h-5" />;
      case "NUTRITION":
        return <Utensils className="w-5 h-5" />;
      case "RM":
        return <Settings className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const columns: string[] = [
    "FITNESS",
    "WELLNESS",
    "SPORTS",
    "NUTRITION",
    "RM",
  ];

  const getRoomDataByType = (roomType: string): RoomData | null => {
    return roomsData.find((room) => room.roomType === roomType) || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatClientProvider client={chatClient}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with customer name */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {selectedUser
                ? `${selectedUser.name}'s Chat Rooms`
                : "Customer Chat"}
            </h1>
            <p className="text-gray-600">Live chat rooms for all categories</p>
            <p className="text-sm text-gray-500 mt-2">
              {/* Logged in as: {hostName} */}
            </p>
          </div>

          {/* 5 Column Chat Layout */}
          <div className="grid grid-cols-5 gap-6 h-[70vh]">
            {columns.map((roomType) => {
              const roomData = getRoomDataByType(roomType);

              return (
                <div
                  key={roomType}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col"
                >
                  {/* Column Header */}
                  <div className={`p-3 ${getColumnHeaderStyle(roomType)}`}>
                    <div className="flex items-center justify-center space-x-2">
                      {getColumnIcon(roomType)}
                      <h2 className="text-lg font-bold">{roomType}</h2>
                    </div>
                  </div>

                  {/* Chat Room */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ChatRoomWrapper
                      roomData={roomData}
                      userId={userId}
                      loggedInUser={loggedInUser}
                      roomType={roomType}
                      currentClientId={currentClientId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ChatClientProvider>
  );
};

export default UserChats;
