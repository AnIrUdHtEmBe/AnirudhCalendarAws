import React, { useContext } from "react";
import { Calendar, FileText } from "lucide-react";
import { DataContext } from "../store/DataContext";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const assignment = JSON.parse(
    localStorage.getItem("assessmentDetails") || "{}"
  );
  const context = useContext(DataContext);

  if (!context) return <div>Loading...</div>;

  const { selectComponent } = context;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="bg-white z-10 w-full">
      {/* Top row with icon and title */}
      
      <div className="flex flex-row  justify-between items-center">
        <div className="flex flex-col sm:flex-row items-center gap-2  sm:gap-4 p-4 sm:px-10">
          <FileText size={48} className="text-gray-800 " />
          <h1 className="text-xl sm:text-2xl md:text-[24px] font-normal text-gray-800 text-center sm:text-left">
            Assessment {assignment?.id ?? ""}
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2  sm:gap-4 p-4 sm:px-10">
          {selectComponent === "responses" && (
            <div className="flex text-[18px] gap-2 ml-[95px] flex items-center">
              <Calendar size={20}></Calendar>
              <h2>{today}</h2>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center flex-wrap gap-6 sm:gap-10 font-normal text-sm sm:text-base px-2 py-3">
        <span
          className={`cursor-pointer ${
            selectComponent === "Q&A" ? "border-b-4 border-black" : ""
          } text-[24px]`}
        >
          Questions
        </span>
        <span
          className={`cursor-pointer ${
            selectComponent === "responses" ? "border-b-4 border-black" : ""
          } text-[24px]`}
        >
          Responses
        </span>
        <span className="cursor-pointer text-[24px]">Settings</span>
      </div>
    </header>
  );
};

export default Header;
