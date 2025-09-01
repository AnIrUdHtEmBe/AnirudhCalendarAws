//CHECK
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { TbMessage } from "react-icons/tb";
import TopBar from "../BookingCalendarComponent/Topbar";

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
import { Send } from "lucide-react";
import axios from "axios";
import WeekPlanView from "../WeeklyDateView/WeekViewPlan";
import { getArrayOfDatesFromSundayToSaturday } from "../WeeklyDateView/date";

interface User {
  userId: string;
  name: string;
  status: "present" | "absent" | "completed" | "not_booked";
  bookings: {
    courtName: string;
    timeSlot: string;
    sportId?: string;
    bookingId: string;
    sessionInstanceId?: string; // Added for not_booked sessions
  }[];
}

interface Court {
  courtId: string;
  arenaId: string;
  name: string;
  capacity: number;
  allowedSports: string[];
  openingTime: string;
  closingTime: string;
  status: string;
  slotSize: number;
}

interface Booking {
  type: string;
  bookedBy: string;
  sportId: string;
  startTime: string;
  endTime: string;
  status: string;
  joinedUsers: string[];
  scheduledPlayers: string[];
  priceType: string | null;
  rackPrice: string | null;
  quotePrice: string | null;
  capacity: number | null;
  st_unix: number;
  et_unix: number;
  bookingId: string;
}

interface CourtBookingResponse {
  courtDetails: Court;
  bookings: Booking[];
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
  timestamp: string;
  createdAt: Date;
  [key: string]: any;
}
// Add this new component after the HandleModal component
interface HandledMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  columnType: string;
  currentDate: Date;
  handledHistory: any[];
  isFromNotBooked: boolean; // Add this to indicate user origin
}

