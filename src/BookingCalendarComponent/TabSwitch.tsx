// components/SwitchTabs.tsx
import { useState } from "react";

const tabs = ["Occupied", "Pricing", "Operators"];

export default function TabSwitch() {
  const [activeTab, setActiveTab] = useState("Occupied");

  return (
    <div className="flex bg-gray-200 rounded-full p-1 w-fit mx-auto mt-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-1 text-sm rounded-full ${
            activeTab === tab ? "bg-gray-700 text-white" : "text-gray-600"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
