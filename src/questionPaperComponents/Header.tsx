import React, { useContext } from "react";
import { Calendar, FileText } from "lucide-react";
import { DataContext } from "../store/DataContext";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";

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
  const userDetail = JSON.parse(localStorage.getItem("user"));
  console.log(userDetail.name)
  return (
    <header className="bg-white z-10 w-full">
      {/* Top row with icon and title */}
        <div>
           <Breadcrumb/>
        </div>
      <div className="flex flex-row  justify-between items-center ">
     
        <div className="flex flex-col sm:flex-row items-center gap-2  sm:gap-4 p-4 sm:px-10">
          <div>
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" className="back-icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M217.9 256L345 129c9.4-9.4 9.4-24.6 0-33.9-9.4-9.4-24.6-9.3-34 0L167 239c-9.1 9.1-9.3 23.7-.7 33.1L310.9 417c4.7 4.7 10.9 7 17 7s12.3-2.3 17-7c9.4-9.4 9.4-24.6 0-33.9L217.9 256z">
            </path></svg>
          </div>
          <FileText size={28} className="text-gray-800 " />
          <h1 className="text-xl sm:text-2xl md:text-[24px] font-normal text-gray-800 text-center sm:text-left">
            {userDetail.name}'s {""} Assessment {assignment?.id ?? ""}
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
