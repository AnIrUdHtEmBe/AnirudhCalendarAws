import axios from "axios";
import { useEffect, useRef, useState } from "react";
import TopBar from "../BookingCalendarComponent/Topbar";
import Toast from "../BookingCalendarComponent/Toast";
import { API_BASE_URL_Latest } from "../BookingCalendarComponent/AxiosApi";
import { useLocation } from "react-router-dom";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import WeekPlanView from "../WeeklyDateView/WeekViewPlan";
import { getArrayOfDatesFromSundayToSaturday } from "../WeeklyDateView/date";

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
  // Use local timezone instead of UTC to avoid date shifting
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
const cols = 48;
const timeLabels = Array.from({ length: cols }, (_, i) => {
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

  return `${formatHourShort(hour)}:${minute}  ${formatHourShort(
    nextHour
  )}:${nextMinute}`;
});

export default function PriceDaily() {
  const [changedSlots, setChangedSlots] = useState<Record<string, Set<string>>>(
    {}
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const [courtId, setCourtId] = useState<Court[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {}
  );
  const location = useLocation();
  const [weekStartToEndDates, setWeekStartToEndDates] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const getDateFromUrl = (): Date => {
    const params = new URLSearchParams(location.search);
    const dateStr = params.get("date");
    console.log("Date from URL:", dateStr); // Debug log
    if (dateStr && !isNaN(new Date(dateStr).getTime())) {
      // Parse as local date, not UTC
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState(getDateFromUrl());
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateStr = params.get("date");
    console.log("URL changed, date param:", dateStr); // Debug log
    if (dateStr && !isNaN(new Date(dateStr).getTime())) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const newDate = new Date(year, month - 1, day);
      console.log("Setting new date:", newDate); // Debug log
      setSelectedDate(newDate);
    }
  }, [location.search]);

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
              `${API_BASE_URL_Latest}/court/${court.courtId}/slots?date=${dateStr}`
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
              `${API_BASE_URL_Latest}/timeslot/${slot.slotId}`
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
    // Validate input...
    if (!/^\d*\.?\d*$/.test(value)) return;

    setPrices((prev) => {
      const updatedPrices = {
        ...prev,
        [courtId]: {
          ...prev[courtId],
          [slotId]: value,
        },
      };
      return updatedPrices;
    });

    setChangedSlots((prev) => {
      const newChanged = { ...prev };

      if (!newChanged[courtId]) {
        newChanged[courtId] = new Set();
      }
      newChanged[courtId].add(slotId);

      return newChanged;
    });
  };

  // Save updated prices for all changed slots
  const handleSave = async () => {
    try {
      const allUpdates = [];

      for (const courtIdKey in changedSlots) {
        for (const slotIdKey of changedSlots[courtIdKey]) {
          const priceStr = prices[courtIdKey]?.[slotIdKey];
          if (!priceStr) continue;

          const priceNum = parseInt(priceStr);
          if (isNaN(priceNum)) continue;

          allUpdates.push(
            axios.patch(`${API_BASE_URL_Latest}/timeslot/${slotIdKey}`, {
              price: priceNum,
              status: "available",
              bookingInfo: "active",
            })
          );
        }
      }

      await Promise.all(allUpdates);
      showToast("Prices saved successfully!");

      // Clear changed slots after successful save
      setChangedSlots({});
      setSelectedCells([]);
    } catch (e) {
      console.error("Failed to save prices", e);
      showToast("Failed to save prices. Please try again.");
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

useEffect(() => {
  let referenceDate = new Date(selectedDate);

  if (isNaN(referenceDate.getTime())) {
    referenceDate = new Date();
  }

  const weekDates = getArrayOfDatesFromSundayToSaturday(referenceDate);

  setWeekStartToEndDates(weekDates);

  const currentDateStr = formatDateForInput(referenceDate);

  const newActiveIndex = weekDates.findIndex(
    (dateStr) => dateStr === currentDateStr
  );

  setActiveIndex(newActiveIndex !== -1 ? newActiveIndex : 0);
}, [selectedDate]);

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
      <div className="flex items-center bg-white shadow-sm shrink-0 rounded-b-lg p-2 gap-4">
  {/* Breadcrumb */}
  <div className="shrink-0">
    <Breadcrumb />
  </div>

  {/* Navigation controls - now using flex-1 and justify-center */}
  <div className="flex items-center gap-5 flex-1 justify-center min-w-0">
    <button
      onClick={() => setSelectedDate(addDays(selectedDate, -7))}
      className="px-3 py-1 bg-gray-300 rounded shrink-0"
    >
      ← Prev
    </button>
    <div className="flex items-center gap-4 min-w-0">
      <div className="min-w-0 flex-1">
        <WeekPlanView
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          weekStartToEndDates={weekStartToEndDates}
          onDateChange={(newDate) => {
            setSelectedDate(newDate);
          }}
        />
      </div>
      <input
        type="date"
        value={formatDateForInput(selectedDate)}
        onChange={(e) => {
          const newDate = new Date(e.target.value);
          if (!isNaN(newDate.getTime())) setSelectedDate(newDate);
        }}
        className="px-2 py-1 border border-gray-300 rounded text-xs shrink-0"
      />
    </div>
    <button
      onClick={() => setSelectedDate(addDays(selectedDate, 7))}
      className="px-3 py-1 bg-gray-300 rounded shrink-0"
    >
      Next →
    </button>
  </div>
</div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          ref={sidebarScrollRef}
          className="flex flex-col w-24 shrink-0 bg-white overflow-y-auto overflow-x-hidden rounded-md border border-gray-200"
          style={{
            overflowY: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
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
          {/* <strong>Court:</strong>{" "}
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
            : "N/A"} */}
        </div>
        {selectedCells.length > 0 && (
          <button
            onClick={handleSave}
            className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition"
          >
            Set Prices
          </button>
        )}
      </div>
      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </div>
  );
}
