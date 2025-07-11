import axios from "axios";
import { useEffect, useRef, useState } from "react";
import TopBar from "../BookingCalendarComponent/Topbar";
import { useNavigate } from "react-router-dom";

type Court = { courtId: string; name: string };

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

export default function WeeklyPricingGrid() {
  const navigate = useNavigate();
  const [courtId, setCourtId] = useState<Court[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    court: string;
  } | null>(null);
  const [selectedCells, setSelectedCells] = useState<
    { day: string; court: string }[]
  >([]);

  const [prices, setPrices] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const selectedDayDate = selectedCell ? new Date(selectedCell.day) : null;
  const formattedSelectedDay = selectedDayDate
    ? selectedDayDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Store fetched min-max prices for week
  const [fetchedPrices, setFetchedPrices] = useState<
    Record<string, Record<string, { minPrice: number; maxPrice: number }>>
  >({});

  const fetchPricesForWeek = async (weekDays: Date[], courts: Court[]) => {
    // Simulate GET API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Dummy data generation: For demo, random min and max prices or same price
    const data: Record<
      string,
      Record<string, { minPrice: number; maxPrice: number }>
    > = {};

    weekDays.forEach((day) => {
      const dayKey = formatDateForInput(day);
      data[dayKey] = {};
      courts.forEach((court) => {
        // Randomly decide if minPrice === maxPrice or different
        const basePrice = Math.floor(Math.random() * 500) + 100; // 100 to 600
        const isRange = Math.random() < 0.3; // 30% chance to be range
        data[dayKey][court.courtId] = isRange
          ? {
              minPrice: basePrice,
              maxPrice: basePrice + Math.floor(Math.random() * 300),
            }
          : { minPrice: basePrice, maxPrice: basePrice };
      });
    });

    return data;
  };

  useEffect(() => {
    setWeekStart(getWeekStart(selectedDate));
    setSelectedCell(null);
  }, [selectedDate]);

  useEffect(() => {
    if (courtId.length === 0) return;

    fetchPricesForWeek(days, courtId).then((data) => {
      setFetchedPrices(data);
    });
  }, [courtId, weekStart]);

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

  useEffect(() => {
    fetchCourtIDs();
  }, []);

  const handlePrevWeek = () => {
    const newDate = addDays(weekStart, -7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addDays(weekStart, 7);
    setSelectedDate(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  const handleCellClick = (day: string, court: string) => {
    setSelectedCells((prev) => {
      const exists = prev.find(
        (cell) => cell.day === day && cell.court === court
      );
      if (exists) {
        // Deselect cell
        return prev.filter(
          (cell) => !(cell.day === day && cell.court === court)
        );
      } else {
        // Add cell to selection
        return [...prev, { day, court }];
      }
    });
  };

  const handleInputChange = (day: string, court: string, value: string) => {
    // Allow only numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(value)) return;

    setPrices((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [court]: value,
      },
    }));
  };

  const handleSave = () => {
    const priceData = Object.entries(prices).flatMap(([date, courtPrices]) =>
      Object.entries(courtPrices).map(([courtId, price]) => ({
        date,
        courtId,
        courtName: resolvedNames[courtId] || courtId,
        price: parseFloat(price) || 0,
      }))
    );

    console.log("Saving prices:", priceData);
    alert("Prices saved! Check console for details.");
  };
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar - Fixed */}
      <TopBar />
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm shrink-0">
        <button
          onClick={handlePrevWeek}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          ← Prev
        </button>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold">
            {formatWeekLabel(weekStart)}
          </span>
          <input
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={handleDateChange}
            className="px-2 py-1 border border-gray-300 rounded text-xs"
          />
        </div>
        <button
          onClick={handleNextWeek}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next →
        </button>
      </div>

      {/* Main Content Area - Flexible */}
      <div className="flex flex-1 overflow-hidden ">
        {/* Left Sidebar - Court Names */}
        {/* Left Sidebar - Synchronized with grid vertical scroll */}
        <div
          ref={sidebarScrollRef}
          className="flex flex-col w-24 shrink-0 bg-white overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="h-10 shrink-0" />
          {courtId.map((court) => (
            <div
              key={court.courtId}
              className="h-10 flex items-center justify-center border border-gray-200 text-xs text-center shrink-0"
            >
              {resolvedNames[court.courtId] ?? court.name}
            </div>
          ))}
        </div>
        {/* Grid Section - Scrollable */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Day Headers */}
          <div className="shrink-0 bg-white rounded-t-md shadow-sm mb-1">
            <div
              className="grid gap-x-1"
              style={{
                gridTemplateColumns: `repeat(7, minmax(5rem, 1fr))`,
              }}
            >
              {days.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className="min-w-0 h-10 flex flex-col items-center justify-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 rounded-md"
                  style={{ userSelect: "none" }}
                  onClick={() => {
                    navigate(`/pricingCalendarDaily`);
                  }}
                >
                  <div>{dayNames[index]}</div>
                  <div>{day.getDate()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Content - Scrollable */}
          <div
            className="flex-1 overflow-auto"
            ref={gridScrollRef}
            onScroll={() => {
              if (sidebarScrollRef.current && gridScrollRef.current) {
                sidebarScrollRef.current.scrollTop =
                  gridScrollRef.current.scrollTop;
              }
            }}
          >
            <div
              className="grid border border-gray-200 rounded-b-md bg-green-500 "
              style={{
                gridTemplateColumns: `repeat(7, minmax(5rem, 1fr))`,
              }}
            >
              {courtId.map((court) =>
                days.map((day) => {
                  const dayKey = formatDateForInput(day);
                  // Check if user has edited price for this cell
                  const editedPrice = prices[dayKey]?.[court.courtId];

                  // Check fetched min-max price
                  const fetchedPrice = fetchedPrices[dayKey]?.[court.courtId];

                  // Determine display value
                  let displayValue = "";
                  if (editedPrice !== undefined) {
                    displayValue = editedPrice;
                  } else if (fetchedPrice) {
                    if (fetchedPrice.minPrice === fetchedPrice.maxPrice) {
                      displayValue = fetchedPrice.minPrice.toString();
                    } else {
                      displayValue = `${fetchedPrice.minPrice} - ${fetchedPrice.maxPrice}`;
                    }
                  }

                  const isSelected = selectedCells.some(
                    (cell) =>
                      cell.day === dayKey && cell.court === court.courtId
                  );

                  return (
                    <div
                      key={`${court.courtId}-${dayKey}`}
                      className={`min-w-0 h-10 flex items-center px-3 cursor-pointer rounded-md transition-colors duration-200 ${
                        isSelected
                          ? "bg-blue-100 ring-2 ring-blue-500 shadow-sm"
                          : "bg-white hover:bg-green-50 border border-gray-300"
                      }`}
                      onClick={() => handleCellClick(dayKey, court.courtId)}
                    >
                      <span className="text-green-600 mr-1 text-sm font-semibold">
                        ₹
                      </span>

                      {isSelected ? (
                        <input
                          type="text"
                          value={editedPrice ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              dayKey,
                              court.courtId,
                              e.target.value
                            )
                          }
                          className="w-full h-full outline-none bg-transparent text-sm font-medium text-green-800 caret-green-600"
                          autoFocus
                          placeholder="0"
                        />
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            fetchedPrice ? "text-gray-800" : "text-gray-400"
                          }`}
                        >
                          {displayValue || ""}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Fixed */}
      <div className="w-full bg-white px-6 py-3 shadow-md flex items-center justify-between shrink-0 text-sm">
        <div className="min-w-[200px]">
          <strong>Court:</strong>{" "}
          {selectedCell && selectedCell.court
            ? resolvedNames[selectedCell.court] || selectedCell.court
            : "N/A"}
          <br />
          <strong>Day:</strong> {formattedSelectedDay || "N/A"}
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
