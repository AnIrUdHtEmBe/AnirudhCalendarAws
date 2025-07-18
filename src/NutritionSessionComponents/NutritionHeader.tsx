import { File, FileText } from "lucide-react";
import React, { useContext } from "react";
import { DataContext } from "../store/DataContext";
import "../sessionsPageComponets/Header.css"; // Assuming this is the path to your CSS file

function NutrtionHeader() {
  const context = useContext(DataContext);
  if (!context) {
    return <div>Loading...</div>;
  }
  const { selectComponent, setSelectComponent } = context;

  return (
    <div className="header-containerrr">
      <div className="header-topper">
        <FileText size={35} />
        <span className="header-titler">{selectComponent === "/nutrition_sessions" || selectComponent === "dashboard" ? "Nutrition Creation" : "All Nutritions"}</span>
      </div>
      <div className="header-tabsss">
        <button
          className={`text-xl font-medium ${ selectComponent === "/nutrition_sessions" || selectComponent === "dashboard" ? "border-b-3 " : ""}`}
          onClick={() => setSelectComponent("/nutrition_sessions")}
        >
          Nutrition Creation
        </button>
        <button className={`text-xl font-medium ${ selectComponent === "All_nutrition_Sessions" ? "border-b-3 " : ""}`}
         onClick={() => setSelectComponent("All_nutrition_Sessions")}
        >All Nutritions</button>
      </div>
    </div>
  );
}

export default NutrtionHeader;
