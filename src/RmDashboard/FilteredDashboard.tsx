import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Dumbbell,
  Heart,
  Trophy,
  Utensils,
  Users,
  Send,
  X,
  Check,
  ArrowLeft,
} from "lucide-react";
import { TbMessage } from "react-icons/tb";
import axios from "axios";
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
import UserChats from "../GoToChat/UserChats";

// Types (duplicated from main for isolation)
interface User {
  userId: string;
  name: string;
  type: string;
}

interface ChatRoom {
  chatId: string;
  roomName: string;
  roomType: string;
  seenByUserAt: number;
  seenByTeamAt: number;
  handledAt: number;
  handledMsg: string | null;
}

interface UserWithRooms {
  user: User;
  rooms: ChatRoom[];
  hasNewMessages: { [roomType: string]: boolean };
  lastMessageTime: { [roomType: string]: number };
}

interface Message {
  text: string;
  clientId: string;
  timestamp: string;
  createdAt: Date;
  [key: string]: any;
}

interface RM {
  userId: string;
  name: string;
}

// ChatBox component (duplicated for isolation)
const ChatBox = ({
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const nameRequestsCache = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    if (historyBeforeSubscribe && loading) {
      historyBeforeSubscribe({ limit: 60 }).then(async (result) => {
        const allMessages: Message[] = result.items as unknown as Message[];

        try {
          const userRes = await axios.get(
            `https://play-os-backend.forgehub.in/human/human/${userId}`
          );
          const userRooms = userRes.data.rooms || userRes.data;
          const currentRoom = userRooms.find(
            (room: ChatRoom) => room.roomType === roomType
          );

          if (currentRoom) {
            const seenByTeamAtDate = new Date(currentRoom.handledAt * 1000);
            const newMessages = allMessages.filter((msg) => {
              const msgDate = new Date(msg.timestamp || msg.createdAt);
              return msgDate > seenByTeamAtDate;
            });

            setMessages(newMessages);

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
    <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 h-96 flex flex-col shadow-xl">
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

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : (
            sortedMessages.map((msg, idx) => {
              const isMine = msg.clientId === currentClientId;
              const date = new Date(msg.timestamp);

              const day = date.getDate();
              const month = date.toLocaleString("en-US", { month: "short" });

              const time = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              const timestamp = `${day} ${month} - ${time}`;
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

// HandleChatModal (duplicated for isolation)
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
  const [comment, setComment] = useState("");

  const handleSave = () => {
    if (comment.trim()) {
      onSave(comment.trim());
      setComment("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-[60]">
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
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border rounded p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add your comment..."
        />

        <div className="text-xs text-gray-500 mt-1">
          {comment.length}/20 characters minimum
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
            disabled={comment.length < 20}
            className={`flex-1 py-2 rounded ${
              comment.length >= 20
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

const FilteredDashboard = ({ 
  onBack, 
  initialSelectedRm = "all",
  initialFromDate = "",
  initialFromTime = "",
  initialToDate = "",
  initialToTime = "",
  initialApply = false 
}: { 
  onBack: () => void; 
  initialSelectedRm?: string;
  initialFromDate?: string;
  initialFromTime?: string;
  initialToDate?: string;
  initialToTime?: string;
  initialApply?: boolean;
}) => {
  const [loggedInUser, setLoggedInUser] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersWithRooms, setUsersWithRooms] = useState<UserWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltersApplied, setIsFiltersApplied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsersForSearch, setFilteredUsersForSearch] = useState<User[]>(
    []
  );
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [openChat, setOpenChat] = useState<{
    userId: string;
    roomType: string;
    userName: string;
    roomName: string;
  } | null>(null);
  const [handleChatModal, setHandleChatModal] = useState<{
    isOpen: boolean;
    userId: string;
    roomType: string;
    userName: string;
  }>({ isOpen: false, userId: "", roomType: "", userName: "" });
  const [rms, setRms] = useState<RM[]>([]);
  const [selectedRm, setSelectedRm] = useState<string>(initialSelectedRm); // Use initial prop
  const [fromDate, setFromDate] = useState<string>(initialFromDate); // Use initial prop
  const [fromTime, setFromTime] = useState<string>(initialFromTime); // Use initial prop
  const [toDate, setToDate] = useState<string>(initialToDate); // Use initial prop
  const [toTime, setToTime] = useState<string>(initialToTime); // Use initial prop

  const fromDateTime = useMemo(() => {
    if (fromDate && fromTime) return new Date(`${fromDate}T${fromTime}`);
    return null;
  }, [fromDate, fromTime]);

  const toDateTime = useMemo(() => {
    if (toDate && toTime) return new Date(`${toDate}T${toTime}`);
    return null;
  }, [toDate, toTime]);

  const hasDatesSet = useMemo(
    () => !!fromDateTime && !!toDateTime,
    [fromDateTime, toDateTime]
  );
  useEffect(() => {
    setIsFiltersApplied(false); // Reset until Apply button is clicked
  }, [selectedRm, fromDate, fromTime, toDate, toTime]);

  // Ably setup (independent)
  const API_KEY = "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI";
  const realtimeClient = useMemo(
    () =>
      new Ably.Realtime({
        key: API_KEY,
        clientId: loggedInUser || "RM_Dashboard_Filtered",
      }),
    [loggedInUser]
  );
  const chatClient = useMemo(
    () =>
      new ChatClient(realtimeClient, {
        logLevel: LogLevel.Info,
      }),
    [realtimeClient]
  );

  const pollingIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const roomConnections = useRef<{ [key: string]: any }>({});
  const monitoringChatClients = useRef<ChatClient[]>([]);
  const roomsPerClient = useRef<number[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);

  const columns = [
    {
      title: "Fitness",
      type: "FITNESS",
      icon: <Dumbbell className="w-5 h-5" />,
    },
    {
      title: "Wellness",
      type: "WELLNESS",
      icon: <Heart className="w-5 h-5" />,
    },
    { title: "Sports", type: "SPORTS", icon: <Trophy className="w-5 h-5" /> },
    {
      title: "Nutrition",
      type: "NUTRITION",
      icon: <Utensils className="w-5 h-5" />,
    },
    { title: "RM", type: "RM", icon: <Users className="w-5 h-5" /> },
  ];

  const getColumnHeaderStyle = (type: string) => {
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

  // Fetch RMs on mount
  useEffect(() => {
    const fetchRms = async () => {
      try {
        const response = await axios.get(
          "https://play-os-backend.forgehub.in/human/all?type=RM"
        );
        setRms(
          response.data.map((rm: any) => ({ userId: rm.userId, name: rm.name }))
        );
      } catch (error) {
        console.error("Failed to fetch RMs:", error);
      }
    };
    fetchRms();

    const hostName = sessionStorage.getItem("hostName");
    setLoggedInUser(hostName || "RM Dashboard Filtered");
  }, []);

  // Fetch users based on selected RM (all if "all", assigned if specific)
  useEffect(() => {
    if (!isFiltersApplied || selectedRm === "all") {
      setAllUsers([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `https://play-os-backend.forgehub.in/human/rm/getassignedusers?userID=${selectedRm}`
        );
        const users = response.data.assignedUsers.map((u: any) => ({
          userId: u.userId,
          name: u.name,
          type: u.type || "forge",
        }));
        setAllUsers(users);
      } catch (error) {
        console.error("Failed to fetch assigned users:", error);
        setAllUsers([]);
      }
    };
    fetchUsers();
  }, [isFiltersApplied, selectedRm]);

  // Fetch room data for users (same as main)
  useEffect(() => {
    if (allUsers.length === 0) {
      setUsersWithRooms([]);
      return;
    }

    const fetchAllUserRooms = async () => {
      setLoading(true);
      const usersWithRoomsData: UserWithRooms[] = [];

      const batchSize = 10;
      for (let i = 0; i < allUsers.length; i += batchSize) {
        const batch = allUsers.slice(i, i + batchSize);
        const batchPromises = batch.map(async (user) => {
          try {
            const response = await axios.get(
              `https://play-os-backend.forgehub.in/human/human/${user.userId}`
            );
            const rooms = Array.isArray(response.data)
              ? response.data
              : response.data.rooms || [];

            return {
              user,
              rooms,
              hasNewMessages: {},
              lastMessageTime: {},
            };
          } catch (error) {
            console.error(
              `Failed to fetch rooms for user ${user.userId}:`,
              error
            );
            return {
              user,
              rooms: [],
              hasNewMessages: {},
              lastMessageTime: {},
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        usersWithRoomsData.push(...batchResults);
      }

      setUsersWithRooms(usersWithRoomsData);
      setLoading(false);
    };

    fetchAllUserRooms();
  }, [allUsers]);

  // Setup always-on connections (modified for date filter)
  useEffect(() => {
    if (usersWithRooms.length === 0 || !isFiltersApplied) {
      // Cleanup if filters not applied
      const cleanup = async () => {
        for (const [roomKey, room] of Object.entries(roomConnections.current)) {
          try {
            if (room) {
              if (room.messages?.unsubscribeAll) {
                await room.messages.unsubscribeAll();
              } else if (room.messages?.unsubscribe) {
                room.messages.unsubscribe();
              }
              if (room.detach) {
                await room.detach();
              }
              if (room.release) {
                await room.release();
              }
            }
          } catch (error) {
            console.error(`Error cleaning up room ${roomKey}:`, error);
          }
        }
        roomConnections.current = {};

        monitoringChatClients.current.forEach((client) => {
          try {
            client.realtime.close();
          } catch (error) {
            console.error("Error closing monitoring realtime:", error);
          }
        });
        monitoringChatClients.current = [];
        roomsPerClient.current = [];
        updateConnectionCount();
      };
      cleanup();
      return;
    }

    const setupAlwaysOnConnections = async () => {
      // Cleanup existing (to ensure independence)
      for (const [roomKey, room] of Object.entries(roomConnections.current)) {
        try {
          if (room) {
            if (room.messages?.unsubscribeAll) {
              await room.messages.unsubscribeAll();
            } else if (room.messages?.unsubscribe) {
              room.messages.unsubscribe();
            }
            if (room.detach) {
              await room.detach();
            }
            if (room.release) {
              await room.release();
            }
          }
        } catch (error) {
          console.error(`Error cleaning up room ${roomKey}:`, error);
        }
      }
      roomConnections.current = {};

      monitoringChatClients.current.forEach((client) => {
        try {
          client.realtime.close();
        } catch (error) {
          console.error("Error closing monitoring realtime:", error);
        }
      });
      monitoringChatClients.current = [];
      roomsPerClient.current = [];

      await new Promise((resolve) => setTimeout(resolve, 1000));

      for (const userWithRooms of usersWithRooms) {
        for (const room of userWithRooms.rooms) {
          const roomKey = `${room.chatId}`;

          if (roomConnections.current[roomKey]) {
            continue;
          }

          let clientIndex = roomsPerClient.current.findIndex(
            (count) => count < 100
          );
          if (clientIndex === -1) {
            const newRealtime = new Ably.Realtime({
              key: API_KEY,
              clientId: loggedInUser || "RM_Dashboard_Filtered",
            });
            const newChatClient = new ChatClient(newRealtime, {
              logLevel: LogLevel.Info,
            });
            monitoringChatClients.current.push(newChatClient);
            roomsPerClient.current.push(0);
            clientIndex = monitoringChatClients.current.length - 1;
          }

          const chatClient = monitoringChatClients.current[clientIndex];

          try {
            const ablyRoom = await chatClient.rooms.get(roomKey);
            if (ablyRoom.status !== "attached") {
              await ablyRoom.attach();
            }

            roomConnections.current[roomKey] = ablyRoom;
            roomsPerClient.current[clientIndex]++;

            const checkInitialMessages = async () => {
              try {
                const messageHistory = await ablyRoom.messages.history({
                  limit: 60,
                });
                const messages = messageHistory.items;

                const seenByTeamAtDate = new Date(room.handledAt * 1000);
                let hasNew = false;
                let latestTimestamp = 0;

                messages.forEach((message: any) => {
                  const messageTimestamp =
                    message.createdAt || message.timestamp;
                  const msgDate = new Date(messageTimestamp);

                  const inRange =
                    (!fromDateTime || msgDate >= fromDateTime) &&
                    (!toDateTime || msgDate <= toDateTime);

                  if (
                    messageTimestamp &&
                    msgDate > seenByTeamAtDate &&
                    inRange
                  ) {
                    hasNew = true;
                    const msgTime = msgDate.getTime();
                    if (msgTime > latestTimestamp) {
                      latestTimestamp = msgTime;
                    }
                  }
                });

                setUsersWithRooms((prev) =>
                  prev.map((uwr) => {
                    if (uwr.user.userId === userWithRooms.user.userId) {
                      return {
                        ...uwr,
                        hasNewMessages: {
                          ...uwr.hasNewMessages,
                          [room.roomType]: hasNew,
                        },
                        lastMessageTime: {
                          ...uwr.lastMessageTime,
                          [room.roomType]: latestTimestamp,
                        },
                      };
                    }
                    return uwr;
                  })
                );
              } catch (error) {
                console.error(
                  `Initial message check error for ${roomKey}:`,
                  error
                );
              }
            };

            const messageListener = (messageEvent: { message: any }) => {
              const message = messageEvent.message || messageEvent;
              const messageTimestamp = message.createdAt || message.timestamp;
              const msgDate = new Date(messageTimestamp);

              setUsersWithRooms((prevUsersWithRooms) => {
                const currentUserWithRooms = prevUsersWithRooms.find(
                  (uwr) => uwr.user.userId === userWithRooms.user.userId
                );

                if (!currentUserWithRooms) return prevUsersWithRooms;

                const currentRoom = currentUserWithRooms.rooms.find(
                  (r) => r.roomType === room.roomType
                );
                if (!currentRoom) return prevUsersWithRooms;

                const currentSeenByTeamAtDate = new Date(
                  currentRoom.handledAt * 1000
                );

                const inRange =
                  (!fromDateTime || msgDate >= fromDateTime) &&
                  (!toDateTime || msgDate <= toDateTime);

                if (
                  messageTimestamp &&
                  msgDate > currentSeenByTeamAtDate &&
                  inRange
                ) {
                  const msgTime = msgDate.getTime();

                  return prevUsersWithRooms.map((uwr) => {
                    if (uwr.user.userId === userWithRooms.user.userId) {
                      return {
                        ...uwr,
                        hasNewMessages: {
                          ...uwr.hasNewMessages,
                          [room.roomType]: true,
                        },
                        lastMessageTime: {
                          ...uwr.lastMessageTime,
                          [room.roomType]: Math.max(
                            uwr.lastMessageTime[room.roomType] || 0,
                            msgTime
                          ),
                        },
                      };
                    }
                    return uwr;
                  });
                }

                return prevUsersWithRooms;
              });
            };

            ablyRoom.messages.subscribe(messageListener);
            await checkInitialMessages();
            updateConnectionCount();
          } catch (error) {
            console.error(
              `Failed to create always-on connection for ${roomKey}:`,
              error
            );
          }
        }
      }
    };

    setupAlwaysOnConnections();

    return () => {
      const cleanup = async () => {
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
              if (room.release) {
                await room.release();
              }
            }
          } catch (error) {
            console.error(`Error cleaning up room ${roomKey}:`, error);
          }
        }
        roomConnections.current = {};
        updateConnectionCount();

        monitoringChatClients.current.forEach((client) => {
          try {
            client.realtime.close();
          } catch (error) {
            console.error("Error closing monitoring realtime:", error);
          }
        });
        monitoringChatClients.current = [];
        roomsPerClient.current = [];
      };

      cleanup();
    };
  }, [usersWithRooms.length, fromDateTime, toDateTime, isFiltersApplied]); // Re-run if dates change

  const updateConnectionCount = () => {
    const count = Object.keys(roomConnections.current).length;
    setConnectionCount(count);
  };

  // const applyFilters = () => {
  //   if (selectedRm !== "all" && hasDatesSet) {
  //     setIsFiltersApplied(true);
  //   } else {
  //     alert("Please select an RM and set both from and to date/time.");
  //   }
  // };

const applyFilters = () => {
  if (selectedRm !== "all" && hasDatesSet) {
    setIsFiltersApplied(true);
  } else {
    alert("Please select an RM and set both from and to date/time.");
  }
};

  const getUsersForColumn = (roomType: string) => {
    return usersWithRooms
      .filter((uwr) => {
        const hasNewMessagesInThisRoom = uwr.hasNewMessages[roomType] || false;
        const hasRoomOfThisType = uwr.rooms.some(
          (room) => room.roomType === roomType
        );

        return hasRoomOfThisType && hasNewMessagesInThisRoom;
      })
      .sort((a, b) => {
        const aTime = a.lastMessageTime[roomType] || 0;
        const bTime = b.lastMessageTime[roomType] || 0;
        return bTime - aTime;
      })
      .slice(0, 100);
  };

  const handleChatOpen = (
    userId: string,
    roomType: string,
    userName: string
  ) => {
    setOpenChat(null);

    const userWithRooms = usersWithRooms.find(
      (uwr) => uwr.user.userId === userId
    );
    const room = userWithRooms?.rooms.find((r) => r.roomType === roomType);

    if (room) {
      const roomName = `${room.chatId}`;
      setOpenChat({ userId, roomType, userName, roomName });
    }
  };

  const handleChatSave = async (comment: any) => {
    setHandleChatModal({
      isOpen: false,
      userId: "",
      roomType: "",
      userName: "",
    });
    setOpenChat(null);
    try {
      await axios.patch(
        "https://play-os-backend.forgehub.in/human/human/mark-seen",
        {
          userId: handleChatModal.userId,
          roomType: handleChatModal.roomType,
          userType: "team",
          handledMsg: comment,
        }
      );

      setInterval(async () => {
        await refreshUserRoomDataAndRecalculate(
          handleChatModal.userId,
          handleChatModal.roomType
        );
      }, 30000);
    } catch (error) {
      console.error("Failed to handle chat:", error);
    }
  };

  const debouncedRefresh = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const scheduleRefresh = useCallback((userId: string, roomType: string) => {
    const key = `${userId}-${roomType}`;

    if (debouncedRefresh.current[key]) {
      clearTimeout(debouncedRefresh.current[key]);
    }

    debouncedRefresh.current[key] = setTimeout(() => {
      refreshUserRoomDataAndRecalculate(userId, roomType);
      delete debouncedRefresh.current[key];
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(debouncedRefresh.current).forEach(clearTimeout);
    };
  }, []);

  const refreshUserRoomDataAndRecalculate = async (
    userId: string,
    roomType: string
  ) => {
    try {
      const response = await axios.get(
        `https://play-os-backend.forgehub.in/human/human/${userId}`
      );
      const updatedRooms = Array.isArray(response.data)
        ? response.data
        : response.data.rooms || [];

      const updatedRoom = updatedRooms.find(
        (room: { roomType: any }) => room.roomType === roomType
      );
      if (!updatedRoom) {
        console.warn(`Room type ${roomType} not found for user ${userId}`);
        return;
      }

      const roomKey = `${updatedRoom.chatId}`;
      const roomConnection = roomConnections.current[roomKey];

      if (roomConnection) {
        try {
          const messageHistory = await roomConnection.messages.history({
            limit: 60,
          });
          const messages = messageHistory.items;
          const newSeenByTeamAtDate = new Date(updatedRoom.handledAt * 1000);

          let hasNew = false;
          let latestTimestamp = 0;

          messages.forEach((message: { createdAt: any; timestamp: any }) => {
            const messageTimestamp = message.createdAt || message.timestamp;
            const msgDate = new Date(messageTimestamp);

            const inRange =
              (!fromDateTime || msgDate >= fromDateTime) &&
              (!toDateTime || msgDate <= toDateTime);

            if (messageTimestamp && msgDate > newSeenByTeamAtDate && inRange) {
              hasNew = true;
              const msgTime = msgDate.getTime();
              if (msgTime > latestTimestamp) {
                latestTimestamp = msgTime;
              }
            }
          });

          setUsersWithRooms((prev) => {
            const userIndex = prev.findIndex(
              (uwr) => uwr.user.userId === userId
            );
            if (userIndex === -1) return prev;

            const currentUser = prev[userIndex];
            const updatedUser = {
              ...currentUser,
              rooms: updatedRooms,
              hasNewMessages: {
                ...currentUser.hasNewMessages,
                [roomType]: hasNew,
              },
              lastMessageTime: {
                ...currentUser.lastMessageTime,
                [roomType]: latestTimestamp,
              },
            };

            const hasMessagesChanged =
              currentUser.hasNewMessages[roomType] !== hasNew;
            const hasTimeChanged =
              currentUser.lastMessageTime[roomType] !== latestTimestamp;

            if (!hasMessagesChanged && !hasTimeChanged) {
              return prev;
            }

            const newArray = [...prev];
            newArray[userIndex] = updatedUser;
            return newArray;
          });
        } catch (error) {
          console.error(
            `Failed to recalculate messages for ${roomKey}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(`Failed to refresh room data for user ${userId}:`, error);
    }
  };

  // Add this useEffect for search functionality:
  useEffect(() => {
    if (searchQuery) {
      const filtered = allUsers.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsersForSearch(filtered);
    } else {
      setFilteredUsersForSearch([]);
    }
  }, [searchQuery, allUsers]);

  useEffect(() => {
  if (initialApply && selectedRm !== "all" && hasDatesSet) {
    setIsFiltersApplied(true);
  }
}, [initialApply, selectedRm, hasDatesSet]);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
  //       <div className="text-xl text-gray-600">Loading filtered dashboard...</div>
  //     </div>
  //   );
  // }

  return (
    <AblyProvider client={realtimeClient}>
      <ChatClientProvider client={chatClient}>
        {selectedUser ? (
          <UserChats
            userId={selectedUser.userId}
            userName={selectedUser.name}
            onBack={() => setSelectedUser(null)}
          />
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Filtered Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onBack}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <h1 className="text-4xl font-bold text-gray-800">
                    Filtered RM Dashboard
                  </h1>
                  <div className="w-24" />{" "}
                  {/* Spacer replaced with fixed-width div */}
                </div>
                <p className="text-gray-600 mt-2">Filtered chat monitoring</p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mt-2">
                  <span>
                    Monitoring {usersWithRooms.length} users across 5 room types
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                    🔗 {connectionCount} Live Connections
                  </span>
                </div>

                {/* Search Bar */}
                <div className="mt-6 relative max-w-lg mx-auto">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search user by name..."
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilteredUsersForSearch([]);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  {filteredUsersForSearch.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-2 max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {filteredUsersForSearch.map((user) => (
                        <div
                          key={user.userId}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center space-x-3"
                          onClick={() => {
                            setSelectedUser({
                              userId: user.userId,
                              name: user.name,
                            });
                            setSearchQuery("");
                            setFilteredUsersForSearch([]);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.userId}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="mt-6 flex justify-center space-x-4 items-end">
                  <select
                    value={selectedRm}
                    onChange={(e) => setSelectedRm(e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Select RM Name (All)</option>
                    {rms.map((rm) => (
                      <option key={rm.userId} value={rm.userId}>
                        {rm.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border rounded px-3 py-2"
                    placeholder="From Date"
                  />
                  <input
                    type="time"
                    value={fromTime}
                    onChange={(e) => {
                      setFromTime(e.target.value);
                      e.target.blur(); // Close dropdown after selection
                    }}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border rounded px-3 py-2"
                    placeholder="To Date"
                  />
                  <input
                    type="time"
                    value={toTime}
                    onChange={(e) => {
                      setToTime(e.target.value);
                      e.target.blur(); // Close dropdown after selection
                    }}
                    className="border rounded px-3 py-2"
                  />
                  <button
                    onClick={applyFilters}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Apply Filter
                  </button>
                </div>
                {!hasDatesSet && selectedRm !== "all" && (
                  <p className="text-red-500 mt-2">
                    Please select from and to date/time (compulsory for
                    filtering).
                  </p>
                )}
              </div>

              {/* Columns Grid */}
              <div className="grid grid-cols-5 gap-6">
                {columns.map((column) => {
                  const usersInColumn = isFiltersApplied
                    ? getUsersForColumn(column.type)
                    : [];

                  return (
                    <div
                      key={column.type}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      <div
                        className={`p-3 ${getColumnHeaderStyle(column.type)}`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {column.icon}
                          <h2 className="text-lg font-bold">{column.title}</h2>
                        </div>
                        <div className="text-center text-sm mt-1 opacity-90">
                          {usersInColumn.length} users
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {!isFiltersApplied ? (
                          <div className="p-4 text-center text-gray-500">
                            Select RM and set dates to view users
                          </div>
                        ) : usersInColumn.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No users in this category
                          </div>
                        ) : (
                          usersInColumn.slice(0, 50).map((userWithRooms) => {
                            const hasNewMessages =
                              userWithRooms.hasNewMessages[column.type] ||
                              false;

                            return (
                              <div
                                key={`${userWithRooms.user.userId}-${column.type}`}
                                className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                      {userWithRooms.user.name}
                                    </span>
                                    {hasNewMessages && (
                                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() =>
                                      handleChatOpen(
                                        userWithRooms.user.userId,
                                        column.type,
                                        userWithRooms.user.name
                                      )
                                    }
                                    className="cursor-pointer hover:bg-gray-200 p-1 rounded transition-colors flex-shrink-0"
                                  >
                                    <TbMessage className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
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
                    onHandleChat={() => {
                      setHandleChatModal({
                        isOpen: true,
                        userId: openChat.userId,
                        roomType: openChat.roomType,
                        userName: openChat.userName,
                      });
                    }}
                  />
                </ChatRoomProvider>
              )}

              {/* Handle Chat Modal */}
              <HandleChatModal
                isOpen={handleChatModal.isOpen}
                onClose={() => {
                  setHandleChatModal({
                    isOpen: false,
                    userId: "",
                    roomType: "",
                    userName: "",
                  });
                }}
                onSave={handleChatSave}
                userName={handleChatModal.userName}
              />
            </div>
          </div>
        )}
      </ChatClientProvider>
    </AblyProvider>
  );
};

export default FilteredDashboard;
