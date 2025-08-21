import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import axios from "axios";
import TopBar from "./Topbar";
import UserModal from "./UserModal";
import Toast from "./Toast";
import { LucideArrowRightSquare } from "lucide-react";
import { API_BASE_URL_Latest } from "./AxiosApi";
import LoadingScreen from "./LoadingScreen";
import "./CellGridLatest.css";
import { useLocation } from "react-router-dom";
import React from "react";
// Add after existing imports
import * as Ably from "ably";
import { ChatClient, LogLevel } from "@ably/chat";
import UserModalNew from "./UserModalNew";
import UserModal2 from "./UserModal2";

// Add before CellGridLatest component definition
const API_KEY = "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI";
const ablyRealtimeClient = new Ably.Realtime({
  key: API_KEY,
  clientId: (() => {
    try {
      const t = sessionStorage.getItem("token");
      return t ? JSON.parse(atob(t.split(".")[1])).name : "Guest";
    } catch {
      return "Guest";
    }
  })(),
});

const cellChatClient = new ChatClient(ablyRealtimeClient, {
  logLevel: LogLevel.Info,
});

export type CellState =
  | "available"
  | "occupied"
  | "blocked"
  | "selected"
  | "unblock"
  | "unbook"
  | "cancelled";

interface CellProps {
  row?: number;
  col?: number;
  state?: CellState;
  label?: string;
  style?: any;
  classNames?: any;
  onClick?: (row: number, col: number) => void;
  onDropAction?: (from: [number, number], to: [number, number]) => void;
  isSelected?: any;
  cellMessageCounts?: { [bookingId: string]: number };
  getBookingIdForOccupiedCell?: (
    row: number,
    col: number
  ) => Promise<string | null>;
}

type Court = { courtId: string; name: string };

type Booking = {
  type: string;
  bookedBy: string;
  sportId: string;
  startTime: string;
  endTime: string;
  status: string;
  joinedUsers: any[];
  price: number | null;
  capacity: number | null;
  st_unix: number;
  et_unix: number;
  bookingId: string;
};

type CourtDetails = {
  arenaId: string;
  name: string;
  capacity: number;
  allowedSports: string[];
  openingTime: string;
  closingTime: string;
  status: string;
  slotSize: number;
  courtId: string;
};

type Sport = {
  name: string;
  description: string;
  maxPlayers: number;
  minPlayers: number;
  minTime: number;
  maxTime: number;
  icon: string;
  instructions: string[];
  category: string;
  sportId: string;
};

const toIST = (utc: string) => {
  const date = new Date(utc);
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
};

function toLocalISOString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // Months are 0-based
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Add this component before CellGridLatest component
// ✅ Outside of CellGridLatest, before Cell definition
const RedDotIndicator: React.FC<{
  row: number;
  col: number;
  cellMessageCounts: { [bookingId: string]: number };
  getBookingIdForOccupiedCell: (
    row: number,
    col: number
  ) => Promise<string | null>;
}> = ({ row, col, cellMessageCounts, getBookingIdForOccupiedCell }) => {
  const [hasNewMessages, setHasNewMessages] = useState(false);

  useEffect(() => {
    const checkForNewMessages = async () => {
      const bookingId = await getBookingIdForOccupiedCell(row, col);
      if (bookingId && cellMessageCounts[bookingId] > 0) {
        setHasNewMessages(true);
      } else {
        setHasNewMessages(false);
      }
    };

    checkForNewMessages();
  }, [row, col, cellMessageCounts, getBookingIdForOccupiedCell]);

  if (!hasNewMessages) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full z-10"></div>
  );
};

