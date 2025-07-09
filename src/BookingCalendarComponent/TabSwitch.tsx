import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { label: "Occupied", path: "/bookingCalendar" },
  { label: "Pricing", path: "/pricingCalendar" },
  { label: "Operators", path: "/operators" },
];

export default function TabSwitch() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current path
  const activeTab = tabs.find(tab => location.pathname.startsWith(tab.path))?.label || "Occupied";

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.path !== location.pathname) {
      navigate(tab.path);
    }
  };

  return (
    <div className="flex bg-gray-200 rounded-full p-1 w-fit mx-auto mt-4">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          onClick={() => handleTabClick(tab)}
          className={`px-4 py-1 text-sm rounded-full ${
            activeTab === tab.label ? "bg-gray-700 text-white" : "text-gray-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
