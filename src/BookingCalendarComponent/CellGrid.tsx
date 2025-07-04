import { useEffect, useState } from "react";
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
  const rows = 16;
  const cols = 16;

  const [courtId, setCourtId] = useState<Court[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {}
  );
  const [currentDate, setCurrentDate] = useState(new Date("2025-07-17"));
  const [bookings, setBookings] = useState<
    Record<string, { start: Date; end: Date }[]>
  >({});
  const [grid, setGrid] = useState<CellState[][]>(
    Array.from({ length: rows }, () => Array(cols).fill("available"))
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);

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


  
  
  const fetchBookings = async (date: Date) => {
  const dateStr = date.toISOString().split("T")[0];
  const newBookings: typeof bookings = {};
    
  await Promise.all(
    courtId.map(async (court) => {
      const res = await axios.get(
        `https://play-os-backend.forgehub.in/court/${court.courtId}/bookings?date=${dateStr}`
      );

      if (
        res?.data &&
        Array.isArray(res.data.bookings)
      ) {
        const bookingArray = res.data.bookings;
        console.log(bookingArray[0].startTime, "bookingArray");

        newBookings[court.courtId] = bookingArray.map((b: any) => ({
          start: toIST(b.startTime),
          end: toIST(b.endTime),
        }));

        console.log(toIST("2025-07-17T03:00:00"), "ist start");
        console.log(newBookings, "newBookings!!!");
      } else {
        console.log(`Invalid response for court ${court.courtId}`);
        newBookings[court.courtId] = [];
      }
    })
  );
  

  console.log(newBookings, "bookings!!!");
  setBookings(newBookings);
  


  console.log("New bookings set:", newBookings ,"After set");

};


  useEffect(() => {
  // Replace courtId with one dummy court if empty
  if (courtId.length === 0) {
    setCourtId([{ courtId: "COUR_DYCI97", name: "Court A" }]);
    setResolvedNames({ COURT_1: "COUR_DYCI97" });
  }

  const testBookings: Record<string, { start: Date; end: Date }[]> = {
    COUR_DYCI97: [
      {
        start: new Date("2025-07-17T03:00:00Z"), // 08:30 IST
        end: new Date("2025-07-17T04:00:00Z"),   // 09:30 IST
      },
    ],
  };

  setBookings(testBookings);
}, [currentDate]);




  
  useEffect(() => {
    if (courtId.length > 0) {
      fetchBookings(currentDate);
    }
  }, [courtId, currentDate]);




  useEffect(() => {
    if (Object.keys(bookings).length === 0) {
    console.log("Bookings empty, skipping grid update");
    
  }
  console.log("Running grid update with bookings:", bookings);
  const newGrid: CellState[][] = Array.from({ length: rows }, () =>
    Array(cols).fill("available")
  );

  for (let r = 0; r < courtId.length; r++) {
    const court = courtId[r];
    console.log(courtId[r],"value of court id new");
    
    const courtBookings = bookings[court.courtId];
    if (!courtBookings) {
      console.warn(`No bookings found for court ${court.courtId}`);
      continue;
    }
    console.log(`Bookings for court ${court.courtId}:`, courtBookings);

    for (const booking of courtBookings) {
      const startTime = booking.start.getTime();
      const endTime = booking.end.getTime();

      for (let i = 0; i < timeLabels.length; i++) {
        const [startStr] = timeLabels[i].split(" - ");
        const [hour, minute] = startStr.split(":").map(Number);

        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, minute, 0, 0);
        const slotStartMillis = slotTime.getTime();
        const slotEndMillis = slotStartMillis + 30 * 60 * 1000;

        if (slotStartMillis < endTime && slotEndMillis > startTime) {
          newGrid[r][i] = "occupied";
        }
      }
    }
  }

  setGrid(newGrid);
}, [bookings, courtId, currentDate]);






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

  const timeLabels = Array.from({ length: cols }, (_, i) => {
    const hour = 6 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const endHour = 6 + Math.floor((i + 1) / 2);
    const endMinute = (i + 1) % 2 === 0 ? "00" : "30";
    return `${hour}:${minute} - ${endHour}:${endMinute}`;
  });

  return (
    <div >
      {/* Top Nav */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm">
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

      <div className="flex flex-col flex-1 w-full h-full  min-h-[600px]">
        {/* Grid Section */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col w-24 shrink-0 bg-white">
            <div className="h-10" />
            {courtId.map((court) => (
              <div
                key={court.courtId}
                className="h-10 flex items-center justify-center border border-gray-200 text-sm text-center px-1"
              >
                {resolvedNames[court.courtId] ?? court.name}
              </div>
            ))}
          </div>

          <div className="flex flex-col flex-1 overflow-x-auto">
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

            <div
              className="grid flex-1 border border-gray-200 rounded-b-md"
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

        {/* Bottom Bar */}
        <div className="w-full bg-white px-6 py-3 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
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
    </div>
  );
};

export default CellGrid;
