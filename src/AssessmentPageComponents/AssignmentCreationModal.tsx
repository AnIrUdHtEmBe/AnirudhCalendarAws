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
      <button
        className="modal-button"
        onClick={() => setSelectComponent("AssessmentCreationPage2")}
      >
        Create Assessment
      </button>
    </div>
  </>
);
}

export default AssignmentCreationModal;
