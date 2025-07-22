import React, { useContext,useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Eye,
  X
} from "lucide-react";
import { useApiCalls } from "../store/axios";
// import Header from "../AssessmentPageComponents/Header";
import AssignmentCreationModal from "../AssessmentPageComponents/AssignmentCreationModal";
import "./QuestionPaper.css"
import './Assessment.css'
import { DataContext } from "../store/DataContext";
function AssessmentPage() {
  const context = useContext(DataContext);
    if (!context) return <div>Loading...</div>;
  const {selectComponent,setSelectComponent,assessments_Api_call}=context
  const {assessments_fetching    } = useApiCalls();
  const [headingText,setheadingText]=useState("Assignments")
    const [selectedAssessment, setSelectedAssessment] = useState<Object | null>(
      null
    );
  
  const [selectedRow, setSelectedRow] = useState<Object | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  
    console.log("][poiugytr")
    const navigate=useNavigate();
    const handleSelection=async(dataString:string)=>{
      if(dataString=='question'){
        // navigate('/question-bank')
        setSelectComponent('/question-bank')
        console.log(dataString,"lkjhkkkkk")
        setheadingText("Questionnaire Creation")
      }
      // else if(dataString=='assignment'){
      //   // navigate('/assignment')
      //   setSelectComponent('/assignment')
      //   console.log("reached assignme")
      //   setheadingText("Assignments")
      // }
    }
    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          try {
            await assessments_fetching();
            // const user = JSON.parse(localStorage.getItem("user"));
            // const assessmentInstanceIdArray = user.assessments;
    
            // if (assessmentInstanceIdArray.length >= 0) {
            //   await assessments_intsnce_fetching(assessmentInstanceIdArray);
            // }
          } catch (error) {
            console.error("Error fetching assessment data:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }, []);
    // console.log(assessments_Api_call.length>0?assessments_Api_call:"assessments_Api_call","thioahsdobosdbw")
  return (
    <div className="question-bank-container">
      <div >
        <h1>'ilkugyf6t878y9u9</h1>
        {/* header */}
        <div className="question-bank-header-container">
          <div className="header-top">
            <FileText size={28} className="text-gray-800" />
            <span className="header-title">{headingText}</span>
          </div>
          <div className="header-tabs">
            <button
            onClick={()=>handleSelection("assignment")}
            className={`header-tab ${
                selectComponent === "/assignment" 
                  ? "border-b-4 active-tab"
                  : ""
              }`}

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
            <button className="header-tab border-b-4 border-transparent pb-2"
            onClick={()=>handleSelection("settings")}
            >
              Settings
            </button>
          </div>
        </div>
        {/* <div className=" bg-gray-200 flex-1 flex justify-center items-center">
          <AssignmentCreationModal />
        </div> */}
      <div className="flex items-center justify-center">
        <AssignmentCreationModal></AssignmentCreationModal>
      </div>
      
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
                <h1 className="modal-titlebhav">{selectedAssessment?.name}</h1>
                <table className="modal-table">
                  <thead>
                    <tr className="modal-table-header-row">
                      <th className="modal-th slno-header">Sl.No</th>
                      <th className="modal-th question-headerrr">Questions</th>
                      <th className="modal-th mandatory-header">Mandatory</th>
                    </tr>
                  </thead>
                  <tbody className="modal-tbody">
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

                    {/* {Array.from({
                      length: Math.max(
                        0,
                        15 - selectedAssessment.questions.length
                      ),
                    }).map((_, i) => (
                      <tr key={`empty-${i}`} className="modal-table-row">
                        <td className="modal-td slno-header">-</td>
                        <td className="modal-td question-headerrr text-gray-400"></td>
                        <td className="modal-td mandatory-header madat-option ml-[10px] text-gray-400"></td>
                      </tr>
                    ))} */}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <div>
      <table className="assessment-table">
        <thead>
          <tr>
            <th className="sl-header">Sl.No</th>
            <th  className="assess-header">Assessment</th>
            <th className="ques-header">No.of Questions</th>
            <th className="prev-header">Preview</th>
          </tr>
        </thead>
        <tbody className="max-h-72 overflow-y-auto mt-4 pr-2">
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
              <td style={{textAlign:"left"}}>{assessment.name}</td>
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
      
      </div>
      </div>
    </div>
  );
}


export default AssessmentPage;
