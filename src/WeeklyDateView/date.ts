export const getWeekRange = (date: Date) => {
  // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();

  // Calculate difference from Sunday (start of the week)
  const diffToStart = date.getDate() - dayOfWeek;

  // Start of the week (Sunday)
  const startOfWeek = new Date(date);
  startOfWeek.setDate(diffToStart);
  startOfWeek.setHours(0, 0, 0, 0);

  // // End of the week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek , dayOfWeek};
};

export function convertUnixToLocalDateString(unixTimestamp: number) {
  const date = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}



export const getArrayOfDatesFromSundayToSaturday = (date :  Date) => {
	const { startOfWeek, endOfWeek } = getWeekRange(date);
	const datesArray = [];
	while (startOfWeek <= endOfWeek) {
		const yyyy = startOfWeek.getFullYear();
		const mm = String(startOfWeek.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
		const dd = String(startOfWeek.getDate()).padStart(2, "0");
		datesArray.push(`${yyyy}-${mm}-${dd}`);
		// Move to next day
		startOfWeek.setDate(startOfWeek.getDate() + 1);
	}
	return datesArray;
};

export const TodaysDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate();

  return day;
}


export const  getFormattedDateTime = (start: Date, end: Date) =>  {
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const dateStr = `${ordinal(start.getDate())} ${start.toLocaleString('default', { month: 'short' })}, ${start.toLocaleString('default', { weekday: 'long' })}`;
  const timeStr = `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;

  return { dateStr, timeStr };
}

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);

  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  return `${day}, ${month} ${year}`;
};

export const formatDateForB = (dateStr: Date) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const isToday = (inputDate: Date): boolean => {
  const today = new Date();

  return (
    inputDate.getDate() === today.getDate() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getFullYear() === today.getFullYear()
  );
};

export const getDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.getDate();
};

export function getDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];

  while (start <= end) {
    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, "0");
    const dd = String(start.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);

    // Move to next day
    start.setDate(start.getDate() + 1);
  }

  return dates;
}

export function convertUnixToLocalTime(st_ist:any) {
  const utcDate = new Date(st_ist);

// Convert to IST (UTC+5:30)
const istOffset = 5.5 * 60; // in minutes
const istTime = new Date(utcDate.getTime() + istOffset * 60 * 1000);

// Format as HH:MM
const hours = istTime.getHours().toString().padStart(2, '0');
const minutes = istTime.getMinutes().toString().padStart(2, '0');
console.log(`${hours}:${minutes}`);
  return `${hours}:${minutes}`
}

