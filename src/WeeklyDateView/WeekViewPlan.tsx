import { getDate, TodaysDate } from "./date";
import "./week-plan-view.css";

interface WeekPlanViewProps {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  weekStartToEndDates: string[];
  onDateChange?: (newDate: Date) => void; // Added optional prop to update currentDate in parent
}

const WeekPlanView = (props: WeekPlanViewProps) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Added for day names

  const handleClick = (index: number, dateStr: string) => {
    props.setActiveIndex(index);
    const newDate = new Date(dateStr);
    if (!isNaN(newDate.getTime()) && props.onDateChange) {
      props.onDateChange(newDate); // Call parent to update currentDate
    }
  };

  return (
    <div className="week-plan-view-container">
      {props.weekStartToEndDates.map((dateStr, i) => {
        const date = new Date(dateStr);
        const isValid = !isNaN(date.getTime());
        const dayName = isValid ? daysOfWeek[date.getDay()] : ''; // Get day name if valid
        const formattedDate = isValid ? TodaysDate(dateStr) : ''; // Use TodaysDate for date part

        return (
          <div
            key={i}
            style={{
              backgroundColor: props.activeIndex === i ? "lightblue" : "white",
            }}
            className="--plan"
            onClick={() => handleClick(i, dateStr)}
          >
            <span className="--day">{dayName}</span> {/* Added span for day name */}
            <span className="--date">{formattedDate}</span>
          </div>
        );
      })}
    </div>
  );
};

export default WeekPlanView;