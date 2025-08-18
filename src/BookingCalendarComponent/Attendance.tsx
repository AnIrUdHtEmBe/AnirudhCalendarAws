import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { TbMessage } from "react-icons/tb";
import TopBar from '../BookingCalendarComponent/Topbar';

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


interface User {
  userId: string;
  name: string;
  status: 'present' | 'absent' | 'completed';
  bookings: {
    courtName: string;
    timeSlot: string;
    sportId?: string;
    bookingId: string;
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
//ably chat part
const ChatBox = ({
  roomName,
  onClose,
  userId,
  roomType,
  userName,
}: {
  roomName: string;
  onClose: () => void;
  userId: string;
  roomType: string;
  userName: string;
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
        nameRequestsCache.current.has(clientId)
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
    [clientNames]
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

  return (
    <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50">
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
            <div className="text-center text-gray-500">
              No messages found in the specified time range
            </div>
          ) : (
            sortedMessages.map((msg, idx) => {
              const isMine = msg.clientId === currentClientId;
              const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              const displayName =
                clientNames[msg.clientId] || msg.clientId;

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
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <Send className="w-4 h-4" />
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (message.trim().length < 25) {
      setError("Message must be at least 25 characters");
      return;
    }
    onSave(message.trim());
    setMessage("");
    setError("");
  };

  const handleClose = () => {
    setMessage("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">Handle User - {userName}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value.trim().length >= 25) {
                setError("");
              }
            }}
            className="w-full border rounded p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your message (minimum 25 characters)..."
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-gray-500 text-sm mt-1">
            {message.length}/25 characters minimum
          </p>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={message.trim().length < 25}
            className={`px-4 py-2 rounded flex items-center space-x-2 ${
              message.trim().length >= 25
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Attendance = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [checkedUsers, setCheckedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  //ably state componenets
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


  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate]);

  // Convert UTC time to IST
  const convertToIST = (utcTimeString: string) => {
    const utcDate = new Date(utcTimeString);
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
    return istDate;
  };

  const formatTimeSlot = (startTime: string, endTime: string) => {
    const start = convertToIST(startTime);
    const end = convertToIST(endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Function to process court name and get display name
  const processCourtName = async (courtName: string): Promise<string> => {
    const lowerCourtName = courtName.toLowerCase();
    
    // Check if court name has court_ or COURT_ prefix
    if (lowerCourtName.startsWith('court_')) {
      const username = courtName.substring(6); // Remove 'court_' prefix
      try {
        const userResponse = await fetch(`https://play-os-backend.forgehub.in/human/${username}`);
        const userData = await userResponse.json();
        return userData.name || courtName; // Return user name or fallback to original court name
      } catch (error) {
        console.error(`Error fetching court user data for ${username}:`, error);
        return courtName; // Fallback to original court name
      }
    }
    
    return courtName; // Return original court name if no prefix
  };

const fetchAttendanceData = async () => {
  setIsLoading(true);
  try {
    const dateStr = formatDateForInput(currentDate);
    
    // API 1: Get all courts
    const courtsResponse = await fetch('https://play-os-backend.forgehub.in/arena/AREN_JZSW15/courts');
    const courts: Court[] = await courtsResponse.json();
    
    // API 2: Get bookings for each court
    const allBookingData: { courtName: string; booking: Booking }[] = [];
    await Promise.all(
      courts.map(async (court) => {
        try {
          const bookingsResponse = await fetch(`https://play-os-backend.forgehub.in/court/${court.courtId}/bookings?date=${dateStr}`);
          const bookingData: CourtBookingResponse = await bookingsResponse.json();
          
          // Process court name to get display name
          const displayCourtName = await processCourtName(bookingData.courtDetails.name);
          
          bookingData.bookings.forEach(booking => {
            allBookingData.push({
              courtName: displayCourtName,
              booking: booking
            });
          });
        } catch (error) {
          console.error(`Error fetching bookings for court ${court.courtId}:`, error);
        }
      })
    );

    // API 4: Filter out cancelled bookings
    const activeBookingData: { courtName: string; booking: Booking }[] = [];
    await Promise.all(
      allBookingData.map(async ({ courtName, booking }) => {
        try {
          const bookingStatusResponse = await fetch(`https://play-os-backend.forgehub.in/booking/${booking.bookingId}`);
          const bookingDetails = await bookingStatusResponse.json();
          
          // Only include bookings that are not cancelled
          if (bookingDetails.status !== 'cancelled') {
            activeBookingData.push({ courtName, booking });
          }
        } catch (error) {
          console.error(`Error fetching booking status for ${booking.bookingId}:`, error);
          // If API fails, include the booking (fail safe)
          activeBookingData.push({ courtName, booking });
        }
      })
    );

    console.log("Active booking data:", activeBookingData);

    // Extract users and determine their status with court and time info (only from active bookings)
    const userBookingsMap = new Map<string, {
      userId: string;
      name?: string;
      status: 'present' | 'absent' | 'pending';
      bookings: {
        courtName: string;
        timeSlot: string;
        sportId: string;
        bookingId: string;
      }[];
    }>();

    // Get current time in IST and check if day has ended
    const getCurrentISTTime = () => {
      return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
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
      if (!isToday()) {
        return true; // Past dates are always "ended"
      }
      
      // For today, check if it's past midnight (next day has started)
      const now = getCurrentISTTime();
      const selectedDateMidnight = new Date(currentDate);
      selectedDateMidnight.setHours(23, 59, 59, 999);
      
      return now > selectedDateMidnight;
    };

    const shouldShowAbsentUsers = isDayEnded();

    console.log("Current IST Time:", currentISTTime);
    console.log("Is Today:", isToday());
    console.log("Should show absent users:", shouldShowAbsentUsers);
    
    activeBookingData.forEach(({ courtName, booking }) => {
      const { joinedUsers, scheduledPlayers, startTime, endTime, sportId, bookingId } = booking;
      const timeSlot = formatTimeSlot(startTime, endTime);
      
      console.log(`Processing booking ${bookingId}:`, {
        scheduledPlayers,
        joinedUsers,
        startTime,
        endTime,
        sportId
      });
      
      scheduledPlayers.forEach(userId => {
        console.log(`Processing user ${userId} for booking ${bookingId}`);
        
        // Initialize user if not exists
        if (!userBookingsMap.has(userId)) {
          userBookingsMap.set(userId, {
            userId,
            status: 'pending', // Default status - will be filtered out if day hasn't ended
            bookings: []
          });
          console.log(`Initialized new user entry for ${userId}`);
        }
        
        const userEntry = userBookingsMap.get(userId)!;
        
        // Add booking info
        userEntry.bookings.push({
          courtName,
          timeSlot,
          sportId: sportId || 'Unknown Sport',
          bookingId
        });
        console.log(`Added booking to user ${userId}:`, { courtName, timeSlot, sportId });
        
        // Determine user status
        if (joinedUsers.includes(userId)) {
          // User joined at least one booking - mark as present
          userEntry.status = 'present';
          console.log(`Marked ${userId} as present`);
        } else if (shouldShowAbsentUsers) {
          // Only show as absent if the whole day has ended and user didn't join any booking
          userEntry.status = 'absent';
          console.log(`Marked ${userId} as absent (day ended)`);
        } else {
          // Day is still ongoing, keep as pending (will be filtered out)
          console.log(`${userId} - day still ongoing, keeping as pending`);
        }
      });
    });

    console.log("Final userBookingsMap:", Array.from(userBookingsMap.entries()));

    // Filter users to only show those with appropriate status (exclude 'pending')
    const filteredUsers = Array.from(userBookingsMap.values()).filter(user => {
      return user.status === 'present' || user.status === 'absent';
    });

    // API 3: Get user names (only for filtered users)
    const usersWithNames = await Promise.all(
      filteredUsers.map(async (userEntry) => {
        try {
          const userResponse = await fetch(`https://play-os-backend.forgehub.in/human/${userEntry.userId}`);
          const userData = await userResponse.json();
          
          return {
            userId: userEntry.userId,
            name: userData.name || 'Unknown User',
            status: userEntry.status,
            bookings: userEntry.bookings
          };
        } catch (error) {
          console.error(`Error fetching user data for ${userEntry.userId}:`, error);
          return {
            userId: userEntry.userId,
            name: 'Unknown User',
            status: userEntry.status,
            bookings: userEntry.bookings
          };
        }
      })
    );
    
    setUsers(usersWithNames);
  } catch (error) {
    console.error('Error fetching attendance data:', error);
  } finally {
    setIsLoading(false);
  }
};
  const getFilteredUsers = (filter: string): User[] => {
    return users.filter(user => user.status === filter);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePrevDay = () => {
    setCurrentDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const handleNextDay = () => {
    setCurrentDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(e.target.value));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="w-5 h-5 text-blue-600" />;
      case 'absent':
        return <X className="w-5 h-5 text-red-600" />;
      case 'completed':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Check className="w-5 h-5 text-gray-400" />;
    }
  };

  const getColumnHeaderStyle = (type: string) => {
    switch (type) {
      case 'present':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'absent':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'completed':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const toggleCheck = (userId: string) => {
    setCheckedUsers(prev => {
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
const handleUserAction = async (userId: string, message: string) => {
  try {
    await axios.patch('https://play-os-backend.forgehub.in/human/human/mark-seen', {
      userId: userId,
      roomType: "RM",
      userType: "team",
      handledMsg: message
    });

    // Mark handled locally
    setHandledUsers(prev => new Set([...prev, userId]));

    // Update users list to set status = "completed"
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.userId === userId ? { ...u, status: 'completed' } : u
      )
    );

    // Close modal
    setOpenHandleModal(null);
  } catch (error) {
    console.error('Failed to handle user:', error);
  }
};


// Add this function to check if user is handled based on room data
const checkUserHandledStatus = async (userId: string) => {
  try {
    const rooms = await fetchUserChatRooms(userId);
    const rmRoom = rooms.find((room: ChatRoom) => room.roomType === "RM");
    
    if (rmRoom && rmRoom.handledMsg && rmRoom.handledMsg.trim() !== "") {
      setHandledUsers(prev => new Set([...prev, userId]));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to check handled status for user ${userId}:`, error);
    return false;
  }
};
const handleChatOpen = async (userId: string, userName: string) => {
  try {
    // Fetch user's chat rooms
    const rooms = await fetchUserChatRooms(userId);
    
    // Find RM room (as you mentioned roomType should always be RM for this page)
    const rmRoom = rooms.find((room: ChatRoom) => room.roomType === "RM");
    
    if (rmRoom) {
      const roomName = `${rmRoom.roomType}-${rmRoom.roomName}-${rmRoom.chatId}-${userId}`;
      
      // Reset new messages count when opening chat
      setNewMessagesCount((prev) => ({
        ...prev,
        [roomName]: 0,
      }));
      
      setOpenChat({ 
        userId, 
        roomType: "RM", 
        userName, 
        roomName 
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
    const allUsers = [...getFilteredUsers('absent'), ...getFilteredUsers('present')];
    
    for (const user of allUsers) {
      await checkUserHandledStatus(user.userId);
    }
  };

  if (users.length > 0) {
    checkAllHandledUsers();
  }
}, [users]);

// Add this useEffect to initialize message polling for absent users (add after your existing useEffects)
useEffect(() => {
  const initializeMessagePolling = async () => {
    const absentUsers = getFilteredUsers('absent');
    
    for (const user of absentUsers) {
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
        console.error(`Failed to initialize polling for user ${user.userId}:`, error);
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

// Function to get new message count for a user
const getNewMessagesForUser = (userId: string) => {
  const userRooms = userChatRooms[userId] || [];
  let totalNewMessages = 0;

  userRooms.forEach((room) => {
    const roomKey = `${room.roomType}-${room.roomName}-${room.chatId}-${userId}`;
    totalNewMessages += newMessagesCount[roomKey] || 0;
  });

  return totalNewMessages;
};

// Update your UserItem component to include the handle functionality
const UserItem = ({ user, showCheckButton }: { user: User; showCheckButton?: boolean }) => {
  const newMsgCount = getNewMessagesForUser(user.userId);
  const isHandled = handledUsers.has(user.userId);
  
  return (
    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3 flex-1">
        {user.status === 'absent' && !isHandled && (
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
        <div className="flex flex-col flex-1">
          <span className="font-medium text-gray-800 mb-1">{user.name}</span>
          {/* Display all bookings for this user */}
          <div className="space-y-1">
            {user.bookings.map((booking, index) => (
              <div key={`${booking.bookingId}-${index}`} className="text-xs text-gray-500">
                <div className="font-medium">{booking.courtName}</div>
                <div>{booking.timeSlot}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 ml-8">
        {showCheckButton && (
          <button 
            className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors ${
              isHandled 
                ? "border-green-500 bg-green-50 cursor-not-allowed" 
                : "border-blue-500 hover:bg-blue-50"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isHandled) {
                setOpenHandleModal({ userId: user.userId, userName: user.name });
              }
            }}
            disabled={isHandled}
          >
            <Check className={`w-4 h-4 ${isHandled ? "text-green-500" : "text-blue-500"}`} />
          </button>
        )}
        <div className="relative">
          <button 
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => handleChatOpen(user.userId, user.name)}
          >
            <TbMessage className="w-5 h-5" />
          </button>
          {newMsgCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {newMsgCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

  const columns = [
    { 
      title: 'Present', 
      type: 'present', 
      users: getFilteredUsers('present'),
      icon: <Check className="w-5 h-5" />,
      showCheckButton: false
    },
    { 
      title: 'Absent', 
      type: 'absent', 
      users: getFilteredUsers('absent'),
      icon: <X className="w-5 h-5" />,
      showCheckButton: true
    },
    { 
      title: 'Completed/Handled', 
      type: 'completed', 
      users: getFilteredUsers('completed'),
      icon: <Clock className="w-5 h-5" />,
      showCheckButton: false
    }
  ];

  return (
    <>
      <AblyProvider client={realtimeClient}>
        <ChatClientProvider client={chatClient}>
          <TopBar />
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm shrink-0">
        <button
          onClick={handlePrevDay}
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
        >
          ← Prev
        </button>
        <span className="text-xs font-semibold">
          {currentDate.toLocaleDateString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Attendance Tracker</h1>
              <p className="text-gray-600">Track daily attendance status</p>
            </div>
          </div>

          {/* Main Grid - Flexible */}
          <div className="grid grid-cols-3 gap-6 flex-1 min-h-0 mb-6">
            {columns.map((column) => (
              <div key={column.type} className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
                {/* Column Header */}
                <div className={`p-4 flex-shrink-0 ${getColumnHeaderStyle(column.type)}`}>
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
                    column.users.map((user, index) => (
                      <UserItem
                        key={`${user.userId}-${index}`}
                        user={user}
                        showCheckButton={column.showCheckButton}
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
              />
            </ChatRoomProvider>
          )}

          {/* Handle Modal */}
          {openHandleModal && (
            <HandleModal
              isOpen={true}
              onClose={() => setOpenHandleModal(null)}
              onSave={(message) => handleUserAction(openHandleModal.userId, message)}
              userName={openHandleModal.userName}
            />
          )}
      </div>
        </ChatClientProvider>
      </AblyProvider>
    </>
  );
};

export default Attendance;