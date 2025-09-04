import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Check, Clock, AlertCircle, Utensils } from "lucide-react";
import TopBar from "../BookingCalendarComponent/Topbar";
import { useNavigate } from "react-router-dom";
import { TbMessage } from "react-icons/tb";

//ably imports
import * as Ably from "ably";
import {
  ChatClient,
  ChatMessageEvent,
  ChatMessageEventType,
  LogLevel,
} from "@ably/chat";
import {
  ChatClientProvider,
  ChatRoomProvider,
  useMessages,
} from "@ably/chat/react";
import { AblyProvider } from "ably/react";
import { Send, X } from "lucide-react";
import axios from "axios";
import WeekPlanView from "../WeeklyDateView/WeekViewPlan";
import { getArrayOfDatesFromSundayToSaturday } from "../WeeklyDateView/date";

interface User {
  userId: string;
  name: string;
  status: "done" | "notdone" | "partially" | "scheduled";
  finalStatus: string;
}

interface NutritionData {
  userId: string;
  nutritionSessions: any[];
  finalStatus: string;
}

// ably interfaces
interface ChatRoom {
  chatId: string;
  roomName: string;
  roomType: string;
  seenByUserAt: number;
  seenByTeamAt: number;
  handledAt: number;
  handledMsg: string | null;
}

interface Message {
  text: string;
  clientId: string;
  timestamp: Date; // Changed from string to Date
  createdAt: Date;
  [key: string]: any;
}

