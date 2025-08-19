import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Eye, X } from "lucide-react";
import { useApiCalls } from "../store/axios";
import AssignmentCreationModal from "../AssessmentPageComponents/AssignmentCreationModal";
import "./QuestionPaper.css";
import "./Assessment.css";
import { DataContext } from "../store/DataContext";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";

function ViewAllAssessment() {
  const context = useContext(DataContext);
  if (!context) return <div>Loading...</div>;

  const { selectComponent, setSelectComponent, assessments_Api_call } = context;
  const { assessments_fetching } = useApiCalls();
  const [headingText, setheadingText] = useState("Assignments");
  const [selectedAssessment, setSelectedAssessment] = useState<Object | null>(
    null
  );
  const [selectedRow, setSelectedRow] = useState<Object | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const handleSelection = async (dataString: string) => {
    if (dataString == "question") {
      setSelectComponent("/question-bank");
      setheadingText("Questionnaire Creation");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await assessments_fetching();
      } catch (error) {
        console.error("Error fetching assessment data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="question-bank-container h-screen w-full flex flex-col overflow-hidden">
      <div className="flex flex-col h-full">
        {/* header */}
        <div className="question-bank-header-container flex-shrink-0">
          <div className="header-top">
            <FileText size={28} className="text-gray-800" />
            <span className="header-title">{headingText}</span>
          </div>
          <div className="header-tabs">
            <div className="header-breadcrumb-left">
              <Breadcrumb />
            </div>
            <div className="header-tabs-center" style={{marginRight : '18rem'}}>
              <button
                onClick={() => handleSelection("assignment")}
                className={`header-tab ${
                  selectComponent === "/assignment"
                    ? "border-b-4 active-tab"
                    : ""
                }`}
              >
                Assessments
              </button>
              <button
                onClick={() => handleSelection("question")}
                className={`header-tab ${
                  selectComponent === "/question-bank"
                    ? "border-b-4 active-tab"
                    : ""
                }`}
              >
                Questions
              </button>
              <button
                className="header-tab border-b-4 border-transparent pb-2"
                onClick={() => handleSelection("settings")}
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Creation Modal */}
        <div className="flex items-center justify-center flex-shrink-0">
          <AssignmentCreationModal></AssignmentCreationModal>
        </div>

        {/* Modal */}
        <div>
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
                  <h1 className="modal-titlebhav">
                    {selectedAssessment?.name}
                  </h1>
                  <div className="modal-table-div">
                    <table className="modal-table">
                      <thead>
                        <tr className="modal-table-header-row">
                          <th className="modal-th slno-header">Sl.No</th>
                          <th className="modal-th question-headerrr">
                            Questions
                          </th>
                          <th className="modal-th mandatory-header">
                            Mandatory
                          </th>
                        </tr>
                      </thead>
                      <tbody className="modal-tbody">
                        {selectedAssessment?.questions.map(
                          (ques: any, index: number) => (
                            <tr
                              key={ques.questionId}
                              className="modal-table-row"
                            >
                              <td className="modal-td slno-header">
                                {index + 1}
                              </td>
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

        {/* Assessment Table */}
        <div className="flex-1 flex flex-col min-h-0 p-4">
          <div className="w-full h-full flex flex-col border border-gray-200 rounded-lg">
            {/* Single table with sticky header & scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[12%]" /> {/* Sl.No */}
                  <col className="w-[50%] max-w-[400px]" /> {/* Assessment */}
                  <col className="w-[20%]" /> {/* No of Questions */}
                  <col className="w-[18%]" /> {/* Preview */}
                </colgroup>

                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-base text-center border-b border-gray-200">
                      Sl.No
                    </th>
                    <th className="p-3 text-base text-left border-b  border-gray-200">
                      Assessment
                    </th>
                    <th className="p-3 text-base text-center   border-b border-gray-200">
                      No.of Questions
                    </th>
                    <th className="p-3 text-base text-center  border-b border-gray-200">
                      Preview
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assessments_Api_call.map(
                    (assessment: any, index: number) => (
                      <tr
                        key={assessment.tempelateId}
                        onClick={() => setSelectedRow(assessment)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          selectedRow === assessment
                            ? "selected-row bg-blue-50"
                            : "hover-row hover:bg-gray-50"
                        }`}
                      >
                        <td className="p-3 text-base text-center text-gray-900">
                          {index + 1}
                        </td>
                        <td className="p-3 text-base text-left text-gray-900">
                          {assessment.name}
                        </td>
                        <td className="p-3 text-base text-center text-gray-900">
                          {assessment.questions.length}
                        </td>
                        <td className="p-3 text-base text-center">
                          {assessment.questions.length !== 0 && (
                            <button
                              className="preview-button inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowModal(true);
                                setSelectedAssessment(assessment);
                              }}
                            >
                              <Eye size={20} className="text-gray-600" />
                            </button>
                          )}
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
    </div>
  );
}

export default ViewAllAssessment;
