import { File, FileText } from "lucide-react";
import React, { useContext, useMemo } from "react";
import { DataContext } from "../store/DataContext";
import "./Header.css"; // Assuming this is the path to your CSS file

function Header() {
  const context = useContext(DataContext);

  if (!context) {
    return <div>Loading...</div>;
  }

  const { selectComponent, setSelectComponent } = context;

  // Authentication check for enhanced features
  const checkEnhancedAuth = useMemo(() => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return false;
      
      // Handle JWT token
      let payload;
      try {
        payload = JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        return false;
      }
      return payload && payload.sub === "USER_MHKN56";
    } catch (error) {
      console.error("Enhanced auth check error:", error);
      return false;
    }
  }, []); // Empty dependency array to calculate once on mount

  // Map selectComponent values to titles
  const headerTitles = {
    "/sessions": "Session Creation",
    "dashboard": "Session Creation",
    "AllSessions": "All Sessions",
    "AllActivities": "All Activities",
    "EnhancedSessionCreator": "Enhanced Session Creator",
    "BulkAddTable": "Excel Sheet Data",
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
          className={`text-xl font-medium ${
            selectComponent === "/sessions" || selectComponent === "dashboard" 
              ? "border-b-3 " 
              : ""
          }`}
          onClick={() => setSelectComponent("/sessions")}
        >
          Session Creator
        </button>
        
        {/* Enhanced Session Creator - only show if authenticated */}
        {checkEnhancedAuth && (
          <button
            className={`text-xl font-medium ${
              selectComponent === "EnhancedSessionCreator" 
                ? "border-b-3 " 
                : ""
            }`}
            onClick={() => setSelectComponent("EnhancedSessionCreator")}
          >
            Enhanced Session Creator(Only for Naveen)
          </button>
        )}
        
        
        <button 
          className={`text-xl font-medium ${
            selectComponent === "AllSessions" 
              ? "border-b-3 " 
              : ""
          }`}
          onClick={() => setSelectComponent("AllSessions")}
        >
          All Sessions
        </button>
        <button
          className={`text-xl font-medium ${
            selectComponent === "AllActivities" ||
            selectComponent === "BulkAddTable"
              ? "border-b-3 "
              : ""
          }`}
          onClick={() => setSelectComponent("AllActivities")}
        >
          {selectComponent === "BulkAddTable" ? (
            <>
              All Activities <span style={{ margin: "0 8px" }}>→</span> Excel
              Sheet Data
            </>
          ) : (
            "All Activities"
          )}
        </button>
      </div>
    </div>
  );
}

export default Header;