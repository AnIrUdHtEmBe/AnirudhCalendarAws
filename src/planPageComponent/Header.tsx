import React, { useContext } from "react";
import { FileText } from "lucide-react";
import { DataContext } from "../store/DataContext";
import "./Header.css"; // Import the CSS file
import { Person, Person2 } from "@mui/icons-material";


interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const assignment = JSON.parse(
    localStorage.getItem("assessmentDetails") || "{}"
  );

  const context = useContext(DataContext);
  if (!context) {
    return <div>Loading...</div>;
  }

  const { selectComponent, setSelectComponent } = context;
  const user = JSON.parse(localStorage.getItem("user"));
  // console.log(user);

  const plan = JSON.parse(localStorage.getItem("selectedPlan"));
  // console.log(plan);

  return (
    <header className="header">
      {/* Top Row */}
      {selectComponent === "planCreation" ? (
        <div className="header-topp">
          <div className="header-row">
            <Person2 className="header-icon" />
            <h1 className="header-titleee">{user.name}</h1>
          </div>
          <div className="header-row">
            <FileText size={25} className="header-icon" />
            <h1 className="header-titleee">{plan.title}</h1>
          </div>
        </div>
      ) : (
        <div className="header-topp">
          <div className="header-row">
            <FileText size={25} className="header-icon" />
            <h1 className="header-titleee">
              Plan Creation {assignment?.id ?? ""}
            </h1>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        {selectComponent === "/plans" ||
        selectComponent === "AllPlans" ||
        selectComponent === "dashboard" ? (
          <button
            className={`tab-button ${
              selectComponent === "/plans" || selectComponent === "dashboard"? "active" : ""
            }`}
            onClick={() => setSelectComponent("/plans")}
          >
            Plan Creator
          </button>
        ) : (
          <>
          
          <button
            className={`tab-button ${
              selectComponent === "planCreation" ? "active" : ""
            }`}
          >
            View Plans
          </button>
          </>
        )}

        <button
          className={`tab-button ${
            selectComponent === "AllPlans" ? "active" : ""
          }`}
          onClick={() => setSelectComponent("AllPlans")}
        >
          All Plans
        </button>
        
      </div>
    </header>
  );
};

export default Header;
