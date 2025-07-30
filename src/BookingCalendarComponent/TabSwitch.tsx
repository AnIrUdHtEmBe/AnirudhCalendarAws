import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { label: "All", key: "all" },
  { label: "Fitness", key: "fitness" },
  { label: "Wellness", key: "wellness" },
  { label: "Sports", key: "sports" },
  { label: "Nutrition", key: "nutrition" },
];

export default function TabSwitch() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query params
  const searchParams = new URLSearchParams(location.search);
  const activeKey = searchParams.get("tab") || (location.pathname === "/nutrition" ? "nutrition" : "all");

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.key === "nutrition") {
      navigate("/nutrition");
    } else {
      // Navigate to /bookingCalendar with query param, no new routes needed
      navigate(`/bookingCalendar?tab=${tab.key}`);
    }
  };

  return (
    <div className="flex bg-gray-200 rounded-full p-1 w-fit mx-auto mt-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleTabClick(tab)}
          className={`px-4 py-1 text-sm rounded-full ${
            activeKey === tab.key ? "bg-gray-700 text-white" : "text-gray-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
