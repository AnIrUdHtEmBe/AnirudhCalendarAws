import { FileText } from "lucide-react";
import React, { useContext,useEffect,useState } from "react";
import { DataContext } from "../store/DataContext";
import "./Header.css"; // Assuming this is the path to your CSS file

function Header() {
  const context = useContext(DataContext);
  if (!context) {
    return <div>Loading...</div>;
  }
  const { selectComponent,setSelectComponent } = context;
  const [headingText,setheadingText]=useState("Questionnaire Creation")
const handleSelection=async(dataString:string)=>{
    if(dataString=='question'){
      setSelectComponent('/question-bank')
      setheadingText("Questionnaire Creation")
    }else if(dataString=='assignment'){
      setSelectComponent('/assignment')
      setheadingText("Assignments")
    }
  }
  useEffect(()=>{
    console.log(selectComponent,headingText)
  },[selectComponent])
  return (
    <div className="header-con">
      <div className="header-t">
        <FileText size={35} className="text-gray-800" />
        <span className="header-titl">{headingText}</span>
      </div>
      <div className="header-tabs-ass">
        <button
         onClick={()=>handleSelection("assignment")}
          className={`text-[20px] font-medium ${selectComponent === "/assignment" || selectComponent === "AssessmentCreationPage2" || selectComponent === 'dashboard' ? "border-b-4 border-black" : ""}`}
        >
          Assessments
        </button>
        <button
            onClick={()=>handleSelection("question")}
            className={`header-tab ${
              selectComponent === "/question-bank"
                ? "border-b-4 active-tab"
                : ""
            }`}
          >
            Questions
          </button>
        <button className="header-taab">Settings</button>
      </div>
    </div>
  );
}

export default Header;
