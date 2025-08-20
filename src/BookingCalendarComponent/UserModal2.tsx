// changes
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
import axios from "axios";
import { Check, ChevronLeft, Send, X } from "lucide-react";
import { enqueueSnackbar } from "notistack";
import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import GameChat from "./GameChat";
import { AblyProvider } from "ably/react";
import * as Ably from "ably";
import { API_BASE_URL_Latest } from "./AxiosApi";
import UserPlanModal from "../UserPlanDetailsComponent/UserPlanModal";
import { TbMessage } from "react-icons/tb";

interface CellModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellData: {
    courtName?: string;
    timeSlot?: string;
    gameName?: string;
    bookingId?: string;
  };
}

interface UserAttendance {
  userId: string;
  name: string;
  status: "present" | "absent" | "pending" | "";
}
const CellModal2: React.FC<CellModalProps> = ({ isOpen, onClose, cellData }) => {
  const navigate = useNavigate();
  // Hard-coded users for now - later replace with API call
  const [modalUsers, setModalUsers] = useState<UserAttendance[]>([]);
  const [openGameChat, setOpenGameChat] = useState(false);
  const [slotString, setSlotString] = useState<string>("");
  const [datePlanStart, setDatePlanStart] = useState<string | undefined>(
    undefined
  );
  const [datePlanEnd, setDatePlanEnd] = useState<string | undefined>(undefined);
  const [isUserPlanModalOpen, setIsUserPlanModalOpen] = useState(false);
  const [userPlanUserId, setUserPlanUserId] = useState<string>("");
  const [userPlanName, setUserPlanName] = useState<string>("");
  const [userPlanStartDate, setUserPlanStartDate] = useState<string>("");
  const [userPlanEndDate, setUserPlanEndDate] = useState<string>("");
  const [openDirectGameChat, setOpenDirectGameChat] = useState(false);
  const [directGameChatRoomName, setDirectGameChatRoomName] = useState(""); // for ably room
  const [directGameChatDisplayName, setDirectGameChatDisplayName] =
    useState(""); // for display in GameChat header
  const [newNotifdot, setNewNotifDot] = useState(false);
  const [directChatUserId, setDirectChatUserId] = useState<string>("");
  const [directChatRoomType, setDirectChatRoomType] = useState<string>("");
  const clickTimeouts = useRef<{[userId: string]: NodeJS.Timeout}>({});
  const [openReplyToAllBox, setOpenReplyToAllBox] = useState(false);
const [replyToAllInput, setReplyToAllInput] = useState("");
const [sendingToAll, setSendingToAll] = useState(false);
  // Add these state variables after existing useState declarations

  // Replace existing message tracking state variables with these
  const [userChatRooms, setUserChatRooms] = useState<{
    [userId: string]: any[];
  }>({});
  const [newMessagesCount, setNewMessagesCount] = useState<{
    [roomKey: string]: number;
  }>({});
  const [isMessageTrackingActive, setIsMessageTrackingActive] = useState(false);
  const [ablyRoomConnections, setAblyRoomConnections] = useState<{
    [roomKey: string]: any;
  }>({});
  const [messagePollingIntervals, setMessagePollingIntervals] = useState<{
    [roomKey: string]: NodeJS.Timeout;
  }>({});
  const [openSmallChatBox, setOpenSmallChatBox] = useState(false);
  const [smallChatBoxData, setSmallChatBoxData] = useState<{
    userId: string;
    roomType: string;
    userName: string;
    roomName: string;
  } | null>(null);
  const [handleChatModalOpen, setHandleChatModalOpen] = useState(false);
  const [handleChatComment, setHandleChatComment] = useState("");
  const roomConnections = useRef<{ [key: string]: any }>({});
  const [usersWithRooms, setUsersWithRooms] = useState<
    {
      user: { userId: string; name: string };
      rooms: any[];
      hasNewMessages: { [roomType: string]: boolean };
      lastMessageTime: { [roomType: string]: number };
    }[]
  >([]);

  useEffect(() => {
    //@ts-ignore
    return localStorage.setItem("roomGameName", cellData.gameName);
  }, [cellData.courtName]);

const fetchUserData = async () => {
  if (!cellData.bookingId) return;
  console.log(cellData, "Cell Data Prop");

  try {
    const bookingRes = await axios.get(
      `${API_BASE_URL_Latest}/booking/${cellData.bookingId}`
    );
    const bookingData = bookingRes.data;
    console.log("booking fetch", bookingRes);

    // Get court and sport info for room type matching - MOVED HERE
    const courtId = bookingData.courtId;
    const courtRes = await axios.get(
      `https://play-os-backend.forgehub.in/court/${courtId}`
    );

    const allowedSports = courtRes.data.allowedSports;
    const firstSportId = Array.isArray(allowedSports) && allowedSports[0];

    let roomType = "SPORTS";
    if (firstSportId) {
      try {
        const sportRes = await axios.get(
          `https://play-os-backend.forgehub.in/sports/id/${firstSportId}`
        );
        roomType = sportRes.data.category || "SPORTS";
        setDirectChatRoomType(roomType);
        localStorage.setItem("roomType", roomType);
      } catch (error) {
        console.warn("Failed to fetch sport info, using default roomType");
      }
    }

    // For single user bookedBy
    const joinedUsers = bookingData.scheduledPlayers || [];
    console.log("scheduled user ids", joinedUsers);

    const usersDetails = await Promise.all(
      joinedUsers.map(async (userId: string) => {
        try {
          const humanRes = await axios.get(
            `${API_BASE_URL_Latest}/human/${userId}`
          );
          return {
            userId,
            name: humanRes.data.name,
            status: "",
          };
        } catch {
          return null;
        }
      })
    );
    const validUsers = usersDetails.filter(
      (u) => u !== null
    ) as UserAttendance[];
    setModalUsers(validUsers);
  } catch (err) {
    console.error("Failed to fetch booking details", err);
  }
};

  useEffect(() => {
    if (isOpen && cellData.bookingId) {
      fetchUserData();
    }
  }, [isOpen]);

  const [modalSubmittedData, setModalSubmittedData] = useState<
    UserAttendance[]
  >([]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle checkbox selection - only one per row
  const handleModalCheckboxChange = (
    userId: string,
    status: "present" | "absent" | "pending"
  ) => {
    setModalUsers((prev) =>
      prev.map((user) =>
        user.userId === userId
          ? { ...user, status: user.status === status ? "" : status }
          : user
      )
    );
  };

  // Handle modal submission
  const handleModalSubmit = async () => {
    const presentUsers = modalUsers.filter((user) => user.status === "present");
    console.log(presentUsers, "presentUsers");

    if (!cellData.bookingId) {
      console.error("Missing bookingId");
      return;
    }

    try {
      // Call API for each present user
      await Promise.all(
        presentUsers.map(async (user) => {
          // We assume user.id corresponds to the ID expected by the API (string or number)
          const userId = user.userId;

          // Construct your URL with bookingId and userId.
          const url = `${API_BASE_URL_Latest}/booking/add-players/${cellData.bookingId}?userIds=${userId}&target_list=joinedUsers`;
          console.log("modal userid and bookingid", userId, cellData.bookingId);

          // POST request (body can be empty or with data if required)
          await axios.patch(url);
        })
      );

      enqueueSnackbar(`Successfully updated present users`, {
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to add present users", err);
      enqueueSnackbar(`Failed to update some users. Please try again.`, {
        variant: "error",
      });
    }

    // Save submitted data and close modal as before
    const checkedModalUsers = modalUsers.filter((user) => user.status !== "");
    setModalSubmittedData(checkedModalUsers);
    console.log("Modal Submitted Data:", checkedModalUsers);
    onClose();
  };

  // Reset modal state when closed
// Replace the entire handleModalClose function
const handleModalClose = () => {
  // Immediate cleanup of all state and connections
  const cleanup = async () => {
    console.log("🧹 Comprehensive modal cleanup initiated...");

    // Clear click timeouts
    Object.values(clickTimeouts.current).forEach(timeout => clearTimeout(timeout));
    clickTimeouts.current = {};

    // Clear session storage click locks
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('click-')) {
        sessionStorage.removeItem(key);
      }
    });

    for (const [roomKey, room] of Object.entries(roomConnections.current)) {
      try {
        if (room) {
          console.log(`🔌 Disconnecting room: ${roomKey}`);
          
          if (room.messages?.unsubscribeAll) {
            await room.messages.unsubscribeAll();
          } else if (room.messages?.unsubscribe) {
            room.messages.unsubscribe();
          }

          if (room.detach && room.status === "attached") {
            await room.detach();
          }

          if (room.release) {
            await room.release();
          }
        }
      } catch (error) {
        console.error(`❌ Error cleaning up room ${roomKey}:`, error);
      }
    }

    roomConnections.current = {};
    console.log("✅ All room connections cleaned up");
    
    // Wait additional time for Ably cleanup
    // await new Promise(resolve => setTimeout(resolve, 2000));
  };

  cleanup();

  // Reset all state immediately
  setModalUsers((prev) => prev.map((user) => ({ ...user, status: "" })));
  setNewMessagesCount({});
  setUserChatRooms({});
  setUsersWithRooms([]);
  setIsMessageTrackingActive(false);
  setDirectChatRoomType("");
  setDirectGameChatRoomName("");
  setDirectGameChatDisplayName("");
  setDirectChatUserId("");
  setOpenSmallChatBox(false);
  setSmallChatBoxData(null);
  setOpenDirectGameChat(false);
  
  console.log("🏁 Modal cleanup completed");
  onClose();
};
  const fetchGameChatId = async () => {
    if (!cellData.bookingId) {
      console.error("Missing bookingId");
      return;
    }

    try {
      // Step 1: Get booking details
      const bookingRes = await axios.get(
        `${API_BASE_URL_Latest}/game/get_games_by_bookingId/${cellData.bookingId}`
      );
      const bookingData = bookingRes.data;
      console.log("Booking data for gameId chatid:", bookingData);

      // // Step 2: Extract date from startTime and sportId
      // const startTime = bookingData.startTime;
      // const date = startTime.split("T")[0]; // Extract date part (e.g., "2025-07-16")
      // const sportId = bookingData.sportId;

      // console.log("Extracted date:", date);
      // console.log("Sport ID:", sportId);

      // // Step 3: Fetch games by sport and date
      // const gamesRes = await axios.get(
      //   `https://play-os-backendv2.forgehub.in/game/games/by-sport?sportId=${sportId}&date=${date}&courtId=ALL`
      // );
      // const gamesData = gamesRes.data;
      // console.log("Games data for game chatid:", gamesData);

      // Step 4: Find the game with matching bookingId and extract chatId
      const matchingGame = bookingData.find(
        (game: any) => game.bookingId === cellData.bookingId
      );

      if (matchingGame && matchingGame.chatId) {
        // Step 5: Store chatId in localStorage
        localStorage.setItem("gameroomChatId", matchingGame.chatId);
        console.log("ChatId stored in localStorage:", matchingGame.chatId);

        // enqueueSnackbar("Game chat loaded successfully", {
        //   variant: "success",
        // });

        return matchingGame.chatId;
      } else {
        console.warn("No matching game found or chatId not available");
        // enqueueSnackbar("Chat not available for this game", {
        //   variant: "warning",
        // });
      }
    } catch (err) {
      console.error("Failed to fetch game chat details", err);
      enqueueSnackbar("Failed to load game chat", {
        variant: "error",
      });
    }
  };

  useEffect(() => {
    fetchGameChatId();
  }, [cellData.bookingId]);

  const API_KEY = "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI";

  function getClientId() {
    try {
      const t = sessionStorage.getItem("token");
      return t ? JSON.parse(atob(t.split(".")[1])).sub : "Guest";
    } catch {
      return "Guest";
    }
  }



  const fetchTimeSlot = async () => {
    const res = await axios.get(
      `${API_BASE_URL_Latest}/booking/${cellData.bookingId}`
    );
    const bookStartTimeUtc = res.data.startTime; // e.g. "2025-07-22T22:00:00"
    const bookEndTimeUtc = res.data.endTime; // e.g. "2025-07-23T00:00:00"

    // FIX: Ensure the date strings are parsed as UTC by appending 'Z' if it's not already there.
    // This is crucial for new Date() to interpret them correctly regardless of local timezone.
    const parsedStartTimeStr = bookStartTimeUtc.endsWith("Z")
      ? bookStartTimeUtc
      : bookStartTimeUtc + "Z";
    const parsedEndTimeStr = bookEndTimeUtc.endsWith("Z")
      ? bookEndTimeUtc
      : bookEndTimeUtc + "Z";

    const startDate = new Date(parsedStartTimeStr);
    const endDate = new Date(parsedEndTimeStr);
    console.log(startDate, endDate, "from usermodal");
    setDatePlanStart(startDate.toISOString().slice(0, 10));
    setDatePlanEnd(endDate.toISOString().slice(0, 10));

    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata", // Specify IST
    };

    const startTimeIst = startDate.toLocaleTimeString("en-IN", options);
    const endTimeIst = endDate.toLocaleTimeString("en-IN", options);

    return `${startTimeIst} - ${endTimeIst}`;
  };

  useEffect(() => {
    if (cellData && cellData.bookingId) {
      // Only fetch if bookingId exists
      setSlotString("Loading..."); // Set loading state
      fetchTimeSlot().then((data) => {
        setSlotString(data);
      });
    } else {
      setSlotString("N/A"); // No booking ID
    }
  }, [cellData]);

  const clientId = getClientId();

  const roomName = `${localStorage.getItem("gameroomChatId")}`;

