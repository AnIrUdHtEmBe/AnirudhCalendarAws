import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import axios from "axios";

export type CellState = "available" | "occupied" | "blocked" | "selected";

interface CellProps {
  row?: number;
  col?: number;
  state?: CellState;
  label?: string;
  onClick?: (row: number, col: number) => void;
  onDropAction?: (from: [number, number], to: [number, number]) => void;
}

type Court = { courtId: string; name: string };

type Booking = {
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

const Cell = ({ row, col, state, label, onClick, onDropAction }: CellProps) => {
  const colorMap: Record<CellState, string> = {
    available: "bg-gray-300",
    occupied: "bg-green-500",
    blocked: "bg-red-500",
    selected: "bg-blue-500",
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

  return (
    <div
      className={clsx(
        "min-w-[4rem] flex-1 h-10 border border-white rounded-md cursor-pointer transition-colors",
        state && colorMap[state]
      )}
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
        if (row !== undefined && col !== undefined && onDropAction && state === "available") {
          onDropAction([fromRow, fromCol], [row, col]);
        }
      }}
    />
  );
};

const CellGrid = () => {
  const [courtId, setCourtId] = useState<Court[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {}
  );

  // 24 hours with 30-minute slots = 48 columns
  const cols = 48;
  const rows = courtId.length;

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

  // Generate time labels for 24 hours (12 AM to 12 AM)
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

  // Updated grid generation function
  const updateGridWithBookings = (
    courtsData: Court[],
    bookingsData: Record<string, { start: Date; end: Date }[]>,
    date: Date
  ) => {
    const newGrid: CellState[][] = Array.from(
      { length: courtsData.length },
      () => Array(cols).fill("available")
    );

    for (let r = 0; r < courtsData.length; r++) {
      const court = courtsData[r];
      const courtBookings = bookingsData[court.courtId];

      if (courtBookings && courtBookings.length > 0) {
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

            if (slotStartMillis < endTime && slotEndMillis > startTime) {
              newGrid[r][i] = "occupied";
            }
          }
        }
      }
    }

    setGrid(newGrid);
  };

  const fetchBookings = async (date: Date) => {
    if (courtId.length === 0) return;

    setIsLoadingBookings(true);
    const dateStr = date.toISOString().split("T")[0];
    const newBookings: Record<string, { start: Date; end: Date }[]> = {};

    try {
      await Promise.all(
        courtId.map(async (court) => {
          try {
            const res = await axios.get(
              `https://play-os-backend.forgehub.in/court/${court.courtId}/bookings?date=${dateStr}`
            );
            console.log(res.data, "Res data!!");

            if (res?.data && Array.isArray(res.data.bookings)) {
              const bookingArray = res.data.bookings;
              newBookings[court.courtId] = bookingArray.map((b: any) => ({
                start: toIST(b.startTime),
                end: toIST(b.endTime),
              }));
            } else {
              newBookings[court.courtId] = [];
            }
          } catch (error) {
            console.error(
              `Failed to fetch bookings for court ${court.courtId}:`,
              error
            );
            newBookings[court.courtId] = [];
          }
        })
      );
      console.log(newBookings, "newBooking");

      // Update both bookings state and grid immediately
      setBookings(newBookings);
      updateGridWithBookings(courtId, newBookings, date);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoadingBookings(false);
    }
  };
  console.log(bookings, "Bookings!!!!!");

  // Fetch bookings when courts or date changes
  useEffect(() => {
    if (courtId.length > 0) {
      fetchBookings(currentDate);
    }
  }, [courtId, currentDate]);

  // Update grid when bookings change (backup for state updates)
  useEffect(() => {
    if (courtId.length > 0 && Object.keys(bookings).length > 0) {
      updateGridWithBookings(courtId, bookings, currentDate);
    }
  }, [bookings, courtId, currentDate]);

  // Update grid size when courts change
  useEffect(() => {
    setGrid(
      Array.from({ length: courtId.length }, () =>
        Array(cols).fill("available")
      )
    );
  }, [courtId.length]);

  // New function to fetch cell details when a cell is selected
  const fetchCellDetails = async (row: number, col: number) => {
    if (courtId.length === 0) return;

    setIsLoadingCellDetails(true);
    const court = courtId[row];
    const dateStr = currentDate.toISOString().split("T")[0];

    try {
      // Fetch court details and bookings
      const res = await axios.get(
        `https://play-os-backend.forgehub.in/court/${court.courtId}/bookings?date=${dateStr}`
      );

      if (res?.data) {
        const courtDetails = res.data.courtDetails;
        const bookingArray = res.data.bookings || [];

        // Find current booking for this time slot
        const hour = Math.floor(col / 2);
        const minute = col % 2 === 0 ? 0 : 30;
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, minute, 0, 0);
        const slotStartMillis = slotTime.getTime();
        const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

        const currentBooking = bookingArray.find((booking: Booking) => {
          const startTime = toIST(booking.startTime).getTime();
          const endTime = toIST(booking.endTime).getTime();
          return slotStartMillis < endTime && slotEndMillis > startTime;
        });

        let gameName = "";
        let availableSports: Sport[] = [];

        // If there's a current booking, get the sport name
        if (currentBooking) {
          try {
            const sportRes = await axios.get(
              `https://play-os-backend.forgehub.in/sports/id/${currentBooking.sportId}`
            );
            gameName = sportRes.data.name;
          } catch (error) {
            console.error("Failed to fetch sport details:", error);
            gameName = "Unknown";
          }
        }

        // If cell is available, fetch available sports
        if (grid[row][col] === "available" || grid[row][col] === "selected") {
          try {
            const sportsPromises = courtDetails.allowedSports.map(
              async (sportId: string) => {
                try {
                  const sportRes = await axios.get(
                    `https://play-os-backend.forgehub.in/sports/id/${sportId}`
                  );
                  return sportRes.data;
                } catch (error) {
                  console.error(`Failed to fetch sport ${sportId}:`, error);
                  return null;
                }
              }
            );

            const sportsData = await Promise.all(sportsPromises);
            availableSports = sportsData.filter((sport) => sport !== null);
          } catch (error) {
            console.error("Failed to fetch available sports:", error);
          }
        }

        setSelectedCellDetails({
          courtDetails,
          bookings: bookingArray,
          gameName,
          availableSports,
          currentBooking,
        });
      }
    } catch (error) {
      console.error("Failed to fetch cell details:", error);
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
  };

  // Update updateCell to allow multiple selection toggling
  const updateCell = (row: number, col: number) => {
    setGrid((prev) => {
      const newG = prev.map((r) => [...r]);
      const curr = newG[row][col];

      if (curr === "available" || curr === "selected") {
        // Toggle selection of this cell
        setSelected((prevSelected) => {
          const exists = prevSelected.some(([r, c]) => r === row && c === col);
          if (exists) {
            // Deselect cell
            return prevSelected.filter(([r, c]) => !(r === row && c === col));
          } else {
            // Select cell (add)
            return [...prevSelected, [row, col]];
          }
        });

        // Toggle cell state between selected and available
        newG[row][col] = curr === "available" ? "selected" : "available";
      } else {
  // For occupied or blocked cells, toggle selection (single selection)
  setSelected((prevSelected) => {
    const exists = prevSelected.some(([r, c]) => r === row && c === col);
    if (exists) {
      // Deselect the cell if already selected
      return prevSelected.filter(([r, c]) => !(r === row && c === col));
    } else {
      // Select only this cell (deselect others)
      return [[row, col]];
    }
  });
}

      return newG;
    });

    // Fetch cell details for the clicked cell (last clicked)
    fetchCellDetails(row, col);
  };

  const handleDrop = (
    [fr, fc]: [number, number],
    [tr, tc]: [number, number]
  ) => {
    setGrid((prev) => {
      const newG = prev.map((r) => [...r]);
      const val = newG[fr][fc];
      if (val === "occupied" || val === "blocked") {
        newG[fr][fc] = "available";
        newG[tr][tc] = val;
      }
      return newG;
    });
  };

  // Modify applyAction to handle multiple selected cells for booking
  const applyAction = async (action: CellState) => {
    if (selected.length === 0) return;

    if (action === "occupied") {
      if (!selectedSportId) {
        alert("Please select a sport first");
        return;
      }

      // For multi-cell booking, we assume consecutive cells in the same row
      // Validate that all selected cells are in the same row and consecutive columns
      const rowsSet = new Set(selected.map(([r]) => r));
      if (rowsSet.size > 1) {
        alert("Please select cells in the same court (row) for booking.");
        return;
      }

      const [row] = selected[0];
      const colsSelected = selected.map(([_, c]) => c).sort((a, b) => a - b);

      // Check if columns are consecutive
      for (let i = 1; i < colsSelected.length; i++) {
        if (colsSelected[i] !== colsSelected[i - 1] + 1) {
          alert("Please select consecutive time slots for booking.");
          return;
        }
      }

      // Calculate startTime from first selected cell
      const firstCol = colsSelected[0];
      const hour = Math.floor(firstCol / 2);
      const minute = firstCol % 2 === 0 ? 0 : 30;
      const startTime = new Date(currentDate);
      startTime.setHours(hour, minute, 0, 0);

      // Calculate endTime from last selected cell + 30 minutes
      const lastCol = colsSelected[colsSelected.length - 1];
      const endHour = Math.floor(lastCol / 2);
      const endMinute = lastCol % 2 === 0 ? 0 : 30;
      const endTime = new Date(currentDate);
      endTime.setHours(endHour, endMinute, 0, 0);
      // Add 30 minutes to endTime slot
      // endTime.setTime(endTime.getTime() + 30 * 60 * 1000);

      const bookingData = {
        hostId: "USER_HZSU81",
        sport: selectedCellDetails.availableSports.find(
          (s) => s.sportId === selectedSportId
        )?.name,
        sportId: selectedSportId,
        courtId: courtId[row].courtId,
        startTime: toLocalISOString(startTime),
        endTime: toLocalISOString(endTime),
        bookedBy: "USER_HZSU81",
        difficultyLevel: "Beginner",
        maxPlayers: 5,
        priceType: "",
        rackPrice: 0,
        quotePrice: 0,
      };
      console.log("Booking Data payload", bookingData);

      try {
        const response = await axios.post(
          "https://play-os-backend.forgehub.in/game/create",
          bookingData
        );
        console.log("Booking created:", response.data);

        // Refresh bookings after successful creation
        await fetchBookings(currentDate);

        // Clear selection and reset sport
        setSelected([]);
        setSelectedSportId("");
      } catch (error) {
        console.error("Failed to create booking:", error);
        alert("Failed to create booking. Please try again.");
      }
    } else {
      // For other actions (block, etc.) apply to all selected cells
      setGrid((prev) => {
        const newG = prev.map((r) => [...r]);
        selected.forEach(([r, c]) => {
          newG[r][c] = action;
        });
        return newG;
      });
      setSelected([]);
      setSelectedSportId("");
    }
  };

  // Modify cancelBooking to cancel bookings for all selected cells with bookings
  const cancelBooking = async () => {
    if (selected.length === 0) return;

    // Collect unique bookingIds from selected cells that have currentBooking
    // Since your currentCellDetails only holds one booking, we need to fetch bookingId for each selected cell
    // For simplicity, cancel only if all selected cells share the same bookingId (common scenario)
    const bookingIds = new Set<string>();

    for (const [r, c] of selected) {
      // Fetch booking for each cell (reuse your existing logic)
      const court = courtId[r];
      const dateStr = currentDate.toISOString().split("T")[0];
      try {
        const res = await axios.get(
          `https://play-os-backend.forgehub.in/court/${court.courtId}/bookings?date=${dateStr}`
        );
        const bookingArray = res.data.bookings || [];
        console.log("cancel bookingArray",res.data);
        
        const hour = Math.floor(c / 2);
        const minute = c % 2 === 0 ? 0 : 30;
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, minute, 0, 0);
        const slotStartMillis = slotTime.getTime();
        const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

        const currentBooking = bookingArray.find((booking: Booking) => {
          const startTime = toIST(booking.startTime).getTime();
          const endTime = toIST(booking.endTime).getTime();
          return slotStartMillis < endTime && slotEndMillis > startTime;
        });
        console.log("cancel current booking",currentBooking);
        
        if (currentBooking) {
          bookingIds.add(currentBooking.bookingId);
        }
      } catch (error) {
        console.error("Failed to fetch booking for cancellation:", error);
      }
    }

    if (bookingIds.size === 0) {
      alert("No bookings found to cancel for selected cells.");
      return;
    }

    if (bookingIds.size > 1) {
      alert(
        "Multiple different bookings selected. Please cancel one booking at a time."
      );
      return;
    }

    const bookingId = Array.from(bookingIds)[0];
    console.log("cancel booking ids",bookingIds);
    
    try {
      await axios.delete(
        `https://play-os-backend.forgehub.in/booking/${bookingId}`
      );
      console.log("Booking cancelled:", bookingId);

      // Refresh bookings after cancellation
      await fetchBookings(currentDate);

      // Clear selection
      setSelected([]);
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Helper for UI: get first selected cell or null
  const firstSelected = selected.length > 0 ? selected[0] : null;

  return (
    <div className="flex flex-col h-screen">
      {/* Top Nav - Fixed */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm shrink-0">
        <button
          onClick={() =>
            setCurrentDate(
              (prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000)
            )
          }
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
        <button
          onClick={() =>
            setCurrentDate(
              (prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000)
            )
          }
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next →
        </button>
      </div>

      {/* Main Content Area - Flexible */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Synchronized with grid vertical scroll */}
        <div className="flex flex-col w-24 shrink-0 bg-white">
          <div className="h-10 shrink-0"/>
          <div
            className="flex flex-col overflow-y-auto overflow-x-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {courtId.map((court) => (
              <div
                key={court.courtId}
                className="h-10 flex items-center  justify-center border border-gray-200 text-xs text-center shrink-0"
              >
                {resolvedNames[court.courtId] ?? court.name}
              </div>
            ))}
          </div>
        </div>

        {/* Grid Section - Scrollable */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Time Headers - Synchronized with grid horizontal scroll */}
          <div
  className="shrink-0 overflow-x-auto overflow-y-hidden relative"
  ref={(el) => {
    if (el && gridScrollRef.current) {
      el.scrollLeft = gridScrollRef.current.scrollLeft;
    }
  }}
  style={{ scrollbarWidth: "none", msOverflowStyle: "none", background: "white" }}
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
    }}
  >
    {timeLabels.map((label, i) => (
      <div
        key={`header-${i}`}
        className="min-w-0 h-10 flex items-center justify-center text-xs font-semibold text-timeSlot whitespace-nowrap"
        style={{ userSelect: "none" }}
      >
        {label}
      </div>
    ))}
  </div>
