import BackButton from "./BackButton";
// import DateSelector from "./DateSelector";
import LegendBoxes from "./LegendBoxes";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { label: "All", path: "/bookingCalendar" },
  { label: "Fitness", path: "/bookingCalendar" },
  { label: "Wellness", path: "/bookingCalendar" },
  { label: "Sports", path: "/bookingCalendar" },
  { label: "Nutrition", path: "/nutrition" },
  { label: "Attendance", path: "/attendance" }, // fixed spelling
];

function TabSwitch() {
  const navigate = useNavigate();
  const location = useLocation();

  // Active tab detection
  const urlParams = new URLSearchParams(location.search);
  let activeTab = urlParams.get("tab") || "All";

  if (location.pathname === "/nutrition") {
    activeTab = "Nutrition";
  } else if (location.pathname === "/attendance") {
    activeTab = "Attendance";
  }

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.label === "Nutrition") {
      navigate(tab.path); // direct route
    } else if (tab.label === "Attendance") {
      navigate(tab.path); // direct route
    } else {
      // booking calendar with query params
      navigate(`${tab.path}?tab=${tab.label}`);
    }
  };

  return (
    <div className="flex bg-gray-200 rounded-full p-1 w-fit mx-auto mt-4">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          onClick={() => handleTabClick(tab)}
          className={`px-4 py-1 text-sm rounded-full ${
            activeTab === tab.label
              ? "bg-gray-700 text-white"
              : "text-gray-600 hover:bg-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function TopBar() {
  return (
    <div className="bg-white shadow py-3">
      {/* Top Row: Back, Date, Legend */}
      <div className="w-full flex justify-between font-bold items-center px-4 py-2">
        {/* Left: Back Button */}
        {/* <div className="flex items-center">
          <BackButton />
        </div> */}

        {/* Center: Admin Dashboard */}
        <div className="flex-1 flex justify-center px-4">
          <div className="text-center text-base md:text-lg font-semibold truncate">
            Admin Dashboard
          </div>
        </div>

        {/* Right: LegendBoxes + TabSwitch */}
        <div className="flex flex-col items-end gap-2">
          <LegendBoxes />
          <TabSwitch />
        </div>
      </div>
    </div>
  );
}
