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
    "/nutrition_sessions": "Meal Creation",
    dashboard: "Meal Creation",
    All_nutrition_Sessions: "Existing Meal Plans",
    AllMeals: "Individual Food Items",
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
          Meal Creation
        </button>

        <button
          className={`text-xl font-medium ${
            selectComponent === "All_nutrition_Sessions" ? "border-b-3 " : ""
          }`}
          onClick={() => setSelectComponent("All_nutrition_Sessions")}
        >
          Existing Meal Plans
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
              Individual Food Items <span style={{ margin: "0 8px" }}>→</span> Excel Sheet
              Data
            </>
          ) : (
            "Individual Food Items"
          )}
        </button>
      </div>
    </div>
  );
}

export default NutrtionHeader;