const Cell = ({
  row,
  col,
  state,
  label,
  style,
  classNames,
  onClick,
  onDropAction,
  isSelected,
  cellMessageCounts,
  getBookingIdForOccupiedCell,
}: CellProps) => {
  const colorMap: Record<CellState, string> = {
    available:
      "bg-neutral-100 border-4 border-green-500 rounded transition focus:bg-green-50 hover:bg-green-300 text-gray-900 flex items-center px-2 py-1",
    occupied: "bg-green-500",
    blocked: "bg-red-500",
    selected: "bg-blue-500",
    unblock:
      "bg-neutral-100 border-4 border-green-500 rounded transition focus:bg-green-50 hover:bg-green-300 text-gray-900 flex items-center px-2 py-1",
    unbook:
      "bg-neutral-100 border-4 border-green-500 rounded transition focus:bg-green-50 hover:bg-green-300 text-gray-900 flex items-center px-2 py-1",
    cancelled:
      "bg-neutral-100 border-4 border-green-500 rounded transition focus:bg-green-50 hover:bg-green-300 text-gray-900 flex items-center px-2 py-1",
  };

  if (label) {
    return (
      <div
        className="min-w-[4rem] flex-1 h-10 flex items-center justify-center border border-gray-200 rounded-md bg-white text-xs font-semibold text-timeSlot whitespace-nowrap"
        style={{ userSelect: "none" }}
      >
        {label}
      </div>
    );
  }

  const showRing =
    isSelected &&
    (state === "occupied" ||
      state === "blocked" ||
      state === "unblock" ||
      state === "unbook");

  // In the Cell component definition, replace the return statement with:
  return (
    <div
      className={clsx(
        classNames,
        "min-w-[4rem] flex-1 h-10 border border-white rounded-md cursor-pointer transition-colors relative",
        state && colorMap[state],
        showRing &&
          isSelected &&
          "ring-4 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg animate-pulse [animation-duration:5.8s]"
      )}
      style={style}
      onClick={() => {
        if (row !== undefined && col !== undefined && onClick) {
          onClick(row, col);
        }
      }}
      draggable={state === "occupied" || state === "blocked"}
      onDragStart={(e) => {
        if (row !== undefined && col !== undefined) {
          e.dataTransfer.setData("text/plain", `${row},${col}`);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const [fromRow, fromCol] = e.dataTransfer
          .getData("text/plain")
          .split(",")
          .map(Number);
        if (
          row !== undefined &&
          col !== undefined &&
          onDropAction &&
          (state === "available" || "unblock" || "unbook")
        ) {
          onDropAction([fromRow, fromCol], [row, col]);
        }
      }}
    >
      {/* Add red dot for occupied cells with new messages */}
      {state === "occupied" && row !== undefined && col !== undefined && (
        <RedDotIndicator
          row={row}
          col={col}
          cellMessageCounts={cellMessageCounts!}
          getBookingIdForOccupiedCell={getBookingIdForOccupiedCell!}
        />
      )}
    </div>
  );
};

const CellGridLatest = () => {
  const [courtId, setCourtId] = useState<Court[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {}
  );

  const [courtDetailsMap, setCourtDetailsMap] = useState<
    Record<string, CourtDetails>
  >({});
  const [courtAllowedSportsMap, setCourtAllowedSportsMap] = useState<
    Record<string, Sport[]>
  >({});

  const [maxPlayers, setMaxPlayers] = useState<number>(1); // default 1
  const [difficultyLevel, setDifficultyLevel] = useState<string>("Beginner"); // default Beginner

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const activeTab = urlParams.get("tab") || "All";

  // Add this after the existing state declarations (around line 150)
  const [cellData, setCellData] = useState<{
    courtName: string;
    timeSlot: string;
    gameName: string;
    bookingId: string;
  } | null>(null);

  // Message polling states - add after existing state declarations
  const [cellMessageCounts, setCellMessageCounts] = useState<{
    [bookingId: string]: number;
  }>({});
  const [cellUserChatRooms, setCellUserChatRooms] = useState<{
    [bookingId: string]: { [userId: string]: any[] };
  }>({});
  const [cellAblyConnections, setCellAblyConnections] = useState<{
    [roomKey: string]: any;
  }>({});
  const [cellPollingIntervals, setCellPollingIntervals] = useState<{
    [roomKey: string]: NodeJS.Timeout;
  }>({});
  const [isMessagePollingActive, setIsMessagePollingActive] = useState(false);

  // Add this filtering function
  // const getCourtType = (courtName: string): string => {
  //   if (courtName.startsWith("Wellness")) return "Wellness";
  //   if ((courtName.startsWith("Fitness") || courtName.startsWith("Forge Gym") || courtName.startsWith("Gym")))  return "Fitness";
  //   return "Sports";
  // };

  // // Add this filtered courts computation
  // const filteredCourtId = React.useMemo(() => {
  //   if (activeTab === "All") return courtId;

  //   return courtId.filter((court) => {
  //     const resolvedName = resolvedNames[court.courtId] || court.name;
  //     const courtType = getCourtType(resolvedName);
  //     return courtType === activeTab;
  //   });
  // }, [courtId, resolvedNames, activeTab]);

  // Updated getCourtType function that fetches data
  // Updated getCourtType function that fetches data
  const getCourtType = async (courtId: string): Promise<string> => {
    try {
      const courtRes = await axios.get(
        `https://play-os-backend.forgehub.in/court/${courtId}`
      );
      const sportIdss = courtRes.data.allowedSports?.[0];
      // console.log("sportId from court filter", sportIdss);

      if (!sportIdss) return "Sports"; // Default fallback

      const sportRes = await axios.get(
        `https://play-os-backend.forgehub.in/sports/id/${sportIdss}`
      );
      const category = sportRes.data.category || "";
      // console.log("category filter", category);

      if (category === "WELLNESS") {
        return "Wellness";
      }
      if (category === "FITNESS") {
        return "Fitness";
      }
      return "Sports";
    } catch (err) {
      // console.error(`Error processing court ${courtId}`, err);
      return "Sports"; // Default fallback on error
    }
  };

  // Add state to store court types
  const [courtTypes, setCourtTypes] = React.useState<Record<string, string>>(
    {}
  );
  const [isLoadingCourtTypes, setIsLoadingCourtTypes] = React.useState(false);

  // Fetch court types when courtId changes
  useEffect(() => {
    const fetchCourtTypes = async () => {
      if (courtId.length === 0) return;

      setIsLoadingCourtTypes(true);
      const types: Record<string, string> = {};

      await Promise.all(
        courtId.map(async (court) => {
          const courtType = await getCourtType(court.courtId);
          types[court.courtId] = courtType;
        })
      );

      setCourtTypes(types);
      setIsLoadingCourtTypes(false);
    };

    fetchCourtTypes();
  }, [courtId]);

  // Updated filtered courts computation - FIXED
  const filteredCourtId = useMemo(() => {
    if (activeTab === "All") return courtId;

    if (isLoadingCourtTypes) return []; // Return empty array while loading

    return courtId.filter((court) => {
      const courtType = courtTypes[court.courtId] || "Sports"; // Default fallback
      return courtType === activeTab;
    });
  }, [courtId, courtTypes, activeTab, isLoadingCourtTypes]);

  // 24 hours with 30-minute slots = 48 columns
  const cols = 48;
  const rows = filteredCourtId.length;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<
    Record<string, { start: Date; end: Date }[]>
  >({});
  const [grid, setGrid] = useState<CellState[][]>(
    Array.from({ length: rows }, () => Array(cols).fill("available"))
  );
  // selected is now an array of selected cells
  const [selected, setSelected] = useState<Array<[number, number]>>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [arenaOpeningTime, setArenaOpeningTime] = useState<Date | null>(null);
  const [arenaClosingTime, setArenaClosingTime] = useState<Date | null>(null);
  const [visibleStartSlot, setVisibleStartSlot] = useState(12); // default to 12 (6 AM)
  const [visibleSlotCount, setVisibleSlotCount] = useState(36); // default to 36 slots
  const [visibleEndSlot, setVisibleEndSlot] = useState(48); // default to 48 (end of day)

  // New state for selected cell details
  const [selectedCellDetails, setSelectedCellDetails] = useState<{
    courtDetails: CourtDetails | null;
    bookings: Booking[];
    gameName: string;
    availableSports: Sport[];
    currentBooking: Booking | null;
  }>({
    courtDetails: null,
    bookings: [],
    gameName: "",
    availableSports: [],
    currentBooking: null,
  });

  const [selectedSportId, setSelectedSportId] = useState<string>("");
  const [isLoadingCellDetails, setIsLoadingCellDetails] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(true);

  // Check if all selected cells are in the same row and columns are consecutive
  const isValidSelection = (
    selectedCells: Array<[number, number]>
  ): boolean => {
    if (selectedCells.length === 0) return false;

    // Extract all rows and columns
    const rows = selectedCells.map(([row]) => row);
    const cols = selectedCells.map(([_, col]) => col).sort((a, b) => a - b);

    // Check if all rows are the same
    const uniqueRows = new Set(rows);
    if (uniqueRows.size !== 1) return false;

    // Check if columns are consecutive
    for (let i = 1; i < cols.length; i++) {
      if (cols[i] !== cols[i - 1] + 1) return false;
    }

    return true;
  };

  const getCellData = async () => {
    if (!selectedCell) return null;

    const { row, col } = selectedCell;
    const court = getFilteredCourtByIndex(row);
    const courtName = resolvedNames[court.courtId] || court.name;

    // Format the selected time slot (single or multiple)
    const timeSlot = formatSelectedTimeRange(
      selected.length > 0 ? selected : [[row, col]]
    );

    // Use gameName from selectedCellDetails, fallback if needed
    const gameName = selectedCellDetails.gameName || "";

    // Get FRESH bookingId instead of using cached data
    let bookingId = "";
    try {
      const freshBookingId = await getBookingIdForCell(row, col);
      bookingId = freshBookingId || "";
    } catch (error) {
      // console.error("Error getting fresh bookingId:", error);
      bookingId = "";
    }

    const data = {
      courtName,
      timeSlot,
      gameName,
      bookingId,
    };

    // Update the state with the fetched data
    setCellData(data);

    // return {
    //   courtName,
    //   timeSlot,
    //   gameName,
    //   bookingId,
    // };

    return data;
  };

  // Format time range only if selection is valid
  const formatSelectedTimeRange = (
    selectedCells: Array<[number, number]>
  ): string => {
    if (!isValidSelection(selectedCells)) {
      return "Invalid selection";
    }

    const colsSelected = selectedCells
      .map(([_, col]) => col)
      .sort((a, b) => a - b);
    const firstCol = colsSelected[0];
    const lastCol = colsSelected[colsSelected.length - 1];

    const formatTime = (col: number) => {
      const hour = Math.floor(col / 2);
      const minute = col % 2 === 0 ? 0 : 30;
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? "AM" : "PM";
      return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
    };

    const startTimeStr = formatTime(firstCol);

    let endHour = Math.floor(lastCol / 2);
    let endMinute = lastCol % 2 === 0 ? 0 : 30;
    endMinute += 30;
    if (endMinute === 60) {
      endMinute = 0;
      endHour += 1;
    }
    const displayEndHour = endHour % 12 === 0 ? 12 : endHour % 12;
    const endAmPm = endHour < 12 ? "AM" : "PM";
    const endTimeStr = `${displayEndHour}:${endMinute
      .toString()
      .padStart(2, "0")} ${endAmPm}`;

    return `${startTimeStr} - ${endTimeStr} `;
  };

  // Generate time labels for 24 hours (12 AM to 12 AM)
  const timeLabels = useMemo(() => {
    return Array.from({ length: cols }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minute = i % 2 === 0 ? "00" : "30";
      const nextHour = Math.floor((i + 1) / 2);
      const nextMinute = (i + 1) % 2 === 0 ? "00" : "30";

      const formatHour = (h: number) => {
        if (h === 0) return "12 AM";
        if (h < 12) return `${h} AM`;
        if (h === 12) return "12 PM";
        return `${h - 12} PM`;
      };

      const formatHourShort = (h: number) => {
        if (h === 0) return "12";
        if (h <= 12) return h.toString();
        return (h - 12).toString();
      };

      return `${formatHourShort(hour)}:${minute}  `;
    });
  }, [cols]);

  const [courtSlots, setCourtSlots] = useState<Record<string, any[]>>({});
  const [courtBookIds, setCourtBookids] = useState<Record<string, any[]>>({});
  const [slotPrices, setSlotPrices] = useState<
    Record<string, Record<string, number>>
  >({});

  function toDate(dateOrString: string | Date): Date {
    return typeof dateOrString === "string"
      ? new Date(dateOrString)
      : dateOrString;
  }

  const calculateColumns = (
    openTime: string | Date,
    closeTime: string | Date
  ) => {
    const start = toDate(openTime);
    const end = toDate(closeTime);

    // Calculate difference in milliseconds
    const diffMs = end.getTime() - start.getTime();

    // Convert to minutes
    const diffMin = diffMs / (1000 * 60);

    // Each 30 min = 1 slot
    const slots = diffMin / 30;

    // Round to integer if needed
    return Math.round(slots);
  };

  const fetchArenaData = async () => {
    try {
      const response = await fetch(
        "https://play-os-backend.forgehub.in/arena/AREN_JZSW15"
      );
      const arenaData = await response.json();

      // Convert from UTC to IST
      const openingTimeIST = toIST(arenaData.openingTime);
      const closingTimeIST = toIST(arenaData.closingTime);

      setArenaOpeningTime(openingTimeIST);
      setArenaClosingTime(closingTimeIST);

      // Calculate opening slot (each slot is 30 minutes, starting from midnight)
      const openingHour = openingTimeIST.getHours();
      const openingMinute = openingTimeIST.getMinutes();
      const openingSlot = openingHour * 2 + (openingMinute >= 30 ? 1 : 0);

      // Calculate closing slot
      const closingHour = closingTimeIST.getHours();
      const closingMinute = closingTimeIST.getMinutes();
      const closingSlot = closingHour * 2 + (closingMinute >= 30 ? 1 : 0);

      // Calculate visible slots
      const totalVisibleSlots = closingSlot - openingSlot;

      setVisibleStartSlot(openingSlot);
      setVisibleEndSlot(closingSlot);
      setVisibleSlotCount(totalVisibleSlots);
    } catch (error) {
      // console.error("Error fetching arena data:", error);
      // Keep default values on error
    }
  };

  const fetchArenaDetails = async () => {
    const apiRes = await axios.get(`${API_BASE_URL_Latest}/arena/AREN_JZSW15`);
    const arenaStartTime = apiRes.data.openingTime;
    const arenaEndTime = apiRes.data.closingTime;

    const arenaOpen = toIST(arenaStartTime);
    const arenaClose = toIST(arenaEndTime);

    // console.log("arena opne close", arenaOpen, arenaClose);
    const numColumns = calculateColumns(arenaOpen, arenaClose);
    // console.log("Number of 30 min slots (columns):", numColumns);
  };

  const fetchCourtIDs = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL_Latest}/arena/AREN_JZSW15/courts`
      );
      if (Array.isArray(response.data)) {
        setCourtId(response.data);
        const nameMap: Record<string, string> = {};

        await Promise.all(
          response.data.map(async (court: Court) => {
            if (court.name.startsWith("court_")) {
              const userId = court.name.replace("court_", "");
              try {
                const res = await axios.get(
                  `${API_BASE_URL_Latest}/human/${userId}`
                );
                nameMap[court.courtId] = res.data.name;
              } catch {
                nameMap[court.courtId] = court.name;
              }
            } else {
              nameMap[court.courtId] = court.name;
            }
          })
        );

        setResolvedNames(nameMap);
      }
    } catch (error) {
      // console.error("Failed to fetch court IDs", error);
    }
  };

  useEffect(() => {
    fetchArenaDetails();
  }, []);

  const fetchAllCourtDetails = useCallback(
    async (filteredCourtId: Court[]) => {
      const detailsMap: Record<string, CourtDetails> = {};
      const allowedSportsMap: Record<string, Sport[]> = {};

      await Promise.all(
        filteredCourtId.map(async (court) => {
          try {
            const res = await axios.get(
              `${API_BASE_URL_Latest}/court/${court.courtId}`
            );
            const courtDetails = res.data;
            // console.log("court details ", courtDetails);

            detailsMap[court.courtId] = courtDetails;

            // Fetch allowed sports for this court
            const sports = await Promise.all(
              courtDetails.allowedSports.map(async (sportId: any) => {
                try {
                  const sportRes = await axios.get(
                    `${API_BASE_URL_Latest}/sports/id/${sportId}`
                  );
                  // console.log("sport res data", sportRes);

                  return sportRes.data;
                } catch {
                  return null;
                }
              })
            );

            allowedSportsMap[court.courtId] = sports.filter(
              (s) => s !== null
            ) as Sport[];
          } catch (error) {
            // console.error(
            //   `Failed to fetch court details or sports for ${court.courtId}`,
            //   error
            // );
          }
        })
      );
      // console.log("allowedSportsMap", allowedSportsMap);

      setCourtDetailsMap(detailsMap);
      setCourtAllowedSportsMap(allowedSportsMap);
    },
    [courtDetailsMap, courtAllowedSportsMap]
  );

  const fetchSlotsForCourts = useCallback(async () => {
    const dateStr = currentDate.toISOString().split("T")[0];
    const slotsMap: Record<string, any[]> = {};
    const bookIdMap: Record<string, any[]> = {};

    await Promise.all(
      filteredCourtId.map(async (court) => {
        try {
          const res = await axios.get(
            `${API_BASE_URL_Latest}/court/${court.courtId}/slots?date=${dateStr}`
          );
          const rawSlots = Array.isArray(res.data) ? res.data : [];

          // Convert all slot times from UTC to IST here
          const istSlots = rawSlots.map((slot) => ({
            ...slot,
            startTime: toIST(slot.startTime),
            endTime: toIST(slot.endTime),
            date: toIST(slot.date),
          }));

          slotsMap[court.courtId] = istSlots;

          bookIdMap[court.courtId] = rawSlots.map((slot) => ({
            ...slot,
            bookingId: slot.bookingInfo,
          }));
        } catch (e) {
          // console.error(`Failed to fetch slots for court ${court.courtId}`, e);
          slotsMap[court.courtId] = [];
        }
      })
    );
    // console.log("slots map get api", slotsMap);
    // console.log("bookzIDnew", bookIdMap);

    setCourtSlots(slotsMap);
    setCourtBookids(bookIdMap);
  }, [currentDate, filteredCourtId, courtSlots]);

  const fetchPrices = async () => {
    const newPrices: Record<string, Record<string, number>> = {};

    const allSlots = Object.values(courtSlots).flat();
    // console.log("all slots before fetching price", allSlots);

    await Promise.all(
      allSlots.map(async (slot) => {
        try {
          const res = await axios.get(
            `${API_BASE_URL_Latest}/timeslot/${slot.slotId}`
          );
          if (!newPrices[slot.courtId]) newPrices[slot.courtId] = {};
          newPrices[slot.courtId][slot.slotId] = res.data.price ?? 0;
        } catch (e) {
          // console.error(`Failed to fetch price for slot ${slot.slotId}`, e);
          if (!newPrices[slot.courtId]) newPrices[slot.courtId] = {};
          newPrices[slot.courtId][slot.slotId] = 0;
        }
      })
    );
    // console.log("new prices response", newPrices);

    setSlotPrices(newPrices);
  };

  useEffect(() => {
    fetchCourtIDs();
  }, []);

  useEffect(() => {
    if (filteredCourtId.length > 0) {
      fetchAllCourtDetails(filteredCourtId);
    }
  }, [filteredCourtId, activeTab]);

  useEffect(() => {
    if (filteredCourtId.length === 0) return;
    fetchSlotsForCourts();
  }, [filteredCourtId.length, currentDate, activeTab]);

  // console.log(courtSlots, "Court Slots state");

  // useEffect(() => {
  //   if (Object.keys(courtSlots).length > 0) {
  //     fetchPrices();
  //   }
  // }, [courtSlots]);

  const getFilteredCourtByIndex = (index: number) => {
    return filteredCourtId[index];
  };

  // Updated grid generation function
  const updateGridWithBookings = useCallback(
    (
      courtsData: Court[],
      bookingsData: Record<string, { start: Date; end: Date }[]>,
      blockedData: Record<string, { start: Date; end: Date }[]>, // new param for blocked slots
      cancelledData: Record<string, { start: Date; end: Date }[]>,
      date: Date
    ) => {
      const newGrid: CellState[][] = Array.from(
        { length: courtsData.length },
        () => Array(cols).fill("available")
      );

      for (let r = 0; r < courtsData.length; r++) {
        const court = courtsData[r];
        const courtBookings = bookingsData[court.courtId] || [];
        const courtBlocked = blockedData[court.courtId] || [];
        const courtCancelled = cancelledData[court.courtId] || [];

        // Mark blocked cells first
        for (const block of courtBlocked) {
          const startTime = block.start.getTime();
          const endTime = block.end.getTime();

          for (let i = 0; i < timeLabels.length; i++) {
            const hour = Math.floor(i / 2);
            const minute = i % 2 === 0 ? 0 : 30;

            const slotTime = new Date(date);
            slotTime.setHours(hour, minute, 0, 0);
            const slotStartMillis = slotTime.getTime();
            const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

            if (slotStartMillis < endTime && slotEndMillis > startTime) {
              newGrid[r][i] = "blocked";
            }
          }
        }

        // Mark occupied cells, but do not override blocked
        for (const booking of courtBookings) {
          const startTime = booking.start.getTime();
          const endTime = booking.end.getTime();

          for (let i = 0; i < timeLabels.length; i++) {
            const hour = Math.floor(i / 2);
            const minute = i % 2 === 0 ? 0 : 30;

            const slotTime = new Date(date);
            slotTime.setHours(hour, minute, 0, 0);
            const slotStartMillis = slotTime.getTime();
            const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

            // Only set to occupied if not blocked
            if (
              slotStartMillis < endTime &&
              slotEndMillis > startTime &&
              newGrid[r][i] !== "blocked" &&
              newGrid[r][i] !== "cancelled" &&
              newGrid[r][i] !== "unbook"
            ) {
              newGrid[r][i] = "occupied";
            }
          }
        }

        for (const cancelled of courtCancelled) {
          const startTime = cancelled.start.getTime();
          const endTime = cancelled.end.getTime();

          for (let i = 0; i < timeLabels.length; i++) {
            const hour = Math.floor(i / 2);
            const minute = i % 2 === 0 ? 0 : 30;

            const slotTime = new Date(date);
            slotTime.setHours(hour, minute, 0, 0);
            const slotStartMillis = slotTime.getTime();
            const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

            // Only set to occupied if not blocked
            if (
              slotStartMillis < endTime &&
              slotEndMillis > startTime &&
              newGrid[r][i] !== "blocked" &&
              newGrid[r][i] !== "occupied"
            ) {
              // console.log(
              //   `Marking available (cancelled): court ${court.courtId}, row ${r}, col ${i}`
              // );
              newGrid[r][i] = "available";
            }
          }
        }
      }

      setGrid(newGrid);
    },
    [cols]
  );

  const fetchBukings = async (dateStr: string) => {
    const bookingsMap: Record<string, { start: Date; end: Date }[]> = {};
    const cancelledBookingsMap: Record<string, { start: Date; end: Date }[]> =
      {};

    await Promise.all(
      filteredCourtId.map(async (court) => {
        try {
          const res = await axios.get(
            `${API_BASE_URL_Latest}/court/${court.courtId}/bookings?date=${dateStr}`
          );
          // console.log("court bookings and date", res.data);
          // console.log("cancelled through booking", res.data.bookings.status);

          const bookings = Array.isArray(res.data.bookings)
            ? res.data.bookings
            : [];

          bookingsMap[court.courtId] = bookings
            .filter(
              (b: any) => b.status === "active" || b.status === "rescheduled"
            )
            .map((b: any) => ({
              start: toIST(b.startTime),
              end: toIST(b.endTime),
            }));

          // Filter cancelled bookings only
          cancelledBookingsMap[court.courtId] = bookings
            .filter((b: any) => b.status === "cancelled")
            .map((b: any) => ({
              start: toIST(b.startTime),
              end: toIST(b.endTime),
            }));
        } catch (error) {
          // console.error(
          //   `Failed to fetch bookings for court ${court.courtId}`,
          //   error
          // );
          bookingsMap[court.courtId] = [];
        }
      })
    );
    // console.log("BookingMaps 0", bookingsMap);
    // console.log("CancelledMao", cancelledBookingsMap);

    return { bookingsMap, cancelledBookingsMap };
  };

  const fetchBlockedSlots = async (dateStr: string) => {
    const blockedMap: Record<string, { start: Date; end: Date }[]> = {};
    await Promise.all(
      filteredCourtId.map(async (court) => {
        try {
          // Fetch slots for the court on this date
          const res = await axios.get(
            `${API_BASE_URL_Latest}/court/${court.courtId}/slots?date=${dateStr}`
          );
          // console.log("block response new", res.data);

          const slots = Array.isArray(res.data) ? res.data : [];

          // console.log("Slots for court", court.courtId, slots);
          slots.forEach((slot, idx) => {
            // console.log(`Slot ${idx}`, {
            //   bookingInfo: slot.bookingInfo,
            //   status: slot.status,
            //   startTime: slot.startTime,
            //   endTime: slot.endTime,
            // });
          });

          // Filter slots that are blocked (outOfOrder)
          const blockedSlotsForCourt = slots
            .filter(
              (slot) =>
                slot.bookingInfo === "outOfOrder" ||
                slot.status === "outOfOrder"
            )
            .map((slot) => ({
              start: toIST(slot.startTime),
              end: toIST(slot.endTime),
            }));
          // console.log("blockedSlotsforCourt", blockedSlotsForCourt);

          blockedMap[court.courtId] = blockedSlotsForCourt;
          // console.log("blockedMap Array set", blockedMap);
        } catch (error) {
          // console.error(
          //   `Failed to fetch blocked slots for court ${court.courtId}`,
          //   error
          // );
          blockedMap[court.courtId] = [];
        }
      })
    );
    return blockedMap;
  };

  const fetchBookingsAndBlocked = async (date: Date) => {
    if (filteredCourtId.length === 0) return;

    setIsLoadingBookings(true);
    setLoadingScreen(true);
    setTimeout(() => {
      setLoadingScreen(false);
    }, 1300);
    const dateStr = date.toISOString().split("T")[0];

    try {
      const [bookingData, newBlocked] = await Promise.all([
        fetchBukings(dateStr),
        fetchBlockedSlots(dateStr),
      ]);

      // Destructure the returned object
      const { bookingsMap, cancelledBookingsMap } = bookingData;

      // console.log(newBlocked, "newBlocked");
      // console.log("All Bookings:", bookingsMap);
      // console.log("Cancelled Bookings:", cancelledBookingsMap);

      setBookings(bookingsMap);
      updateGridWithBookings(
        filteredCourtId,
        bookingsMap,
        newBlocked,
        cancelledBookingsMap,
        date
      );

      // Clear any cached cell details to force refresh
      setSelectedCellDetails({
        courtDetails: null,
        bookings: [],
        gameName: "",
        availableSports: [],
        currentBooking: null,
      });
    } catch (error) {
      // console.error("Failed to fetch bookings and blocked slots:", error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Fetch bookings when courts or date changes
  useEffect(() => {
    if (filteredCourtId.length > 0) {
      fetchBookingsAndBlocked(currentDate);
    }
  }, [filteredCourtId.length, currentDate, activeTab]);

  useEffect(() => {
    setGrid(
      Array.from({ length: filteredCourtId.length }, () =>
        Array(cols).fill("available")
      )
    );
  }, [courtId.length]);

  // New function to fetch cell details when a cell is selected
  // New function to fetch cell details when a cell is selected
  const fetchCellDetails = async (row: number, col: number) => {
    if (filteredCourtId.length === 0) return;

    const cacheKey = `${row}-${col}-${currentDate.toISOString().split("T")[0]}`;

    // Check if we already have fresh data for this cell
    if (
      selectedCellDetails.courtDetails &&
      selectedCell?.row === row &&
      selectedCell?.col === col
    ) {
      return;
    }

    setIsLoadingCellDetails(true);
    const court = getFilteredCourtByIndex(row);
    const dateStr = currentDate.toISOString().split("T")[0];

    // Initialize all details to null/empty before fetching
    let selectedCourtDetails: CourtDetails | null = null;
    let selectedBookingArray: Booking[] = [];
    let selectedGameName: string = "";
    let selectedAvailableSports: Sport[] = [];
    let selectedCurrentBooking: Booking | null = null;

    try {
      // 1. Fetch court details (including allowedSports)
      const courtRes = await axios.get(
        `${API_BASE_URL_Latest}/court/${court.courtId}`
      );
      selectedCourtDetails = courtRes.data;

      // 2. Fetch all allowed sports details for this court
      if (
        selectedCourtDetails?.allowedSports &&
        selectedCourtDetails.allowedSports.length > 0
      ) {
        const sportsPromises = selectedCourtDetails.allowedSports.map(
          async (sportId: string) => {
            try {
              const sportRes = await axios.get(
                `${API_BASE_URL_Latest}/sports/id/${sportId}`
              );
              return sportRes.data;
            } catch (error) {
              // console.error(`Failed to fetch sport ${sportId}:`, error);
              return null;
            }
          }
        );
        selectedAvailableSports = (await Promise.all(sportsPromises)).filter(
          (s) => s !== null
        ) as Sport[];
      }

      // 3. ALWAYS fetch fresh bookings for the court on the selected date
      try {
        const bookingsRes = await axios.get(
          `${API_BASE_URL_Latest}/court/${court.courtId}/bookings?date=${dateStr}`
        );
        selectedBookingArray = bookingsRes?.data?.bookings || [];

        // Find current booking for this cell (if any) - ACTIVE AND RESCHEDULED BOOKINGS
        const hour = Math.floor(col / 2);
        const minute = col % 2 === 0 ? 0 : 30;
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, minute, 0, 0);
        const slotStartMillis = slotTime.getTime();
        const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

        selectedCurrentBooking =
          selectedBookingArray.find((booking: Booking) => {
            const startTime = toIST(booking.startTime).getTime();
            const endTime = toIST(booking.endTime).getTime();
            // Include both active and rescheduled bookings
            const isValidBooking =
              booking.status === "active" || booking.status === "rescheduled";
            return (
              slotStartMillis < endTime &&
              slotEndMillis > startTime &&
              isValidBooking
            );
          }) || null;

        // IMPORTANT: Always reset to all allowed sports first
        selectedGameName = selectedAvailableSports
          .map((sport) => sport.name)
          .join(", ");

        // If current booking exists (active or rescheduled), override gameName with booked sport's name
        if (selectedCurrentBooking && selectedCurrentBooking.sportId) {
          try {
            // 1. Fetch sport name for the booking
            const sportRes = await axios.get(
              `${API_BASE_URL_Latest}/sports/id/${selectedCurrentBooking.sportId}`
            );
            selectedGameName = sportRes.data.name;

            // Only fetch game details if type is "game"
            if (selectedCurrentBooking.type === "game") {
              // 2. Compute cell timeslot start & end for the selected cell
              const hour = Math.floor(col / 2);
              const minute = col % 2 === 0 ? 0 : 30;
              const slotStart = new Date(currentDate);
              slotStart.setHours(hour, minute, 0, 0);
              const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

              // 3. Fetch the game list for this sport, court, and date
              const gamesRes = await axios.get(
                `${API_BASE_URL_Latest}/game/games/by-sport`,
                {
                  params: {
                    sportId: selectedCurrentBooking.sportId,
                    date: dateStr,
                    courtId: court.courtId,
                  },
                }
              );
              const games = gamesRes.data || [];

              // 4. Find the correct game for this timeslot/cell
              const matchingGame = games.find((game: any) => {
                const gameStart = new Date(game.startTime).getTime();
                const gameEnd = new Date(game.endTime).getTime();
                return (
                  (gameStart === slotStart.getTime() &&
                    gameEnd === slotEnd.getTime()) ||
                  (slotStart.getTime() >= gameStart &&
                    slotEnd.getTime() <= gameEnd)
                );
              });

              if (matchingGame) {
                // console.log(
                //   "latest game id and chatId",
                //   matchingGame.gameId,
                //   matchingGame.chatId
                // );
              }
            }
          } catch (err) {
            // console.error("Error fetching sport details for booking:", err);
            // Keep the default all allowed sports name
            selectedGameName = selectedAvailableSports
              .map((sport) => sport.name)
              .join(", ");
          }
        }
        // If no valid booking, selectedGameName remains as all allowed sports
      } catch (bookingsError) {
        // console.error("Failed to fetch bookings:", bookingsError);
        selectedBookingArray = [];
        selectedCurrentBooking = null;
        // Keep selectedGameName as allowed sports names
        selectedGameName = selectedAvailableSports
          .map((sport) => sport.name)
          .join(", ");
      }
    } catch (mainError) {
      // console.error(
      //   "Failed to fetch court details or primary info:",
      //   mainError
      // );
      // If court details fail, clear everything
      selectedCourtDetails = null;
      selectedBookingArray = [];
      selectedGameName = "";
      selectedAvailableSports = [];
      selectedCurrentBooking = null;
    } finally {
      setSelectedCellDetails({
        courtDetails: selectedCourtDetails,
        bookings: selectedBookingArray,
        gameName: selectedGameName,
        availableSports: selectedAvailableSports,
        currentBooking: selectedCurrentBooking,
      });
      setIsLoadingCellDetails(false);
    }
  };

  // Update updateCell to allow multiple selection toggling
  const updateCell = (row: number, col: number) => {
    //   setSelectedCell({ row, col });
    //    setSelectedCell(prev =>
    //   prev && prev.row === row && prev.col === col ? null : { row, col }
    // );
    const cell = grid[row][col];
    let newSelected: [number, number][] = [];
    let newGrid = grid.map((r) => [...r]);

    setSelectedSportId("");
    setGrid((prev) => {
      const newG = prev.map((r) => [...r]);
      const curr = newG[row][col];

      const hasOccupiedOrBlockedSelected = selected.some(
        ([r, c]) => grid[r][c] === "occupied" || grid[r][c] === "blocked"
      );

      if (cell === "available" && hasOccupiedOrBlockedSelected) {
        // Clear all selected occupied/blocked cells, select only this available cell
        const newSelection = selected.filter(
          ([r, c]) => !(grid[r][c] === "occupied" || grid[r][c] === "blocked")
        );

        // Add this available cell if not already selected
        if (!newSelection.some(([r, c]) => r === row && c === col)) {
          newSelection.push([row, col]);
        }

        newG[row][col] = "selected";
        setSelected(newSelection);
        return newG;
      }

      if (curr === "available" || curr === "selected") {
        // Toggle selection of this cell
        setSelected((prevSelected) => {
          const exists = prevSelected.some(([r, c]) => r === row && c === col);
          if (exists) {
            // Deselect cell
            // setSelectedCell(null);
            return prevSelected.filter(([r, c]) => !(r === row && c === col));
          } else {
            // Select cell (add)
            // setSelectedCell({ row, col });
            return [...prevSelected, [row, col]];
          }
        });

        // Toggle cell state between selected and available
        newG[row][col] = curr === "available" ? "selected" : "available";
        return newG;
      } else {
        // For occupied or blocked cells, toggle selection (single selection)
        // BUT DO NOT CHANGE THE CELL STATE - keep it as occupied/blocked
        setSelected((prevSelected) => {
          const exists = prevSelected.some(([r, c]) => r === row && c === col);
          if (exists) {
            // Deselect the cell if already selected
            setSelectedCell(null);
            return prevSelected.filter(([r, c]) => !(r === row && c === col));
          } else {
            // Select only this cell (deselect others)
            setSelectedCell({ row, col });
            return [[row, col]];
          }
        });
        return prev;
      }
    });

    // Fetch cell details for the clicked cell (last clicked)
    fetchCellDetails(row, col);
    fetchGameIdForCell(row, col);
  };

  const handleDrop = async (
    [fr, fc]: [number, number],
    [tr, tc]: [number, number]
  ) => {
    // Check if target cell is available for dropping
    const targetCellState = grid[tr][tc];
    if (targetCellState === "occupied" || targetCellState === "blocked") {
      showToast("Cannot drop on occupied/blocked cell");
      return;
    }

    const sourceVal = grid[fr][fc];
    if (sourceVal === "occupied" || sourceVal === "blocked") {
      try {
        // Get booking type first to determine which API to use
        const sourceCourt = getFilteredCourtByIndex(fr);
        const dateStr = currentDate.toISOString().split("T")[0];

        // Fetch fresh booking details for the source cell
        const bookingsRes = await axios.get(
          `${API_BASE_URL_Latest}/court/${sourceCourt.courtId}/bookings?date=${dateStr}`
        );
        const bookings = bookingsRes?.data?.bookings || [];

        // Calculate source cell time
        const sourceHour = Math.floor(fc / 2);
        const sourceMinute = fc % 2 === 0 ? 0 : 30;
        const sourceTime = new Date(currentDate);
        sourceTime.setHours(sourceHour, sourceMinute, 0, 0);
        const sourceStartMillis = sourceTime.getTime();
        const sourceEndMillis = sourceStartMillis + 30 * 60 * 1000;

        // Find the booking for source cell
        const sourceBooking = bookings.find((booking: any) => {
          const startTime = toIST(booking.startTime).getTime();
          const endTime = toIST(booking.endTime).getTime();
          const isActiveBooking =
            booking.status === "active" || booking.status === "rescheduled";
          return (
            sourceStartMillis < endTime &&
            sourceEndMillis > startTime &&
            isActiveBooking
          );
        });

        if (!sourceBooking) {
          showToast("No booking found for source cell");
          return;
        }

        const bookingType = sourceBooking.type; // This will be "game" or "booking"
        const bookingId = sourceBooking.bookingId;

        // Calculate booking duration from the actual booking times
        const bookingStart = toIST(sourceBooking.startTime);
        const bookingEnd = toIST(sourceBooking.endTime);
        const bookingDurationMinutes = Math.floor(
          (bookingEnd.getTime() - bookingStart.getTime()) / (60 * 1000)
        );

        if (isNaN(bookingDurationMinutes) || bookingDurationMinutes <= 0) {
          showToast("Error: Could not determine booking duration.");
          return;
        }

        // Calculate new start and end times for the target cell
        const targetHour = Math.floor(tc / 2);
        const targetMinute = tc % 2 === 0 ? 0 : 30;
        const newStartTime = new Date(currentDate);
        newStartTime.setHours(targetHour, targetMinute, 0, 0);
        const newEndTime = new Date(newStartTime);
        newEndTime.setMinutes(
          newStartTime.getMinutes() + bookingDurationMinutes
        );

        // Get the target court
        const targetCourt = getFilteredCourtByIndex(tr);

        // Convert times to IST format for the API
        const newStartTimeIST = toLocalISOString(newStartTime);
        const newEndTimeIST = toLocalISOString(newEndTime);

        let rescheduleResponse;

        // Use different API based on booking type
        if (bookingType === "game") {
          // Fetch gameId for game type bookings
          const gameId = await fetchGameIdForCell(fr, fc);

          // console.log(
          //   `${API_BASE_URL_Latest}/game/reschedule/${gameId}?newStartTime=${newStartTimeIST}&newEndTime=${newEndTimeIST}&courtId=${targetCourt.courtId}`,
          //   "game reschedule api log"
          // );

          rescheduleResponse = await axios.patch(
            `${API_BASE_URL_Latest}/game/reschedule/${gameId}?newStartTime=${newStartTimeIST}&newEndTime=${newEndTimeIST}&courtId=${targetCourt.courtId}`,
            {
              params: {
                gameId: gameId,
                newStartTime: newStartTimeIST,
                newEndTime: newEndTimeIST,
                courtId: targetCourt.courtId,
              },
            }
          );
        } else {
          // For booking type, use booking reschedule API
          // console.log(
          //   `${API_BASE_URL_Latest}/court/booking/${bookingId}/reschedule-by-time?newStartTime=${newStartTimeIST}&newEndTime=${newEndTimeIST}&courtId=${targetCourt.courtId}`,
          //   "booking reschedule api log"
          // );

          rescheduleResponse = await axios.patch(
            `${API_BASE_URL_Latest}/court/booking/${bookingId}/reschedule-by-time?newStartTime=${newStartTimeIST}&newEndTime=${newEndTimeIST}&courtId=${targetCourt.courtId}`,
            {
              params: {
                bookingId: bookingId,
                newStartTime: newStartTimeIST,
                newEndTime: newEndTimeIST,
                courtId: targetCourt.courtId,
              },
            }
          );
        }

        // console.log("Reschedule successful:", rescheduleResponse.data);

        // Update the grid after successful reschedule
        setGrid((prev) => {
          const newG = prev.map((r) => [...r]);
          newG[fr][fc] = "available";
          newG[tr][tc] = sourceVal;
          return newG;
        });

        // Refresh bookings to reflect the changes
        await fetchBookingsAndBlocked(currentDate);

        showToast("Booking successfully rescheduled!");
        setSelected([]);
      } catch (error) {
        // console.error("Failed to reschedule booking:", error);
        showToast("Failed to reschedule booking. Please try again.");
      }
    }
  };

  type ModalGame = {
    gameId: string;
  };

  const [modalData, setModalData] = useState<ModalGame>();

  function getUserNameFromToken(): string {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return "Guest";

      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || "Guest";
    } catch {
      return "Guest";
    }
  }

  // Modify applyAction to handle multiple selected cells for booking
  const applyAction = async (action: CellState) => {
    if (selected.length === 0) return;

    if (
      action === "occupied" ||
      action === "blocked" ||
      action === "unblock" ||
      action === "unbook"
    ) {
      // if (!selectedSportId) {
      //   alert("Please select a sport first");
      //   return;
      // }

      if (action === "blocked") {
        // Find slotId corresponding to selected cells (assuming consecutive cells in same row)
        const rowsSet = new Set(selected.map(([r]) => r));
        if (rowsSet.size > 1) {
          showToast(
            "Please select cells in the same court (row) for blocking."
          );
          return;
        }

        const [row] = selected[0];
        const colsSelected = selected.map(([_, c]) => c).sort((a, b) => a - b);

        // Validate consecutive columns
        for (let i = 1; i < colsSelected.length; i++) {
          if (colsSelected[i] !== colsSelected[i - 1] + 1) {
            showToast("Please select consecutive time slots for blocking.");
            return;
          }
        }

        // Find the slotId for this court and selected time range from courtSlots state
        const courtSlotsForCourt =
          courtSlots[getFilteredCourtByIndex(row).courtId] || [];
        let matchedSlot: any = null;

        // Calculate start and end time of selected cells
        const firstCol = colsSelected[0];
        const lastCol = colsSelected[colsSelected.length - 1];
        const startHour = Math.floor(firstCol / 2);
        const startMinute = firstCol % 2 === 0 ? 0 : 30;
        const endHour = Math.floor(lastCol / 2);
        const endMinute = lastCol % 2 === 0 ? 0 : 30;
        const startTime = new Date(currentDate);
        startTime.setHours(startHour, startMinute, 0, 0);
        const endTime = new Date(currentDate);
        endTime.setHours(endHour, endMinute, 0, 0);
        endTime.setTime(endTime.getTime() + 30 * 60 * 1000); // add 30 mins

        const overlappingSlots = courtSlotsForCourt.filter((slot) => {
          const slotStart = new Date(slot.startTime).getTime();
          const slotEnd = new Date(slot.endTime).getTime();

          return slotStart < endTime.getTime() && slotEnd > startTime.getTime();
        });

        if (overlappingSlots.length === 0) {
          showToast("No matching slot found for selected cells.");
          return;
        }
        // console.log("overlapping slots", overlappingSlots);

        // PATCH request to update timeslot as blocked
        try {
          await Promise.all(
            overlappingSlots.map((slot) =>
              axios.post(
                `${API_BASE_URL_Latest}/court/courts/${slot.courtId}/timeslots/action`,
                {
                  startTime: Math.floor(
                    new Date(slot.startTime).getTime() / 1000
                  ),
                  endTime: Math.floor(new Date(slot.endTime).getTime() / 1000),

                  action: "BLOCK",
                }
              )
            )
          );
          showToast("Slots successfully blocked.");

          await fetchBookingsAndBlocked(currentDate);

          setSelected([]);
          setSelectedSportId("");
        } catch (error) {
          // console.error("Failed to block slots:", error);
          showToast("Failed to block slots. Please try again.");
        }
      } else if (action === "unblock") {
        // Find slotId corresponding to selected cells (assuming consecutive cells in same row)
        const rowsSet = new Set(selected.map(([r]) => r));
        if (rowsSet.size > 1) {
          showToast(
            "Please select cells in the same court (row) for blocking."
          );
          return;
        }

        const [row] = selected[0];
        const colsSelected = selected.map(([_, c]) => c).sort((a, b) => a - b);

        // Validate consecutive columns
        for (let i = 1; i < colsSelected.length; i++) {
          if (colsSelected[i] !== colsSelected[i - 1] + 1) {
            showToast("Please select consecutive time slots for blocking.");
            return;
          }
        }

        // Find the slotId for this court and selected time range from courtSlots state
        const courtSlotsForCourt =
          courtSlots[getFilteredCourtByIndex(row).courtId] || [];
        let matchedSlot: any = null;

        // Calculate start and end time of selected cells
        const firstCol = colsSelected[0];
        const lastCol = colsSelected[colsSelected.length - 1];
        const startHour = Math.floor(firstCol / 2);
        const startMinute = firstCol % 2 === 0 ? 0 : 30;
        const endHour = Math.floor(lastCol / 2);
        const endMinute = lastCol % 2 === 0 ? 0 : 30;
        const startTime = new Date(currentDate);
        startTime.setHours(startHour, startMinute, 0, 0);
        const endTime = new Date(currentDate);
        endTime.setHours(endHour, endMinute, 0, 0);
        endTime.setTime(endTime.getTime() + 30 * 60 * 1000); // add 30 mins

        const overlappingSlots = courtSlotsForCourt.filter((slot) => {
          const slotStart = new Date(slot.startTime).getTime();
          const slotEnd = new Date(slot.endTime).getTime();

          return slotStart < endTime.getTime() && slotEnd > startTime.getTime();
        });

        if (overlappingSlots.length === 0) {
          showToast("No matching slot found for selected cells.");
          return;
        }

        // PATCH request to update timeslot as blocked
        try {
          await Promise.all(
            overlappingSlots.map((slot) =>
              axios.post(
                `${API_BASE_URL_Latest}/court/courts/${slot.courtId}/timeslots/action`,
                {
                  startTime: Math.floor(
                    new Date(slot.startTime).getTime() / 1000
                  ),
                  endTime: Math.floor(new Date(slot.endTime).getTime() / 1000),

                  action: "UNBLOCK",
                }
              )
            )
          );
          showToast("Slots successfully cancelled.");

          await fetchBookingsAndBlocked(currentDate);

          setSelected([]);
          setSelectedSportId("");
        } catch (error) {
          // console.error("Failed to cancel slots:", error);
          showToast("Failed to cancel slots. Please try again.");
        }
      } else if (action === "unbook") {
        // Find slotId corresponding to selected cells (assuming consecutive cells in same row)
        const rowsSet = new Set(selected.map(([r]) => r));
        if (rowsSet.size > 1) {
          showToast(
            "Please select cells in the same court (row) for blocking."
          );
          return;
        }

        const [row] = selected[0];
        const colsSelected = selected.map(([_, c]) => c).sort((a, b) => a - b);

        // Validate consecutive columns
        for (let i = 1; i < colsSelected.length; i++) {
          if (colsSelected[i] !== colsSelected[i - 1] + 1) {
            showToast("Please select consecutive time slots for blocking.");
            return;
          }
        }

        // Find the slotId for this court and selected time range from courtSlots state
        const courtSlotsForCourt =
          courtSlots[getFilteredCourtByIndex(row).courtId] || [];
        let matchedSlot: any = null;

        // Calculate start and end time of selected cells
        const firstCol = colsSelected[0];
        const lastCol = colsSelected[colsSelected.length - 1];
        const startHour = Math.floor(firstCol / 2);
        const startMinute = firstCol % 2 === 0 ? 0 : 30;
        const endHour = Math.floor(lastCol / 2);
        const endMinute = lastCol % 2 === 0 ? 0 : 30;
        const startTime = new Date(currentDate);
        startTime.setHours(startHour, startMinute, 0, 0);
        const endTime = new Date(currentDate);
        endTime.setHours(endHour, endMinute, 0, 0);
        endTime.setTime(endTime.getTime() + 30 * 60 * 1000); // add 30 mins

        const overlappingSlots = courtSlotsForCourt.filter((slot) => {
          const slotStart = new Date(slot.startTime).getTime();
          const slotEnd = new Date(slot.endTime).getTime();

          return slotStart < endTime.getTime() && slotEnd > startTime.getTime();
        });

        if (overlappingSlots.length === 0) {
          showToast("No matching slot found for selected cells.");
          return;
        }

        const courtKey = getFilteredCourtByIndex(row).courtId;

        // For each overlapping slot, find the bookingId from courtBookIds
        const bookingIdsToCancel = overlappingSlots
          .map((slot) => {
            const bookObj = (courtBookIds[courtKey] || []).find(
              (b) => b.slotId === slot.slotId
            );
            return bookObj && bookObj.bookingId ? bookObj.bookingId : null;
          })
          .filter(Boolean); // Remove nulls
        // console.log("Unbook bookingId", bookingIdsToCancel);

        if (bookingIdsToCancel.length === 0) {
          showToast("No bookingId found for the selected slots.");
          return;
        }

        // PATCH request to update timeslot as blocked
        try {
          await Promise.all(
            bookingIdsToCancel.map(async (bookingId) => {
              const gameIdCancel = await axios.get(
                `${API_BASE_URL_Latest}/game/get_games_by_bookingId/${bookingId}`
              );
              // console.log("fetchig gameid for cancellation", gameIdCancel);

              const cancelGameId = gameIdCancel.data[0].gameId;
              await axios.patch(
                `${API_BASE_URL_Latest}/game/cancel/${cancelGameId}`
              );
            })
          );

          showToast("Slots successfully cancelled.");

          await fetchBookingsAndBlocked(currentDate);

          if (selected.length > 0) {
            await fetchCellDetails(selected[0][0], selected[0][1]);
          }

          setSelected([]);
          setSelectedSportId("");
        } catch (error) {
          // console.error("Failed to cancel slots:", error);
          showToast("Failed to cancel slots. Please try again.");
        }
      } else if (action === "occupied") {
        // Existing booking logic here (unchanged)
        if (!selectedSportId) {
          showToast("Please select a sport first");
          return;
        }
        const rowsSet = new Set(selected.map(([r]) => r));
        if (rowsSet.size > 1) {
          showToast("Please select cells in the same court (row) for booking.");
          return;
        }

        const [row] = selected[0];
        const colsSelected = selected.map(([_, c]) => c).sort((a, b) => a - b);

        // Check if columns are consecutive
        for (let i = 1; i < colsSelected.length; i++) {
          if (colsSelected[i] !== colsSelected[i - 1] + 1) {
            showToast("Please select consecutive time slots for booking.");
            return;
          }
        }

        // Calculate startTime from first selected cell
        const firstCol = colsSelected[0];
        const hour = Math.floor(firstCol / 2);
        const minute = firstCol % 2 === 0 ? 0 : 30;
        const startTime = new Date(currentDate);
        startTime.setHours(0, 0, 0, 0);
        startTime.setHours(hour, minute, 0, 0);

        // Calculate endTime from last selected cell + 30 minutes
        const lastCol = colsSelected[colsSelected.length - 1];
        const endHour = Math.floor(lastCol / 2);
        const endMinute = lastCol % 2 === 0 ? 0 : 30;
        const endTime = new Date(currentDate);
        endTime.setHours(0, 0, 0, 0);
        endTime.setHours(endHour, endMinute, 0, 0);
        // Add 30 minutes to endTime slot
        endTime.setTime(endTime.getTime() + 30 * 60 * 1000);

        const bookingData = {
          hostId: getUserNameFromToken(),
          type: "game",
          sport: selectedCellDetails.availableSports.find(
            (s) => s.sportId === selectedSportId
          )?.name,
          sportId: selectedSportId,
          courtId: getFilteredCourtByIndex(row).courtId,
          startTime: toLocalISOString(startTime),
          endTime: toLocalISOString(endTime),
          bookedBy: getUserNameFromToken(),
          difficultyLevel: difficultyLevel, // <-- added here
          maxPlayers: maxPlayers,
          slotRemaining: maxPlayers - 1,
          priceType: "",
          rackPrice: 0,
          quotePrice: 0,
        };
        // console.log("Start Time:", startTime.toISOString());
        // console.log("End Time:", endTime.toISOString());

        // console.log("Booking Data payload", bookingData);

        try {
          const response = await axios.post(
            `${API_BASE_URL_Latest}/game/create`,
            bookingData
          );
          // console.log("Booking created:", response.data);
          setModalData(response.data.gameId);

          showToast("Slots successfully booked.");

          // Refresh bookings after successful creation
          await fetchBookingsAndBlocked(currentDate);

          // Clear selection and reset sport
          setSelected([]);
          setSelectedSportId("");
        } catch (error) {
          // console.error("Failed to create booking:", error);
          showToast("Failed to create booking. Please try again.");
        }
      } else {
      }
      // ... existing code for booking creation ...
    } else {
    }
  };

  const getSlotForCell = (row: number, col: number) => {
    const slotsForCourt =
      courtSlots[getFilteredCourtByIndex(row)?.courtId] || [];
    const hour = Math.floor(col / 2);
    const minute = col % 2 === 0 ? 0 : 30;
    const cellStartTime = new Date(currentDate);
    cellStartTime.setHours(hour, minute, 0, 0);

    return slotsForCourt.find((slot) => {
      const slotStart = new Date(slot.startTime);
      return slotStart.getTime() === cellStartTime.getTime();
    });
  };

  // Modify cancelBooking to cancel bookings for all selected cells with bookings
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!leftSidebarRef.current) return;
    const el = leftSidebarRef.current;

    const onSidebarScroll = () => {
      if (!gridScrollRef.current) return;
      gridScrollRef.current.scrollTop = el.scrollTop;
    };

    el.addEventListener("scroll", onSidebarScroll);

    return () => el.removeEventListener("scroll", onSidebarScroll);
  }, [leftSidebarRef.current]);

  // Helper for UI: get first selected cell or null
  const firstSelected = selected.length > 0 ? selected[0] : null;
  // console.log(firstSelected, "firstSelected");

  const [isModalOpen, setisModalOpen] = useState<boolean>(false);

  function openModal() {
    setisModalOpen(true);
  }

  function closeModal() {
    setisModalOpen(false);
  }
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  function formatDateForInput(date: Date) {
    return date.toISOString().split("T")[0];
  }

  const selectedSlot = selectedCell
    ? getSlotForCell(selectedCell.row, selectedCell.col)
    : null;
  const slotPrice = selectedSlot
    ? slotPrices[selectedSlot.courtId]?.[selectedSlot.slotId]
    : null;

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const fetchGameIdForCell = async (row: number, col: number) => {
    try {
      const court = getFilteredCourtByIndex(row);
      const dateStr = currentDate.toISOString().split("T")[0];

      // Get the cell time
      const hour = Math.floor(col / 2);
      const minute = col % 2 === 0 ? 0 : 30;
      const slotTime = new Date(currentDate);
      slotTime.setHours(hour, minute, 0, 0);
      const slotStartMillis = slotTime.getTime();
      const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

      // ALWAYS fetch fresh bookings to get latest sportId
      const bookingsRes = await axios.get(
        `${API_BASE_URL_Latest}/court/${court.courtId}/bookings?date=${dateStr}`
      );
      const bookings = bookingsRes?.data?.bookings || [];

      const cellBooking = bookings.find((booking: Booking) => {
        const startTime = toIST(booking.startTime).getTime();
        const endTime = toIST(booking.endTime).getTime();
        const isActiveBooking =
          booking.status === "active" || booking.status === "rescheduled";
        return (
          slotStartMillis < endTime &&
          slotEndMillis > startTime &&
          isActiveBooking
        );
      });

      if (!cellBooking || !cellBooking.sportId) {
        throw new Error("No fresh booking or sportId found for this cell");
      }

      const sportId = cellBooking.sportId;

      // For game type bookings, fetch games using the fresh sportId
      if (cellBooking.type === "game") {
        let response;
        try {
          response = await axios.get(
            `${API_BASE_URL_Latest}/game/games/by-sport?sportId=${sportId}&date=${dateStr}&courtId=${court.courtId}`
          );
        } catch (error) {
          // console.log("Trying with courtId=ALL as fallback");
          response = await axios.get(
            `${API_BASE_URL_Latest}/game/games/by-sport?sportId=${sportId}&date=${dateStr}&courtId=ALL`
          );
        }
        // console.log("new host name", response.data[0].hostName);

        // console.log("Fresh game fetch response:", response.data);
        const games = response.data;
        sessionStorage.setItem("newHostClick", response.data[0].hostName);

        const matchingGame = games.find((game: any) => {
          const gameStart = toIST(game.startTime).getTime();
          const gameEnd = toIST(game.endTime).getTime();

          return (
            (game.courtId === court.courtId && slotStartMillis < gameEnd) ||
            slotEndMillis > gameStart
          );
        });

        if (!matchingGame) {
          throw new Error("No matching fresh game found for cell");
        }

        // console.log("Found fresh matching game with ID:", matchingGame.gameId);
        localStorage.setItem("gameId", matchingGame.gameId);
        return matchingGame.gameId;
      } else {
        // For booking type, we don't need gameId, just return the bookingId
        return cellBooking.bookingId;
      }
    } catch (error) {
      // console.error("Failed to fetch fresh gameId:", error);
      throw error;
    }
  };

  const getBookingIdForCell = async (
    row: number,
    col: number
  ): Promise<string | null> => {
    try {
      const court = getFilteredCourtByIndex(row);
      const dateStr = currentDate.toISOString().split("T")[0];

      // Calculate cell time
      const hour = Math.floor(col / 2);
      const minute = col % 2 === 0 ? 0 : 30;
      const cellTime = new Date(currentDate);
      cellTime.setHours(hour, minute, 0, 0);
      const cellStartMillis = cellTime.getTime();
      const cellEndMillis = cellStartMillis + 30 * 60 * 1000;

      // ALWAYS fetch fresh bookings data - don't rely on cached selectedCellDetails
      const bookingsRes = await axios.get(
        `${API_BASE_URL_Latest}/court/${court.courtId}/bookings?date=${dateStr}`
      );
      const bookings = bookingsRes?.data?.bookings || [];
      // console.log("Fresh bookings for bookingId lookup:", bookings);

      // Find booking that overlaps with this cell (active or rescheduled status only)
      const matchingBooking = bookings.find((booking: Booking) => {
        const startTime = toIST(booking.startTime).getTime();
        const endTime = toIST(booking.endTime).getTime();
        const isActiveBooking =
          booking.status === "active" || booking.status === "rescheduled";
        return (
          cellStartMillis < endTime &&
          cellEndMillis > startTime &&
          isActiveBooking
        );
      });

      if (matchingBooking && matchingBooking.bookingId) {
        // console.log(
        //   "Found fresh matching booking with ID:",
        //   matchingBooking.bookingId
        // );
        return matchingBooking.bookingId;
      }

      // console.log("No fresh bookingId found for cell:", row, col);
      return null;
    } catch (error) {
      // console.error("Error getting fresh bookingId for cell:", error);
      return null;
    }
  };

  const currentGameName =
    selectedCellDetails.availableSports.find(
      (s) => s.sportId === selectedCellDetails.currentBooking?.sportId
    )?.name || "Unknown";

  useEffect(() => {
    if (currentGameName) {
      localStorage.setItem("currentGameName", currentGameName);
    }
  }, [currentGameName]);

  useEffect(() => {
    // Set a timer to hide loading screen after 10 seconds
    const timer = setTimeout(() => {
      setLoadingScreen(false);
    }, 1300);

    // Cleanup timer if component unmounts early
    return () => clearTimeout(timer);
  }, []);

  // Add this state to track sidebar width
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Add this useEffect to detect sidebar collapse state
  useEffect(() => {
    const checkSidebarCollapsed = () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        // Check if sidebar has the 'collapsed' class
        setIsSidebarCollapsed(sidebar.classList.contains("collapsed"));
      }
    };

    // Initial check
    checkSidebarCollapsed();

    // Use MutationObserver to watch for class changes on sidebar
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      const observer = new MutationObserver(checkSidebarCollapsed);
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // Add this useEffect after your existing useEffects
  useEffect(() => {
    // Reset grid when tab changes (but not on initial load)
    if (filteredCourtId.length > 0) {
      const newGrid = Array.from({ length: filteredCourtId.length }, () =>
        Array(cols).fill("available")
      );
      setGrid(newGrid);

      // Clear selections
      setSelected([]);
      setSelectedCell(null);
      setSelectedSportId("");

      // Refetch bookings and blocked slots for filtered courts
      fetchBookingsAndBlocked(currentDate);
    }
  }, [activeTab, filteredCourtId.length]); // Trigger when activeTab or filtered court count changes

  const [courName, setCourName] = useState("Loading...");

  useEffect(() => {
    const courtId = selectedCellDetails.courtDetails?.courtId;
    if (firstSelected && courtId) {
      const fetchCourtName = async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL_Latest}/court/${courtId}`
          );
          setCourName(res.data.name);
        } catch (err) {
          setCourName("Unknown");
        }
      };
      fetchCourtName();
    }
  }, [firstSelected, selectedCellDetails.courtDetails?.courtId]);

