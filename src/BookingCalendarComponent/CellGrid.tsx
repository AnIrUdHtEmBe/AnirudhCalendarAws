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

const toIST = (utc: string) => {
  const date = new Date(utc);
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
};

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
        if (row !== undefined && col !== undefined && onDropAction) {
          onDropAction([fromRow, fromCol], [row, col]);
        }
      }}
    />
  );
};

const CellGrid = () => {
  const [courtId, setCourtId] = useState<Court[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
  
  // 24 hours with 30-minute slots = 48 columns
  const cols = 48;
  const rows = courtId.length;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Record<string, { start: Date; end: Date }[]>>({});
  const [grid, setGrid] = useState<CellState[][]>(
    Array.from({ length: rows }, () => Array(cols).fill("available"))
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

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
    
    return `${formatHourShort(hour)}:${minute} - ${formatHourShort(nextHour)}:${nextMinute}`;
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
  const updateGridWithBookings = (courtsData: Court[], bookingsData: Record<string, { start: Date; end: Date }[]>, date: Date) => {
    const newGrid: CellState[][] = Array.from({ length: courtsData.length }, () =>
      Array(cols).fill("available")
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
            console.error(`Failed to fetch bookings for court ${court.courtId}:`, error);
            newBookings[court.courtId] = [];
          }
        })
      );
      console.log(newBookings,"newBooking");
      
      // Update both bookings state and grid immediately
      setBookings(newBookings);
      updateGridWithBookings(courtId, newBookings, date);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoadingBookings(false);
    }
  };
console.log(bookings,"Bookings!!!!!");

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
    setGrid(Array.from({ length: courtId.length }, () => Array(cols).fill("available")));
  }, [courtId.length]);

  const updateCell = (row: number, col: number) => {
    setGrid((prev) => {
      const newG = prev.map((r) => [...r]);
      const curr = newG[row][col];

      if (curr === "available" || curr === "selected") {
        if (selected) {
          const [pr, pc] = selected;
          if (newG[pr][pc] === "selected") {
            newG[pr][pc] = "available";
          }
        }
        newG[row][col] = curr === "available" ? "selected" : "available";
        setSelected(curr === "available" ? [row, col] : null);
      } else {
        setSelected([row, col]);
      }

      return newG;
    });
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

  const applyAction = (action: CellState) => {
    if (!selected) return;
    const [r, c] = selected;
    setGrid((prev) => {
      const newG = prev.map((r) => [...r]);
      newG[r][c] = action;
      return newG;
    });
    setSelected(null);
  };

  const gridScrollRef = useRef<HTMLDivElement>(null);

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
        <span className="text-sm font-semibold">
          {currentDate.toLocaleDateString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          {isLoadingBookings && <span className="ml-2 text-blue-500">Loading...</span>}
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
          <div className="h-10 shrink-0" />
          <div 
            className="flex flex-col overflow-y-auto overflow-x-hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {courtId.map((court) => (
              <div
                key={court.courtId}
                className="h-10 flex items-center justify-center border border-gray-200 text-sm text-center px-1 shrink-0"
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
            className="shrink-0 overflow-x-auto overflow-y-hidden"
            ref={(el) => {
              if (el && gridScrollRef.current) {
                el.scrollLeft = gridScrollRef.current.scrollLeft;
              }
            }}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div
              className="grid border border-gray-300 rounded-t-md bg-white"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(4rem, 1fr))`,
              }}
            >
              {timeLabels.map((label, i) => (
                <div
                  key={`header-${i}`}
                  className="min-w-0 h-10 flex items-center justify-center text-xs font-semibold text-timeSlot whitespace-nowrap px-1"
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
              const timeHeaderEl = target.parentElement?.querySelector('.shrink-0') as HTMLElement;
              if (timeHeaderEl) {
                timeHeaderEl.scrollLeft = target.scrollLeft;
              }
              
              // Sync vertical scroll with left sidebar
              const leftSidebarEl = target.parentElement?.parentElement?.querySelector('.flex.flex-col.overflow-y-auto') as HTMLElement;
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
          {selected ? (
            <div className="space-y-2">
              <p>
                <strong>Court Id:</strong>{" "}
                {courtId[selected[0]]?.courtId ?? "Unknown"} |{" "}
                <strong>Time:</strong> {timeLabels[selected[1]]}
              </p>
              <p>
                <strong>Host:</strong> anirudh | <strong>Booked On:</strong>{" "}
                03-Jul-2025
              </p>
              <p>
                <strong>Game:</strong> Tennis | <strong>Mode:</strong> Singles
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No cell selected</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {selected && (
            <span className="text-sm text-timeSlot">
              <strong>Status:</strong> {grid[selected[0]][selected[1]]}
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            {selected &&
              ["available", "selected"].includes(
                grid[selected[0]][selected[1]]
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
            {selected && (
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded"
                onClick={() => applyAction("available")}
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