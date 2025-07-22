import axios from "axios";
import { useEffect, useRef, useState } from "react";
import TopBar from "../BookingCalendarComponent/Topbar";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

type Court = { courtId: string; name: string };
type Slot = {
  slotId: string;
  courtId: string;
  startTime: string; // ISO string
  endTime: string;
  status: string;
  bookingInfo: any;
  slotSize: number;
  date: string;
  st_unix: number;
  et_unix: number;
};
type SlotPrice = {
  price: number;
  slotId: string;
};

type SelectedCell = {
  day: string;
  court: string;
  slotId: string;
};

function getWeekStart(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as week start
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatWeekLabel(startDate: Date) {
  const endDate = addDays(startDate, 6);
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const month = startDate.toLocaleString("default", { month: "long" });
  const year = startDate.getFullYear();

  return `${startDay} - ${endDay} ${month} ${year}`;
}

// Generate 48 half-hour slots labels (12:00 AM to 11:30 PM)

export default function PriceDaily() {

let arenaOpen = null;
let arenaClose = null;
const [openingTimeIST, setOpeningTimeIST] = useState<dayjs.Dayjs | null>(null);
const [cols, setCols] = useState<number>(0);



dayjs.extend(utc);
dayjs.extend(timezone);

const fetchArena = async () => {
  try {
    const arenaRes = await axios.get(`https://play-os-backend.forgehub.in/arena/AREN_JZSW15`);
    const openingTime = dayjs.utc(arenaRes.data.openingTime).tz("Asia/Kolkata");
    const closingTime = dayjs.utc(arenaRes.data.closingTime).tz("Asia/Kolkata");

    setOpeningTimeIST(openingTime);
    const diffInMinutes = closingTime.diff(openingTime, "minute");
    setCols(diffInMinutes / 30);

  } catch (error) {
    console.error("Failed to fetch arena:", error);
  }
};

  useEffect(() => {
    fetchArena();
  },[])
  
const timeLabels = openingTimeIST && cols
  ? Array.from({ length: cols }, (_, i) => {
      const start = openingTimeIST.add(i * 30, "minute");
      const end = start.add(30, "minute");

      const formatHourShort = (h: number) => {
        if (h === 0) return "12";
        if (h <= 12) return h.toString();
        return (h - 12).toString();
      };
      const formatLabel = (t: dayjs.Dayjs) => {
        const h = t.hour();
        const m = t.minute();
        return `${formatHourShort(h)}:${m === 0 ? "00" : "30"}`;
      };

      return `${formatLabel(start)} - ${formatLabel(end)}`;
    })
  : [];



  const [courtId, setCourtId] = useState<Court[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    court: string;
    slotId?: string;
  } | null>(null);

  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  // Map: courtId -> slotId -> price (string for input)
  const [prices, setPrices] = useState<Record<string, Record<string, string>>>(
    {}
  );

  const timeHeaderRef = useRef<HTMLDivElement>(null);

  const toggleCellSelection = (courtId: string, slotId: string) => {
    const day = formatDateForInput(selectedDate);

    setSelectedCells((prev) => {
      const exists = prev.find(
        (cell) =>
          cell.day === day && cell.court === courtId && cell.slotId === slotId
      );
      if (exists) {
        // Deselect if already selected
        return prev.filter(
          (cell) =>
            !(
              cell.day === day &&
              cell.court === courtId &&
              cell.slotId === slotId
            )
        );
      } else {
        // Add new selection
        return [...prev, { day, court: courtId, slotId }];
      }
    });
  };

  // Map: courtId -> slots array for selected date
  const [courtSlots, setCourtSlots] = useState<Record<string, Slot[]>>({});

  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Fetch courts and resolve names
  useEffect(() => {
    const fetchCourtIDs = async () => {
      try {
        const response = await axios.get(
          "https://play-os-backend.forgehub.in/arena/AREN_JZSW15/courts"
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
                    `https://play-os-backend.forgehub.in/human/${userId}`
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
        console.error("Failed to fetch court IDs", error);
      }
    };

    fetchCourtIDs();
  }, []);

  // Fetch slots for each court for selectedDate
  useEffect(() => {
    if (courtId.length === 0) return;

    const fetchSlotsForCourts = async () => {
      const dateStr = formatDateForInput(selectedDate);
      const slotsMap: Record<string, Slot[]> = {};

      await Promise.all(
        courtId.map(async (court) => {
          try {
            const res = await axios.get(
              `https://play-os-backend.forgehub.in/court/${court.courtId}/slots?date=${dateStr}`
            );
            if (Array.isArray(res.data)) {
              slotsMap[court.courtId] = res.data;
            } else {
              slotsMap[court.courtId] = [];
            }
          } catch (e) {
            console.error(
              `Failed to fetch slots for court ${court.courtId}`,
              e
            );
            slotsMap[court.courtId] = [];
          }
        })
      );

      setCourtSlots(slotsMap);
    };

    fetchSlotsForCourts();
  }, [courtId, selectedDate]);

  // Fetch prices for all slots
  useEffect(() => {
    const fetchPrices = async () => {
      const newPrices: Record<string, Record<string, string>> = {};

      const allSlots = Object.values(courtSlots).flat();
      
      
      await Promise.all(
        allSlots.map(async (slot) => {
          console.log("SlotId's", slot.slotId);
          try {
            const res = await axios.get(
              `https://play-os-backend.forgehub.in/timeslot/${slot.slotId}`
            );
            if (!newPrices[slot.courtId]) newPrices[slot.courtId] = {};
            newPrices[slot.courtId][slot.slotId] = String(res.data.price ?? "");
          } catch (e) {
            console.error(`Failed to fetch price for slot ${slot.slotId}`, e);
            if (!newPrices[slot.courtId]) newPrices[slot.courtId] = {};
            newPrices[slot.courtId][slot.slotId] = "";
          }
        })
      );

      setPrices(newPrices);
    };

    // Only fetch prices if slots are loaded
    if (Object.keys(courtSlots).length > 0) {
      fetchPrices();
    }
  }, [courtSlots]);

  // Handle input change for price
  const handleInputChange = (
    courtId: string,
    slotId: string,
    value: string
  ) => {
    // Allow only numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(value)) return;

    setPrices((prev) => ({
      ...prev,
      [courtId]: {
        ...prev[courtId],
        [slotId]: value,
      },
    }));
  };

  // Save updated prices for all changed slots
  const handleSave = async () => {
    try {
      const allUpdates = [];

      for (const courtIdKey in prices) {
        for (const slotIdKey in prices[courtIdKey]) {
          const priceStr = prices[courtIdKey][slotIdKey];
          if (priceStr === "") continue; // skip empty
          const priceNum = parseInt(priceStr);
          if (isNaN(priceNum)) continue;

          // POST updated price for each slot
          allUpdates.push(
            axios.patch(
              `https://play-os-backend.forgehub.in/timeslot/${slotIdKey}`,
              {
                price: priceNum,
                status: "available",
                bookingInfo: "active",
              }
            )
          );
          console.log("SlotIdKey", slotIdKey);
          console.log("price, status, bookingInfo", priceNum);
        }
      }

      console.log(allUpdates, "All updates");

      await Promise.all(allUpdates);
      alert("Prices saved successfully!");
    } catch (e) {
      console.warn("Failed to save prices", e);
      alert("Failed to save prices. Please try again.");
    }
  };

  // Synchronize sidebar vertical scroll with grid vertical scroll
  const onGridScroll = () => {
    if (sidebarScrollRef.current && gridScrollRef.current) {
      sidebarScrollRef.current.scrollTop = gridScrollRef.current.scrollTop;
    }
    if (timeHeaderRef.current && gridScrollRef.current) {
      timeHeaderRef.current.scrollLeft = gridScrollRef.current.scrollLeft;
    }
  };

  // Helper: find slotId for a court and half-hour index
  // Return slotId or null if no slot matches that time
  const IST_OFFSET_MINUTES = 330; // IST is UTC +5:30

  const findSlotIdForTime = (
    courtId: string,
    halfHourIndex: number
  ): string | null => {
    const slots = courtSlots[courtId];
    if (!slots) return null;

    // Calculate the start time of the half-hour slot in IST
    const slotStartIST = new Date(selectedDate);
    slotStartIST.setHours(0, 0, 0, 0);
    slotStartIST.setMinutes(halfHourIndex * 30);

    // Convert slotStartIST to UTC for comparison (reverse offset)
    const slotStartUTC = new Date(
      slotStartIST.getTime() - IST_OFFSET_MINUTES * 60000
    );

    // Find a slot whose time range covers slotStartUTC
    for (const slot of slots) {
      const slotStartUTCDate = new Date(slot.startTime);
      const slotEndUTCDate = new Date(slot.endTime);

      if (slotStartUTC >= slotStartUTCDate && slotStartUTC < slotEndUTCDate) {
        return slot.slotId;
      }
    }

    return null;
  };

  // Render

  return (
    <div className="flex flex-col h-screen font-semibold">
      {/* Top Bar */}
      <TopBar />
      <div className="flex items-center justify-between  bg-white shadow-sm shrink-0 rounded-b-lg p-2">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          ← Prev
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold">
            {formatWeekLabel(getWeekStart(selectedDate))}
          </span>
          <input
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) setSelectedDate(newDate);
            }}
            className="px-2 py-1 border border-gray-300 rounded text-xs"
          />
        </div>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next →
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          ref={sidebarScrollRef}
          className="flex flex-col w-24 shrink-0 bg-white overflow-y-auto overflow-x-hidden rounded-md border border-gray-200"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="h-10 shrink-0 bg-gray-100 border-b border-gray-200 rounded-tl-md" />
          {courtId.map((court) => (
            <div
              key={court.courtId}
              className="h-10 flex items-center justify-center text-xs text-center shrink-0 border-b border-gray-200"
            >
              {resolvedNames[court.courtId] ?? court.name}
            </div>
          ))}
        </div>

        {/* Grid Section */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Time Headers */}
          <div
            className="shrink-0 bg-white rounded-t-md shadow-sm grid divide-x divide-gray-200 overflow-x-auto overflow-y-hidden hide-scrollbar"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(5rem, 1fr))`,
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE and Edge
            }}
            ref={timeHeaderRef} // <-- add this
          >
            {timeLabels.map((label, i) => (
              <div
                key={i}
                className="min-w-0 h-10 flex items-center justify-center text-xs font-semibold text-gray-700 cursor-default select-none"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid Content */}
          <div
            ref={gridScrollRef}
            className="flex-1 overflow-auto"
            onScroll={onGridScroll}
          >
            <div
              className="grid border border-gray-200 rounded-b-md bg-white divide-x divide-gray-200 divide-y"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(5rem, 1fr))`,
              }}
            >
              {courtId.map((court) => {
                const slots = courtSlots[court.courtId] || [];
                let cellIndex = 0;
                const cells = [];

                while (cellIndex < cols) {
                  // Find slot covering this cellIndex
                  const slot = slots.find((s) => {
                    const slotStartIST = new Date(selectedDate);
                    slotStartIST.setHours(0, 0, 0, 0);
                    slotStartIST.setMinutes(cellIndex * 30);

                    const slotStartUTC = new Date(
                      slotStartIST.getTime() - IST_OFFSET_MINUTES * 60000
                    );
                    const slotStartUTCDate = new Date(s.startTime);
                    const slotEndUTCDate = new Date(s.endTime);

                    return (
                      slotStartUTC >= slotStartUTCDate &&
                      slotStartUTC < slotEndUTCDate
                    );
                  });

                  if (slot) {
                    const span = slot.slotSize / 30;
                    const slotId = slot.slotId;
                    const value = prices[court.courtId]?.[slotId] ?? "";
                    const isSelected = selectedCells.some(
                      (cell) =>
                        cell.day === formatDateForInput(selectedDate) &&
                        cell.court === court.courtId &&
                        cell.slotId === slotId
                    );

                    cells.push(
                      <div
                        key={`${court.courtId}-${cellIndex}`}
                        className={`min-w-0 h-10 flex items-center px-3 cursor-pointer rounded transition-colors duration-200 ${
                          isSelected
                            ? "bg-blue-100 ring-1 ring-blue-500 shadow-sm"
                            : "bg-green-50 hover:bg-green-200"
                        } border border-gray-200`}
                        style={{ gridColumn: `span ${span}` }}
                        onClick={() =>
                          toggleCellSelection(court.courtId, slotId)
                        }
                      >
                        <span className="text-green-600 mr-1 text-sm select-none font-semibold">
                          ₹
                        </span>
                        {isSelected ? (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              handleInputChange(
                                court.courtId,
                                slotId,
                                e.target.value
                              )
                            }
                            className="w-full h-full outline-none bg-transparent text-sm font-medium text-green-900 caret-green-600"
                            autoFocus={true}
                            placeholder="0"
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        ) : (
                          <span className="text-sm text-gray-700 font-medium">
                            {value}
                          </span>
                        )}
                      </div>
                    );

                    cellIndex += span;
                  } else {
                    // Render N/A cell with same style but no rupee symbol
                    cells.push(
                      <div
                        key={`${court.courtId}-${cellIndex}`}
                        className="min-w-0 h-10 flex items-center px-3 cursor-default rounded bg-white hover:bg-green-50 border border-gray-200 select-none"
                        style={{ gridColumn: "span 1" }}
                      >
                        <span className="text-gray-400 text-sm mx-auto font-semibold">
                          N/A
                        </span>
                      </div>
                    );

                    cellIndex++;
                  }
                }

                return cells;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full bg-white px-6 py-3 shadow-md flex items-center justify-between shrink-0 text-sm">
        <div className="min-w-[200px]">
          <strong>Court:</strong>{" "}
          {selectedCell && selectedCell.court
            ? resolvedNames[selectedCell.court] || selectedCell.court
            : "N/A"}
          <br />
          <strong>Day:</strong>{" "}
          {selectedCell
            ? new Date(selectedCell.day).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A"}
        </div>
        <button
          onClick={handleSave}
          className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
}
