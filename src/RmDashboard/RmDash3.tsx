// import React, { useEffect, useState } from 'react';
// import { Dumbbell, Heart, Trophy, Utensils, Calendar } from 'lucide-react';
// import { TbMessage } from "react-icons/tb";

// const RmDash = () => {
//   const [loggedInUser, setLoggedInUser] = useState(""); // This is the logged-in user

//   useEffect(() => {
//     // Get the logged-in user from sessionStorage
//     const hostName = sessionStorage.getItem("hostName");
//     if (hostName) {
//       setLoggedInUser(hostName);
//     } else {
//       // Fallback for demo
//       setLoggedInUser("user not found");
//     }
//   }, []);

//   const getColumnHeaderStyle = (type: string) => {
//     switch (type) {
//       case 'fitness':
//         return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
//       case 'wellness':
//         return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
//       case 'sports':
//         return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
//       case 'nutrition':
//         return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
//       case 'events':
//         return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
//       default:
//         return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
//     }
//   };

//   const columns = [
//     {
//       title: 'Fitness',
//       type: 'fitness',
//       icon: <Dumbbell className="w-5 h-5" />
//     },
//     {
//       title: 'Wellness',
//       type: 'wellness',
//       icon: <Heart className="w-5 h-5" />
//     },
//     {
//       title: 'Sports',
//       type: 'sports',
//       icon: <Trophy className="w-5 h-5" />
//     },
//     {
//       title: 'Nutrition',
//       type: 'nutrition',
//       icon: <Utensils className="w-5 h-5" />
//     },
//     {
//       title: 'Events',
//       type: 'events',
//       icon: <Calendar className="w-5 h-5" />
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header with customer name */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-gray-800 mb-2">
//             {loggedInUser ? `${loggedInUser}'s Chat` : "RM Chat"}
//           </h1>
//           <p className="text-gray-600">Chat categories and conversations</p>
//         </div>

//         {/* Compact Grid - 5 columns */}
//         <div className="grid grid-cols-5 gap-6">
//           {columns.map((column) => (
//             <div key={column.type} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//               {/* Column Header */}
//               <div className={`p-3 ${getColumnHeaderStyle(column.type)}`}>
//                 <div className="flex items-center justify-center space-x-2">
//                   {column.icon}
//                   <h2 className="text-lg font-bold">{column.title}</h2>
//                 </div>
//               </div>

//               {/* User Chat Box */}
//               <div className="p-4">
//                 <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-pointer transition-colors border border-gray-200">
//                   <div className="flex items-center justify-center space-x-3">
//                     <span className="text-gray-800 font-medium">
//                       {loggedInUser}
//                     </span>
//                     <button className='cursor-pointer'>
//                       <TbMessage className='size-6' />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RmDash;

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

// Types
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