useEffect(() => {
    if (filteredCourtId.length > 0) {
      // ✅ Stop old polling when date changes
      cleanupMessagePolling();

      // ✅ Start fresh polling for the new date
      setIsMessagePollingActive(false);
      startPollingForAllOccupiedCells();
    }
}, [filteredCourtId.length, currentDate]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMessagePolling();
    };
  }, []);

  // Add these functions after existing helper functions

  const fetchScheduledUsersForBooking = async (bookingId: string) => {
    try {
      const bookingRes = await axios.get(
        `${API_BASE_URL_Latest}/booking/${bookingId}`
      );
      return bookingRes.data.scheduledPlayers || [];
    } catch (error) {
      console.error(
        `Failed to fetch scheduled users for booking ${bookingId}:`,
        error
      );
      return [];
    }
  };

  const fetchChatRoomsForUser = async (userId: string) => {
    try {
      const response = await axios.get(
        `https://play-os-backend.forgehub.in/human/human/${userId}`
      );
      const rooms = Array.isArray(response.data)
        ? response.data
        : response.data.rooms || [];
      return rooms;
    } catch (error) {
      console.error(`Failed to fetch chat rooms for user ${userId}:`, error);
      return [];
    }
  };

  const startMessagePollingForRoom = async (
    bookingId: string,
    userId: string,
    roomType: string,
    chatId: string,
    roomName: string,
    seenByTeamAtUnix: number
  ) => {
    const roomKey = `${roomType}-${roomName}-${chatId}-${userId}`;
    const ablyRoomName = roomKey;

    try {
      const room = await cellChatClient.rooms.get(ablyRoomName);

      setCellAblyConnections((prev) => ({
        ...prev,
        [roomKey]: room,
      }));

      if (cellPollingIntervals[roomKey]) {
        clearInterval(cellPollingIntervals[roomKey]);
      }

      const pollMessages = async () => {
        try {
          const messageHistory = await room.messages.history({ limit: 30 });
          const messages = messageHistory.items;
          const seenByTeamAtIST = new Date(seenByTeamAtUnix * 1000);

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

          // Update message count for this booking
          setCellMessageCounts((prev) => {
            const currentCount = prev[bookingId] || 0;
            return {
              ...prev,
              [bookingId]: currentCount + newMessageCount,
            };
          });
        } catch (error) {
          console.error(`Failed to poll messages for ${roomKey}:`, error);
        }
      };

      await pollMessages();
      const interval = setInterval(pollMessages, 30000);

      setCellPollingIntervals((prev) => ({
        ...prev,
        [roomKey]: interval,
      }));
    } catch (error) {
      console.error(`Failed to create room connection for ${roomKey}:`, error);
    }
  };

  const initializeMessagePollingForCell = async (bookingId: string) => {
    const scheduledUsers = await fetchScheduledUsersForBooking(bookingId);
    if (scheduledUsers.length === 0) return;

    // Reset count for this booking
    setCellMessageCounts((prev) => ({ ...prev, [bookingId]: 0 }));

    const userRoomsMap: { [userId: string]: any[] } = {};

    // Fetch chat rooms for all users
    await Promise.all(
      scheduledUsers.map(async (userId: string) => {
        const rooms = await fetchChatRoomsForUser(userId);
        userRoomsMap[userId] = rooms;
      })
    );

    setCellUserChatRooms((prev) => ({
      ...prev,
      [bookingId]: userRoomsMap,
    }));

    // Start polling for all user rooms
    const pollingPromises: Promise<void>[] = [];

    Object.entries(userRoomsMap).forEach(([userId, rooms]) => {
      rooms.forEach((room) => {
        pollingPromises.push(
          startMessagePollingForRoom(
            bookingId,
            userId,
            room.roomType,
            room.chatId,
            room.roomName,
            room.seenByTeamAt || 0
          )
        );
      });
    });

    await Promise.allSettled(pollingPromises);
  };

  const startPollingForAllOccupiedCells = async () => {
    if (isMessagePollingActive) return;

    setIsMessagePollingActive(true);
    const dateStr = currentDate.toISOString().split("T")[0];

    // Get all occupied cells with bookings
    const occupiedCellPromises: Promise<void>[] = [];

    for (let row = 0; row < filteredCourtId.length; row++) {
      const court = filteredCourtId[row];

      try {
        const bookingsRes = await axios.get(
          `${API_BASE_URL_Latest}/court/${court.courtId}/bookings?date=${dateStr}`
        );
        const bookings = bookingsRes?.data?.bookings || [];

        const activeBookings = bookings.filter(
          (b: any) => b.status === "active" || b.status === "rescheduled"
        );

        activeBookings.forEach((booking: any) => {
          if (booking.bookingId) {
            occupiedCellPromises.push(
              initializeMessagePollingForCell(booking.bookingId)
            );
          }
        });
      } catch (error) {
        console.error(
          `Failed to fetch bookings for court ${court.courtId}:`,
          error
        );
      }
    }

    await Promise.allSettled(occupiedCellPromises);
  };

  const cleanupMessagePolling = () => {
    Object.values(cellPollingIntervals).forEach((interval) => {
      if (interval) clearInterval(interval);
    });

    Object.values(cellAblyConnections).forEach((room) => {
      try {
        if (room && typeof room.release === "function") {
          room.release();
        }
      } catch (error) {
        console.error("Error releasing room connection:", error);
      }
    });

    setCellPollingIntervals({});
    setCellMessageCounts({});
    setCellUserChatRooms({});
    setCellAblyConnections({});
    setIsMessagePollingActive(false);
  };

  const getBookingIdForOccupiedCell = async (
    row: number,
    col: number
  ): Promise<string | null> => {
    try {
      const court = getFilteredCourtByIndex(row);
      const dateStr = currentDate.toISOString().split("T")[0];

      const hour = Math.floor(col / 2);
      const minute = col % 2 === 0 ? 0 : 30;
      const cellTime = new Date(currentDate);
      cellTime.setHours(hour, minute, 0, 0);
      const cellStartMillis = cellTime.getTime();
      const cellEndMillis = cellStartMillis + 30 * 60 * 1000;

      const bookingsRes = await axios.get(
        `${API_BASE_URL_Latest}/court/${court.courtId}/bookings?date=${dateStr}`
      );
      const bookings = bookingsRes?.data?.bookings || [];

      const matchingBooking = bookings.find((booking: any) => {
        const startTime = toIST(booking.startTime).getTime();
        const endTime = toIST(booking.endTime).getTime();
        const isActiveBooking =
          booking.status === "active" || booking.status === "rescheduled";
        return (
          cellStartMillis < endTime &&
          cellEndMillis > startTime &&
          isActiveBooking
        );
      });

      return matchingBooking?.bookingId || null;
    } catch (error) {
      console.error("Error getting bookingId for cell:", error);
      return null;
    }
  };

  // Add this useEffect after existing ones

  // if (loadingScreen) {
  //   return <LoadingScreen />;
  // }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Nav - Fixed */}
      <TopBar />
      <div className="flex items-center justify-center gap-10 py-2 bg-white shadow-sm shrink-0">
        <button
          onClick={() => {
            setCurrentDate(
              (prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000)
            );
            setSelected([]);
            setLoadingScreen(true);
            setTimeout(() => {
              setLoadingScreen(false);
            }, 1300);
          }}
          className="px-3 py-1 bg-gray-300 rounded"
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
          {isLoadingBookings && (
            <span className="ml-2 text-blue-500">Loading...</span>
          )}
        </span>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={formatDateForInput(currentDate)}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) {
                setCurrentDate(newDate);
                setSelected([]);
                setLoadingScreen(true);
                setTimeout(() => {
                  setLoadingScreen(false);
                }, 1300);
              }
            }}
            className="px-2 py-1 border border-gray-300 rounded text-xs"
          />
        </div>
        <button
          onClick={() => {
            setCurrentDate(
              (prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000)
            );
            setSelected([]);
            setLoadingScreen(true);
            setTimeout(() => {
              setLoadingScreen(false);
            }, 1300);
          }}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next →
        </button>
      </div>

      {/* Main Content Area - Flexible */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Synchronized with grid vertical scroll */}
        <div className="flex flex-col w-24 shrink-0 bg-white">
          <div className="h-10 shrink-0" />
          <div
            ref={leftSidebarRef}
            className="flex flex-col overflow-y-auto overflow-x-hidden"
            style={{
              overflowY: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingBottom: "20px",
            }}
          >
            {filteredCourtId.map((court) => (
              <div
                key={court.courtId}
                className="h-10 flex items-center  justify-center border border-gray-200 text-xs text-center shrink-0"
              >
                {resolvedNames[court.courtId] ?? court.name}
              </div>
            ))}
          </div>
        </div>

        {/* Grid Section - Scrollable with Visual Restriction */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Time Headers - Visually Clipped Container */}
          <div
            className="shrink-0 relative"
            style={{
              overflow: "hidden",
              width: "100%",

              height: "40px", // h-10 equivalent
            }}
          >
            {/* Actual Time Headers - Full Width but Shifted */}
            <div
              className="overflow-x-auto overflow-y-hidden absolute"
              ref={(el) => {
                if (el && gridScrollRef.current) {
                  el.scrollLeft = gridScrollRef.current.scrollLeft;
                }
              }}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                background: "white",
                // width: `calc(100vw - ${isSidebarCollapsed ? '38rem' : '24rem'})`,
                width: `calc(100% + ${4 * visibleStartSlot}rem)`,
                // width: "100%",
                height: "100%",
                left: `calc(4rem * -${visibleStartSlot})`, // Shift left to hide first 12 columns (midnight to 6AM)
              }}
            >
              {/* Continuous border line from midnight to 12 PM */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `calc(4rem * 48)`,
                  height: "1px",
                  backgroundColor: "#D1D5DB",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />

              <div
                className="grid border border-gray-300 rounded-t-md bg-white"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(4rem, 1fr))`,
                  minWidth: `calc(4rem * 48)`, // Ensure full grid width
                }}
              >
                {timeLabels.map((label, i) => (
                  <div
                    key={`header-${i}`}
                    className="min-w-0 h-10 mr-7 flex items-center justify-center text-xs font-semibold text-timeSlot whitespace-nowrap"
                    style={{ userSelect: "none" }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Content - Visually Clipped Container */}
          <div
            className="flex-1 relative"
            style={{
              overflow: "hidden",
            }}
          >
            {/* Actual Grid Content - Full Width but Shifted */}
            <div
              className="overflow-auto absolute custom-scrollbar"
              ref={gridScrollRef}
              onScroll={(e) => {
                const target = e.target as HTMLElement;

                const leftSidebarEl =
                  target.parentElement?.parentElement?.parentElement?.querySelector(
                    ".flex.flex-col.overflow-y-auto.overflow-x-hidden"
                  ) as HTMLElement;
                if (leftSidebarEl) {
                  leftSidebarEl.scrollTop = target.scrollTop;
                }

                // Sync horizontal scroll with time headers
                const timeHeaderEl =
                  target.parentElement?.parentElement?.querySelector(
                    ".overflow-x-auto.overflow-y-hidden.absolute"
                  ) as HTMLElement;
                if (timeHeaderEl) {
                  timeHeaderEl.scrollLeft = target.scrollLeft;
                }
              }}
              style={{
                // width: `calc(100vw - ${isSidebarCollapsed ? '38rem' : '24rem'})`,
                width: `calc(100% + ${4 * visibleStartSlot}rem)`,
                height: "100%",
                left: `calc(4rem * -${visibleStartSlot})`,
                // Same shift as headers to maintain alignment
              }}
            >
              <div
                className="grid border border-gray-200 rounded-b-md"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(4rem, 1fr))`,
                  minWidth: `calc(4rem * 48)`, // Ensure full grid width
                }}
              >
                {grid.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    let isDisabled = false;

                    const hasAvailableSelected = selected.some(
                      ([r, c]) =>
                        grid[r][c] === "available" || grid[r][c] === "selected"
                    );
                    const hasOccupiedOrBlockedSelected = selected.some(
                      ([r, c]) =>
                        grid[r][c] === "occupied" || grid[r][c] === "blocked"
                    );

                    if (cell === "selected") {
                      // Find all selected cells in this row
                      const selectedInRow = selected
                        .filter(([r, _]) => r === rIdx)
                        .map(([_, col]) => col);

                      if (selectedInRow.length > 0) {
                        const minSelectedCol = Math.min(...selectedInRow);
                        const maxSelectedCol = Math.max(...selectedInRow);

                        // Disable this cell if it is not at the edges of selection
                        if (
                          cIdx !== minSelectedCol &&
                          cIdx !== maxSelectedCol
                        ) {
                          isDisabled = true;
                        }
                      }
                    }

                    if (cell === "available") {
                      if (hasOccupiedOrBlockedSelected) {
                        // available cells are enabled to allow switching from occupied/blocked
                        // isDisabled = true;
                      } else if (selected.length > 0) {
                        const [selRow] = selected[0];
                        const selCols = selected.map(([, col]) => col);
                        const minCol = Math.min(...selCols);
                        const maxCol = Math.max(...selCols);

                        if (rIdx !== selRow) isDisabled = true;

                        const isNextToSelection =
                          cIdx === minCol - 1 || cIdx === maxCol + 1;
                        if (
                          !(selected.length === 1 && cIdx === minCol) &&
                          !isNextToSelection
                        )
                          isDisabled = true;
                      }
                    } else if (cell === "occupied" || cell === "blocked") {
                      // Disabled if any available cell is already selected
                      if (hasAvailableSelected) {
                        isDisabled = true;
                      }
                    }
                    const hoverClass = isDisabled
                      ? "hover:bg-red-500"
                      : "hover:bg-green-300";
                    return (
                      <Cell
                        key={`${rIdx}-${cIdx}`}
                        row={rIdx}
                        col={cIdx}
                        state={cell}
                        onClick={() => {
                          if (!isDisabled) updateCell(rIdx, cIdx);
                        }}
                        onDropAction={handleDrop}
                        isSelected={selected.some(
                          ([r, c]) => r === rIdx && c === cIdx
                        )}
                        style={{
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          pointerEvents: isDisabled ? "none" : "auto",
                          // Tailwind's red-500 hex
                        }}
                        classNames={hoverClass}
                        cellMessageCounts={cellMessageCounts}
                        getBookingIdForOccupiedCell={
                          getBookingIdForOccupiedCell
                        }
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Fixed */}
      <div className="w-full bg-white px-6 py-3 shadow-md flex flex-col gap-2 shrink-0 text-sm">
        {/* Main Row: Left, Center, Right */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Side: Court Id and Host */}
          {firstSelected && (
            <div className="flex flex-col min-w-[200px] flex-1">
              <div className="bg-white border border-gray-300 rounded-md shadow-sm p-2">
                {/* <p>
                <strong>Court Name:</strong>{" "}
                {getCellData()?.courtName ??
                  (firstSelected
                    ? courtId[firstSelected[0]]?.name ?? "Unknown"
                    : "N/A")}
              </p> */}

                <p>
                  <strong>Court Name:</strong>{" "}
                  {firstSelected
                    ? (resolvedNames[
                        filteredCourtId[firstSelected[0]]?.courtId
                      ] ||
                        filteredCourtId[firstSelected[0]]?.name) ??
                      "Unknown"
                    : "N/A"}
                </p>

                <p>
                  <strong>Host:</strong>{" "}
                  {firstSelected &&
                    ["occupied", "blocled"].includes(
                      grid[firstSelected[0]][firstSelected[1]]
                    ) &&
                    sessionStorage.getItem("newHostClick")}
                  {firstSelected &&
                    [
                      "available",
                      "selected",

                      "unbook",
                      "unblock",
                      "cancelled",
                    ].includes(grid[firstSelected[0]][firstSelected[1]]) &&
                    sessionStorage.getItem("hostName")}
                </p>

                {/* Bottom row: Sport Select dropdown - aligned left */}
                {firstSelected &&
                  [
                    "available",
                    "selected",

                    "unbook",
                    "unblock",
                    "cancelled",
                  ].includes(grid[firstSelected[0]][firstSelected[1]]) && (
                    <div className="flex items-center gap-2 justify-start w-full">
                      <label className="font-semibold">Sport:</label>
                      <select
                        value={selectedSportId}
                        onChange={(e) => setSelectedSportId(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select a sport</option>
                        {selectedCellDetails.availableSports.map((sport) => (
                          <option key={sport.sportId} value={sport.sportId}>
                            {sport.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Center: Difficulty, Max Players, Slots, Price, and Sport dropdown */}
          <div className="flex flex-col min-w-[350px] flex-1">
            {/* Top row: Difficulty, Max Players, Slots, Price - centered */}
            <div className="flex flex-wrap items-center gap-4 justify-center w-full mb-2">
              {/* Difficulty */}

              <div>
                {firstSelected &&
                  ["selected", "unbook", "unblock", "cancelled"].includes(
                    grid[firstSelected[0]][firstSelected[1]]
                  ) && (
                    <>
                      <label className="font-semibold mr-2">Difficulty:</label>
                      <select
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        value={difficultyLevel}
                        onChange={(e) => setDifficultyLevel(e.target.value)}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </>
                  )}
              </div>

              {/* Max Players */}
              <div className="flex items-center gap-2">
                {firstSelected &&
                  ["selected", "unbook", "unblock", "cancelled"].includes(
                    grid[firstSelected[0]][firstSelected[1]]
                  ) && (
                    <>
                      <label className="font-semibold">Max Players:</label>
                      <button
                        className="px-2 py-1 bg-gray-300 rounded"
                        onClick={() =>
                          setMaxPlayers((prev) => Math.max(1, prev - 1))
                        }
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{maxPlayers}</span>
                      <button
                        className="px-2 py-1 bg-gray-300 rounded"
                        onClick={() =>
                          setMaxPlayers((prev) => Math.min(30, prev + 1))
                        }
                      >
                        +
                      </button>
                    </>
                  )}
              </div>

              {/* Slots */}
              {selected.length === 0 ? (
                <div className="text-gray-500">
                  <strong>Slots: </strong>Not Selected
                </div>
              ) : (
                <div>
                  <strong>Slots:</strong> {formatSelectedTimeRange(selected)}
                </div>
              )}

              {/* Game */}
              <div className="ml-4 md:ml-8 lg:ml-16 xl:ml-18 2xl:ml-21">
                {firstSelected &&
                  [
                    "selected",
                    "occupied",
                    "blocked",
                    "unbook",
                    "unblock",
                    "cancelled",
                  ].includes(grid[firstSelected[0]][firstSelected[1]]) && (
                    <>
                      <strong>Allowed Sports:</strong>{" "}
                      {selected.length > 0 ? (
                        selectedCellDetails.currentBooking &&
                        selectedCellDetails.currentBooking.sportId ? (
                          // Show only the booked game's name
                          <span>
                            {"'" +
                              (selectedCellDetails.availableSports.find(
                                (s) =>
                                  s.sportId ===
                                  selectedCellDetails.currentBooking!.sportId
                              )?.name || "Unknown") +
                              "' "}
                          </span>
                        ) : (
                          // Show all available sports
                          selectedCellDetails.availableSports.map((sport) => (
                            <span key={sport.sportId}>
                              {"'" + sport.name + "' "}
                            </span>
                          ))
                        )
                      ) : (
                        ""
                      )}
                    </>
                  )}
              </div>
            </div>
          </div>

          {/* Right Side: Buttons and Status */}
          <div className="flex flex-col items-end gap-2 min-w-[200px] flex-1">
            {/* <div>
              <strong>Price:</strong>{" "}
              {slotPrices !== null && slotPrices !== undefined
                ? slotPrices
                : "N/A"}
            </div> */}

            {firstSelected && (
              <span className="text-sm text-timeSlot mb-2">
                <strong>Status:</strong>{" "}
                {grid[firstSelected[0]][firstSelected[1]]}
              </span>
            )}

            <div className="flex flex-wrap gap-2 justify-end w-full">
              {firstSelected &&
                [
                  "available",
                  "selected",
                  "unbook",
                  "unblock",
                  "cancelled",
                ].includes(grid[firstSelected[0]][firstSelected[1]]) && (
                  <>
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded"
                      onClick={() => applyAction("occupied")}
                    >
                      Create Game
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => applyAction("blocked")}
                    >
                      Block
                    </button>
                  </>
                )}
              {firstSelected && (
                <>
                  <button
                    className="bg-gray-500 text-white px-3 py-1 rounded"
                    onClick={() => {
                      applyAction("unblock");
                      setSelected([]);
                    }}
                  >
                    Un-Block
                  </button>

                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                    onClick={() => {
                      applyAction("unbook");
                      setSelected([]);
                    }}
                  >
                    Un-Book
                  </button>

                  {["occupied", "blocked"].includes(
                    grid[firstSelected[0]][firstSelected[1]]
                  ) && (
                    <button
                      onClick={async () => {
                        // Refresh cell details before opening modal to get latest data
                        await fetchCellDetails(
                          firstSelected[0],
                          firstSelected[1]
                        );
                        await getCellData();
                        openModal();
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      View Details
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Current Date - Full Width */}
        {/* <div className="text-xs text-gray-500 text-center mt-1 w-full"></div> */}
      </div>
      <UserModal2
        isOpen={isModalOpen}
        onClose={closeModal}
        cellData={
          cellData ?? {
            courtName: "",
            timeSlot: "",
            gameName: "",
            bookingId: "",
          }
        }
      />
      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </div>
  );
};

export default CellGridLatest;
