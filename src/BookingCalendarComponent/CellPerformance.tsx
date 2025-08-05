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

// Cache objects - moved outside component to persist across re-renders
// Replace the cache configuration (around line 78) with optimized durations:

const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for stable data
const SHORT_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for dynamic data (bookings, slots)

const getCachedData = (key: string, shortCache = false) => {
  const cached = apiCache.get(key);
  const duration = shortCache ? SHORT_CACHE_DURATION : CACHE_DURATION;
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any, shortCache = false) => {
  apiCache.set(key, { data, timestamp: Date.now() });
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

const Cell = React.memo(({
  row,
  col,
  state,
  label,
  style,
  classNames,
  onClick,
  onDropAction,
  isSelected,
}: CellProps) => {
  const colorMap: Record<CellState, string> = useMemo(() => ({
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
  }), []);

  const handleClick = useCallback(() => {
    if (row !== undefined && col !== undefined && onClick) {
      onClick(row, col);
    }
  }, [row, col, onClick]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (row !== undefined && col !== undefined) {
      e.dataTransfer.setData("text/plain", `${row},${col}`);
    }
  }, [row, col]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
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
  }, [row, col, onDropAction, state]);

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

  return (
    <div
      className={clsx(
        classNames,
        "min-w-[4rem] flex-1 h-10 border border-white rounded-md cursor-pointer transition-colors",
        state && colorMap[state],
        showRing &&
          isSelected &&
          "ring-4 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg animate-pulse [animation-duration:5.8s]"
      )}
      style={style}
      onClick={handleClick}
      draggable={state === "occupied" || state === "blocked"}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  );
});

const CellGridPerformv2 = () => {
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
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

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

  // Updated getCourtType function that fetches data with caching
  const getCourtType = useCallback(async (courtId: string): Promise<string> => {
    const cacheKey = `court-type-${courtId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const courtRes = await axios.get(
        `https://play-os-backend.forgehub.in/court/${courtId}`
      );
      const sportIdss = courtRes.data.allowedSports?.[0];

      if (!sportIdss) {
        setCachedData(cacheKey, "Sports");
        return "Sports";
      }

      const sportRes = await axios.get(
        `https://play-os-backend.forgehub.in/sports/id/${sportIdss}`
      );
      const category = sportRes.data.category || "";

      let result = "Sports";
      if (category === "WELLNESS") {
        result = "Wellness";
      } else if (category === "FITNESS") {
        result = "Fitness";
      }

      setCachedData(cacheKey, result);
      return result;
    } catch (err) {
      setCachedData(cacheKey, "Sports");
      return "Sports";
    }
  }, []);

  // Add state to store court types
  const [courtTypes, setCourtTypes] = React.useState<Record<string, string>>({});
  const [isLoadingCourtTypes, setIsLoadingCourtTypes] = React.useState(false);

  // Optimized court types fetching with caching
  const fetchCourtTypes = useCallback(async (courts: Court[]) => {
    if (courts.length === 0) return;

    setIsLoadingCourtTypes(true);
    const types: Record<string, string> = {};

    // Check cache first
    const cachedTypes: Record<string, string> = {};
    const courtsToFetch: Court[] = [];

    courts.forEach(court => {
      const cached = getCachedData(`court-type-${court.courtId}`);
      if (cached) {
        cachedTypes[court.courtId] = cached;
      } else {
        courtsToFetch.push(court);
      }
    });

    // Set cached types immediately
    Object.assign(types, cachedTypes);

    // Fetch remaining types in parallel
    if (courtsToFetch.length > 0) {
      await Promise.all(
        courtsToFetch.map(async (court) => {
          const courtType = await getCourtType(court.courtId);
          types[court.courtId] = courtType;
        })
      );
    }

    setCourtTypes(types);
    setIsLoadingCourtTypes(false);
  }, [getCourtType]);

  // Fetch court types when courtId changes
  useEffect(() => {
    fetchCourtTypes(courtId);
  }, [courtId, fetchCourtTypes]);

  // Updated filtered courts computation - FIXED
