import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// DateSelector Component (inline)
function DateSelector({
  date,
  day,
  monthYear,
  onPrev,
  onNext,
}: {
  date: string;
  day: string;
  monthYear: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onPrev} className="text-gray-600 hover:text-black">
        <ChevronLeft size={40} />
      </button>
      <div className="text-center">
        <div className="text-xl font-bold">{date}</div>
        <div className="text-sm font-bold text-gray-600">
          {day}, {monthYear}
        </div>
      </div>
      <button onClick={onNext} className="text-gray-600 hover:text-black">
        <ChevronRight size={40} />
      </button>
    </div>
  );
}

// Main GridPage Component
export default function GridPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    console.log("Date changed:", selectedDate.toDateString());
    // In future: fetch grid data based on selectedDate
  }, [selectedDate]);

  const goPrev = () => {
    setSelectedDate((prev) => new Date(prev.getTime() - 86400000)); // -1 day
  };

  const goNext = () => {
    setSelectedDate((prev) => new Date(prev.getTime() + 86400000)); // +1 day
  };

  const { day, date, monthYear } = formatDateParts(selectedDate);

  return (
    <div className="flex justify-center py-4">
      <DateSelector
        date={date}
        day={day}
        monthYear={monthYear}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

// Utility function to format date parts
function formatDateParts(date: Date) {
  const day = date.toLocaleDateString("en-US", { weekday: "short" });
  const dateNum = date.getDate().toString().padStart(2, "0");
  const monthYear = date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return { day, date: dateNum, monthYear };
}
