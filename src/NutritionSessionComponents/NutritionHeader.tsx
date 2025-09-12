import { File, FileText } from "lucide-react";
import React, { useContext, useMemo } from "react";
import { DataContext } from "../store/DataContext";
import "../sessionsPageComponets/Header.css"; // Assuming this is the path to your CSS file

function NutrtionHeader() {
  const context = useContext(DataContext);

  if (!context) {
    return <div>Loading...</div>;
  }

  const { selectComponent, setSelectComponent } = context;

  // Map selectComponent values to titles
  const headerTitles = {
    "/nutrition_sessions": "Daily Nutrition Plan Creation",
    dashboard: "Daily Nutrition Plan Creation",
    All_nutrition_Sessions: "Existing Nutrition Plans",
    AllMeals: "All Meals",
    BulkAddMeals: "Excel Sheet Meals Data",
  };

  const headerTitle =
    headerTitles[selectComponent] || "Existing Nutrition Plans";

  return (
    <div className="header-containerrr">
      <div className="header-topper">
        <FileText size={35} />
        <span className="header-titler">{headerTitle}</span>
      </div>
      <div className="header-tabsss">
        <button
          className={`text-xl font-medium ${
            selectComponent === "/nutrition_sessions" ||
            selectComponent === "dashboard"
              ? "border-b-3 "
              : ""
          }`}
          onClick={() => setSelectComponent("/nutrition_sessions")}
        >
          Daily Nutrition Plan Creation
        </button>

        <button
          className={`text-xl font-medium ${
            selectComponent === "All_nutrition_Sessions" ? "border-b-3 " : ""
          }`}
          onClick={() => setSelectComponent("All_nutrition_Sessions")}
        >
          Existing Nutrition Plans
        </button>

        <button
          className={`text-xl font-medium ${
            selectComponent === "AllMeals" || selectComponent === "BulkAddMeals"
              ? "border-b-3 "
              : ""
          }`}
          onClick={() => setSelectComponent("AllMeals")}
        >
          {selectComponent === "BulkAddMeals" ? (
            <>
              All Meals <span style={{ margin: "0 8px" }}>→</span> Excel Sheet
              Data
            </>
          ) : (
            "All Meals"
          )}
        </button>
      </div>
    </div>
  );
}

export default NutrtionHeader;
