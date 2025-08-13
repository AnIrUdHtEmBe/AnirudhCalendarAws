import React, { useContext, useEffect, useState } from "react";
import { Eye, ArrowRight, X } from "lucide-react";
import { DataContext } from "../store/DataContext";
import Header from "../assessmentComponents/Header";
import "./Assessment.css";
import { CircularProgress, Switch } from "@mui/material";
import { useApiCalls } from "../store/axios";


const Assessment: React.FC = () => {
  const context = useContext(DataContext);
  if (!context) return <div>Loading...</div>;
  const {
    setSelectComponent,
    assessments_Api_call,
    assessmentInstance_expanded_Api_call,
  } = context;
  const {
    assessments_fetching,
    assessments_intsnce_fetching,
    starting_assessment_by_user,
  } = useApiCalls();

  const [selectedRow, setSelectedRow] = useState<Object | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Object | null>(
    null
  );

  const [showModal, setShowModal] = useState(false);
  const [showTaken, setShowTaken] = useState(false);

  const [loading, setLoading] = useState(true);


  const handleEditAssessment = () => {
    localStorage.setItem("assessmentDetails", JSON.stringify(selectedRow));
    localStorage.setItem("type" , "edit");
    setSelectComponent("Q&A");
  };

  const handleStartAssignment = () => {
    localStorage.setItem("assessmentDetails", JSON.stringify(selectedRow));
    localStorage.setItem("type", "start");
    setSelectComponent("Q&A");
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.userId;
    const templateId = selectedRow?.templateId; // handle both spellings

    if (userId && templateId) {
      starting_assessment_by_user(userId, templateId);
    } else {
      console.error("User ID or Template ID missing", { userId, templateId });
    }
  };

  console.log(selectedRow);
  console.log( JSON.parse(localStorage.getItem("user")).assessments);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await assessments_fetching();
        const user = JSON.parse(localStorage.getItem("user"));
        const assessmentInstanceIdArray = user.assessments;

        if (assessmentInstanceIdArray.length >= 0) {
          await assessments_intsnce_fetching(assessmentInstanceIdArray);
        }
      } catch (error) {
        console.error("Error fetching assessment data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  console.log(assessmentInstance_expanded_Api_call,"this expaned");

  console.log("assessments_Api_call", assessments_Api_call);
  return (
    <div>
      
      <Header />

      <div className="assessment-container">
        <div className="assessment-content">
          <div className="assessment-header">
            <h1 className="assessment-title">Assessments</h1>
            <div className="assess-right-panel">
              <div className="assess-right-panel-left">
                <span>Show Taken</span>
                <Switch onClick={() => setShowTaken(!showTaken)}></Switch>
                <span>To Take</span>
              </div>
              {showTaken ? (
                <button
                  className={`${
                    selectedRow ? "start-button" : "disable-button"
                  }`}
                  disabled={!selectedRow}
                  onClick={handleStartAssignment}
                >
                  <span>Start</span>
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                className={`${
                  selectedRow ? "start-button" : "disable-button"
                }`}
                disabled={!selectedRow}
                onClick={handleEditAssessment}>   <span>Edit</span>
                  <ArrowRight size={20} /></button>
              )}
            </div>
          </div>

          <div className="assessment-table-wrapper">
            {loading ? (
              <div className="loading-state">
                <CircularProgress style={{ color: "#1976d2" }} />
              </div>
            ) : !showTaken ? (
              <table className="assessment-table">
                <thead>
                  <tr className="assessment-table-header-assessment">
                    <th className="sl-header">Sl.No</th>
                    <th className="assess-header">Assessment</th>
                    <th className="ques-header">No.of Questions</th>
                    <th className="prev-header">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentInstance_expanded_Api_call.length > 0  ?assessmentInstance_expanded_Api_call.map(
                    (assessment, index) => (
                      <tr
                        key={assessment.tempelateId}
                        onClick={() => setSelectedRow(assessment)}
                        className={
                          selectedRow === assessment
                            ? "selected-row"
                            : "hover-row"
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{assessment.template.name}</td>
                        <td>{assessment.template.questions.length}</td>
                        <td>
                          {assessment.template.questions.length !== 0 && (
                            <button
                              className="preview-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowModal(true);
                                setSelectedAssessment(assessment.template);
                              }}
                            >
                              <Eye size={25} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  ) :  <tr>
                  <td className="not-attemped-state" colSpan={4}>
                    No assessments Attempted yet
                  </td>
                </tr>}
                </tbody>
              </table>
            ) : (
              <table className="assessment-table">
                <thead>
                  <tr>
                    <th className="sl-header">Sl.No</th>
                    <th  className="assess-header">Assessment</th>
                    <th className="ques-header">No.of Questions</th>
                    <th className="prev-header">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments_Api_call.map((assessment, index) => (
                    <tr
                      key={assessment.tempelateId}
                      onClick={() => setSelectedRow(assessment)}
                      className={
                        selectedRow === assessment
                          ? "selected-row"
                          : "hover-row"
                      }
                    >
                      <td>{index + 1}</td>
                      <td>{assessment.name}</td>
                      <td>{assessment.questions.length}</td>
                      <td>
                        {assessment.questions.length !== 0 && (
                          <button
                            className="preview-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowModal(true);
                              setSelectedAssessment(assessment);
                            }}
                          >
                            <Eye size={25} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                <X size={24} className="" />
              </button>
              <div className="modal">
                <h1 className="modal-titlebhav">{selectedAssessment?.name}</h1>
                <div className="modal-table-div">
                <table className="modal-table">
                  <thead>
                    <tr className="modal-table-header-row">
                      <th className="modal-th slno-header">Sl.No</th>
                      <th className="modal-th question-headerrr">Questions</th>
                      <th className="modal-th mandatory-header">Mandatory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAssessment?.questions.map(
                      (ques: any, index: number) => (
                        <tr key={ques.questionId} className="modal-table-row">
                          <td className="modal-td slno-header">{index + 1}</td>
                          <td className="modal-td question-headerrr">
                            {ques.mainText}
                          </td>
                          <td className="modal-td mandatory-header madat-option ml-[10px]">
                            {ques.isRequired ? "Yes" : "No"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessment;