// Chat Component
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

  // Load only new messages since seenByTeamAt
  useEffect(() => {
    if (historyBeforeSubscribe && loading) {
      historyBeforeSubscribe({ limit: 60 }).then(async (result) => {
        const allMessages: Message[] = result.items as unknown as Message[];

        // Get user's room data to find seenByTeamAt
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

// Handle Chat Modal
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

const RmDashNew3 = () => {
  const [loggedInUser, setLoggedInUser] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersWithRooms, setUsersWithRooms] = useState<UserWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Ably setup
  const API_KEY = "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI";
  const realtimeClient = useMemo(
    () =>
      new Ably.Realtime({
        key: API_KEY,
        clientId: loggedInUser || "RM_Dashboard",
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

  // Polling refs
  const pollingIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const roomConnections = useRef<{ [key: string]: any }>({});
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

  // Fetch all users on mount
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await axios.get(
          "https://play-os-backend.forgehub.in/human/all?type=forge"
        );
        const users = response.data
          .map((user: any) => ({
            userId: user.userId,
            name: user.name,
            type: user.type || "play",
          }))
          .slice(0, 38); // ✅ Limit to first 10 users

        setAllUsers(users);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    const hostName = sessionStorage.getItem("hostName");
    setLoggedInUser(hostName || "RM Dashboard");
    fetchAllUsers();
  }, []);

  // Fetch room data for all users
  useEffect(() => {
    if (allUsers.length === 0) return;

    const fetchAllUserRooms = async () => {
      setLoading(true);
      const usersWithRoomsData: UserWithRooms[] = [];

      // Process users in batches to avoid overwhelming the API
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

  // Start message polling
  useEffect(() => {
    if (usersWithRooms.length === 0) return;

    const setupAlwaysOnConnections = async () => {
      // Properly cleanup existing connections first
      for (const [roomKey, room] of Object.entries(roomConnections.current)) {
        try {
          if (room) {
            // Unsubscribe from all message listeners
            if (room.messages?.unsubscribeAll) {
              await room.messages.unsubscribeAll();
            } else if (room.messages?.unsubscribe) {
              room.messages.unsubscribe();
            }

            // Detach and release room
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

      // Add a small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      for (const userWithRooms of usersWithRooms) {
        for (const room of userWithRooms.rooms) {
          const roomKey = `${room.roomType}-${room.roomName}-${room.chatId}-${userWithRooms.user.userId}`;

          // Skip if room already exists and is connected
          if (roomConnections.current[roomKey]) {
            console.log(`⏭️ Skipping ${roomKey} - already connected`);
            continue;
          }

          try {
            const ablyRoom = await chatClient.rooms.get(roomKey);

            // Ensure room is attached before setting up listeners
            if (ablyRoom.status !== "attached") {
              await ablyRoom.attach();
            }

            roomConnections.current[roomKey] = ablyRoom;

            // Initial message check
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
                  if (
                    messageTimestamp &&
                    new Date(messageTimestamp) > seenByTeamAtDate
                  ) {
                    hasNew = true;
                    const msgTime = new Date(messageTimestamp).getTime();
                    if (msgTime > latestTimestamp) {
                      latestTimestamp = msgTime;
                    }
                  }
                });

                // Update state for initial check
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

            // Set up always-on message listener
            // In RmDashNew, find the always-on connection setup useEffect and replace the messageListener with this:
const messageListener = (messageEvent: { message: any; }) => {
  const message = messageEvent.message || messageEvent;
  const messageTimestamp = message.createdAt || message.timestamp;
  
  // Get fresh handledAt from current state instead of stale closure
  setUsersWithRooms((prevUsersWithRooms) => {
    const currentUserWithRooms = prevUsersWithRooms.find(
      uwr => uwr.user.userId === userWithRooms.user.userId
    );
    
    if (!currentUserWithRooms) return prevUsersWithRooms;
    
    const currentRoom = currentUserWithRooms.rooms.find(r => r.roomType === room.roomType);
    if (!currentRoom) return prevUsersWithRooms;
    
    const currentSeenByTeamAtDate = new Date(currentRoom.handledAt * 1000);

    console.log("📨 RmDash - New message received:", {
      roomKey,
      messageTimestamp: new Date(messageTimestamp),
      currentHandledAt: currentSeenByTeamAtDate,
      isNewer: messageTimestamp
        ? new Date(messageTimestamp).getTime() > currentSeenByTeamAtDate.getTime()
        : false,
    });

    if (messageTimestamp && new Date(messageTimestamp) > currentSeenByTeamAtDate) {
      const msgTime = new Date(messageTimestamp).getTime();

      console.log(`🔴 RmDash - Message is newer, updating state for ${roomKey}`);

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

            // Subscribe to real-time message events
            ablyRoom.messages.subscribe(messageListener);

            // Perform initial check
            await checkInitialMessages();

            console.log(`✅ Always-on connection established for ${roomKey}`);
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

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        for (const [roomKey, room] of Object.entries(roomConnections.current)) {
          try {
            if (room) {
              console.log(`🧹 Cleaning up ${roomKey}`);

              // Unsubscribe from all message listeners
              if (room.messages?.unsubscribeAll) {
                await room.messages.unsubscribeAll();
              } else if (room.messages?.unsubscribe) {
                room.messages.unsubscribe();
              }

              // Detach room connection
              if (room.detach && room.status === "attached") {
                await room.detach();
              }

              // Release room
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
      };

      cleanup();
    };
  }, [usersWithRooms.length, chatClient]);

  const updateConnectionCount = () => {
    const count = Object.keys(roomConnections.current).length;
    setConnectionCount(count);
  };

  const getUsersForColumn = (roomType: string) => {
    return usersWithRooms
      .filter((uwr) => {
        // Only show users who have new messages in this specific room type
        const hasNewMessagesInThisRoom = uwr.hasNewMessages[roomType] || false;
        const hasRoomOfThisType = uwr.rooms.some(
          (room) => room.roomType === roomType
        );

        return hasRoomOfThisType && hasNewMessagesInThisRoom;
      })
      .sort((a, b) => {
        // Sort by latest message time
        const aTime = a.lastMessageTime[roomType] || 0;
        const bTime = b.lastMessageTime[roomType] || 0;
        return bTime - aTime;
      })
      .slice(0, 38); // Ensure we never show more than 10 users per column
  };

  const handleChatOpen = (
    userId: string,
    roomType: string,
    userName: string
  ) => {
    // Close any existing chat
    setOpenChat(null);

    // Find the room
    const userWithRooms = usersWithRooms.find(
      (uwr) => uwr.user.userId === userId
    );
    const room = userWithRooms?.rooms.find((r) => r.roomType === roomType);

    if (room) {
      const roomName = `${room.roomType}-${room.roomName}-${room.chatId}-${userId}`;
      setOpenChat({ userId, roomType, userName, roomName });
    }
  };

// Replace the existing handleChatSave function in RmDashNew with this:
const handleChatSave = async (comment: any) => {
    console.log("save is being called!");
    setHandleChatModal({
      isOpen: false,
      userId: "",
      roomType: "",
      userName: "",
    });
    setOpenChat(null)
  try {
    // Call the patch API to mark chat as handled
    await axios.patch(
      "https://play-os-backend.forgehub.in/human/human/mark-seen",
      {
        userId: handleChatModal.userId,
        roomType: handleChatModal.roomType,
        userType: "team",
        handledMsg: comment,
      }
    );

    // Close the handle chat modal
    setHandleChatModal({
      isOpen: false,
      userId: "",
      roomType: "",
      userName: "",
    });

    // Keep the working setInterval logic
    setInterval(async () => {
        await refreshUserRoomDataAndRecalculate(
      handleChatModal.userId,
      handleChatModal.roomType
    );
    }, 10000)
    
  } catch (error) {
    console.error("Failed to handle chat:", error);
  }
};

// Add debounced refresh for handled chats
const debouncedRefresh = useRef<{ [key: string]: NodeJS.Timeout }>({});

const scheduleRefresh = useCallback((userId: string, roomType: string) => {
  const key = `${userId}-${roomType}`;
  
  // Clear existing timeout
  if (debouncedRefresh.current[key]) {
    clearTimeout(debouncedRefresh.current[key]);
  }
  
  // Schedule refresh after 5 seconds
  debouncedRefresh.current[key] = setTimeout(() => {
    refreshUserRoomDataAndRecalculate(userId, roomType);
    delete debouncedRefresh.current[key];
  }, 3000);
}, []);

// Cleanup timeouts on unmount
useEffect(() => {
  return () => {
    Object.values(debouncedRefresh.current).forEach(clearTimeout);
  };
}, []);

// Replace the existing refreshUserRoomData function with this enhanced version:
const refreshUserRoomDataAndRecalculate = async (userId: string, roomType: string) => {
  try {
    // Fetch updated room data for the specific user
    const response = await axios.get(
      `https://play-os-backend.forgehub.in/human/human/${userId}`
    );
    const updatedRooms = Array.isArray(response.data)
      ? response.data
      : response.data.rooms || [];

    // Find the updated room with new handledAt
    const updatedRoom = updatedRooms.find((room: { roomType: any; }) => room.roomType === roomType);
    if (!updatedRoom) {
      console.warn(`Room type ${roomType} not found for user ${userId}`);
      return;
    }

    // Recalculate messages with updated handledAt
    const roomKey = `${updatedRoom.roomType}-${updatedRoom.roomName}-${updatedRoom.chatId}-${userId}`;
    const roomConnection = roomConnections.current[roomKey];
    
    if (roomConnection) {
      try {
        const messageHistory = await roomConnection.messages.history({ limit: 60 });
        const messages = messageHistory.items;
        const newSeenByTeamAtDate = new Date(updatedRoom.handledAt * 1000);
        
        let hasNew = false;
        let latestTimestamp = 0;

        messages.forEach((message: { createdAt: any; timestamp: any; }) => {
          const messageTimestamp = message.createdAt || message.timestamp;
          if (messageTimestamp && new Date(messageTimestamp) > newSeenByTeamAtDate) {
            hasNew = true;
            const msgTime = new Date(messageTimestamp).getTime();
            if (msgTime > latestTimestamp) {
              latestTimestamp = msgTime;
            }
          }
        });

        console.log(`🔄 Recalculated for ${roomKey}: hasNew=${hasNew}, count=${messages.length}`);

        // Use functional update with a stable key to prevent re-rendering flicker
        setUsersWithRooms((prev) => {
          const userIndex = prev.findIndex(uwr => uwr.user.userId === userId);
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
          
          // Only update if there's actually a change to prevent unnecessary re-renders
          const hasMessagesChanged = currentUser.hasNewMessages[roomType] !== hasNew;
          const hasTimeChanged = currentUser.lastMessageTime[roomType] !== latestTimestamp;
          
          if (!hasMessagesChanged && !hasTimeChanged) {
            return prev; // No change, return same reference
          }
          
          // Create new array with updated user at same position
          const newArray = [...prev];
          newArray[userIndex] = updatedUser;
          return newArray;
        });

        console.log(`✅ Successfully recalculated messages for user ${userId}, room ${roomType}, hasNew: ${hasNew}`);
        
      } catch (error) {
        console.error(`Failed to recalculate messages for ${roomKey}:`, error);
      }
    } else {
      console.warn(`No room connection found for ${roomKey}`);
    }

  } catch (error) {
    console.error(`Failed to refresh room data for user ${userId}:`, error);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <AblyProvider client={realtimeClient}>
      <ChatClientProvider client={chatClient}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                RM Dashboard
              </h1>
              <p className="text-gray-600">Chat monitoring and management</p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span>
                  Monitoring {usersWithRooms.length} users across 5 room types
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  🔗 {connectionCount} Live Connections
                </span>
              </div>
            </div>

            {/* Columns Grid */}
            <div className="grid grid-cols-5 gap-6">
              {columns.map((column) => {
                const usersInColumn = getUsersForColumn(column.type);

                return (
                  <div
                    key={column.type}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    {/* Column Header */}
                    <div className={`p-3 ${getColumnHeaderStyle(column.type)}`}>
                      <div className="flex items-center justify-center space-x-2">
                        {column.icon}
                        <h2 className="text-lg font-bold">{column.title}</h2>
                      </div>
                      <div className="text-center text-sm mt-1 opacity-90">
                        {usersInColumn.length} users
                      </div>
                    </div>

                    {/* Users List with Virtual Scrolling */}
                    <div className="max-h-96 overflow-y-auto">
                      {usersInColumn.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No users in this category
                        </div>
                      ) : (
                        usersInColumn.slice(0, 50).map((userWithRooms) => {
                          // Limit to 50 for performance
                          const hasNewMessages =
                            userWithRooms.hasNewMessages[column.type] || false;

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
              onClose={() =>{
                
                setHandleChatModal({
                  isOpen: false,
                  userId: "",
                  roomType: "",
                  userName: "",
                })
                
            }
              }
              onSave={handleChatSave}
              userName={handleChatModal.userName}
            />
          </div>
        </div>
      </ChatClientProvider>
    </AblyProvider>
  );
};

export default RmDashNew3;
