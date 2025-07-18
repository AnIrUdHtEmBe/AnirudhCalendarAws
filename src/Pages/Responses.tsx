import { useContext, useEffect, useState } from "react";
import Header from "../questionPaperComponents/Header";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  Dumbbell,
  CheckCircle,
  Calendar,
  Edit,
} from "lucide-react";
import { DataContext } from "../store/DataContext";
import "./Responses.css";
import { Comment, ReplayOutlined } from "@mui/icons-material";
import { StickyNote } from "lucide-react";
import { useApiCalls } from "../store/axios";

function Responses() {
  const ScoreZoneData = [
    { name: "Kick Start", from: 0, to: 30 },
    { name: "Momentum", from: 31, to: 60 },
    { name: "Performance", from: 61, to: 80 },
    { name: "Elite", from: 81, to: 100 },
  ];

  const [selectedDate, setselectedDate] = useState("")
  const paperDetails = JSON.parse(localStorage.getItem("assessmentDetails"));
  // console.log(paperDetails);
  const userDetail = JSON.parse(localStorage.getItem("user"));
  // console.log(userDetail);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const [score, setScore] = useState<{ score: number; index: number }>({
    score: 0,
    index: -1,
  });

  const [calcLoading, setCalcLoading] = useState(true);

  const {
    starting_assessment_by_user,
    assessments_intsnce_fetching,
    getPlansFull,
    updateNextAssessmentDate
  } = useApiCalls();

  const context = useContext(DataContext);
  if (!context) {
    return <div>Loading...</div>;
  }
  const [summaryNote, setSummaryNote] = useState<string>(() => {
    return localStorage.getItem("summaryNote") || "";
  });
  const [commentModal, setCommentModal] = useState(false);
  const [tempComment, setTempComment] = useState<string>(summaryNote);

  const [plann, setPlan] = useState<any>(null);

  const {
    plans_full_api_call,
    setSelectComponent,
    assessmentInstance_expanded_Api_call,
  } = context;

  const [comment, setComment] = useState<string>("");
  const handleCommentModal = () => {
    setTempComment(summaryNote); // preload saved note into modal
    setCommentModal(true);
  };

  const saveSummaryNote = () => {
    setSummaryNote(tempComment);
    localStorage.setItem("summaryNote", tempComment); // persist it
    setCommentModal(false);
  };

  const handleStartAssignment = () => {
    setSelectComponent("Q&A");
  };

  let latestAssessmentInstanceId = [
    JSON.parse(localStorage.getItem("assessmentInstanceId")),
  ];

  console.log(latestAssessmentInstanceId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (latestAssessmentInstanceId) {
          await assessments_intsnce_fetching(latestAssessmentInstanceId);
          await getPlansFull();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(fetchData, 1000); // 1 second delay
  }, []);

  console.log(
    "Assessment Instance Expanded API Call Data:",
    assessmentInstance_expanded_Api_call
  );

  console.log("Plans Full API Call Data:", plans_full_api_call);

  const handlePlanSelection = (plan: any) => {
    console.log("Selected Plan:", plan);
    setPlan(plan);
    localStorage.setItem("selectedPlan", JSON.stringify(plan));
  };

  useEffect(() => {
    if (!assessmentInstance_expanded_Api_call?.[0]?.answers) {
      setCalcLoading(true);
      return;
    }

    let totalScore = 0;
    try {
      assessmentInstance_expanded_Api_call[0].answers.forEach((answer) => {
        totalScore += answer.scoreValue || 0;
      });
    } catch (error) {
      console.error("Score calculation error:", error);
      setCalcLoading(false);
      return;
    }

    // Determine score zone
    let scoreIndex = -1;
    if (totalScore >= 0 && totalScore <= 30) scoreIndex = 0;
    else if (totalScore <= 60) scoreIndex = 1;
    else if (totalScore <= 80) scoreIndex = 2;
    else if (totalScore <= 100) scoreIndex = 3;

    setScore({ score: totalScore, index: scoreIndex });
    setCalcLoading(false);
  }, [assessmentInstance_expanded_Api_call]); // Add proper dependency

  console.log("Total Score:", score);
  if (!context || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
      </div>
    );
  }



  return (
    <div className="responses-root">
      {/* Fixed Header */}
      {/* <div className="sticky-header"> */}
      <Header />
      {/* </div> */}

      <div className="main-containers">
        <div className="main-card">
          {/* Top Info */}
          <div className="top">
            <div>
              <div className="paper-title">
                {paperDetails.name || paperDetails.template.name}
              </div>
              <div className="paper-subtitle">
                For adults, optimizing strength, metabolism, and diet.
              </div>
            </div>
            <div className="user-actions">
              <div className="flex space-x-2.5">
                <span className="label-bhav">Taking For: </span>
                <div>
                  {userDetail.name} <br /> ID: {userDetail.userId}
                </div>
              </div>

              <button onClick={handleStartAssignment} className="retake-button">
                <ReplayOutlined></ReplayOutlined>
                <span>Retake Assessment</span>
              </button>
            </div>
          </div>

          {/* Main Panels */}
          <div className="main-panels relative">
            {/* Left Questions List */}
            <div className="question-list">
              <div className="question-title">Responses</div>
              <div className="question-items">
                {assessmentInstance_expanded_Api_call[0].answers?.map(
                  (q, index) => (
                    <div key={q.questionId} className="question-box">
                      <div className="question-row">
                        <CheckCircle className="icon-success" />
                        <span className="question-text">
                          {index + 1}. {q.mainText}
                        </span>
                      </div>
                      <div className="question-answer">
                        Ans -{" "}
                        <span className="font-normal">
                          <span className="font-semibold">
                            {q.value ? q.value : "null"}
                          </span>{" "}
                          {q.scoreZone && (
                            <>
                              and you are in{" "}
                              <span className="font-semibold">
                                {q.scoreZone}
                              </span>{" "}
                              category
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Right Summary */}
            <div className="summary-panel">
              <div className="summary-header-wrapper">
                <div className="summary-header">
                  <div className="summary-title">Summary</div>
                  <div className="summary-paper-title">
                    {" "}
                    {paperDetails.name || paperDetails.template.name}
                  </div>
                </div>
                {calcLoading ? (
                  <div>Calculating score...</div>
                ) : (
                  <div className="font-normal text-lg">
                    Score = <span className="font-bold">{score.score}</span>
                  </div>
                )}
              </div>

              {score.score === 0 ? (
                <div className="font-normal text-2xl flex items-center justify-center pt-[40px]">
                  Welcome to Forge , Below are Your recommended Plans
                </div>
              ) : (
                <div className="summary-table-wrapper">
                  <table className="assignment-table">
                    <thead>
                      <tr>
                        <th>ScoreZone</th>
                        <th>From</th>
                        <th>To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ScoreZoneData.map((zone, index) => (
                        <tr
                          key={index}
                          className={`${score.index === index ? "highlight" : ""
                            }`}
                        >
                          <td>{zone.name}</td>
                          <td>{zone.from}</td>
                          <td>{zone.to}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="plan-text">
                The Recommended Plan for this assessment is ready! Please refer
                the monthly plan below.
              </div>
              <div className="plan-options">
                {plans_full_api_call.map((plan, i) => (
                  <button
                    key={i}
                    className={`plan-box hover:cursor-pointer ${plann === plan ? "sel" : ""
                      }`}
                    onClick={() => handlePlanSelection(plan)}
                  >
                    {plan.title}
                  </button>
                ))}
              </div>

              {/* where to dave the next assessment date? */}
              <div className="mt-12 flex space-x-4 items-center">
                <Calendar></Calendar>{" "}
                <div >

                  <span className="font-normal text-xl">
                    Next assessment On:<input
                      type="date"
                      className="border border-gray-300 rounded px-3 py-2 text-lg"
                      onChange={(e) => (setselectedDate(e.target.value))}
                    />
                  </span>
                </div>
                {/* <span className="font-normal text-xl ">
                  Next assessment On : 10/12/13
                </span> */}
                {/* <Edit></Edit> */}
              </div>
              <div className="proceed-button-wrapper">
                <button
                  className={`flex items-center bg-blue-600 px-4 py-3 text-white rounded-xl space-x-4 absolute bottom-4 right-4 transition-opacity ${plann === null
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                    }`}
                  disabled={plann === null}
                  onClick={async () => {
                    try {
                      const res = await updateNextAssessmentDate(
                        JSON.parse(localStorage.getItem("assessmentInstanceId")),
                        selectedDate
                      );

                      if (res) {
                        setSelectComponent("planCreation");
                      } else {
                        console.log("Date not updated");
                      }
                    } catch (err) {
                      console.error("Error updating date:", err);
                    }
                  }}
                >
                  <span>Proceed</span> <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {commentModal && (
        <div className="fixed inset-0 z-50  bg-black/60 bg-opacity-20 flex justify-center items-center">
          <div className="bg-white rounded-xl p-6 w-[400px] space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold">Summary Notes</h2>
            <textarea
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="Write your summary notes here..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setCommentModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={saveSummaryNote}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Responses;