const filteredCourtId = useMemo(() => {
  if (activeTab === "All") return courtId;
  if (isLoadingCourtTypes) return courtId; // Return all courts while loading to prevent UI flicker
  
  return courtId.filter((court) => {
    const courtType = courtTypes[court.courtId] || "Sports";
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);


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
  const isValidSelection = useCallback((
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
  }, []);

  const memoizedResolvedNames = useMemo(() => resolvedNames, [resolvedNames]);

// Memoize grid dimensions
const gridDimensions = useMemo(() => ({
  cols,
  rows: filteredCourtId.length
}), [cols, filteredCourtId.length]);

// Memoize selected cell validation
const isValidSelectionMemo = useMemo(() => {
  return isValidSelection(selected);
}, [selected, isValidSelection]);

  const getCellData = useCallback(async () => {
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

    return data;
  }, [selectedCell, selected, selectedCellDetails.gameName, resolvedNames]);

  // Format time range only if selection is valid
  const formatSelectedTimeRange = useCallback((
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
  }, [isValidSelection]);

  // Generate time labels for 24 hours (12 AM to 12 AM) - Memoized
  const timeLabels = useMemo(() => { 
    return Array.from({ length: cols }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minute = i % 2 === 0 ? "00" : "30";

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

  const calculateColumns = useCallback((
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
  }, []);

  const fetchArenaData = useCallback(async () => {
    const cacheKey = "arena-AREN_JZSW15";
    const cached = getCachedData(cacheKey);
    
    try {
      let arenaData;
      if (cached) {
        arenaData = cached;
      } else {
        const response = await fetch(
          "https://play-os-backend.forgehub.in/arena/AREN_JZSW15"
        );
        arenaData = await response.json();
        setCachedData(cacheKey, arenaData);
      }

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
  }, []);

  const fetchArenaDetails = useCallback(async () => {
    const cacheKey = "arena-details-AREN_JZSW15";
    const cached = getCachedData(cacheKey);
    
    try {
      let apiRes;
      if (cached) {
        apiRes = { data: cached };
      } else {
        apiRes = await axios.get(`${API_BASE_URL_Latest}/arena/AREN_JZSW15`);
        setCachedData(cacheKey, apiRes.data);
      }

      const arenaStartTime = apiRes.data.openingTime;
      const arenaEndTime = apiRes.data.closingTime;

      const arenaOpen = toIST(arenaStartTime);
      const arenaClose = toIST(arenaEndTime);

      const numColumns = calculateColumns(arenaOpen, arenaClose);
    } catch (error) {
      // console.error("Error fetching arena details:", error);
    }
  }, [calculateColumns]);

  const fetchCourtIDs = useCallback(async () => {
    const cacheKey = "court-ids-AREN_JZSW15";
    const cached = getCachedData(cacheKey);
    
    try {
      let response;
      if (cached) {
        response = { data: cached };
      } else {
        response = await axios.get(
          `${API_BASE_URL_Latest}/arena/AREN_JZSW15/courts`
        );
        setCachedData(cacheKey, response.data);
      }

      if (Array.isArray(response.data)) {
        setCourtId(response.data);
        const nameMap: Record<string, string> = {};

        await Promise.all(
          response.data.map(async (court: Court) => {
            if (court.name.startsWith("court_")) {
              const userId = court.name.replace("court_", "");
              const userCacheKey = `human-${userId}`;
              const cachedUser = getCachedData(userCacheKey);
              
              try {
                if (cachedUser) {
                  nameMap[court.courtId] = cachedUser.name;
                } else {
                  const res = await axios.get(
                    `${API_BASE_URL_Latest}/human/${userId}`
                  );
                  setCachedData(userCacheKey, res.data);
                  nameMap[court.courtId] = res.data.name;
                }
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
  }, []);

  useEffect(() => {
    fetchArenaDetails();
  }, [fetchArenaDetails]);

  const fetchAllCourtDetails = useCallback(async(filteredCourtId: Court[]) => {
    const detailsMap: Record<string, CourtDetails> = {};
    const allowedSportsMap: Record<string, Sport[]> = {};

    await Promise.all(
      filteredCourtId.map(async (court) => {
        try {
          const courtCacheKey = `court-details-${court.courtId}`;
          const cachedCourt = getCachedData(courtCacheKey);
          
          let courtDetails;
          if (cachedCourt) {
            courtDetails = cachedCourt;
          } else {
            const res = await axios.get(
              `${API_BASE_URL_Latest}/court/${court.courtId}`
            );
            courtDetails = res.data;
            setCachedData(courtCacheKey, courtDetails);
          }

          detailsMap[court.courtId] = courtDetails;

          // Fetch allowed sports for this court with caching
          const sports = await Promise.all(
            courtDetails.allowedSports.map(async (sportId: any) => {
              try {
                const sportCacheKey = `sport-${sportId}`;
                const cachedSport = getCachedData(sportCacheKey);
                
                if (cachedSport) {
                  return cachedSport;
                } else {
                  const sportRes = await axios.get(
                    `${API_BASE_URL_Latest}/sports/id/${sportId}`
                  );
                  setCachedData(sportCacheKey, sportRes.data);
                  return sportRes.data;
                }
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

    setCourtDetailsMap(detailsMap);
    setCourtAllowedSportsMap(allowedSportsMap);
  }, []);

  const fetchSlotsForCourts = useCallback(async () => {
    const dateStr = currentDate.toISOString().split("T")[0];
    const slotsMap: Record<string, any[]> = {};
    const bookIdMap: Record<string, any[]> = {};

    await Promise.all(
      filteredCourtId.map(async (court) => {
        try {
          const slotsCacheKey = `slots-${court.courtId}-${dateStr}`;
          const cachedSlots = getCachedData(slotsCacheKey);
          
          let rawSlots;
          if (cachedSlots) {
            rawSlots = cachedSlots;
          } else {
            const res = await axios.get(
              `${API_BASE_URL_Latest}/court/${court.courtId}/slots?date=${dateStr}`
            );
            rawSlots = Array.isArray(res.data) ? res.data : [];
            // Cache for shorter duration since slots change frequently
            apiCache.set(slotsCacheKey, { data: rawSlots, timestamp: Date.now() });
          }

          // Convert all slot times from UTC to IST here
          const istSlots = rawSlots.map((slot: any) => ({
            ...slot,
            startTime: toIST(slot.startTime),
            endTime: toIST(slot.endTime),
            date: toIST(slot.date),
          }));

          slotsMap[court.courtId] = istSlots;

          bookIdMap[court.courtId] = rawSlots.map((slot: any) => ({
            ...slot,
            bookingId: slot.bookingInfo,
          }));
        } catch (e) {
          // console.error(`Failed to fetch slots for court ${court.courtId}`, e);
          slotsMap[court.courtId] = [];
        }
      })
    );

    setCourtSlots(slotsMap);
    setCourtBookids(bookIdMap);
  }, [currentDate, filteredCourtId]);

  const fetchPrices = useCallback(async () => {
    const newPrices: Record<string, Record<string, number>> = {};

    const allSlots = Object.values(courtSlots).flat();

    await Promise.all(
      allSlots.map(async (slot) => {
        try {
          const priceCacheKey = `price-${slot.slotId}`;
          const cachedPrice = getCachedData(priceCacheKey);
          
          let price;
          if (cachedPrice !== null) {
            price = cachedPrice;
          } else {
            const res = await axios.get(
              `${API_BASE_URL_Latest}/timeslot/${slot.slotId}`
            );
            price = res.data.price ?? 0;
            setCachedData(priceCacheKey, price);
          }
          
          if (!newPrices[slot.courtId]) newPrices[slot.courtId] = {};
          newPrices[slot.courtId][slot.slotId] = price;
        } catch (e) {
          // console.error(`Failed to fetch price for slot ${slot.slotId}`, e);
          if (!newPrices[slot.courtId]) newPrices[slot.courtId] = {};
          newPrices[slot.courtId][slot.slotId] = 0;
        }
      })
    );

    setSlotPrices(newPrices);
  }, [courtSlots]);

  useEffect(() => {
    fetchCourtIDs();
  }, [fetchCourtIDs]);

  useEffect(() => {
    if (filteredCourtId.length > 0) {
      fetchAllCourtDetails(filteredCourtId);
    }
  }, [filteredCourtId, activeTab, fetchAllCourtDetails]);

  useEffect(() => {
    if (filteredCourtId.length === 0) return;
    fetchSlotsForCourts();
  }, [fetchSlotsForCourts]);

  const getFilteredCourtByIndex = useCallback((index: number) => {
    return filteredCourtId[index];
  }, [filteredCourtId]);

  // Updated grid generation function
  const updateGridWithBookings = useCallback((
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
  }, [cols, timeLabels.length]);

  const fetchBukings = useCallback(async (dateStr: string) => {
    const bookingsMap: Record<string, { start: Date; end: Date }[]> = {};
    const cancelledBookingsMap: Record<string, { start: Date; end: Date }[]> =
      {};

    await Promise.all(
      filteredCourtId.map(async (court) => {
        try {
          const bookingsCacheKey = `bookings-${court.courtId}-${dateStr}`;
          const cachedBookings = getCachedData(bookingsCacheKey);
          
          let bookingsData;
          if (cachedBookings) {
            bookingsData = cachedBookings;
          } else {
            const res = await axios.get(
              `${API_BASE_URL_Latest}/court/${court.courtId}/bookings?date=${dateStr}`
            );
            bookingsData = res.data;
            // Cache for shorter duration since bookings change frequently
            apiCache.set(bookingsCacheKey, { data: bookingsData, timestamp: Date.now() });
          }

          const bookings = Array.isArray(bookingsData.bookings)
            ? bookingsData.bookings
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

    return { bookingsMap, cancelledBookingsMap };
  }, [filteredCourtId]);

  const fetchBlockedSlots = useCallback(async (dateStr: string) => {
    const blockedMap: Record<string, { start: Date; end: Date }[]> = {};
    await Promise.all(
      filteredCourtId.map(async (court) => {
        try {
          const blockedCacheKey = `blocked-slots-${court.courtId}-${dateStr}`;
          const cachedBlocked = getCachedData(blockedCacheKey);
          
          let slots;
          if (cachedBlocked) {
            slots = cachedBlocked;
          } else {
            // Fetch slots for the court on this date
            const res = await axios.get(
              `${API_BASE_URL_Latest}/court/${court.courtId}/slots?date=${dateStr}`
            );
            slots = Array.isArray(res.data) ? res.data : [];
            // Cache for shorter duration
            apiCache.set(blockedCacheKey, { data: slots, timestamp: Date.now() });
          }

          // Filter slots that are blocked (outOfOrder)
          const blockedSlotsForCourt = slots
            .filter(
              (slot: any) =>
                slot.bookingInfo === "outOfOrder" ||
                slot.status === "outOfOrder"
            )
            .map((slot: any) => ({
              start: toIST(slot.startTime),
              end: toIST(slot.endTime),
            }));

          blockedMap[court.courtId] = blockedSlotsForCourt;
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
  }, [filteredCourtId]);

  const fetchBookingsAndBlocked = useCallback(async (date: Date) => {
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
  }, [filteredCourtId, fetchBukings, fetchBlockedSlots, updateGridWithBookings]);

  // Fetch bookings when courts or date changes
  useEffect(() => {
    if (filteredCourtId.length > 0) {
      fetchBookingsAndBlocked(currentDate);
    }
  }, [filteredCourtId.length, currentDate, activeTab, fetchBookingsAndBlocked]);

  useEffect(() => {
    setGrid(
      Array.from({ length: filteredCourtId.length }, () =>
        Array(cols).fill("available")
      )
    );
  }, [filteredCourtId.length, cols]);

  // New function to fetch cell details when a cell is selected
// Replace the fetchCellDetails function with this batched version:

const fetchCellDetails = useCallback(async (row: number, col: number) => {
  if (filteredCourtId.length === 0) return;

  // Check if we already have fresh data for this cell
  if (selectedCellDetails.courtDetails && selectedCell?.row === row && selectedCell?.col === col) {
    return;
  }

  setIsLoadingCellDetails(true);
  const court = getFilteredCourtByIndex(row);
  const dateStr = currentDate.toISOString().split("T")[0];

  try {
    // Batch all the data fetching
    const [courtDetails, bookingsData] = await Promise.all([
      // Court details with caching
      (async () => {
        const courtCacheKey = `court-details-${court.courtId}`;
        const cached = getCachedData(courtCacheKey);
        if (cached) return cached;
        
        const courtRes = await axios.get(`${API_BASE_URL_Latest}/court/${court.courtId}`);
        setCachedData(courtCacheKey, courtRes.data);
        return courtRes.data;
      })(),
      
      // Fresh bookings with short cache
      (async () => {
        const bookingsCacheKey = `fresh-bookings-${court.courtId}-${dateStr}`;
        const cached = getCachedData(bookingsCacheKey, true); // Use short cache
        if (cached) return cached;
        
        const bookingsRes = await axios.get(`${API_BASE_URL_Latest}/court/${court.courtId}/bookings?date=${dateStr}`);
        setCachedData(bookingsCacheKey, bookingsRes.data, true);
        return bookingsRes.data;
      })()
    ]);

    // Fetch sports data in parallel
    const sportsPromises = courtDetails?.allowedSports?.map(async (sportId: string) => {
      const sportCacheKey = `sport-${sportId}`;
      const cached = getCachedData(sportCacheKey);
      if (cached) return cached;
      
      const sportRes = await axios.get(`${API_BASE_URL_Latest}/sports/id/${sportId}`);
      setCachedData(sportCacheKey, sportRes.data);
      return sportRes.data;
    }) || [];

    const availableSports = (await Promise.all(sportsPromises)).filter(s => s !== null);
    const bookingArray = bookingsData?.bookings || [];

    // Calculate current booking
    const hour = Math.floor(col / 2);
    const minute = col % 2 === 0 ? 0 : 30;
    const slotTime = new Date(currentDate);
    slotTime.setHours(hour, minute, 0, 0);
    const slotStartMillis = slotTime.getTime();
    const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

    const currentBooking = bookingArray.find((booking: Booking) => {
      const startTime = toIST(booking.startTime).getTime();
      const endTime = toIST(booking.endTime).getTime();
      const isValidBooking = booking.status === "active" || booking.status === "rescheduled";
      return slotStartMillis < endTime && slotEndMillis > startTime && isValidBooking;
    }) || null;

    // Determine game name
    let gameName = availableSports.map(sport => sport.name).join(", ");
    
    if (currentBooking?.sportId) {
      const sportCacheKey = `sport-${currentBooking.sportId}`;
      const cached = getCachedData(sportCacheKey);
      if (cached) {
        gameName = cached.name;
      } else {
        try {
          const sportRes = await axios.get(`${API_BASE_URL_Latest}/sports/id/${currentBooking.sportId}`);
          setCachedData(sportCacheKey, sportRes.data);
          gameName = sportRes.data.name;
        } catch (err) {
          // Keep default gameName
        }
      }
    }

    // Batch state update
    setSelectedCellDetails({
      courtDetails,
      bookings: bookingArray,
      gameName,
      availableSports,
      currentBooking,
    });

  } catch (error) {
    // Reset to empty state on error
    setSelectedCellDetails({
      courtDetails: null,
      bookings: [],
      gameName: "",
      availableSports: [],
      currentBooking: null,
    });
  } finally {
    setIsLoadingCellDetails(false);
  }
}, [filteredCourtId.length, currentDate, getFilteredCourtByIndex, selectedCellDetails.courtDetails, selectedCell]);

  // Update updateCell to allow multiple selection toggling
  const updateCell = useCallback((row: number, col: number) => {
    const cell = grid[row][col];

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
            return prevSelected.filter(([r, c]) => !(r === row && c === col));
          } else {
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
  }, [grid, selected, fetchCellDetails]);

  const handleDrop = useCallback(async (
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
  }, [grid, getFilteredCourtByIndex, currentDate, fetchBookingsAndBlocked, showToast]);

  type ModalGame = {
    gameId: string;
  };

  const [modalData, setModalData] = useState<ModalGame>();

  const getUserNameFromToken = useCallback((): string => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return "Guest";

      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || "Guest";
    } catch {
      return "Guest";
    }
  }, []);

  // Modify applyAction to handle multiple selected cells for booking
  const applyAction = useCallback(async (action: CellState) => {
    if (selected.length === 0) return;

    if (
      action === "occupied" ||
      action === "blocked" ||
      action === "unblock" ||
      action === "unbook"
    ) {
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

        try {
          const response = await axios.post(
            `${API_BASE_URL_Latest}/game/create`,
            bookingData
          );
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
      }
    }
  }, [selected, selectedSportId, showToast, courtSlots, getFilteredCourtByIndex, currentDate, fetchBookingsAndBlocked, selectedCellDetails.availableSports, getUserNameFromToken, difficultyLevel, maxPlayers, courtBookIds]);

  const getSlotForCell = useCallback((row: number, col: number) => {
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
  }, [courtSlots, getFilteredCourtByIndex, currentDate]);

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
  }, []);

  // Helper for UI: get first selected cell or null
  const firstSelected = selected.length > 0 ? selected[0] : null;

  const [isModalOpen, setisModalOpen] = useState<boolean>(false);

  const openModal = useCallback(() => {
    setisModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setisModalOpen(false);
  }, []);

  

  const formatDateForInput = useCallback((date: Date) => {
    return date.toISOString().split("T")[0];
  }, []);

  const selectedSlot = useMemo(() => {
    return selectedCell ? getSlotForCell(selectedCell.row, selectedCell.col) : null;
  }, [selectedCell, getSlotForCell]);

  const slotPrice = useMemo(() => {
    return selectedSlot ? slotPrices[selectedSlot.courtId]?.[selectedSlot.slotId] : null;
  }, [selectedSlot, slotPrices]);

  
  const fetchGameIdForCell = useCallback(async (row: number, col: number) => {
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
  }, [getFilteredCourtByIndex, currentDate]);

  const getBookingIdForCell = useCallback(async (
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
        return matchingBooking.bookingId;
      }

      return null;
    } catch (error) {
      // console.error("Error getting fresh bookingId for cell:", error);
      return null;
    }
  }, [getFilteredCourtByIndex, currentDate]);

  const currentGameName = useMemo(() => {
    return selectedCellDetails.availableSports.find(
      (s) => s.sportId === selectedCellDetails.currentBooking?.sportId
    )?.name || "Unknown";
  }, [selectedCellDetails.availableSports, selectedCellDetails.currentBooking?.sportId]);

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
  }, [activeTab, filteredCourtId.length, cols, fetchBookingsAndBlocked, currentDate]); // Trigger when activeTab or filtered court count changes

  const [courName, setCourName] = useState("Loading...");

  useEffect(() => {
    const courtId = selectedCellDetails.courtDetails?.courtId;
    if (firstSelected && courtId) {
      const fetchCourtName = async () => {
        try {
          const courtCacheKey = `court-name-${courtId}`;
          const cached = getCachedData(courtCacheKey);
          
          if (cached) {
            setCourName(cached);
          } else {
            const res = await axios.get(
              `${API_BASE_URL_Latest}/court/${courtId}`
            );
            setCachedData(courtCacheKey, res.data.name);
            setCourName(res.data.name);
          }
        } catch (err) {
          setCourName("Unknown");
        }
      };
      fetchCourtName();
    }
  }, [firstSelected, selectedCellDetails.courtDetails?.courtId]);

  // Memoized grid rendering
  // Replace the incomplete gridCells useMemo (around line 1445) with this complete implementation:

const gridCells = useMemo(() => {
  return grid.map((row, rIdx) =>
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
        const selectedInRow = selected
          .filter(([r, _]) => r === rIdx)
          .map(([_, col]) => col);

        if (selectedInRow.length > 0) {
          const minSelectedCol = Math.min(...selectedInRow);
          const maxSelectedCol = Math.max(...selectedInRow);

          if (cIdx !== minSelectedCol && cIdx !== maxSelectedCol) {
            isDisabled = true;
          }
        }
      }

      if (cell === "available") {
        if (hasOccupiedOrBlockedSelected) {
          // available cells are enabled to allow switching from occupied/blocked
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
        if (hasAvailableSelected) {
          isDisabled = true;
        }
      }

      const isSelected = selected.some(([r, c]) => r === rIdx && c === cIdx);

      return (
        <Cell
          key={`cell-${rIdx}-${cIdx}`}
          row={rIdx}
          col={cIdx}
          state={cell}
          onClick={updateCell}
          onDropAction={handleDrop}
          isSelected={isSelected}
          classNames={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        />
      );
    })
  );
}, [grid, selected, updateCell, handleDrop]); // Complete dependency array
      
        
// The JSX return statement is broken around line 1500. Replace everything from "return (" to the end of component with:

return (
  <>
    {/* {loadingScreen && <LoadingScreen />} */}
    <div className="flex flex-col h-screen">
      {/* Top Nav - Fixed */}
      <TopBar />
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm shrink-0">
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
        {/* Left Sidebar - Court Names */}
        <div className="flex flex-col w-48 shrink-0 bg-white border-r border-gray-200">
          <div className="h-10 shrink-0 border-b border-gray-200" />
          <div
            ref={leftSidebarRef}
            className="flex flex-col overflow-y-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {filteredCourtId.map((court, idx) => (
              <div
                key={court.courtId}
                className="h-10 flex items-center px-3 border-b border-gray-200 bg-white text-xs font-semibold truncate"
                style={{ userSelect: "none" }}
              >
                {memoizedResolvedNames[court.courtId] || court.name}
              </div>
            ))}
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Time Headers - Fixed */}
          <div
            className="overflow-x-auto overflow-y-hidden h-10 shrink-0"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div
              className="grid border-b border-gray-200"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(4rem, 1fr))`,
                minWidth: `calc(4rem * ${cols})`,
              }}
            >
              {timeLabels.map((label, i) => (
                <div
                  key={`header-${i}`}
                  className="min-w-[4rem] h-10 flex items-center justify-center text-xs font-semibold text-timeSlot whitespace-nowrap border-r border-gray-200"
                  style={{ userSelect: "none" }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Grid Content */}
          <div
            className="flex-1 overflow-auto"
            ref={gridScrollRef}
            onScroll={(e) => {
              const target = e.target as HTMLElement;
              if (leftSidebarRef.current) {
                leftSidebarRef.current.scrollTop = target.scrollTop;
              }
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(4rem, 1fr))`,
                minWidth: `calc(4rem * ${cols})`,
              }}
            >
              {gridCells.flat()}
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
                <p>
                  <strong>Court Name:</strong>{" "}
                  {firstSelected
                    ? (memoizedResolvedNames[
                        filteredCourtId[firstSelected[0]]?.courtId
                      ] ||
                        filteredCourtId[firstSelected[0]]?.name) ??
                      "Unknown"
                    : "N/A"}
                </p>

                <p>
                  <strong>Host:</strong>{" "}
                  {firstSelected &&
                    ["occupied", "blocked"].includes(
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
                    ].includes(
                      grid[firstSelected[0]][firstSelected[1]]
                    ) &&
                    sessionStorage.getItem("hostName")}
                </p>

                {/* Sport Select dropdown */}
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

          {/* Center: Difficulty, Max Players, Slots, Price */}
          <div className="flex flex-col min-w-[350px] flex-1">
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
      </div>
      
        {/* Current Date - Full Width */}
        <div className="text-xs text-gray-500 text-center mt-1 w-full"></div>
      </div>
      <UserModal
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
    </>
  );
};

export default CellGridPerformv2;