const HandledMessagesModal = ({
  isOpen,
  onClose,
  userId,
  userName,
  columnType,
  currentDate,
  handledHistory,
  isFromNotBooked,
}: HandledMessagesModalProps) => {
  // Determine marking type based on user origin
  const markingType = isFromNotBooked ? "notbooked" : "absent";

  // Filter and get latest 5 messages of the specific type
  const filteredMessages = useMemo(() => {
    if (!handledHistory || handledHistory.length === 0) return [];

    return handledHistory
      .filter((entry) => {
        const hasValidMsg = entry.handledMsg && entry.handledMsg.trim() !== "";
        const hasValidType = entry.markingType === markingType;
        return hasValidMsg && hasValidType;
      })
      .sort((a, b) => b.handledAt - a.handledAt) // Latest first
      .slice(0, 5); // Get only latest 5
  }, [handledHistory, markingType]);

  if (!isOpen) return null;

  console.log(`Filtered messages for ${userName} (${columnType}):`, filteredMessages);

  return (
    <div className="fixed inset-0 backdrop-blur bg-opacity-30 flex items-center justify-center z-[80]">
      <div className="bg-white rounded-lg w-96 p-4 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">
            Handled Messages - {userName} (
            {isFromNotBooked ? "Not Booked" : "Absent"})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No handled messages for this day
            </div>
          ) : (
            filteredMessages.map((entry, index) => {
              const date = new Date(entry.handledAt * 1000);
              const timestamp = `${date.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })} - ${date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`;
              return (
                <div
                  key={`${userId}-${entry.handledAt}-${index}`}
                  className="p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="text-xs text-gray-600 mb-1">
                    {timestamp} (Type: {entry.markingType})
                  </div>
                  <div className="text-sm text-gray-800 break-words">
                    {entry.handledMsg}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
//ably chat part
const ChatBox = ({
  roomName,
  onClose,
  userId,
  roomType,
  userName,
  setOpenHandleModal,
  columnType, // Add columnType prop
}: {
  roomName: string;
  onClose: () => void;
  userId: string;
  roomType: string;
  userName: string;
  setOpenHandleModal: (data: { userId: string; userName: string }) => void;
  columnType?: string;
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const nameRequestsCache = useRef<Set<string>>(new Set());

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
          roomType: "RM",
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
      const rmRoom = rooms.find((room: any) => room.roomType === "RM");
      if (rmRoom && rmRoom.handledAt) {
        return rmRoom.handledAt; // seconds
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
      await send({ text: inputValue.trim() });
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
    setOpenHandleModal({ userId, userName, columnType }); // Use the prop function correctly
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
            sortedMessages.map((msg, idx) => {
              const isMine = msg.clientId === currentClientId;
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

                  console.log(timestamp);
              const displayName = clientNames[msg.clientId] || msg.clientId;

              return (
                <div
                  key={`${msg.clientId}-${msg.timestamp}-${idx}`}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
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
            })
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
  userId, // Add userId to identify the user
  columnType, // Add columnType to determine absent/not_booked
  users, // Pass users array to access booking/session data
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (message: string) => void;
  userName: string;
  userId: string;
  columnType?: string;
  users: User[];
}) => {
  const [localComment, setLocalComment] = useState("");

  // Log IDs and type when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalComment("");
      console.log(`Handle modal opened for user: ${userName} (ID: ${userId}), columnType: ${columnType || 'none'}`);
      
      // Find the user and log relevant IDs and type
      const user = users.find(u => u.userId === userId && u.status === columnType);
      if (user && (columnType === "absent" || columnType === "not_booked")) {
        let ids: string[] = [];
        let handleType: string | undefined;
        
        if (columnType === "absent") {
          ids = user.bookings.map(b => b.bookingId).filter(id => id);
          handleType = "Absent";
        } else if (columnType === "not_booked") {
          ids = user.bookings.map(b => b.sessionInstanceId || "").filter(id => id);
          handleType = "notBooked";
        }
        
        console.log('Captured IDs on modal open:', ids.length > 0 ? ids : 'none');
        console.log('Captured Type on modal open:', handleType || 'none');
      } else {
        console.log('No IDs or type to capture (not absent or not_booked)');
      }
    }
  }, [isOpen, userId, columnType, users]);

  const handleSave = () => {
    if (localComment.trim() && localComment.length >= 20) {
      onSave(localComment.trim());
      onClose();
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
// for handled users
// Utility function to get start of next day in Unix timestamp
const getNextDayStartUnix = (date: Date): number => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  return Math.floor(nextDay.getTime() / 1000);
};

// Function to check if user was handled after a specific date
const checkIfHandledAfterDate = (
  handledHistory: any[],
  afterDateUnix: number
): boolean => {
  if (!handledHistory || handledHistory.length === 0) return false;

  return handledHistory.some((entry) => {
    return (
      entry.handledAt > 0 &&
      entry.handledAt > afterDateUnix &&
      entry.handledMsg &&
      entry.handledMsg.trim() !== ""
    );
  });
};

const Attendance = () => {
  const [isHandledMessagesModalOpen, setIsHandledMessagesModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [checkedUsers, setCheckedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
    const [weekStartToEndDates, setWeekStartToEndDates] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
  //ably state componenets
  const [openChat, setOpenChat] = useState<{
    userId: string;
    roomType: string;
    userName: string;
    roomName: string;
    columnType?: string; // Add this
  } | null>(null);

  const [openHandleModal, setOpenHandleModal] = useState<{
    userId: string;
    userName: string;
    columnType?: string;
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
  const [handledAfterDateUsers, setHandledAfterDateUsers] = useState<
    Set<string>
  >(new Set());
const [userHandledMessages, setUserHandledMessages] = useState<{
  [userId: string]: {
    absent?: string;
    notbooked?: string;
  }
}>({});
  useEffect(() => {
    const loadData = async () => {
      setUserHandledMessages({});
      await fetchAttendanceData();
      // Immediately check for handled users without delay
      checkAllAbsentUsersHandledStatus();

    };

    loadData();
  }, [currentDate]);
// Add this function near your other utility functions
const extractDailyHandledMessages = (
  handledHistory: any[],
  targetDate: Date,
  markingType: string
): string | null => {
  if (!handledHistory || handledHistory.length === 0) return null;

  // Get start and end of the target date in Unix timestamps
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);
  
  const dayStartUnix = Math.floor(dayStart.getTime() / 1000);
  const dayEndUnix = Math.floor(dayEnd.getTime() / 1000);

  // Filter entries for the target date with specific marking type
  const dayEntries = handledHistory.filter((entry) => {
    const hasValidTime = entry.handledAt > 0 && 
                        entry.handledAt >= dayStartUnix && 
                        entry.handledAt <= dayEndUnix;
    const hasValidMsg = entry.handledMsg && entry.handledMsg.trim() !== "";
    const hasValidType = entry.markingType === markingType;
    
    return hasValidTime && hasValidMsg && hasValidType;
  });

  if (dayEntries.length === 0) return null;

  // Sort by handledAt (latest first) and return the latest message
  dayEntries.sort((a, b) => b.handledAt - a.handledAt);
  return dayEntries[0].handledMsg;
};

const findNextClosestMessage = (
  handledHistory: any[],
  targetDate: Date,
  markingType: string
): { message: string; daysLate: number } | null => {
  if (!handledHistory || handledHistory.length === 0) return null;

  const targetDateStart = new Date(targetDate);
  targetDateStart.setHours(0, 0, 0, 0);
  const targetDateUnix = Math.floor(targetDateStart.getTime() / 1000);

  // Filter entries after target date with specific marking type
  const futureEntries = handledHistory.filter((entry) => {
    const hasValidTime = entry.handledAt > 0 && entry.handledAt >= targetDateUnix;
    const hasValidMsg = entry.handledMsg && entry.handledMsg.trim() !== "";
    const hasValidType = entry.markingType === markingType;
    
    return hasValidTime && hasValidMsg && hasValidType;
  });

  if (futureEntries.length === 0) return null;

  // Sort by handledAt (earliest first)
  futureEntries.sort((a, b) => a.handledAt - b.handledAt);
  const closestEntry = futureEntries[0];
  
  // Calculate days late with 1-day buffer
  const handledDate = new Date(closestEntry.handledAt * 1000);
  const daysDifference = Math.floor((handledDate.getTime() - targetDateStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Apply 1-day buffer - only count as late if handled 2+ days after target date
  const daysLate = daysDifference > 1 ? daysDifference - 1 : 0;
  
  return {
    message: closestEntry.handledMsg,
    daysLate: daysLate
  };
};
// Add this function after the extractDailyHandledMessages function
// Replace the existing fetchHandledMessagesForCompletedUsers function
// Update the fetchHandledMessagesForCompletedUsers function
const fetchHandledMessagesForCompletedUsers = async (completedUsers: User[], targetDate: Date) => {
  if (completedUsers.length === 0) return;

  console.log("fetchHandledMessagesForCompletedUsers called with:", completedUsers.length, "users");
  const handledMessagesMap: { [userId: string]: { history: any[] } } = {};

  await Promise.all(
    completedUsers.map(async (user) => {
      try {
        console.log(`Fetching handled messages for user: ${user.userId} (${user.name})`);
        const response = await axios.get(
          `https://play-os-backend.forgehub.in/human/human/${user.userId}`
        );
        const userData = Array.isArray(response.data) ? response.data : [response.data];
        const rmRoom = userData.find((room: any) => room.roomType === "RM");

        if (rmRoom && rmRoom.handledHistory) {
          console.log(`Found handledHistory for ${user.userId}, entries:`, rmRoom.handledHistory.length);
          
          // Store the full history for each user
          handledMessagesMap[user.userId] = {
            history: rmRoom.handledHistory,
          };
        } else {
          console.log(`No handledHistory found for ${user.userId}`);
        }
      } catch (error) {
        console.error(`Error fetching handled messages for user ${user.userId}:`, error);
      }
    })
  );

  console.log("Final handledMessagesMap:", handledMessagesMap);
  setUserHandledMessages(handledMessagesMap);
};

const checkHandledStatusWithIds = (
  handledHistory: any[],
  targetIds: string[],
  expectedType: string,
  afterDateUnix: number
): boolean => {
  if (!handledHistory || handledHistory.length === 0) return false;

  // First, check for entries with matching IDs and type
  const hasSpecificHandling = handledHistory.some((entry) => {
    // Check if this entry has the specific IDs we're looking for
 const hasMatchingIds = entry.targets && 
  Array.isArray(entry.targets) &&
  targetIds.length > 0 &&
  targetIds.some(targetId => entry.targets.includes(targetId));
    
    // Check if this entry has the correct type and valid handled message
const hasCorrectTypeAndMessage = 
  entry.markingType === expectedType &&
  entry.handledMsg &&
  entry.handledMsg.trim() !== "";
    return (
      entry.handledAt > 0 &&
      hasCorrectTypeAndMessage &&
      (hasMatchingIds || targetIds.length === 0) // Allow fallback if no specific IDs
    );
  });

  if (hasSpecificHandling) return true;

  // Fallback: check for any handling of the type after the date
  return handledHistory.some((entry) => {
    return (
      entry.handledAt > 0 &&
      entry.handledAt > afterDateUnix &&
      entry.markingType === expectedType &&
      entry.handledMsg &&
      entry.handledMsg.trim() !== ""
    );
  });
};
  // Convert UTC time to IST
  const convertToIST = (utcTimeString: string) => {
    const utcDate = new Date(utcTimeString);
    const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000); // Add 5.5 hours for IST
    return istDate;
  };

  const formatTimeSlot = (startTime: string, endTime: string) => {
    const start = convertToIST(startTime);
    const end = convertToIST(endTime);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Function to process court name and get display name
  const processCourtName = async (courtName: string): Promise<string> => {
    const lowerCourtName = courtName.toLowerCase();

    // Check if court name has court_ or COURT_ prefix
    if (lowerCourtName.startsWith("court_")) {
      const username = courtName.substring(6); // Remove 'court_' prefix
      try {
        const userResponse = await fetch(
          `https://play-os-backend.forgehub.in/human/${username}`
        );
        const userData = await userResponse.json();
        return userData.name || courtName; // Return user name or fallback to original court name
      } catch (error) {
        console.error(`Error fetching court user data for ${username}:`, error);
        return courtName; // Fallback to original court name
      }
    }

    return courtName; // Return original court name if no prefix
  };
  const formatTimeFromScheduledDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const dateStr = formatDateForInput(currentDate);

      // API 1: Get all courts
      const courtsResponse = await fetch(
        "https://play-os-backend.forgehub.in/arena/AREN_JZSW15/courts"
      );
      const courts: Court[] = await courtsResponse.json();

      // API 2: Get bookings for each court
      const allBookingData: { courtName: string; booking: Booking }[] = [];
      await Promise.all(
        courts.map(async (court) => {
          try {
            const bookingsResponse = await fetch(
              `https://play-os-backend.forgehub.in/court/${court.courtId}/bookings?date=${dateStr}`
            );
            const bookingData: CourtBookingResponse =
              await bookingsResponse.json();

            // Process court name to get display name
            const displayCourtName = await processCourtName(
              bookingData.courtDetails.name
            );

            bookingData.bookings.forEach((booking) => {
              allBookingData.push({
                courtName: displayCourtName,
                booking: booking,
              });
            });
          } catch (error) {
            console.error(
              `Error fetching bookings for court ${court.courtId}:`,
              error
            );
          }
        })
      );

      // API 4: Filter out cancelled bookings
      const activeBookingData: { courtName: string; booking: Booking }[] = [];
      await Promise.all(
        allBookingData.map(async ({ courtName, booking }) => {
          try {
            const bookingStatusResponse = await fetch(
              `https://play-os-backend.forgehub.in/booking/${booking.bookingId}`
            );
            const bookingDetails = await bookingStatusResponse.json();

            // Only include bookings that are not cancelled
            if (bookingDetails.status !== "cancelled") {
              activeBookingData.push({ courtName, booking });
            }
          } catch (error) {
            console.error(
              `Error fetching booking status for ${booking.bookingId}:`,
              error
            );
            // If API fails, include the booking (fail safe)
            activeBookingData.push({ courtName, booking });
          }
        })
      );

      console.log("Active booking data:", activeBookingData);

      // Modified data structure to track individual bookings per user
      const userBookingsMap = new Map<
        string,
        {
          userId: string;
          name?: string;
          presentBookings: {
            courtName: string;
            timeSlot: string;
            sportId: string;
            bookingId: string;
          }[];
          absentBookings: {
            courtName: string;
            timeSlot: string;
            sportId: string;
            bookingId: string;
          }[];
          completedBookings: {
            courtName: string;
            timeSlot: string;
            sportId: string;
            bookingId: string;
          }[];
        }
      >();

      // Get current time in IST and check if day has ended
      const getCurrentISTTime = () => {
        return new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
      };

      const currentISTTime = getCurrentISTTime();

      // Check if the selected date is today
      const isToday = () => {
        const today = new Date().toDateString();
        const selectedDate = currentDate.toDateString();
        return today === selectedDate;
      };

      // Check if the day has ended (past midnight)
      const isDayEnded = () => {
        const now = getCurrentISTTime();
        const selectedDateMidnight = new Date(currentDate);
        selectedDateMidnight.setHours(23, 59, 59, 999);
        console.log("isDayEnded:", {
          now,
          selectedDateMidnight,
          result: now > selectedDateMidnight,
        });
        // Return true only for past dates or today if it's past midnight
        return now > selectedDateMidnight;
      };

      console.log("Current IST Time:", currentISTTime);
      console.log("Is Today:", isToday());

      // Process each booking individually
      activeBookingData.forEach(({ courtName, booking }) => {
        const {
          joinedUsers,
          scheduledPlayers,
          startTime,
          endTime,
          sportId,
          bookingId,
        } = booking;
        const timeSlot = formatTimeSlot(startTime, endTime);

        // Convert endTime (GMT) to IST and add 30 minutes
        const endTimeIST = convertToIST(endTime);
        const endTimePlus30Min = new Date(
          endTimeIST.getTime() + 30 * 60 * 1000
        );
        const currentISTTime = getCurrentISTTime();

        scheduledPlayers.forEach((userId) => {
          console.log(`Processing user ${userId} for booking ${bookingId}`);

          if (!userBookingsMap.has(userId)) {
            userBookingsMap.set(userId, {
              userId,
              presentBookings: [],
              absentBookings: [],
              completedBookings: [],
            });
            console.log(`Initialized new user entry for ${userId}`);
          }

          const userEntry = userBookingsMap.get(userId)!;

          const bookingInfo = {
            courtName,
            timeSlot,
            sportId: sportId || "Unknown Sport",
            bookingId,
            st_unix: booking.st_unix,
            endTime: booking.endTime,
          };

          // Determine booking status
          if (joinedUsers.includes(userId)) {
            userEntry.presentBookings.push(bookingInfo);
            console.log(`Added booking to present for ${userId}:`, bookingInfo);
          } else if (currentISTTime > endTimePlus30Min) {
            userEntry.absentBookings.push(bookingInfo);
            console.log(`Added booking to absent for ${userId}:`, bookingInfo);
          }
          // If current time is before endTime + 30 min, do nothing (booking stays hidden)
        });
      });
      // Process handled for absent bookings per individual booking
await Promise.all(
  Array.from(userBookingsMap.entries()).map(async ([userId, userEntry]) => {
    if (userEntry.absentBookings.length === 0) return;

    try {
      const response = await axios.get(
        `https://play-os-backend.forgehub.in/human/human/${userId}`
      );
      const userData = Array.isArray(response.data)
        ? response.data
        : [response.data];
      const rmRoom = userData.find((room) => room.roomType === "RM");
      const handledHistory = rmRoom?.handledHistory || [];

      const completedFromAbsent = [];
      const remainingAbsent = [];
      //const nextDayStartUnix = getNextDayStartUnix(currentDate);
      for (const booking of userEntry.absentBookings) {
  const isHandled = handledHistory.some((entry) => {
    const hasMatchingIds = entry.targets && 
      Array.isArray(entry.targets) &&
      entry.targets.includes(booking.bookingId);
    
    const hasCorrectTypeAndMessage = 
      entry.markingType === "absent" &&
      entry.handledMsg &&
      entry.handledMsg.trim() !== "";
    
    // Specific check
    if (
      entry.handledAt > 0 &&
      hasCorrectTypeAndMessage &&
      hasMatchingIds
    ) {
      return true;
    }
    
    // Fallback check (if no specific ID match): any absent handling after the booking's start time
    return (
      entry.handledAt > 0 &&
     entry.handledAt > Math.floor((convertToIST(booking.endTime).getTime() + 30 * 60 * 1000) / 1000) &&  // Use booking.st_unix; or swap to nextDayStartUnix if global
      hasCorrectTypeAndMessage &&
      !hasMatchingIds  // Optional: ensure it's fallback (no IDs matched)
    );
  });

  if (isHandled) {
    completedFromAbsent.push(booking);
  } else {
    remainingAbsent.push(booking);
  }
}

      userEntry.absentBookings = remainingAbsent;
      userEntry.completedBookings = [
        ...userEntry.completedBookings,
        ...completedFromAbsent,
      ];
    } catch (error) {
      console.error(`Error processing handled bookings for user ${userId}:`, error);
      // On error, leave all in absent (fail-safe)
    }
  })
);
      console.log(
        "Final userBookingsMap:",
        Array.from(userBookingsMap.entries())
      );

      // Convert to the format expected by your UI
      // We'll create separate user entries for present, absent, and completed
      const presentUsers: User[] = [];
      const absentUsers: User[] = [];
      const completedUsers: User[] = [];

      // API 3: Get user names and process the data
      await Promise.all(
        Array.from(userBookingsMap.entries()).map(
          async ([userId, userEntry]) => {
            try {
              const userResponse = await fetch(
                `https://play-os-backend.forgehub.in/human/${userId}`
              );
              const userData = await userResponse.json();
              const userName = userData.name || "Unknown User";

              // Create present user entry if they have present bookings
              if (userEntry.presentBookings.length > 0) {
                presentUsers.push({
                  userId,
                  name: userName,
                  status: "present",
                  bookings: userEntry.presentBookings,
                });
              }

              // Create absent user entry if they have absent bookings
              if (userEntry.absentBookings.length > 0) {
                absentUsers.push({
                  userId,
                  name: userName,
                  status: "absent",
                  bookings: userEntry.absentBookings,
                });
              }

              // Create completed user entry if they have completed bookings
              if (userEntry.completedBookings.length > 0) {
                completedUsers.push({
                  userId,
                  name: userName,
                  status: "completed",
                  bookings: userEntry.completedBookings,
                });
              }
            } catch (error) {
              console.error(`Error fetching user data for ${userId}:`, error);
              // Handle error case with unknown user name
              if (userEntry.presentBookings.length > 0) {
                presentUsers.push({
                  userId,
                  name: "Unknown User",
                  status: "present",
                  bookings: userEntry.presentBookings,
                });
              }
              if (userEntry.absentBookings.length > 0) {
                absentUsers.push({
                  userId,
                  name: "Unknown User",
                  status: "absent",
                  bookings: userEntry.absentBookings,
                });
              }
              if (userEntry.completedBookings.length > 0) {
                completedUsers.push({
                  userId,
                  name: "Unknown User",
                  status: "completed",
                  bookings: userEntry.completedBookings,
                });
              }
            }
          }
        )
      );

      // Combine all users for the state FIRST
      let allUsers = [...presentUsers, ...absentUsers, ...completedUsers];

      // Handle "Not Booked" logic (only if day has ended)
      let notBookedUsers: User[] = [];
      if (isDayEnded()) {
        try {
          // Fetch all forge users to get userIds
          const forgeUsersResponse = await fetch(
            "https://play-os-backend.forgehub.in/human/all?type=forge"
          );
          const forgeUsers = await forgeUsersResponse.json();
          const userIds = forgeUsers.map((u: any) => u.userId);
          console.log(userIds, "== all usersss");

          const dateStr = formatDateForInput(currentDate);
          const notBookedMap = new Map<
            string,
            {
              userId: string;
              name?: string;
              sessions: { title: string; time: string }[];
            }
          >();

          // Fetch plan instances for each userId and filter SCHEDULED sessions
          await Promise.all(
            userIds.map(async (userId: string) => {
              try {
                const resp = await fetch(
                  `https://forge-play-backend.forgehub.in/humans/${userId}/plan-instances-within-date?start=${dateStr}&end=${dateStr}`
                );
                console.log("api = ", resp);

                const plans = await resp.json();
                const scheduledSessions: { title: string; time: string; sessionInstanceId: string }[] = [];

for (const plan of plans) {
  for (const session of plan.sessionInstances) {
    if (session.status === "SCHEDULED") {
      const time = formatTimeFromScheduledDate(session.scheduledDate);
      scheduledSessions.push({
        title: session.sessionTemplateTitle,
        time,
        sessionInstanceId: session.sessionInstanceId, // Capture sessionInstanceId
      });
    }
  }
}

                if (scheduledSessions.length > 0) {
                  // Fetch user name
                  const userResp = await fetch(
                    `https://play-os-backend.forgehub.in/human/${userId}`
                  );
                  const userData = await userResp.json();
                  const name = userData.name || "Unknown User";

                  notBookedMap.set(userId, {
                    userId,
                    name,
                    sessions: scheduledSessions,
                  });
                }
              } catch (e) {
                console.error(`Error fetching plans for user ${userId}:`, e);
              }
            })
          );

          // Convert to User format (reuse bookings structure: courtName for title, timeSlot for time)
          notBookedUsers = Array.from(notBookedMap.values()).map((entry) => ({
            userId: entry.userId,
            name: entry.name || "Unknown User",
            status: "not_booked",
            bookings: entry.sessions.map((s) => ({
              courtName: s.title,
              timeSlot: s.time,
              sportId: "",
              bookingId: "",
              sessionInstanceId: s.sessionInstanceId,
            })),
          }));

          console.log("Not booked users:", notBookedUsers);
        } catch (error) {
          console.error("Error fetching not booked users:", error);
        }
      }

      // Add not booked users to the main users array
      allUsers = [...allUsers, ...notBookedUsers];

      // Check for users handled after this date and update their status
      const nextDayStartUnix = getNextDayStartUnix(currentDate);
      const handledUserIds: string[] = [];

for (const user of allUsers.filter((u) => u.status === "not_booked")) {
  // Get the relevant IDs based on user status 
  const sessionInstanceIds = user.status === "not_booked"
    ? user.bookings.map(b => b.sessionInstanceId || "").filter(id => id)
    : [];

  const isHandledAfterDate = await fetchUserHandledStatus(
    user.userId,
    [],
    sessionInstanceIds,
    nextDayStartUnix,
    user.status
  );
  
  if (isHandledAfterDate) {
    handledUserIds.push(user.userId);
  }
}

      if (handledUserIds.length > 0) {
        setHandledAfterDateUsers(new Set(handledUserIds));

        // Update users to move from absent to completed
        allUsers = allUsers.map((user) => {
          if (
            handledUserIds.includes(user.userId) &&
            (user.status === "absent" || user.status === "not_booked")  // Add this
          ) {
            return { ...user, status: "completed" };
          }
          return user;
        });
      }

      // Set the final users state ONCE with all users included
      setUsers(allUsers);
 const completedUsersForMessages = allUsers.filter(u => u.status === "completed");
if (completedUsersForMessages.length > 0) {
  console.log("Fetching handled messages for completed users:", completedUsersForMessages.length);
  await fetchHandledMessagesForCompletedUsers(completedUsersForMessages, currentDate);
}
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // Function to fetch user's handled status from the API
const fetchUserHandledStatus = async (
  userId: string,
  bookingIds: string[], // Add this parameter
  sessionInstanceIds: string[], // Add this parameter
  afterDateUnix: number,
  userStatus: string // Add this to know if we're checking absent or not_booked
): Promise<boolean> => {
  try {
    const response = await axios.get(
      `https://play-os-backend.forgehub.in/human/human/${userId}`
    );

    const userData = Array.isArray(response.data)
      ? response.data
      : [response.data];

    // Find the RM room data
    const rmRoom = userData.find((room: any) => room.roomType === "RM");

    if (rmRoom && rmRoom.handledHistory) {
      // Check based on user status
      // if (userStatus === "absent" && bookingIds.length > 0) {
      //   return checkHandledStatusWithIds(
      //     rmRoom.handledHistory,
      //     bookingIds,
      //     "absent",
      //     afterDateUnix
      //   );
      // } else 
        if (userStatus === "not_booked" && sessionInstanceIds.length > 0) {
        return checkHandledStatusWithIds(
          rmRoom.handledHistory,
          sessionInstanceIds,
          "notbooked",
          afterDateUnix
        );
      }
      
      // Fallback for users without specific IDs
      return checkIfHandledAfterDate(rmRoom.handledHistory, afterDateUnix);
    }

    return false;
  } catch (error) {
    console.error(`Error fetching handled status for user ${userId}:`, error);
    return false;
  }
};
  // Function to check handled status for all absent users
const checkAllAbsentUsersHandledStatus = async () => {
  const absentUsers = [
    //...getFilteredUsers("absent"),
    ...getFilteredUsers("not_booked"),
  ];
  if (absentUsers.length === 0) return;

  const nextDayStartUnix = getNextDayStartUnix(currentDate);
  const handledUserIds: string[] = [];

  // Check each absent user
  for (const user of absentUsers) {
    const bookingIds = user.status === "absent" 
      ? user.bookings.map(b => b.bookingId).filter(id => id)
      : [];
      
    const sessionInstanceIds = user.status === "not_booked"
      ? user.bookings.map(b => b.sessionInstanceId || "").filter(id => id)
      : [];

    const isHandled = await fetchUserHandledStatus(
      user.userId,
      bookingIds,
      sessionInstanceIds,
      nextDayStartUnix,
      user.status
    );
    
    if (isHandled) {
      handledUserIds.push(user.userId);
    }
  }

  if (handledUserIds.length > 0) {
    // Update the handledAfterDateUsers state
    setHandledAfterDateUsers(new Set(handledUserIds));

    // Move these users from absent/not_booked to completed
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (
          handledUserIds.includes(user.userId) && 
          (user.status === "absent" || user.status === "not_booked")
        ) {
          return { ...user, status: "completed" };
        }
        return user;
      })
    );

    console.log(
      `Moved ${handledUserIds.length} users from absent/not_booked to completed:`,
      handledUserIds
    );
  }
};
  const getFilteredUsers = (filter: string): User[] => {
    return users.filter((user) => user.status === filter);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handlePrevDay = () => {
    setCurrentDate((prev) => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(e.target.value));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <Check className="w-5 h-5 text-blue-600" />;
      case "absent":
        return <X className="w-5 h-5 text-red-600" />;
      case "completed":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Check className="w-5 h-5 text-gray-400" />;
    }
  };

  const getColumnHeaderStyle = (type: string) => {
    switch (type) {
      case "present":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "absent":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "completed":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const toggleCheck = (userId: string) => {
    setCheckedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
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
const handleUserAction = async (userId: string, message: string, columnType?: string) => {
  try {
    let payload: any = {
      userId,
      roomType: "RM",
      userType: "team",
      handledMsg: message,
    };

    let ids: string[] = [];
    if (columnType === "absent" || columnType === "not_booked") {
      const user = users.find(u => u.userId === userId && u.status === columnType);
      if (user) {
        let handleType: string | undefined;

        if (columnType === "absent") {
          ids = user.bookings.map(b => b.bookingId).filter(id => id);
          handleType = "absent";
        } else if (columnType === "not_booked") {
          ids = user.bookings.map(b => b.sessionInstanceId || "").filter(id => id);
          handleType = "notbooked";
        }

        if (ids.length > 0) {
          payload = {
            ...payload,
            handledTargetIDs: ids,
            markingType: handleType,
          };
        }
      }
    }

    await axios.patch(
      "https://play-os-backend.forgehub.in/human/human/mark-seen",
      payload
    );

    // Update handled messages for immediate remark display
    setUserHandledMessages(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        history: [
          ...(prev[userId]?.history || []),
          {
            handledAt: Math.floor(Date.now() / 1000),
            handledMsg: message,
            markingType: columnType === "absent" ? "absent" : "notbooked",
            targets: ids
          }
        ]
      }
    }));

    // FIXED: Properly consolidate users to prevent duplicates
    setUsers((prev) => {
      const handledUser = prev.find(u => u.userId === userId && u.status === columnType);
      if (!handledUser) return prev;

      // Check if this user already exists in completed status
      const existingCompletedUser = prev.find(u => u.userId === userId && u.status === "completed");
      
      if (existingCompletedUser) {
        // User already exists in completed - merge their bookings and remove original
        const updatedUsers = prev.filter(u => !(u.userId === userId && u.status === columnType));
        
        return updatedUsers.map((u) => {
          if (u.userId === userId && u.status === "completed") {
            return {
              ...u,
              bookings: [...u.bookings, ...handledUser.bookings]
            };
          }
          return u;
        });
      } else {
        // No existing completed user - just change status to completed
        return prev.map((u) =>
          u.userId === userId && u.status === columnType
            ? { ...u, status: "completed" }
            : u
        );
      }
    });

  } catch (error) {
    console.error("Failed to handle user:", error);
  }
};
  // Add this function to check if user is handled based on room data
  const checkUserHandledStatus = async (userId: string) => {
    try {
      const rooms = await fetchUserChatRooms(userId);
      const rmRoom = rooms.find((room: ChatRoom) => room.roomType === "RM");

      if (rmRoom && rmRoom.handledMsg && rmRoom.handledMsg.trim() !== "") {
        setHandledUsers((prev) => new Set([...prev, userId]));

        // Move user's absent bookings to completed
        setUsers((prevUsers) =>
          prevUsers.map((user) => {
            if (user.userId === userId && user.status === "absent") {
              return { ...user, status: "completed" };
            }
            return user;
          })
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error(
        `Failed to check handled status for user ${userId}:`,
        error
      );
      return false;
    }
  };
const handleChatOpen = async (userId: string, userName: string, columnType?: string) => {
  try {
    // Fetch user's chat rooms
    const rooms = await fetchUserChatRooms(userId);

    // Find RM room (as you mentioned roomType should always be RM for this page)
    const rmRoom = rooms.find((room: ChatRoom) => room.roomType === "RM");

    if (rmRoom) {
      const roomName = `${rmRoom.chatId}`;

      setOpenChat({
        userId,
        roomType: "RM",
        userName,
        roomName,
        columnType, // Add columnType here
      });
    } else {
      console.error("No RM room found for user");
    }
  } catch (error) {
    console.error("Error opening chat:", error);
  }
};

  // Add this function to start message polling for new message indicators
  // Update the startMessagePolling function to exclude your own messages
  const startMessagePolling = async (
    userId: string,
    roomType: string,
    chatId: string,
    roomName: string,
    seenByTeamAtUnix: number
  ) => {
    const roomKey = `${chatId}`;
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
      console.log(messages, "message body");

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

  // Add this useEffect to check handled status for all users (add after existing useEffects)
  useEffect(() => {
    const checkAllHandledUsers = async () => {
      const allUsers = [
        ...getFilteredUsers("absent"),
        ...getFilteredUsers("present"),
      ];

      for (const user of allUsers) {
        await checkUserHandledStatus(user.userId);
      }
    };

    if (users.length > 0) {
      checkAllHandledUsers();
    }
  }, [users.length]);

  // Add this useEffect to initialize message polling for absent users (add after your existing useEffects)
  useEffect(() => {
    const initializeMessagePolling = async () => {
    if (isHandledMessagesModalOpen) {
      console.log("Skipping polling - handled messages modal is open");
      return;
    }
      const allUsers = [
        ...getFilteredUsers("present"),
        ...getFilteredUsers("absent"),
        ...getFilteredUsers("completed"),
        ...getFilteredUsers("not_booked"),
      ];
      for (const user of allUsers) {
        try {
          const rooms = await fetchUserChatRooms(user.userId);
          const rmRoom = rooms.find((room: ChatRoom) => room.roomType === "RM");

          if (rmRoom) {
            await startMessagePolling(
              user.userId,
              rmRoom.roomType,
              rmRoom.chatId,
              rmRoom.roomName,
              rmRoom.seenByTeamAt || 0
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


      initializeMessagePolling();
    

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
  }, [users.length]);

  useEffect(() => {
    let intervalId;

    // Function to fetch new message counts for all absent users
    const pollNewMessageCounts = async () => {
      const allUsers = [
        ...getFilteredUsers("present"),
        ...getFilteredUsers("absent"),
        ...getFilteredUsers("completed"),
        ...getFilteredUsers("not_booked"),
      ];
      for (const user of allUsers) {
        try {
          const rooms = await fetchUserChatRooms(user.userId);
          const rmRoom = rooms.find(
            (room: { roomType: string }) => room.roomType === "RM"
          );
          if (rmRoom) {
            const roomKey = `${rmRoom.chatId}`;
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
              (rmRoom.seenByTeamAt || 0) * 1000
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
          console.log("polled");
        } catch (error) {
          console.error("Polling error for user", user.userId, error);
        }
      }
    };

    intervalId = setInterval(pollNewMessageCounts, 20000);

    return () => {
      clearInterval(intervalId);
    };
  }, [users, chatClient]);

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

  // Update your UserItem component to include the handle functionality
const [modalUserData, setModalUserData] = useState<{
  userId: string;
  userName: string;
  columnType: string;
  isFromNotBooked: boolean;
} | null>(null);
// In UserItem component (replace the existing UserItem component)
const UserItem = ({
  user,
  columnType,
  currentDate,
}: {
  user: User;
  columnType: string;
  currentDate: Date;
}) => {
  const newMsgCount = getNewMessagesForUser(user.userId);
  //const [showHandledMessagesModal, setShowHandledMessagesModal] = useState(false);
  const showCheckbox =
    columnType === "absent" ||
    columnType === "not_booked" ||
    columnType === "completed";
  const isCompleted = columnType === "completed";
  const checkboxStyle = isCompleted
    ? "border-green-500 bg-green-50 cursor-not-allowed"
    : "border-blue-500 hover:bg-blue-50";
  const checkboxIconColor = isCompleted ? "text-green-500" : "text-blue-500";

 // In the UserItem component, update the message extraction logic
// Determine if user is from not_booked based on sessionInstanceId presence
const isFromNotBooked = user.bookings.some(booking => booking.sessionInstanceId);
const markingType = isFromNotBooked ? "notbooked" : "absent";

const getSessionDate = (user: User): Date => {
  // For not_booked users, we need to parse the sessionInstanceId to get the date
  if (user.status === "not_booked" && user.bookings.length > 0 && user.bookings[0].sessionInstanceId) {
    // SessionInstanceId format: "session_20250828_xxxxxx"
    const sessionId = user.bookings[0].sessionInstanceId;
    const dateMatch = sessionId.match(/session_(\d{4})(\d{2})(\d{2})/);
    
    if (dateMatch) {
      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1; // Months are 0-indexed in JavaScript
      const day = parseInt(dateMatch[3]);
      return new Date(year, month, day);
    }
  }
  
  // For absent users, we need to get the date from the booking
  // This would require additional API calls or storing the booking date
  // For now, return the current date as a fallback
  return currentDate;
};

// Then in the UserItem component:
const sessionDate = getSessionDate(user);

// Get handled message for session date
const currentDateMessage = userHandledMessages[user.userId]?.history
  ? extractDailyHandledMessages(userHandledMessages[user.userId].history, sessionDate, markingType)
  : null;

// If no message for session date, find next closest
const nextClosestMessage = currentDateMessage 
  ? null 
  : userHandledMessages[user.userId]?.history
    ? findNextClosestMessage(userHandledMessages[user.userId].history, sessionDate, markingType)
    : null;

// Determine which message to show and its styling
let handledMessageToShow = "";
let messageStyle = "";
let daysLate = 0;

if (currentDateMessage) {
  handledMessageToShow = currentDateMessage;
  messageStyle = "bg-green-50 border-green-200 text-green-700";
} else if (nextClosestMessage) {
  daysLate = nextClosestMessage.daysLate;
  
  if (daysLate === 0) {
    // Within 1-day buffer - show as green (on time)
    handledMessageToShow = nextClosestMessage.message;
    messageStyle = "bg-green-50 border-green-200 text-green-700";
  } else {
    // Actually late (beyond 1-day buffer) - show as red with days late
    handledMessageToShow = `${nextClosestMessage.message} (${daysLate} day${daysLate !== 1 ? 's' : ''} late)`;
    messageStyle = "bg-red-50 border-red-200 text-red-700";
  }
}

  console.log(`UserItem for ${user.name} (${user.userId}), columnType: ${columnType}, isFromNotBooked: ${isFromNotBooked}, handledMessageToShow: ${handledMessageToShow}`);

  return (
    <div className="flex items-center p-1 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow justify-between gap-1">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {user.status === "absent" && !isCompleted && (
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-medium text-gray-800 mb-1 break-words">
            {user.name}
          </span>
          <div className="space-y-1">
            {user.bookings.map((booking, index) => (
              <div
                key={`${booking.bookingId}-${index}`}
                className="text-xs text-gray-500 flex flex-col"
              >
                <div className="font-medium break-words">
                  {booking.courtName}
                </div>
                {columnType !== "not_booked" && !isFromNotBooked && (
                  <div>{booking.timeSlot}</div>
                )}
              </div>
            ))}
            {/* Show handled message for completed users */}
            {isCompleted && handledMessageToShow && (
        <div className={`mt-2 p-2 rounded border ${messageStyle}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium">
              Remark:
            </div>
            <button
              onClick={() => {
  setModalUserData({
    userId: user.userId,
    userName: user.name,
    columnType,
    isFromNotBooked
  });
  setIsHandledMessagesModalOpen(true);
}}
              className="hover:opacity-70"
              title="View all handled messages"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
          <div className="text-xs break-words">
            {handledMessageToShow}
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 min-w-[60px] flex-shrink-0">
        {showCheckbox && (
          <button
            className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${checkboxStyle}`}
            disabled
          >
            <Check className={`w-2 h-2 ${checkboxIconColor}`} />
          </button>
        )}
        <div className="relative">
          <button
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => handleChatOpen(user.userId, user.name, columnType)}
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
      {/* Handled Messages Modal */}
      {/* {showHandledMessagesModal && (
        <HandledMessagesModal
          isOpen={showHandledMessagesModal}
          onClose={() => setShowHandledMessagesModal(false)}
          userId={user.userId}
          userName={user.name}
          columnType={columnType}
          currentDate={currentDate}
          handledHistory={userHandledMessages[user.userId]?.history || []}
          isFromNotBooked={isFromNotBooked} // Pass isFromNotBooked
        />
      )} */}
    </div>
  );
};


  const columns = [
    {
      title: "Not Booked",
      type: "not_booked",
      users: getFilteredUsers("not_booked"), // Fix: Use dynamic user list
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      title: "Present",
      type: "present",
      users: getFilteredUsers("present"),
      icon: <Check className="w-5 h-5" />,
    },
    {
      title: "Absent",
      type: "absent",
      users: getFilteredUsers("absent"),
      icon: <X className="w-5 h-5" />,
    },
    {
      title: "Completed/Handled",
      type: "completed",
      users: getFilteredUsers("completed"),
      icon: <Clock className="w-5 h-5" />,
    },
  ];

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
          <div className="flex items-center justify-center gap-10 py-2 bg-white shadow-sm shrink-0">
            <button
              onClick={handlePrevDay}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
            >
              ← Prev
            </button>
            <WeekPlanView
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                weekStartToEndDates={weekStartToEndDates}
                onDateChange={(newDate) => {
                  setCurrentDate(newDate);
                }}
              />
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
              Next →
            </button>
          </div>
          <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col">
            <div className="max-w-7xl mx-auto flex flex-col h-[70%]">
              {/* Header - Fixed */}
              <div className="flex-shrink-0">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Attendance Tracker
                  </h1>
                  <p className="text-gray-600">Track daily attendance status</p>
                </div>
              </div>

              {/* Main Grid - Flexible */}
<div className="grid grid-cols-4 gap-6 flex-1 min-h-0 mb-6">
  {columns.map((column) => (
    <div
      key={column.type}
      className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col"
    >
      <div
        className={`p-4 flex-shrink-0 ${getColumnHeaderStyle(column.type)}`}
      >
        <div className="flex items-center space-x-2">
          {column.icon}
          <h2 className="text-lg font-bold">{column.title}</h2>
          <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-medium">
            {column.users.length}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {column.users.length > 0 ? (
          column.users.map((user, index) => (
            <UserItem
              key={`${user.userId}-${index}`}
              user={user}
              columnType={column.type}
              currentDate={currentDate} // Pass currentDate to UserItem
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No users in this category</p>
          </div>
        )}
      </div>
    </div>
  ))}
</div>
            </div>
            {/* Chat Modal */}
{openChat && (
  <ChatRoomProvider name={openChat.roomName}>
    <ChatBox
      roomName={openChat.roomName}
      onClose={() => setOpenChat(null)}
      userId={openChat.userId}
      roomType={openChat.roomType}
      userName={openChat.userName}
      columnType={openChat.columnType} // Pass columnType to ChatBox
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
      handleUserAction(openHandleModal.userId, message, openHandleModal.columnType)
    }
    userName={openHandleModal.userName}
    userId={openHandleModal.userId}
    columnType={openHandleModal.columnType}
    users={users} // Make sure to pass users array
  />
)}
{isHandledMessagesModalOpen && modalUserData && (
  <HandledMessagesModal
    isOpen={isHandledMessagesModalOpen}
    onClose={() => {
      setIsHandledMessagesModalOpen(false);
      setModalUserData(null);
    }}
    userId={modalUserData.userId}
    userName={modalUserData.userName}
    columnType={modalUserData.columnType}
    currentDate={currentDate}
    handledHistory={userHandledMessages[modalUserData.userId]?.history || []}
    isFromNotBooked={modalUserData.isFromNotBooked}
  />
)}
          </div>
        </ChatClientProvider>
      </AblyProvider>
    </>
  );
};

export default Attendance;
//stashh