//ably chat part
const ChatBox = ({
  roomName,
  onClose,
  userId,
  roomType,
  userName,
  setOpenHandleModal,
}: {
  roomName: string;
  onClose: () => void;
  userId: string;
  roomType: string;
  userName: string;
  setOpenHandleModal: (data: { userId: string; userName: string }) => void;
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const nameRequestsCache = useRef<Set<string>>(new Set());


function getUserId() {
    try {
      const t = sessionStorage.getItem("token");
      return t ? JSON.parse(atob(t.split(".")[1])).sub : "Guest";
    } catch {
      return "Guest";
    }
  }

const recordPresence = async (action: "ENTER" | "EXIT", useBeacon = false) => {
  try {
    const payload = [{
      action,
      userId: getUserId(),
      roomId: roomName,
      timeStamp: Date.now(),
    }];

    const url = "https://play-os-backend.forgehub.in/chatV1/presence/record";

    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const success = navigator.sendBeacon(url, blob);
      console.log(`${action.toLowerCase()} beacon sent:`, success);
      if (success) return;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
    
    if (response.ok) {
      console.log(`${action} presence recorded successfully`);
    }
  } catch (error) {
    console.error(`Error recording ${action} presence:`, error);
  }
};

  console.log(`ChatBox opened for user: ${userId} (${userName})`);

  const { historyBeforeSubscribe, send } = useMessages({
    listener: (event: ChatMessageEvent) => {
      if (event.type === ChatMessageEventType.Created) {
        const newMsg = event.message as unknown as Message;
        setMessages((prev) => [...prev, newMsg]);
        fetchSenderName(newMsg.clientId);
      }
    },
    onDiscontinuity: (error: Error) => {
      console.warn("Chat discontinuity:", error);
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
    recordPresence("EXIT", true);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      recordPresence("EXIT", false);
    } else {
      recordPresence("ENTER", false);
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [roomName]);

  // ✅ Get correct Ably clientId for this logged-in agent
  const currentClientId = useMemo(() => {
    try {
      const t = sessionStorage.getItem("token");
      if (t) {
        const decoded = JSON.parse(atob(t.split(".")[1]));
        // Prefer clientId if available, else fallback to name
        return decoded.clientId || decoded.sub || decoded.name || "Guest";
      }
      return "Guest";
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
        nameRequestsCache.current.has(clientId) ||
        clientId === currentClientId // ADD THIS LINE TO SKIP FETCHING OWN NAME
      ) {
        return;
      }

      nameRequestsCache.current.add(clientId);

      try {
        const res = await axios.get(
          `https://play-os-backend.forgehub.in/human/${clientId}`
        );
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
    [clientNames, currentClientId] // ADD currentClientId TO DEPS
  );

  const markSeenByTeam = useCallback(async (targetUserId: string) => {
    console.log(`markSeenByTeam called for userId: ${targetUserId}`);
    try {
      const res = await axios.patch(
        "https://play-os-backend.forgehub.in/human/human/mark-seen",
        {
          userId: targetUserId,
          roomType: "NUTRITION",
          userType: "team",
          handledMsg: "",
        }
      );
      console.log(
        `✅ Marked chat as seen by team for user ${targetUserId}`,
        res.data
      );
    } catch (error) {
      console.error(
        `❌ Failed to mark chat as seen by team for user ${targetUserId}`,
        error
      );
    }
  }, []);

  const fetchUserRoomData = useCallback(async (targetUserId: string) => {
    try {
      const response = await axios.get(
        `https://play-os-backend.forgehub.in/human/human/${targetUserId}`
      );
      const rooms = Array.isArray(response.data)
        ? response.data
        : response.data.rooms || [];
      const nutritionRoom = rooms.find(
        (room: any) => room.roomType === "NUTRITION"
      );
      if (nutritionRoom && nutritionRoom.handledAt) {
        return nutritionRoom.handledAt; // seconds
      }
      return null;
    } catch (error) {
      console.error(
        `Error fetching room data for user ${targetUserId}:`,
        error
      );
      return null;
    }
  }, []);

  const loadMessagesWithTimeRange = useCallback(async () => {
    if (!historyBeforeSubscribe) return;
    try {
      const handledAtUnix = await fetchUserRoomData(userId);

      if (handledAtUnix) {
        const startTimeUnixSeconds = handledAtUnix;
        const endTimeUnixSeconds = Math.floor(Date.now() / 1000);

        const result = await historyBeforeSubscribe({
          limit: 100,
          start: startTimeUnixSeconds,
          end: endTimeUnixSeconds,
        });

        const startTimeDate = new Date(startTimeUnixSeconds * 1000);
        const endTimeDate = new Date(endTimeUnixSeconds * 1000);
        const initialMessages = result.items || [];

        const filteredMessages = initialMessages.filter((msg) => {
          const msgTime = new Date(msg.timestamp);
          return msgTime >= startTimeDate && msgTime <= endTimeDate;
        });

        setMessages(filteredMessages);
        setLoading(false);
        const uniqueClientIds = [
          ...new Set(filteredMessages.map((m) => m.clientId)),
        ];
        uniqueClientIds.forEach((clientId) => fetchSenderName(clientId));
      } else {
        const result = await historyBeforeSubscribe({ limit: 50 });
        const initialMessages = result.items || [];
        setMessages(initialMessages);
        setLoading(false);
        const uniqueClientIds = [
          ...new Set(initialMessages.map((m) => m.clientId)),
        ];
        uniqueClientIds.forEach((clientId) => fetchSenderName(clientId));
      }
    } catch (error) {
      console.error("Error loading messages with time range:", error);
      try {
        const result = await historyBeforeSubscribe({ limit: 50 });
        const initialMessages = result.items || [];
        setMessages(initialMessages);
        setLoading(false);
        const uniqueClientIds = [
          ...new Set(initialMessages.map((m) => m.clientId)),
        ];
        uniqueClientIds.forEach((clientId) => fetchSenderName(clientId));
      } catch (fallbackError) {
        console.error("Fallback message loading failed:", fallbackError);
        setLoading(false);
      }
    }
  }, [historyBeforeSubscribe, fetchUserRoomData, userId, fetchSenderName]);

  useEffect(() => {
    if (historyBeforeSubscribe) {
      setLoading(true);
      setMessages([]);
      loadMessagesWithTimeRange();
    }
  }, [historyBeforeSubscribe, userId, loadMessagesWithTimeRange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    try {
      await send({ text: inputValue.trim(), metadata: {location: "Nutrition-Tracker"} });
      setInputValue("");
      await markSeenByTeam(userId);
    } catch (err) {
      console.error("Send error", err);
    }
  }, [inputValue, send, userId, markSeenByTeam]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages]);

  // Handle Chat function - Updated to use the prop
  const handleChatOpen = () => {
    setOpenHandleModal({ userId, userName }); // Use the prop function correctly
    onClose(); // Close chat when handle modal opens
  };

  return (
    <div className="fixed inset-0 backdrop-blur bg-opacity-30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-96 h-96 flex flex-col shadow-xl">
        {/* Header */}
        <div className="bg-blue-500 text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{userName}</span>
            <span className="text-xs bg-blue-600 px-2 py-1 rounded">
              {roomType}
            </span>
          </div>
          <button onClick={onClose} className="hover:bg-blue-600 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : sortedMessages.length === 0 ? (
            <div className="text-center text-gray-500">No New Messages</div>
          ) : (
            sortedMessages.map(
              (
                msg: {
                  clientId: string | number;
                  timestamp: string | number | Date;
                  text:
                    | string
                    | number
                    | boolean
                    | React.ReactElement<
                        any,
                        string | React.JSXElementConstructor<any>
                      >
                    | Iterable<React.ReactNode>
                    | React.ReactPortal
                    | null
                    | undefined;
                },
                idx: any
              ) => {
                const isMine = msg.clientId === currentClientId;
                const date = new Date(msg.timestamp);

                  const day = date.getDate(); // 25
                  const month = date.toLocaleString("en-US", {
                    month: "short",
                  }); // Aug

                  const time = date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const timestamp = `${day} ${month} - ${time}`;

                  console.log(timestamp);
                const displayName = clientNames[msg.clientId] || msg.clientId;

                return (
                  <div
                    key={`${msg.clientId}-${msg.timestamp}-${idx}`}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-lg ${
                        isMine
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      {!isMine && (
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {displayName}
                        </div>
                      )}
                      <div className="text-sm">{msg.text}</div>
                      <div className="text-xs opacity-75 mt-1">{timestamp}</div>
                    </div>
                  </div>
                );
              }
            )
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t flex space-x-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            autoComplete="off"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Handle Chat Button */}
        <div className="p-3 border-t">
          <button
            onClick={handleChatOpen}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Handle Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Handle Modal Component - Add this after ChatBox component
const HandleModal = ({
  isOpen,
  onClose,
  onSave,
  userName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (message: string) => void;
  userName: string;
}) => {
  // Move the state inside this component to prevent external re-renders
  const [localComment, setLocalComment] = useState("");

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLocalComment("");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (localComment.trim() && localComment.length >= 20) {
      onSave(localComment.trim());
      setLocalComment("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur bg-opacity-30 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg w-80 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Handle Chat - {userName}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          value={localComment}
          onChange={(e) => setLocalComment(e.target.value)}
          className="w-full border rounded p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add your comment (minimum 20 characters)..."
          autoFocus
        />

        <div className="text-xs text-gray-500 mt-1">
          {localComment.length}/20 characters minimum
        </div>

        <div className="flex space-x-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={localComment.length < 20}
            className={`flex-1 py-2 rounded ${
              localComment.length >= 20
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const NutritionMain = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [weekStartToEndDates, setWeekStartToEndDates] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  //ably state components
  const [openChat, setOpenChat] = useState<{
    userId: string;
    roomType: string;
    userName: string;
    roomName: string;
  } | null>(null);

  const [openHandleModal, setOpenHandleModal] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  const [handledUsers, setHandledUsers] = useState<Set<string>>(new Set());

  const [userChatRooms, setUserChatRooms] = useState<{
    [userId: string]: ChatRoom[];
  }>({});

  const [newMessagesCount, setNewMessagesCount] = useState<{
    [roomKey: string]: number;
  }>({});

  const [roomConnections, setRoomConnections] = useState<{
    [roomKey: string]: any;
  }>({});

  const API_KEY = "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI";
  const realtimeClient = useMemo(() => {
    let clientId = "Guest"; // fallback

    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        // Decode the JWT payload
        const payload = JSON.parse(atob(token.split(".")[1]));

        // Take the "sub" field as userId
        if (payload?.sub) {
          clientId = payload.sub;
        }
      }
    } catch (err) {
      console.error("Failed to parse token for Ably clientId:", err);
    }

    return new Ably.Realtime({
      key: API_KEY,
      clientId,
    });
  }, []);

  const chatClient = useMemo(
    () =>
      new ChatClient(realtimeClient, {
        logLevel: LogLevel.Info,
      }),
    [realtimeClient]
  );

  useEffect(() => {
    fetchNutritionData();
  }, [currentDate]);

  const fetchNutritionData = async () => {
    setIsLoading(true);
    try {
      const dateStr = currentDate.toISOString().split("T")[0];
      const nutritionResponse = await fetch(
        `https://forge-play-backend.forgehub.in/getNutritionForAllUser/${dateStr}`
      );
      const nutritionData: NutritionData[] = await nutritionResponse.json();

      const usersWithNames = await Promise.all(
        nutritionData.map(async (item) => {
          try {
            const userResponse = await fetch(
              `https://play-os-backend.forgehub.in/human/${item.userId}`
            );
            const userData = await userResponse.json();

            let status: "done" | "notdone" | "partially" | "scheduled" =
              "scheduled";

            if (item.finalStatus === "SCHEDULED") {
              status = "scheduled";
            } else if (item.finalStatus === "NOT DONE") {
              status = "notdone";
            } else if (item.finalStatus === "PARTIALLY DONE") {
              status = "partially";
            } else if (item.finalStatus === "COMPLETE") {
              status = "done";
            }

            return {
              userId: item.userId,
              name: userData.name || "Unknown User",
              status,
              finalStatus: item.finalStatus,
            };
          } catch (error) {
            console.error(
              `Error fetching user data for ${item.userId}:`,
              error
            );
            return {
              userId: item.userId,
              name: "Unknown User",
              status: "scheduled" as const,
              finalStatus: item.finalStatus,
            };
          }
        })
      );

      setUsers(usersWithNames);
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredUsers = (filter: string): User[] => {
    switch (filter) {
      case "done":
        return users.filter((user) => user.status === "done");
      case "notdone":
        return users.filter((user) => user.status === "notdone");
      case "partially":
        return users.filter((user) => user.status === "partially");
      case "scheduled":
        return users.filter((user) => user.status === "scheduled");
      default:
        return users;
    }
  };

  const handleStatusChange = (
    userId: string,
    newStatus: "done" | "notdone" | "partially" | "scheduled"
  ) => {
    setUsers(
      users.map((user) =>
        user.userId === userId ? { ...user, status: newStatus } : user
      )
    );
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handlePrevDay = () => {
    setCurrentDate(
      (prev) => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
  };

  const handleNextDay = () => {
    setCurrentDate(
      (prev) => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(e.target.value));
  };

  const handleUserClick = (userId: string) => {
    navigate(
      `/userNutrition/${userId}?date=${formatDateForInput(currentDate)}`
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <Check className="w-5 h-5 text-green-600" />;
      case "partially":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "notdone":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "scheduled":
        return <Clock className="w-5 h-5 text-purple-600" />;
      default:
        return <Utensils className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "border-green-200 bg-green-50";
      case "partially":
        return "border-yellow-200 bg-yellow-50";
      case "notdone":
        return "border-red-200 bg-red-50";
      case "scheduled":
        return "border-purple-200 bg-purple-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const getColumnHeaderStyle = (type: string) => {
    switch (type) {
      case "done":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "notdone":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "partially":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "scheduled":
        return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
    }
  };

  const UserItem = ({
    user,
    showStatusSelect = false,
  }: {
    user: User;
    showStatusSelect?: boolean;
  }) => {
    const newMsgCount = getNewMessagesForUser(user.userId);
    const isHandled = handledUsers.has(user.userId);

    return (
      <div
        className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${getStatusColor(
          user.status
        )}`}
        onClick={() => handleUserClick(user.userId)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(user.status)}
            <span className="font-medium text-gray-800">{user.name}</span>
          </div>
          <div className="flex items-center space-x-3">
            {isHandled && (
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-500" />
              </div>
            )}
            <div className="relative">
              <button
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChatOpen(user.userId, user.name);
                }}
              >
                <TbMessage className="w-5 h-5" />
              </button>
              {newMsgCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {/* {newMsgCount} */}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    {
      title: "All Users",
      type: "all",
      users: getFilteredUsers("scheduled"),
      icon: <Utensils className="w-5 h-5" />,
    },

    {
      title: "Not Done",
      type: "notdone",
      users: getFilteredUsers("notdone"),
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      title: "Partially Done",
      type: "partially",
      users: getFilteredUsers("partially"),
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: "Done",
      type: "done",
      users: getFilteredUsers("done"),
      icon: <Check className="w-5 h-5" />,
    },
  ];

  // Add this function to fetch user chat rooms
  const fetchUserChatRooms = async (userId: string) => {
    try {
      const response = await axios.get(
        `https://play-os-backend.forgehub.in/human/human/${userId}`
      );
      const rooms = Array.isArray(response.data)
        ? response.data
        : response.data.rooms || [];

      setUserChatRooms((prev) => ({
        ...prev,
        [userId]: rooms,
      }));

      return rooms;
    } catch (error) {
      console.error(`Failed to fetch chat rooms for user ${userId}:`, error);
      return [];
    }
  };

  // Add this function to handle the mark-seen API call
  const handleUserAction = async (userId: string, message: string) => {
    try {
      await axios.patch(
        "https://play-os-backend.forgehub.in/human/human/mark-seen",
        {
          userId: userId,
          roomType: "NUTRITION",
          userType: "team",
          handledMsg: message,
        }
      );

      // Mark handled locally for immediate handling
      setHandledUsers((prev) => new Set([...prev, userId]));

      // Reset new message count for this user
      const userRooms = userChatRooms[userId] || [];
      const updatedCounts = { ...newMessagesCount };
      userRooms.forEach((room) => {
        const roomKey = `${room.chatId}`;
        updatedCounts[roomKey] = 0;
      });
      setNewMessagesCount(updatedCounts);

      // Close modal
      setOpenHandleModal(null);

      console.log(
        `User ${userId} handled successfully with message: ${message}`
      );
    } catch (error) {
      console.error("Failed to handle user:", error);
    }
  };

  const handleChatOpen = async (userId: string, userName: string) => {
    try {
      // Fetch user's chat rooms
      const rooms = await fetchUserChatRooms(userId);

      // Find NUTRITION room
      const nutritionRoom = rooms.find(
        (room: ChatRoom) => room.roomType === "NUTRITION"
      );

      if (nutritionRoom) {
        const roomName = `${nutritionRoom.chatId}`;

        setOpenChat({
          userId,
          roomType: "NUTRITION",
          userName,
          roomName,
        });
      } else {
        console.error("No NUTRITION room found for user");
      }
    } catch (error) {
      console.error("Error opening chat:", error);
    }
  };

  // Add this function to start message polling for new message indicators
  const startMessagePolling = async (
    userId: string,
    roomType: string,
    chatId: string,
    roomName: string,
    seenByTeamAtUnix: number
  ) => {
    const roomKey = `${roomType}-${roomName}-${chatId}-${userId}`;
    const ablyRoomName = roomKey;

    try {
      const room = await chatClient.rooms.get(ablyRoomName);

      setRoomConnections((prev) => ({
        ...prev,
        [roomKey]: room,
      }));

      // Get current client ID to exclude own messages
      const getCurrentClientId = () => {
        try {
          const token = sessionStorage.getItem("token");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload?.sub || payload?.name || "Guest";
          }
        } catch {
          return "Guest";
        }
        return "Guest";
      };

      const currentClientId = getCurrentClientId();

      // Set up real-time message listener for new message indicator
      const messageListener = (messageEvent: any) => {
        const message = messageEvent.message || messageEvent;
        const messageTimestamp = message.createdAt || message.timestamp;
        const seenByTeamAtDate = new Date(seenByTeamAtUnix * 1000);

        // Only count messages that are:
        // 1. Not from the current user (team member)
        // 2. Newer than the seenByTeamAt timestamp
        if (
          messageTimestamp &&
          new Date(messageTimestamp) > seenByTeamAtDate &&
          message.clientId !== currentClientId
        ) {
          // Update new message count
          setNewMessagesCount((prev) => ({
            ...prev,
            [roomKey]: (prev[roomKey] || 0) + 1,
          }));
        }
      };

      room.messages.subscribe(messageListener);

      // Initial check for existing new messages
      const messageHistory = await room.messages.history({ limit: 50 });
      const messages = messageHistory.items;
      const seenByTeamAtDate = new Date(seenByTeamAtUnix * 1000);

      let newMessageCount = 0;
      messages.forEach((message: any) => {
        const messageTimestamp = message.createdAt || message.timestamp;
        // Only count messages that are not from the current user and are newer than seenByTeamAt
        if (
          messageTimestamp &&
          new Date(messageTimestamp) > seenByTeamAtDate &&
          message.clientId !== currentClientId
        ) {
          newMessageCount++;
        }
      });

      setNewMessagesCount((prev) => ({
        ...prev,
        [roomKey]: newMessageCount,
      }));
    } catch (error) {
      console.error(`Failed to setup message polling for ${roomKey}:`, error);
    }
  };

  // Function to get new message count for a user
  const getNewMessagesForUser = (userId: string) => {
    const userRooms = userChatRooms[userId] || [];
    let totalNewMessages = 0;

    userRooms.forEach((room) => {
      const roomKey = `${room.chatId}`;
      totalNewMessages += newMessagesCount[roomKey] || 0;
    });

    return totalNewMessages;
  };

  // Add this useEffect to initialize message polling for all users
  useEffect(() => {
    const initializeMessagePolling = async () => {
      for (const user of users) {
        try {
          const rooms = await fetchUserChatRooms(user.userId);
          const nutritionRoom = rooms.find(
            (room: ChatRoom) => room.roomType === "NUTRITION"
          );

          if (nutritionRoom) {
            await startMessagePolling(
              user.userId,
              nutritionRoom.roomType,
              nutritionRoom.chatId,
              nutritionRoom.roomName,
              nutritionRoom.handledAt || 0
            );
          }
        } catch (error) {
          console.error(
            `Failed to initialize polling for user ${user.userId}:`,
            error
          );
        }
      }
    };

    if (users.length > 0) {
      initializeMessagePolling();
    }

    // Cleanup on unmount
    return () => {
      Object.values(roomConnections).forEach((room) => {
        try {
          if (room && room.messages?.unsubscribeAll) {
            room.messages.unsubscribeAll();
          }
        } catch (error) {
          console.error("Error cleaning up room connection:", error);
        }
      });
    };
  }, [users]);

  useEffect(() => {
    let intervalId;

    // Function to fetch new message counts for all users
    const pollNewMessageCounts = async () => {
      for (const user of users) {
        try {
          const rooms = await fetchUserChatRooms(user.userId);
          const nutritionRoom = rooms.find(
            (room: { roomType: string }) => room.roomType === "NUTRITION"
          );
          if (nutritionRoom) {
            const roomKey = `${nutritionRoom.chatId}`;
            const ablyRoomName = roomKey;

            // Get current client ID to exclude self messages
            const getCurrentClientId = () => {
              try {
                const token = sessionStorage.getItem("token");
                if (token) {
                  const payload = JSON.parse(atob(token.split(".")[1]));
                  return payload?.sub || payload?.name || "Guest";
                }
              } catch {
                return "Guest";
              }
              return "Guest";
            };
            const currentClientId = getCurrentClientId();

            // Fetch recent messages and count unread
            const room = await chatClient.rooms.get(ablyRoomName);
            const messageHistory = await room.messages.history({ limit: 50 });
            const messages = messageHistory.items || [];
            const seenByTeamAtDate = new Date(
              (nutritionRoom.handledAt || 0) * 1000
            );

            let newMessageCount = 0;
            messages.forEach((message) => {
              const messageTimestamp = message.createdAt || message.timestamp;
              if (
                messageTimestamp &&
                new Date(messageTimestamp) > seenByTeamAtDate &&
                message.clientId !== currentClientId
              ) {
                newMessageCount++;
              }
            });

            setNewMessagesCount((prev) => ({
              ...prev,
              [roomKey]: newMessageCount,
            }));
          }
        } catch (error) {
          console.error("Polling error for user", user.userId, error);
        }
      }
    };

    intervalId = setInterval(pollNewMessageCounts, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [users, chatClient]);

  useEffect(() => {
    let referenceDate = new Date(currentDate);

    if (isNaN(referenceDate.getTime())) {
      referenceDate = new Date();
    }

    const weekDates = getArrayOfDatesFromSundayToSaturday(referenceDate);

    setWeekStartToEndDates(weekDates);

    const currentDateStr = referenceDate.toISOString().split("T")[0];

    const newActiveIndex = weekDates.findIndex(
      (dateStr) => dateStr === currentDateStr
    );

    setActiveIndex(newActiveIndex !== -1 ? newActiveIndex : 0);
  }, [currentDate]);

  return (
    <>
      <AblyProvider client={realtimeClient}>
        <ChatClientProvider client={chatClient}>
          <TopBar />
          <div className="flex items-center justify-center gap-10 py-2 bg-white shadow-sm shrink-0 font-medium">
            <button
              onClick={handlePrevDay}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
            >
              ← Prev Week
            </button>
            <div>
              <WeekPlanView
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                weekStartToEndDates={weekStartToEndDates}
                onDateChange={(newDate) => {
                  setCurrentDate(newDate);
                }}
              />
            </div>
            <span className="text-xs font-semibold">
              {/* {currentDate.toLocaleDateString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })} */}
              {isLoading && (
                <span className="ml-2 text-blue-500">Loading...</span>
              )}
            </span>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={formatDateForInput(currentDate)}
                onChange={handleDateChange}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
            <button
              onClick={handleNextDay}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
            >
              Next Week →
            </button>
          </div>
          <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col">
            <div className="max-w-7xl mx-auto flex flex-col h-[70%]">
              {/* Header - Fixed */}
              <div className="flex-shrink-0">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Nutrition Tracker
                  </h1>
                  <p className="text-gray-600">
                    Track your daily nutrition goals and meal completion
                  </p>
                </div>

                {/* Stats Cards */}
                {/* <div className="grid grid-cols-4 gap-6 mb-4">
              {columns.map((column) => (
                <div key={column.type} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${getColumnHeaderStyle(column.type)}`}>
                      {column.icon}
                    </div>
                    <span className="text-2xl font-bold text-gray-800">{column.users.length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-700">{column.title}</h3>
                </div>
              ))}
            </div> */}
              </div>

              {/* Main Grid - Flexible */}
              <div className="grid grid-cols-4 gap-6 flex-1 min-h-0 mb-6">
                {columns.map((column) => (
                  <div
                    key={column.type}
                    className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col"
                  >
                    {/* Column Header */}
                    <div
                      className={`p-4 flex-shrink-0 ${getColumnHeaderStyle(
                        column.type
                      )}`}
                    >
                      <div className="flex items-center space-x-2">
                        {column.icon}
                        <h2 className="text-lg font-bold">{column.title}</h2>
                        <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-medium">
                          {column.users.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Content - Scrollable */}
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                      {column.users.length > 0 ? (
                        column.users.map((user) => (
                          <UserItem
                            key={user.userId}
                            user={user}
                            showStatusSelect={column.type === "all"}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">
                            <Utensils className="w-12 h-12 mx-auto" />
                          </div>
                          <p className="text-gray-500 text-sm">
                            No users in this category
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {openChat && (
            <ChatRoomProvider name={openChat.roomName}>
              <ChatBox
                roomName={openChat.roomName}
                onClose={() => setOpenChat(null)}
                userId={openChat.userId}
                roomType={openChat.roomType}
                userName={openChat.userName}
                setOpenHandleModal={setOpenHandleModal}
              />
            </ChatRoomProvider>
          )}

          {/* Handle Modal */}
          {openHandleModal && (
            <HandleModal
              isOpen={true}
              onClose={() => setOpenHandleModal(null)}
              onSave={(message) =>
                handleUserAction(openHandleModal.userId, message)
              }
              userName={openHandleModal.userName}
            />
          )}
        </ChatClientProvider>
      </AblyProvider>
    </>
  );
};

export default NutritionMain;