const realtimeClient = useMemo(() => {
  return new Ably.Realtime({ key: API_KEY, clientId });
}, [API_KEY, clientId]);

const chatClient = useMemo(() => {
  return new ChatClient(realtimeClient, {
    logLevel: LogLevel.Info,
  });
}, [realtimeClient]);

  const stableModalUsers = useMemo(() => {
    return modalUsers.map((user) => ({
      userId: user.userId,
      name: user.name,
    }));
  }, [
    modalUsers.map((u) => u.userId).join(","),
    modalUsers.map((u) => u.name).join(","),
  ]);



 const stableChatClient = useMemo(() => chatClient, [chatClient]); // Remove API_KEY, clientId deps



// Replace the existing useEffect (around line 300-500) with this:
useEffect(() => {
  if (stableModalUsers.length === 0 || !isOpen || !directChatRoomType) return;

  let isEffectActive = true;

  const setupAlwaysOnNotificationConnections = async () => {
    if (!isEffectActive) return;

    console.log(`🔄 Setting up notification connections for roomType: ${directChatRoomType}...`);

    // Cleanup existing connections
    for (const [roomKey, room] of Object.entries(roomConnections.current)) {
      try {
        if (room) {
          if (room.messages?.unsubscribeAll) {
            await room.messages.unsubscribeAll();
          } else if (room.messages?.unsubscribe) {
            room.messages.unsubscribe();
          }
          if (room.detach) await room.detach();
          if (room.release) await room.release();
        }
      } catch (error) {
        console.error(`Error cleaning up room ${roomKey}:`, error);
      }
    }
    roomConnections.current = {};

    if (!isEffectActive) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!isEffectActive) return;

    // Setup notification-only connections
    const usersWithRoomsData = [];

    for (const user of stableModalUsers) {
      if (!isEffectActive) break;

      try {
        const response = await axios.get(
          `https://play-os-backend.forgehub.in/human/human/${user.userId}`
        );
        const rooms = Array.isArray(response.data)
          ? response.data
          : response.data.rooms || [];

        const matchingRoom = rooms.find(
          (room: { roomType: string; }) =>
            room.roomType &&
            room.roomType.trim().toUpperCase() === directChatRoomType.trim().toUpperCase()
        );

        const filteredRooms = matchingRoom ? [matchingRoom] : [];
        
        const userWithRooms = {
          user: { userId: user.userId, name: user.name },
          rooms: filteredRooms,
          hasNewMessages: {},
          lastMessageTime: {},
        };

        usersWithRoomsData.push(userWithRooms);

        // Setup notification connection for matching room only
        for (const room of filteredRooms) {
          if (!isEffectActive) break;

          const roomKey = `${room.chatId}`;

          if (roomConnections.current[roomKey]) {
            console.log(`⏭️ Skipping ${roomKey} - already connected`);
            continue;
          }

          try {
            const ablyRoom = await chatClient.rooms.get(roomKey);

            if (ablyRoom.status !== "attached") {
              await ablyRoom.attach();
            }

            roomConnections.current[roomKey] = ablyRoom;

            // Initial message count check
            const checkInitialMessages = async () => {
              if (!isEffectActive) return;

              try {
                const messageHistory = await ablyRoom.messages.history({ limit: 60 });
                const messages = messageHistory.items;
                const seenByTeamAtDate = new Date(room.handledAt * 1000);
                let messageCount = 0;

                messages.forEach((message) => {
                  const messageTimestamp = message.createdAt || message.timestamp;
                  if (messageTimestamp) {
                    const msgDate = new Date(messageTimestamp);
                    if (msgDate.getTime() > seenByTeamAtDate.getTime()) {
                      messageCount++;
                    }
                  }
                });

                console.log(`📊 Initial notification count for ${roomKey}: ${messageCount}`);

                if (isEffectActive) {
                  setNewMessagesCount((prev) => ({
                    ...prev,
                    [roomKey]: messageCount,
                  }));
                }
              } catch (error) {
                console.error(`Initial message check error for ${roomKey}:`, error);
                if (isEffectActive) {
                  setNewMessagesCount((prev) => ({
                    ...prev,
                    [roomKey]: 0,
                  }));
                }
              }
            };

            // Always-alive notification listener
            const notificationListener = (messageEvent: { message: any; }) => {
              if (!isEffectActive) return;

              const message = messageEvent.message || messageEvent;
              const messageTimestamp = message.createdAt || message.timestamp;
              
              // Get current room data for fresh handledAt comparison
              const currentUserWithRooms = usersWithRooms.find(uwr => uwr.user.userId === user.userId);
              const currentRoom = currentUserWithRooms?.rooms.find(r => r.roomType === room.roomType);
              const currentHandledAt = currentRoom?.handledAt || room.handledAt;
              const seenByTeamAtDate = new Date(currentHandledAt * 1000);

              console.log("📨 Notification listener - New message:", {
                roomKey,
                messageTimestamp: new Date(messageTimestamp),
                seenByTeamAtDate,
                isNewer: messageTimestamp
                  ? new Date(messageTimestamp).getTime() > seenByTeamAtDate.getTime()
                  : false,
              });

              if (messageTimestamp) {
                const msgDate = new Date(messageTimestamp);
                if (msgDate.getTime() > seenByTeamAtDate.getTime()) {
                  setNewMessagesCount((prev) => {
                    const newCount = (prev[roomKey] || 0) + 1;
                    console.log(`🔴 Notification count updated for ${roomKey}: ${newCount}`);
                    return {
                      ...prev,
                      [roomKey]: newCount,
                    };
                  });
                }
              }
            };

            ablyRoom.messages.subscribe(notificationListener);
            await checkInitialMessages();

            console.log(`✅ Notification connection established for ${roomKey}`);
          } catch (error) {
            console.error(`Failed to create notification connection for ${roomKey}:`, error);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch rooms for user ${user.userId}:`, error);
        usersWithRoomsData.push({
          user: { userId: user.userId, name: user.name },
          rooms: [],
          hasNewMessages: {},
          lastMessageTime: {},
        });
      }
    }

    if (isEffectActive) {
      setUsersWithRooms(usersWithRoomsData);
      setIsMessageTrackingActive(true);
      console.log("✅ All notification connections established successfully");
    }
  };

  setupAlwaysOnNotificationConnections();

  return () => {
    isEffectActive = false;

    const cleanup = async () => {
      console.log("🧹 Cleaning up notification connections...");

      for (const [roomKey, room] of Object.entries(roomConnections.current)) {
        try {
          if (room) {
            if (room.messages?.unsubscribeAll) {
              await room.messages.unsubscribeAll();
            } else if (room.messages?.unsubscribe) {
              room.messages.unsubscribe();
            }
            if (room.detach && room.status === "attached") {
              await room.detach();
            }
            if (room.release) await room.release();
          }
        } catch (error) {
          console.error(`Error cleaning up room ${roomKey}:`, error);
        }
      }

      roomConnections.current = {};
      setNewMessagesCount({});
      setUserChatRooms({});
      setUsersWithRooms([]);
      setIsMessageTrackingActive(false);
      console.log("Notification connections cleanup completed");
    };

    cleanup();
  };
}, [stableModalUsers, isOpen, directChatRoomType]);

  // Replace the existing handleOpenRoomChat function with this updated version

// Replace the existing handleOpenRoomChat function with this simplified version:
// Replace the existing handleOpenRoomChat function with this simplified version:
const handleOpenRoomChat = async (userId: string) => {
  if (!userId || !cellData.bookingId) {
    console.warn("❌ Missing userId or bookingId");
    return;
  }

  try {
    console.log("🚀 Opening room chat for user:", userId);
    
    // Find user in usersWithRooms - we already have the matching room
    const userWithRooms = usersWithRooms.find(
      (uwr) => uwr.user.userId === userId
    );

    if (!userWithRooms || !userWithRooms.rooms.length) {
      console.warn("❌ No rooms found for user:", userId);
      return;
    }

    // Since we filtered to only matching rooms, take the first (and only) room
    const matchedRoom = userWithRooms.rooms[0];
    const roomNameDisplay = matchedRoom.roomName;
    const finalRoomName = `${matchedRoom.chatId}`;

    console.log("🔍 Found matching room:", { finalRoomName, roomNameDisplay });
    
    // Set room info for SmallChatBox (no connection management here)
    setDirectGameChatRoomName(finalRoomName);
    setDirectGameChatDisplayName(roomNameDisplay);
    setDirectChatUserId(userId);
    
    console.log("✅ Room info set for SmallChatBox");
    
  } catch (error) {
    console.error("❌ Error opening room chat:", error);
  }
};

  

  const getNewMessagesForUser = (userId: string) => {
    const userWithRooms = usersWithRooms.find(
      (uwr) => uwr.user.userId === userId
    );

    if (!userWithRooms) {
      console.log(`No rooms found for user ${userId}`);
      return 0;
    }

    let totalNewMessages = 0;
    userWithRooms.rooms.forEach((room) => {
      const roomKey = `${room.chatId}`;
      const count = newMessagesCount[roomKey] || 0;
      totalNewMessages += count;
      console.log(`Room ${roomKey}: ${count} new messages`);
    });

    console.log(`Total new messages for user ${userId}: ${totalNewMessages}`);
    return totalNewMessages;
  };



// At the top of the SmallChatBox file/component
interface SmallChatBoxProps {
  roomName: string;
  onClose: () => void;
  userId: string;
  roomType: string;
  userName: string;
  onHandleChat: () => void;
}

interface ChatMessage {
  clientId: string;
  text: string;
  timestamp?: string | number | Date;
  createdAt?: string | number | Date;
  // add other fields if your chat message object requires
}


const SmallChatBox: React.FC<SmallChatBoxProps> = ({
  roomName,
  onClose,
  userId,
  roomType,
  userName,
  onHandleChat,
}) => {

  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [clientNames, setClientNames] = useState<{[key: string]: string}>({});
  const nameRequestsCache = useRef(new Set());

  // Independent connection via useMessages hook
const { historyBeforeSubscribe, send } = useMessages({
  listener: (event) => {
    console.log("🎯 useMessages listener fired:", event.type);
    if (event.type === ChatMessageEventType.Created) {
      const newMsg = event.message;
      console.log("📨 New message in chat:", newMsg.text);
      
      // Prevent adding duplicates by checking if message already exists
      setMessages((prev) => {
        const isDuplicate = prev.some(msg => 
          msg.clientId === newMsg.clientId && 
          msg.text === newMsg.text && 
          Math.abs(new Date(msg.timestamp || msg.createdAt || 0).getTime() - new Date(newMsg.timestamp || newMsg.createdAt || 0).getTime()) < 1000
        );
        
        if (isDuplicate) {
          console.log("🚫 Duplicate message detected, skipping");
          return prev;
        }
        
        console.log("✅ Adding new message to chat");
        fetchSenderName(newMsg.clientId);
        return [...prev, newMsg];
      });
    }
  },
  onDiscontinuity: (error) => {
    console.error("📡 Chat discontinuity:", error);
    // Don't set loading to true here as it would trigger message reload
    console.log("📡 Handling discontinuity without reloading messages");
  },
});

  const currentClientId = useMemo(() => {
    try {
      const t = sessionStorage.getItem("token");
      return t ? JSON.parse(atob(t.split(".")[1])).sub : "Guest";
    } catch {
      return "Guest";
    }
  }, []);

const fetchSenderName = useCallback(
  async (clientId: unknown) => {
    if (
      typeof clientId !== "string" ||
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
      console.error("Error fetching sender name:", error);
      setClientNames((prev) => ({ ...prev, [clientId]: clientId }));
    } finally {
      nameRequestsCache.current.delete(clientId);
    }
  },
  [clientNames]
);

console.log("🔍 historyBeforeSubscribe reference:", historyBeforeSubscribe);
console.log("🔍 loading state:", loading);

  // Load messages - show only new messages since handledAt
  useEffect(() => {
    console.log("🔥 useEffect triggered - historyBeforeSubscribe:", !!historyBeforeSubscribe, "loading:", loading);
    if (!historyBeforeSubscribe || !loading) return;
    
    const loadMessages = async () => {
      try {
        console.log("📥 Loading chat messages for room:", roomName);
        
        const result = await historyBeforeSubscribe({ limit: 60 });
        const allMessages = result.items;
        console.log("📥 All chat messages fetched:", allMessages.length);

        // Get user's room data to find handledAt
        const userRes = await axios.get(
          `https://play-os-backend.forgehub.in/human/human/${userId}`
        );
        
        const userRooms = Array.isArray(userRes.data)
          ? userRes.data
          : userRes.data.rooms || [];
        const currentRoom = userRooms.find(
          (room: { roomType: string; }) => room.roomType === roomType
        );

        if (currentRoom && currentRoom.handledAt) {
          const seenByTeamAtDate = new Date(currentRoom.handledAt * 1000);
          console.log("🕐 Chat handledAt:", seenByTeamAtDate);

          const newMessages = allMessages.filter((msg) => {
            const msgDate = new Date(msg.timestamp || msg.createdAt);
            return msgDate.getTime() > seenByTeamAtDate.getTime();
          });

          console.log(`📊 Showing ${newMessages.length} new chat messages out of ${allMessages.length} total`);

          if (newMessages.length > 0) {
            setMessages(newMessages);
            const uniqueClientIds = [...new Set(newMessages.map((msg) => msg.clientId))];
            uniqueClientIds.forEach((clientId) => fetchSenderName(clientId));
          } else {
            console.log("🔍 No new chat messages found since last handled");
            setMessages([]);
          }
        } else {
          console.log("⚠️ No handledAt found, showing empty chat");
          setMessages([]);
        }
      } catch (error) {
        console.error("❌ Error loading chat messages:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [historyBeforeSubscribe, loading, userId, roomType, roomName]);

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
      
      // Mark as seen by team after sending
      await axios.patch(
        `https://play-os-backend.forgehub.in/human/human/mark-seen`,
        {
          userId: userId,
          roomType: roomType,
          userType: "team",
          handledMsg: "",
        }
      );
      console.log("✅ Team message sent and marked as seen");
    } catch (err) {
      console.error("❌ Send error:", err);
    }
  }, [inputValue, send, userId, roomType]);

const handleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  },
  [sendMessage]
);


const sortedMessages = useMemo(() => {
  return [...messages].sort((a, b) => {
    return (
      new Date(a.timestamp || a.createdAt || 0).getTime() -
      new Date(b.timestamp || b.createdAt || 0).getTime()
    );
  });
}, [messages]);


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
            <div className="text-center text-gray-500">
              Loading messages...
            </div>
          ) : (
            sortedMessages.map((msg, idx) => {
  const isMine = msg.clientId === currentClientId;
  const timestamp = new Date(msg.timestamp || msg.createdAt || 0).toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" }
  );
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
            onClick={onHandleChat}
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

  // Replace the HandleChatModal component entirely
  const HandleChatModal = ({
    isOpen,
    onClose,
    onSave,
    userName,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (comment: string) => void;
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

  const handleChatOpen = () => {
    setHandleChatModalOpen(true);
    setOpenSmallChatBox(false); // Close small chat box when handle chat opens
  };

// Replace the existing handleChatSave function with this:
// Replace the existing handleChatSave function with this:
const handleChatSave = async (comment: string) => {
  if (!smallChatBoxData) return;

  try {
    // Mark chat as handled with comment
    await axios.patch(
      "https://play-os-backend.forgehub.in/human/human/mark-seen",
      {
        userId: smallChatBoxData.userId,
        roomType: smallChatBoxData.roomType,
        userType: "team",
        handledMsg: comment,
      }
    );

    // Refresh user room data to get updated handledAt
    const response = await axios.get(
      `https://play-os-backend.forgehub.in/human/human/${smallChatBoxData.userId}`
    );
    const updatedRooms = Array.isArray(response.data)
      ? response.data
      : response.data.rooms || [];

    // Update usersWithRooms with fresh data
    setUsersWithRooms(prev => 
      prev.map(uwr => {
        if (uwr.user.userId === smallChatBoxData.userId) {
          return {
            ...uwr,
            rooms: updatedRooms.filter((room: { roomType: string; }) => 
              room.roomType &&
              room.roomType.trim().toUpperCase() === directChatRoomType.trim().toUpperCase()
            ),
          };
        }
        return uwr;
      })
    );

    // Recalculate message count with new handledAt using existing always-on connection
    const roomKey = `${smallChatBoxData.roomName.split("-")[2]}`;
    
    // Get the room connection and recheck messages
    const roomConnection = roomConnections.current[roomKey];
    if (roomConnection) {
      try {
        const messageHistory = await roomConnection.messages.history({ limit: 60 });
        const messages = messageHistory.items;
        
        const updatedRoom = updatedRooms.find((room: { roomType: string; }) => room.roomType === smallChatBoxData.roomType);
        const newHandledAt = updatedRoom ? updatedRoom.handledAt : Date.now() / 1000;
        const seenByTeamAtDate = new Date(newHandledAt * 1000);
        
        let messageCount = 0;
        messages.forEach((message: { createdAt: any; timestamp: any; }) => {
          const messageTimestamp = message.createdAt || message.timestamp;
          if (messageTimestamp) {
            const msgDate = new Date(messageTimestamp);
            if (msgDate.getTime() > seenByTeamAtDate.getTime()) {
              messageCount++;
            }
          }
        });
        
        console.log(`🔄 Recalculated message count after handle: ${messageCount}`);
        
        setNewMessagesCount(prev => ({
          ...prev,
          [roomKey]: messageCount
        }));
      } catch (error) {
        console.error("Error recalculating messages after handle:", error);
      }
    }

    setHandleChatModalOpen(false);
    setOpenSmallChatBox(false);
    setSmallChatBoxData(null);

    enqueueSnackbar("Chat handled successfully", { variant: "success" });
  } catch (error) {
    console.error("Failed to handle chat:", error);
    enqueueSnackbar("Failed to handle chat", { variant: "error" });
  }
};

const ReplyToAllBox: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [localInput, setLocalInput] = useState("");
  const currentClientId = useMemo(() => {
    try {
      const t = sessionStorage.getItem("token");
      return t ? JSON.parse(atob(t.split(".")[1])).sub : "Guest";
    } catch {
      return "Guest";
    }
  }, []);

  const sendToAllUsers = async () => {
    if (!localInput.trim()) return;
    
    setSendingToAll(true);
    const message = localInput.trim();
    let successCount = 0;
    let failedUsers: string[] = [];

    try {
      // We'll need to send to each room individually
      // Since useMessages hook works per room, we'll use the existing chat infrastructure
      for (const user of modalUsers) {
        try {
          // Find user's room
          const userWithRooms = usersWithRooms.find(
            (uwr) => uwr.user.userId === user.userId
          );

          if (!userWithRooms || !userWithRooms.rooms.length) {
            console.warn(`No rooms found for user: ${user.name}`);
            failedUsers.push(user.name);
            continue;
          }

          // Get first matching room
          const matchedRoom = userWithRooms.rooms[0];
          const roomKey = `${matchedRoom.chatId}`;

          // Get the room and send message using Chat client
          const room = await stableChatClient.rooms.get(roomKey);
          await room.messages.send({ text: message });

          successCount++;
          console.log(`✅ Message sent to ${user.name}`);
        } catch (error) {
          console.error(`Failed to send to ${user.name}:`, error);
          failedUsers.push(user.name);
        }
      }

      // Show results
      if (successCount > 0) {
        enqueueSnackbar(
          `Message sent successfully to ${successCount} user${successCount > 1 ? 's' : ''}`,
          { variant: "success" }
        );
      }

      if (failedUsers.length > 0) {
        enqueueSnackbar(
          `Failed to send to: ${failedUsers.join(", ")}`,
          { variant: "error" }
        );
      }

      // Close modal and reset
      setLocalInput("");
      onClose();
    } catch (error) {
      console.error("Reply to all error:", error);
      enqueueSnackbar("Failed to send messages", { variant: "error" });
    } finally {
      setSendingToAll(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !sendingToAll) {
      e.preventDefault();
      sendToAllUsers();
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur bg-opacity-30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-96 h-64 flex flex-col shadow-xl">
        {/* Header */}
        <div className="bg-green-500 text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Reply to All Users</span>
            <span className="text-xs bg-green-600 px-2 py-1 rounded">
              {modalUsers.length} users
            </span>
          </div>
          <button onClick={onClose} className="hover:bg-green-600 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="text-sm text-gray-600 mb-3">
            This message will be sent individually to all {modalUsers.length} users in their respective chat rooms.
          </div>
          
  <textarea
    value={localInput}
    onChange={(e) => setLocalInput(e.target.value)}
    onKeyDown={handleKeyDown}
    className="w-full border rounded px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
    placeholder="Type your message to send to all users..."
    disabled={sendingToAll}
    autoFocus
  />
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex space-x-2">
          <button
            onClick={onClose}
            disabled={sendingToAll}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={sendToAllUsers}
            disabled={!localInput.trim() || sendingToAll}
            className={`flex-1 py-2 rounded flex items-center justify-center space-x-2 ${
              !localInput.trim() || sendingToAll
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {sendingToAll ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send to All</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            User Attendance - {cellData.courtName}
          </h2>
          <div
            className="
    border-2 border-blue-400 rounded-lg shadow-md px-3 py-1 font-semibold text-blue-700 bg-blue-50 cursor-pointer transition duration-150 w-fit hover:bg-blue-100 hover:shadow-xl hover:scale-105 hover:border-blue-600 hover:ring-2 hover:ring-blue-300 active:scale-95 select-none
  "
            onClick={() => {
              // navigate("/gameChat");
              setOpenGameChat(true);
            }}
          >
            Game Chat
          </div>

          <div
            className="
    border-2 border-blue-400 rounded-lg shadow-md px-3 py-1 font-semibold text-blue-700 bg-blue-50 cursor-pointer transition duration-150 w-fit hover:bg-blue-100 hover:shadow-xl hover:scale-105 hover:border-blue-600 hover:ring-2 hover:ring-blue-300 active:scale-95 select-none
  "
            onClick={() => setOpenReplyToAllBox(true)}
          >
            Reply to All
          </div>

          <button
            onClick={handleModalClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Time Slot:</strong> {slotString}
              </div>
              <div>
                <strong>Game:</strong> {cellData.gameName}
              </div>
              <div>
                <strong>Booking ID:</strong> {cellData.bookingId}
              </div>
            </div>
          </div>

          {/* User Attendance Table */}
          <div className="overflow-y-auto max-h-64">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    S.No
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    User Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center">
                    Present
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center">
                    Absent
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center">
                    Personal Chat
                  </th>
                </tr>
              </thead>
              <tbody>
                {modalUsers.map((user, index) => (
                  // Replace the existing table row with this updated version that includes message indicator
                  <tr
                    key={user.userId}
                    className="hover:bg-blue-100 cursor-pointer hover:underline transition duration-150 active:scale-95"
                  >
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {index + 1}
                    </td>
                    <td
                      onClick={() => {
                        setUserPlanUserId(user.userId);
                        setUserPlanName(user.name);
                        setUserPlanStartDate(datePlanStart ?? "");
                        setUserPlanEndDate(datePlanEnd ?? "");
                        setIsUserPlanModalOpen(true);
                      }}
                      className="border border-gray-300 px-4 py-2 font-medium relative"
                    >
                      {user.name}
                      {/* New messages indicator */}
                      {/* {getNewMessagesForUser(user.userId) > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {getNewMessagesForUser(user.userId)}
      </span>
    )} */}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={user.status === "present"}
                        onChange={() =>
                          handleModalCheckboxChange(user.userId, "present")
                        }
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={user.status === "absent"}
                        onChange={() =>
                          handleModalCheckboxChange(user.userId, "absent")
                        }
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                    </td>

<td 
className="flex justify-center border border-gray-300 px-4 py-2 text-center relative cursor-pointer hover:bg-gray-50 transition-colors"
onClick={async (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // If this is the automatic second click, skip the auto-trigger
  if (e.isTrusted === false) {
    console.log("🔄 Processing automatic second click for user:", user.userId);
  } else {
    console.log("👆 Processing first click for user:", user.userId);
    
    // For the first (real) click, trigger a second click after 50ms
    setTimeout(() => {
      console.log("🤖 Triggering automatic second click for user:", user.userId);
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      e.target.dispatchEvent(clickEvent);
    }, 50);
  }
  
  try {
    console.log("💬 TbMessage clicked for user:", user.userId);
    
    // Close any existing SmallChatBox first
    if (openSmallChatBox) {
      console.log("🔒 Closing existing chat before opening new one");
      setOpenSmallChatBox(false);
      setSmallChatBoxData(null);
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    await handleOpenRoomChat(user.userId);
    
    // Wait for room to be ready with proper polling
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds total (50 * 100ms)
    
    const waitForRoom = () => {
      return new Promise((resolve, reject) => {
        const checkRoom = () => {
          attempts++;
          
          if (directGameChatRoomName && directChatUserId && !directGameChatRoomName.includes('loading-')) {
            console.log(`✅ Room ready after ${attempts * 100}ms:`, directGameChatRoomName);
            resolve(true);
          } else if (attempts >= maxAttempts) {
            console.error(`❌ Room not ready after ${maxAttempts * 100}ms`);
            reject(new Error('Room setup timeout'));
          } else {
            console.log(`⏳ Waiting for room... attempt ${attempts}/${maxAttempts}`);
            setTimeout(checkRoom, 100);
          }
        };
        
        checkRoom();
      });
    };
    
    await waitForRoom();
    
    // Room is ready, open the chat
    console.log("✅ Opening SmallChatBox with room:", directGameChatRoomName);
    
    setSmallChatBoxData({
      userId: user.userId,
      roomType: directChatRoomType,
      userName: user.name,
      roomName: directGameChatRoomName,
    });
    setOpenSmallChatBox(true);
    
  } catch (error) {
    console.error("❌ Error in TbMessage click:", error);
    // enqueueSnackbar("Failed to open chat. Please try again.", { 
    //   variant: "error" 
    // });
  }
}
}
>
  <TbMessage
    size={30}
    style={{ color: "black", cursor: "pointer" }}
  />
  {/* Keep existing message indicator logic */}
  {(() => {
    const userWithRooms = usersWithRooms.find(
      (uwr) => uwr.user.userId === user.userId
    );
    if (!userWithRooms) return null;

    let matchedRoom = userWithRooms.rooms.find(
      (room) =>
        room.roomType &&
        room.roomType.trim().toUpperCase() === directChatRoomType.trim().toUpperCase()
    ) || userWithRooms.rooms[0];

    if (!matchedRoom) return null;

    const roomKey = `${matchedRoom.chatId}`;
    const count = newMessagesCount[roomKey] || 0;

    return count > 0 ? (
      <span className="absolute top-1 right-14 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center" />
    ) : null;
  })()}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleModalClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleModalSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
        <UserPlanModal
          open={isUserPlanModalOpen}
          handleClose={() => setIsUserPlanModalOpen(false)}
          userId={userPlanUserId}
          userName={userPlanName}
          startDate={userPlanStartDate}
          endDate={userPlanEndDate}
        />

        <div>
          {openGameChat && (
            <div
              className="fixed inset-0 z-[100] bg-white flex flex-col"
              style={{ minHeight: "100vh" }}
            >
              <AblyProvider client={realtimeClient}>
                <ChatClientProvider client={chatClient}>
                  <ChatRoomProvider name={roomName}>
                    <GameChat
                      roomName={`${localStorage.getItem("currentGameName")}`}
                      onClose={() => setOpenGameChat(false)}
                      userId={directChatUserId}
                      roomType={directChatRoomType}
                    />
                  </ChatRoomProvider>
                </ChatClientProvider>
              </AblyProvider>
            </div>
          )}

          
{openSmallChatBox && smallChatBoxData && (
  <AblyProvider client={realtimeClient}>
    <ChatClientProvider client={chatClient}>
      <ChatRoomProvider name={smallChatBoxData.roomName}>
        <SmallChatBox
          key={`${smallChatBoxData.userId}-${smallChatBoxData.roomName}-${Date.now()}`} 
          roomName={smallChatBoxData.roomName}
          onClose={() => {
            console.log("🔒 Closing SmallChatBox with cleanup");
            
            // Only reset chat-specific state, keep always-on connections alive
            setOpenSmallChatBox(false);
            setSmallChatBoxData(null);
            setDirectGameChatRoomName("");
            setDirectGameChatDisplayName("");
            setDirectChatUserId("");
            
            // Clear click timeouts but don't touch always-on connections
            Object.values(clickTimeouts.current).forEach(timeout => clearTimeout(timeout));
            clickTimeouts.current = {};
          }}
          userId={smallChatBoxData.userId}
          roomType={smallChatBoxData.roomType}
          userName={smallChatBoxData.userName}
          onHandleChat={handleChatOpen}
        />
      </ChatRoomProvider>
    </ChatClientProvider>
  </AblyProvider>
)}

          <HandleChatModal
            isOpen={handleChatModalOpen}
            onClose={() => { setHandleChatModalOpen(false)
              setOpenSmallChatBox(false)
            }}
            onSave={handleChatSave}
            userName={smallChatBoxData?.userName || ""}
          />
          {openReplyToAllBox && (
  <ReplyToAllBox
    onClose={() => {
      setOpenReplyToAllBox(false);
      setReplyToAllInput("");
      setSendingToAll(false);
    }}
  />
)}
        </div>
      </div>
    </div>
  );
};

export default CellModal2;

