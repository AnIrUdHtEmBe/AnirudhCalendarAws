import React, { useContext } from "react";
import { DataContext } from "../store/DataContext";
import "./AssignmentCreationModal.css"; // import the CSS file


function AssignmentCreationModal() {
  const context = useContext(DataContext);

  if (!context) {
    return <div>Loading...</div>;
  }

  const { setSelectComponent } = context;

  return (
    <>
    
    <div className="assignment-modal">
      {/* <div className="modal-title">Create Assessment</div> */}
      {/* <div className="modal-description">
        Create a personalized assessment to analyze customer goals and recommend
        a tailored fitness plan.
      </div> 
      <div>*/}
      
        <button
          className="modal-button"
          onClick={() => setSelectComponent("AssessmentCreationPage2")}
        >
          Create Assessment
        </button>
      {/* </div> */}
    </div>
    </>
  );
}

export default AssignmentCreationModal;
