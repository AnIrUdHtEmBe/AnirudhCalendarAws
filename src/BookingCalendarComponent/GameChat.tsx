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

// Define the message type if not exported from @ably/chat:
type Message = {
  text: string;
  clientId: string;
  timestamp: string;
  [key: string]: any;
};

interface SimpleChatRoomProps {
  roomName: string;
}

export default function GameChat({ roomName }: SimpleChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { historyBeforeSubscribe, send } = useMessages({
    listener: (event: ChatMessageEvent) => {
      if (event.type === ChatMessageEventType.Created) {
        setMessages((prev) => [...prev, event.message as unknown as Message]);
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
      });
    }
  }, [historyBeforeSubscribe, loading]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-none px-4 py-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shadow-inner border-2 border-blue-300 text-2xl font-bold text-blue-700 mr-2">
          {roomName.toUpperCase().charAt(0)}
        </div>
        <h1 className="text-2xl font-bold tracking-wide text-gray-900">
          {roomName}
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

        {[...messages]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .map((msg: Message, idx) => {
            const isMine = msg.clientId === getClientId();
            const timestamp = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

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
                      {msg.clientId}
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
            />
            {isTyping && (
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
          >
            {/* Voice icon (use 🎤 for emoji, or Lucide <Mic />) */}
            <span className="text-lg">🎤</span>
          </button>
        </div>
      </div>
    </div>
  );
}
