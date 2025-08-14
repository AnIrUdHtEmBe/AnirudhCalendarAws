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
import React, { useState, useEffect, useRef, ChangeEvent, useMemo, useCallback } from "react";
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
  userId: any;

  name: string;
  status: "present" | "absent" | "pending" | "";
}

const CellModal: React.FC<CellModalProps> = ({ isOpen, onClose, cellData }) => {
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

  const [directChatUserId, setDirectChatUserId] = useState<string>("");
  const [directChatRoomType, setDirectChatRoomType] = useState<string>("");
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
  const handleModalClose = () => {
    setModalUsers((prev) => prev.map((user) => ({ ...user, status: "" })));
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
      return t ? JSON.parse(atob(t.split(".")[1])).name : "Guest";
    } catch {
      return "Guest";
    }
  }

  //   // Fetch slot string when component mounts or when bookingId changes
  // useEffect(() => {
  //   async function fetchSlots() {
  //     if (!cellData.bookingId) return;

  //     try {
  //       const apiRes = await axios.get(`https://play-os-backendv2.forgehub.in/booking/${cellData.bookingId}`);
  //       const startTimeUTC = apiRes.data.startTime;
  //       const endTimeUTC = apiRes.data.endTime;

  //       const startDate = new Date(startTimeUTC);
  //       const endDate = new Date(endTimeUTC);

  //       const options: Intl.DateTimeFormatOptions = {
  //         hour: "2-digit",
  //         minute: "2-digit",
  //         hour12: true,
  //         timeZone: "Asia/Kolkata"
  //       };

  //       const startTimeIST = startDate.toLocaleTimeString("en-IN", options);
  //       const endTimeIST = endDate.toLocaleTimeString("en-IN", options);

  //       setSlotString(`${startTimeIST}  - ${endTimeIST} `);
  //     } catch (error) {
  //       console.error("Failed to fetch slot times", error);
  //       setSlotString("Unavailable");
  //     }
  //   }

  //   fetchSlots();
  // }, [cellData.bookingId]);

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

  const roomName = `room-game-${localStorage.getItem("gameroomChatId")}`;

  const realtimeClient = new Ably.Realtime({ key: API_KEY, clientId });
  const chatClient = new ChatClient(realtimeClient, {
    logLevel: LogLevel.Info,
  });

  useEffect(() => {
    if (modalUsers.length > 0 && !isMessageTrackingActive) {
      initializeAllUserChatRooms();
    }
  }, [modalUsers]);

  // Start polling when chat rooms are initialized
  useEffect(() => {
    if (Object.keys(userChatRooms).length > 0 && isMessageTrackingActive) {
      startAllMessagePolling();
    }
  }, [userChatRooms, isMessageTrackingActive]);

  // Cleanup on component unmount or modal close
  useEffect(() => {
    if (!isOpen) {
      cleanupMessagePolling();
    }

    return () => {
      cleanupMessagePolling();
    };
  }, [isOpen]);

  // Replace the existing handleOpenRoomChat function with this updated version
  const handleOpenRoomChat = async (userId: string) => {
    if (!userId || !cellData.bookingId) return;

    try {
      // Show the chat immediately with loading state
      setDirectGameChatRoomName(`loading-${userId}-${Date.now()}`);
      setDirectGameChatDisplayName("Loading...");
      setOpenDirectGameChat(true);
      setDirectChatUserId(userId);

      // Run all API calls in parallel
      const [userRoomsRes, bookingRes] = await Promise.all([
        axios.get(`https://play-os-backend.forgehub.in/human/human/${userId}`),
        axios.get(
          `https://play-os-backend.forgehub.in/booking/${cellData.bookingId}`
        ),
      ]);

      // Process user rooms
      const userRooms = Array.isArray(userRoomsRes.data)
        ? userRoomsRes.data
        : userRoomsRes.data.rooms;

      const courtId = bookingRes.data.courtId;

      // Get court info
      const courtRes = await axios.get(
        `https://play-os-backend.forgehub.in/court/${courtId}`
      );

      const allowedSports = courtRes.data.allowedSports;
      const firstSportId = Array.isArray(allowedSports) && allowedSports[0];

      // Get sport info (with fallback)
      let roomType = "SPORTS"; // default
      if (firstSportId) {
        try {
          const sportRes = await axios.get(
            `https://play-os-backend.forgehub.in/sports/id/${firstSportId}`
          );
          roomType = sportRes.data.category || "SPORTS";
          setDirectChatRoomType(roomType);
          console.log(roomType, "roomType from userModal");
          localStorage.setItem("roomType", roomType);
        } catch (error) {
          console.warn("Failed to fetch sport info, using default roomType");
        }
      }

      // Find matching room
      let matchedRoom = userRooms?.find(
        (room: any) =>
          room.roomType &&
          room.roomType.trim().toUpperCase() === roomType.trim().toUpperCase()
      );

      if (!matchedRoom) {
        matchedRoom = userRooms && userRooms[0];
        if (!matchedRoom) {
          setDirectGameChatDisplayName("No rooms available");
          return;
        }
      }

      const roomNameDisplay = matchedRoom.roomName;
      const finalRoomName = `${roomType}-${matchedRoom.roomName}-${matchedRoom.chatId}-${userId}`;

      // Reset new messages count when opening chat
      setNewMessagesCount((prev) => ({
        ...prev,
        [finalRoomName]: 0,
      }));

      // Update with actual data
      setDirectGameChatRoomName(finalRoomName);
      setDirectGameChatDisplayName(roomNameDisplay);
      const resetRoomKey = `${roomType}-${matchedRoom.roomName}-${matchedRoom.chatId}-${userId}`;
      setNewMessagesCount((prev) => ({
        ...prev,
        [resetRoomKey]: 0,
      }));

      // Also update the room connection if it exists
      if (ablyRoomConnections[resetRoomKey]) {
        // Force a refresh of message count for this room
        setTimeout(() => {
          setNewMessagesCount((prev) => ({
            ...prev,
            [resetRoomKey]: 0,
          }));
        }, 100);
      }
    } catch (error) {
      console.error("Error opening room chat:", error);
      setDirectGameChatDisplayName("Error loading chat");
    }
  };

  // Add this function after existing functions
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

  // Add this function after fetchUserChatRooms
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
      // Get the room connection
      const room = await chatClient.rooms.get(ablyRoomName);

      // Store room connection
      setAblyRoomConnections((prev) => ({
        ...prev,
        [roomKey]: room,
      }));

      // Clear existing interval if any
      if (messagePollingIntervals[roomKey]) {
        clearInterval(messagePollingIntervals[roomKey]);
      }

      const pollMessages = async () => {
        try {
          // Use the room's messages history method correctly
          const messageHistory = await room.messages.history({ limit: 1000 });
          const messages = messageHistory.items;

          // Convert seenByTeamAt unix timestamp to IST Date for comparison
          const seenByTeamAtIST = new Date(seenByTeamAtUnix * 1000);

          // Count new messages (messages newer than seenByTeamAt)
          let newMessageCount = 0;

          messages.forEach((message: any) => {
            const messageTimestamp = message.createdAt || message.timestamp;

            if (
              messageTimestamp &&
              new Date(messageTimestamp) > seenByTeamAtIST
            ) {
              newMessageCount++;
            }
          });

          // Update new messages count
          setNewMessagesCount((prev) => ({
            ...prev,
            [roomKey]: newMessageCount,
          }));
        } catch (error) {
          console.error(`Failed to poll messages for ${roomKey}:`, error);
          // Reset count on error
          setNewMessagesCount((prev) => ({
            ...prev,
            [roomKey]: 0,
          }));
        }
      };

      // Initial poll
      await pollMessages();

      // Poll every 5 seconds
      const interval = setInterval(pollMessages, 5000);

      setMessagePollingIntervals((prev) => ({
        ...prev,
        [roomKey]: interval,
      }));

      console.log(`Started Ably message polling for ${roomKey}`);
    } catch (error) {
      console.error(`Failed to create room connection for ${roomKey}:`, error);
    }
  };

  const startAllMessagePolling = async () => {
    console.log("Starting Ably message polling for all user rooms...");

    const pollingPromises = Object.entries(userChatRooms).flatMap(
      ([userId, rooms]) =>
        rooms.map((room) =>
          startMessagePolling(
            userId,
            room.roomType,
            room.chatId,
            room.roomName,
            room.seenByTeamAt || 0 // fallback to 0 if seenByTeamAt is missing
          )
        )
    );

    // Start all polling in parallel
    await Promise.allSettled(pollingPromises);

    console.log(
      `Started Ably polling for ${Object.keys(userChatRooms).length} users`
    );
  };

  const initializeAllUserChatRooms = async () => {
    if (modalUsers.length === 0) return;

    console.log("Initializing chat rooms for all users...");
    setIsMessageTrackingActive(true);

    // Fetch chat rooms for all users in parallel
    const roomPromises = modalUsers.map((user) =>
      fetchUserChatRooms(user.userId)
    );
    await Promise.all(roomPromises);

    // Initialize message counts to 0 for all rooms
    const initialCounts: { [roomKey: string]: number } = {};
    modalUsers.forEach((user) => {
      const userRooms = userChatRooms[user.userId] || [];
      userRooms.forEach((room) => {
        const roomKey = `${room.roomType}-${room.roomName}-${room.chatId}-${user.userId}`;
        initialCounts[roomKey] = 0;
      });
    });

    setNewMessagesCount(initialCounts);
    console.log(
      "Initialized chat rooms for all users, starting message tracking..."
    );
  };

  const getNewMessagesForUser = (userId: string) => {
    const userRooms = userChatRooms[userId] || [];
    let totalNewMessages = 0;

    userRooms.forEach((room) => {
      const roomKey = `${room.roomType}-${room.roomName}-${room.chatId}-${userId}`;
      totalNewMessages += newMessagesCount[roomKey] || 0;
    });

    return totalNewMessages;
  };

  const cleanupMessagePolling = async () => {
    console.log("Cleaning up Ably message polling...");

    // Clear all polling intervals
    Object.values(messagePollingIntervals).forEach((interval) => {
      if (interval) clearInterval(interval);
    });

    // Cleanup Ably room connections
    Object.values(ablyRoomConnections).forEach((room) => {
      try {
        // Release room resources if needed
        if (room && typeof room.release === "function") {
          room.release();
        }
      } catch (error) {
        console.error("Error releasing room connection:", error);
      }
    });

    setMessagePollingIntervals({});
    setNewMessagesCount({});
    setUserChatRooms({});
    setAblyRoomConnections({});
    setIsMessageTrackingActive(false);

    console.log("Ably message polling cleanup completed");
  };

  const SmallChatBox = ({
  roomName,
  onClose,
  userId,
  roomType,
  userName,
  onHandleChat,
}: {
  roomName: string;
  onClose: () => void;
  userId: string;
  roomType: string;
  userName: string;
  onHandleChat: () => void;
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const nameRequestsCache = useRef<Set<string>>(new Set());

  const { historyBeforeSubscribe, send } = useMessages({
    listener: (event: ChatMessageEvent) => {
      if (event.type === ChatMessageEventType.Created) {
        const newMsg = event.message as unknown as any;
        setMessages((prev) => [...prev, newMsg]);
        fetchSenderName(newMsg.clientId);
      }
    },
    onDiscontinuity: (error: Error) => {
      console.warn("Chat discontinuity:", error);
      setLoading(true);
    },
  });

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

  // Load only new messages since seenByTeamAt
  useEffect(() => {
    if (historyBeforeSubscribe && loading) {
      historyBeforeSubscribe({ limit: 60 }).then(async (result) => {
        const allMessages: any[] = result.items as unknown as any[];

        // Get user's room data to find seenByTeamAt
        try {
          const userRes = await axios.get(
            `https://play-os-backend.forgehub.in/human/human/${userId}`
          );
          const userRooms = userRes.data.rooms || userRes.data;
          const currentRoom = userRooms.find(
            (room: any) => room.roomType === roomType
          );

          if (currentRoom) {
            const seenByTeamAtDate = new Date(currentRoom.seenByTeamAt * 1000);
            // Filter messages newer than seenByTeamAt
            const newMessages = allMessages.filter((msg) => {
              const msgDate = new Date(msg.timestamp || msg.createdAt);
              return msgDate > seenByTeamAtDate;
            });

            setMessages(newMessages);

            // Fetch names for unique client IDs
            const uniqueClientIds = [
              ...new Set(newMessages.map((msg) => msg.clientId)),
            ];
            uniqueClientIds.forEach((clientId) => fetchSenderName(clientId));
          } else {
            setMessages(allMessages);
          }
        } catch (error) {
          console.error("Error filtering messages:", error);
          setMessages(allMessages);
        }

        setLoading(false);
      });
    }
  }, [historyBeforeSubscribe, loading, userId, roomType, fetchSenderName]);

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
    } catch (err) {
      console.error("Send error", err);
    }
  }, [inputValue, send]);

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
    <div className="fixed inset-0 backdrop-blur bg-black bg-opacity-30 flex items-center justify-center z-[60]">
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
          ) : (
            sortedMessages.map((msg, idx) => {
              const isMine = msg.clientId === currentClientId;
              const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
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
  const handleSave = () => {
    if (handleChatComment.trim() && handleChatComment.length >= 20) {
      onSave(handleChatComment.trim());
      setHandleChatComment("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur bg-black bg-opacity-30 flex items-center justify-center z-[70]">
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
          value={handleChatComment}
          onChange={(e) => setHandleChatComment(e.target.value)}
          className="w-full border rounded p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add your comment (minimum 20 characters)..."
        />
        
        <div className="text-xs text-gray-500 mt-1">
          {handleChatComment.length}/20 characters minimum
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
            disabled={handleChatComment.length < 20}
            className={`flex-1 py-2 rounded ${
              handleChatComment.length >= 20
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

const handleChatSave = async (comment: string) => {
  if (!smallChatBoxData) return;
  
  try {
    await axios.patch(
      "https://play-os-backend.forgehub.in/human/human/mark-seen",
      {
        userId: smallChatBoxData.userId,
        roomType: smallChatBoxData.roomType,
        userType: "team",
        handled: comment,
      }
    );

    setHandleChatModalOpen(false);
    setOpenSmallChatBox(false);
    setSmallChatBoxData(null);
    
    enqueueSnackbar("Chat handled successfully", { variant: "success" });
  } catch (error) {
    console.error("Failed to handle chat:", error);
    enqueueSnackbar("Failed to handle chat", { variant: "error" });
  }
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
            Group Chat
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
                    <td className="flex justify-center border border-gray-300 px-4 py-2 text-center relative">
                      <TbMessage
                        size={30}
                        style={{ color: "black", cursor: "pointer" }}
                        // onClick={() => handleOpenRoomChat(user.userId)}
                        onClick={() => {
  handleOpenRoomChat(user.userId).then(() => {
    if (directGameChatRoomName && directGameChatDisplayName) {
      setSmallChatBoxData({
        userId: directChatUserId,
        roomType: directChatRoomType,
        userName: user.name,
        roomName: directGameChatRoomName,
      });
      setOpenSmallChatBox(true);
    }
  });
}}
                      />
                      {/* New messages indicator on chat icon */}
                      {getNewMessagesForUser(user.userId) > 0 && (
                        <span className="absolute top-1 right-14 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {/* {getNewMessagesForUser(user.userId)} */}
                        </span>
                      )}
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
          roomName={smallChatBoxData.roomName}
          onClose={() => {
            setOpenSmallChatBox(false);
            setSmallChatBoxData(null);
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
  onClose={() => setHandleChatModalOpen(false)}
  onSave={handleChatSave}
  userName={smallChatBoxData?.userName || ""}
/>
        </div>
      </div>
    </div>
  );
};

export default CellModal;

//comment

// replaced from openSmallChatBox
// {openDirectGameChat && (
//   <div
//     className="fixed inset-0 z-[100] bg-white flex flex-col"
//     style={{ minHeight: "100vh" }}
//   >
//     {/* Use your existing Ably provider setup here if needed */}
//     <AblyProvider client={realtimeClient}>
//       <ChatClientProvider client={chatClient}>
//         <ChatRoomProvider name={directGameChatRoomName}>
//           <GameChat
//             roomName={directGameChatDisplayName}
//             onClose={() => setOpenDirectGameChat(false)}
//             userId={directChatUserId}
//             roomType={directChatRoomType}
//           />
//         </ChatRoomProvider>
//       </ChatClientProvider>
//     </AblyProvider>
//   </div>
// )}