</div>


          {/* Grid Content - Scrollable */}
          <div
            className="flex-1 overflow-auto"
            ref={gridScrollRef}
            onScroll={(e) => {
              const target = e.target as HTMLElement;

              // Sync horizontal scroll with time headers
              const timeHeaderEl = target.parentElement?.querySelector(
                ".shrink-0"
              ) as HTMLElement;
              if (timeHeaderEl) {
                timeHeaderEl.scrollLeft = target.scrollLeft;
              }

              // Sync vertical scroll with left sidebar
              const leftSidebarEl =
                target.parentElement?.parentElement?.querySelector(
                  ".flex.flex-col.overflow-y-auto"
                ) as HTMLElement;
              if (leftSidebarEl) {
                leftSidebarEl.scrollTop = target.scrollTop;
              }
            }}
          >
            <div
              className="grid border border-gray-200 rounded-b-md"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(4rem, 1fr))`,
              }}
            >
              {grid.map((row, rIdx) =>
                row.map((cell, cIdx) => (
                  <Cell
                    key={`${rIdx}-${cIdx}`}
                    row={rIdx}
                    col={cIdx}
                    state={cell}
                    onClick={updateCell}
                    onDropAction={handleDrop}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Fixed */}
      <div className="w-full bg-white px-6 py-3 shadow-md flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="text-sm flex-1">
          {firstSelected ? (
            <div className="space-y-2">
              <p>
                <strong>Court Id:</strong>{" "}
                {courtId[firstSelected[0]]?.courtId ?? "Unknown"} |{" "}
                <strong>Time:</strong> {timeLabels[firstSelected[1]]}
              </p>
              <p>
                <strong>Host:</strong> anirudh | <strong>Booked On:</strong>{" "}
                {Date()}
              </p>
              <p>
                <strong>Game:</strong> {selectedCellDetails.gameName || "N/A"} |{" "}
                <strong>Mode:</strong> Singles
              </p>
              {isLoadingCellDetails && (
                <p className="text-blue-500">Loading details...</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No cell selected</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {firstSelected && (
            <span className="text-sm text-timeSlot">
              <strong>Status:</strong>{" "}
              {grid[firstSelected[0]][firstSelected[1]]}
            </span>
          )}

          {/* Sport selection dropdown for available cells */}
          {firstSelected &&
            ["available", "selected"].includes(
              grid[firstSelected[0]][firstSelected[1]]
            ) &&
            selectedCellDetails.availableSports.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Sport:</label>
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

          <div className="flex flex-wrap gap-2">
            {firstSelected &&
              ["available", "selected"].includes(
                grid[firstSelected[0]][firstSelected[1]]
              ) && (
                <>
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded"
                    onClick={() => applyAction("occupied")}
                  >
                    Occupy
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
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded"
                onClick={() => {
                  if (
                    ["occupied", "blocked"].includes(
                      grid[firstSelected[0]][firstSelected[1]]
                    ) &&
                    selectedCellDetails.currentBooking
                  ) {
                    cancelBooking();
                  } else {
                    applyAction("available");
                  }
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CellGrid;
