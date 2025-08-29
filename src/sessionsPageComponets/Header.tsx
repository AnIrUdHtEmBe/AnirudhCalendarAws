import { File, FileText } from "lucide-react";
import React, { useContext } from "react";
import { DataContext } from "../store/DataContext";
import "./Header.css"; // Assuming this is the path to your CSS file

function Header() {
  const context = useContext(DataContext);
  if (!context) {
    return <div>Loading...</div>;
  }
  const { selectComponent, setSelectComponent } = context;

  // Map selectComponent values to titles
  const headerTitles = {
    "/sessions": "Session Creation",
    "dashboard": "Session Creation",
    "AllSessions": "All Sessions",
    "AllActivities": "All Activities",
  };

  const headerTitle = headerTitles[selectComponent] || "All Sessions";

  return (
    <div className="header-containerrr">
      <div className="header-topper">
        <FileText size={35} />
        <span className="header-titler">{headerTitle}</span>
      </div>
      <div className="header-tabsss">
        <button
          className={`text-xl font-medium ${ selectComponent === "/sessions" || selectComponent === "dashboard" ? "border-b-3 " : ""}`}
          onClick={() => setSelectComponent("/sessions")}
        >
          Session Creator
        </button>
        <button className={`text-xl font-medium ${ selectComponent === "AllSessions" ? "border-b-3 " : ""}`}
         onClick={() => setSelectComponent("AllSessions")}
        >All Sessions</button>
        <button className={`text-xl font-medium ${ selectComponent === "AllActivities" ? "border-b-3 " : ""}`}
         onClick={() => setSelectComponent("AllActivities")}
        >All Activities</button>
      </div>
    </div>
  );
}

export default Header;
