import { useContext, useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle, Circle, StickyNote } from "lucide-react";
import Header from "../questionPaperComponents/Header";
import { DataContext } from "../store/DataContext";
import "./QuestionPaper.css";
import { useApiCalls } from "../store/axios";
import { enqueueSnackbar } from "notistack";

type Notes = {
  questionId: number;
  comment: string;
};

function QuestionPaper() {
  const paperDetails = useMemo(() => {
    return JSON.parse(localStorage.getItem("assessmentDetails") || "{}");
  }, []);

  console.log(paperDetails);
  const userDetail = JSON.parse(localStorage.getItem("user") || "{}");
  console.log(userDetail);

  const [notes, setNotes] = useState<Notes[]>([]);
  console.log(notes);
  const context = useContext(DataContext);

  // Refs for scroll synchronization
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftQuestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  if (!context) {
    return <div>Loading...</div>;
  }

  // const { setSelectComponent } = context;
  const { assessmet_submission, getScore } = useApiCalls();

  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [commentModal, setCommentModal] = useState(false);
  const [comment, setComment] = useState<string>("");
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  const [selectedScoreZones, setSelectedScoreZones] = useState<
    Record<number, string>
  >({});
  const [scoreValues, setScoreValues] = useState<Record<number, number | null>>(
    {}
  );

  useEffect(() => {
    if (!paperDetails) return;

    if (Array.isArray(paperDetails.answers)) {
      const initialAnswers: Record<number, string | string[]> = {};
      paperDetails.answers.forEach((answer: any) => {
        const questionIndex = questions.findIndex(
          (q: any) => q.questionId === answer.questionId
        );
        if (questionIndex !== -1) {
          if (
            answer.answerType === "choose_many" &&
            typeof answer.value === "string"
          ) {
            initialAnswers[questionIndex] = answer.value
              .split(",")
              .map((v: string) => v.trim());
          } else {
            initialAnswers[questionIndex] = answer.value || "";
          }
        }
      });
      setAnswers(initialAnswers);
    } else if (Array.isArray(questions)) {
      const initialAnswers: Record<number, string | string[]> = {};
      questions.forEach((_: any, idx: number) => {
        initialAnswers[idx] = "";
      });
      setAnswers(initialAnswers);
    }
  }, [paperDetails]);

  // Handles both possible structures
  const questions = Array.isArray(paperDetails.questions)
    ? paperDetails.questions
    : paperDetails.template && Array.isArray(paperDetails.template.questions)
    ? paperDetails.template.questions
    : [];

  console.log(questions);

  useEffect(() => {
    if (
      paperDetails &&
      Array.isArray(paperDetails.answers) &&
      paperDetails.answers.length > 0
    ) {
      const notesss: Notes[] = paperDetails.answers.map((item) => ({
        questionId: item.questionId,
        comment: item?.notes || "",
      }));
      setNotes(notesss);
    }
  }, []);

  // Function to get visible questions in right panel
  const getVisibleQuestionsInRightPanel = () => {
    if (!rightPanelRef.current) return [];
    
    const rightPanel = rightPanelRef.current;
    const rightPanelRect = rightPanel.getBoundingClientRect();
    const visibleQuestions: number[] = [];

    questionRefs.current.forEach((ref, index) => {
      if (ref) {
        const questionRect = ref.getBoundingClientRect();
        // Check if question is at least 50% visible in the right panel
        const questionTop = questionRect.top - rightPanelRect.top;
        const questionBottom = questionRect.bottom - rightPanelRect.top;
        
        if (questionTop < rightPanelRect.height && questionBottom > 0) {
          // Question is at least partially visible
          const visibleHeight = Math.min(questionBottom, rightPanelRect.height) - Math.max(questionTop, 0);
          const questionHeight = questionRect.height;
          
          if (visibleHeight > questionHeight * 0.3) { // At least 30% visible
            visibleQuestions.push(index);
          }
        }
      }
    });

    return visibleQuestions;
  };

  // Function to check if questions are visible in left panel
  const areQuestionsVisibleInLeftPanel = (questionIndices: number[]) => {
    if (!leftPanelRef.current || questionIndices.length === 0) return true;
    
    const leftPanel = leftPanelRef.current;
    const leftPanelRect = leftPanel.getBoundingClientRect();
    
    return questionIndices.every(index => {
      const leftQuestionRef = leftQuestionRefs.current[index];
      if (!leftQuestionRef) return false;
      
      const questionRect = leftQuestionRef.getBoundingClientRect();
      const questionTop = questionRect.top - leftPanelRect.top;
      const questionBottom = questionRect.bottom - leftPanelRect.top;
      
      // Check if question is visible in left panel
      return questionTop >= 0 && questionBottom <= leftPanelRect.height;
    });
  };

  // Function to scroll left panel to show specific question
  const scrollLeftPanelToQuestion = (questionIndex: number) => {
    if (!leftPanelRef.current || !leftQuestionRefs.current[questionIndex]) return;
    
    isScrollingProgrammatically.current = true;
    
    const leftPanel = leftPanelRef.current;
    const questionElement = leftQuestionRefs.current[questionIndex];
    
    if (questionElement) {
      const leftPanelRect = leftPanel.getBoundingClientRect();
      const questionRect = questionElement.getBoundingClientRect();
      
      const scrollTop = leftPanel.scrollTop;
      const questionOffsetTop = questionRect.top - leftPanelRect.top + scrollTop;
      
      leftPanel.scrollTo({
        top: questionOffsetTop - 50, // 50px padding from top
        behavior: 'smooth'
      });
    }
    
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 500);
  };

  // Function to scroll right panel to show specific question
  const scrollRightPanelToQuestion = (questionIndex: number) => {
    if (!rightPanelRef.current || !questionRefs.current[questionIndex]) return;
    
    isScrollingProgrammatically.current = true;
    
    const rightPanel = rightPanelRef.current;
    const questionElement = questionRefs.current[questionIndex];
    
    if (questionElement) {
      const rightPanelRect = rightPanel.getBoundingClientRect();
      const questionRect = questionElement.getBoundingClientRect();
      
      const scrollTop = rightPanel.scrollTop;
      const questionOffsetTop = questionRect.top - rightPanelRect.top + scrollTop;
      
      rightPanel.scrollTo({
        top: questionOffsetTop - 50, // 50px padding from top
        behavior: 'smooth'
      });
    }
    
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 500);
  };

  // Handle right panel scroll - sync with left panel
  const handleRightPanelScroll = () => {
    if (isScrollingProgrammatically.current) return;
    
    const visibleQuestions = getVisibleQuestionsInRightPanel();
    if (visibleQuestions.length > 0) {
      const areVisible = areQuestionsVisibleInLeftPanel(visibleQuestions);
      if (!areVisible) {
        // Scroll left panel to show the first visible question
        scrollLeftPanelToQuestion(visibleQuestions[0]);
      }
    }
  };

  // Handle left panel question click - sync with right panel
  const handleLeftQuestionClick = (questionIndex: number) => {
    setSelectedQuestionIndex(questionIndex);
    scrollRightPanelToQuestion(questionIndex);
  };

  // Add scroll event listeners
  useEffect(() => {
    const rightPanel = rightPanelRef.current;
    
    if (rightPanel) {
      rightPanel.addEventListener('scroll', handleRightPanelScroll);
      
      return () => {
        rightPanel.removeEventListener('scroll', handleRightPanelScroll);
      };
    }
  }, [questions]);

  const handleOptionSelect = (questionIndex: number, optionValue: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionValue,
    }));
  };

  const handleChooseManyOption = (
    questionIndex: number,
    optionValue: string
  ) => {
    setAnswers((prev) => {
      const current = prev[questionIndex];
      let updated: string[];
      if (Array.isArray(current)) {
        // Toggle selection
        if (current.includes(optionValue)) {
          updated = current.filter((opt) => opt !== optionValue);
        } else {
          updated = [...current, optionValue];
        }
      } else {
        updated = [optionValue];
      }
      return { ...prev, [questionIndex]: updated };
    });
  };

  const allAnswered = questions
    .filter((q) => q.isRequired)
    .every((q, index) => {
      const val = answers[index];

      const isAnswered = q.answerType === "choose_many"
        ? Array.isArray(val) && val.length > 0
        : val !== undefined && val !== "";

      const note = notes.find((n) => n.questionId === q.questionId);
      const isCommentValid = note && note.comment.trim() !== "";
      
      // Accept if either answered or commented
      return isAnswered || isCommentValid;
    });

  console.log(JSON.parse(localStorage.getItem("latestAssessmentTemplate")));
  console.log(
    JSON.parse(localStorage.getItem("assessmentDetails")).assessmentInstanceId
  );

  console.log(localStorage.getItem("type"));

  const handleSubmit = async () => {
    if(!allAnswered) {
      enqueueSnackbar("Please answer all required questions before submitting or add comments in it", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }
    try {
      let instanceId;
      if (localStorage.getItem("type") === "start") {
        console.log("typeweweeeeeeee")
        instanceId = JSON.parse(
          localStorage.getItem("latestAssessmentTemplate")
        );
      } else {
        instanceId = JSON.parse(
          localStorage.getItem("assessmentDetails")
        ).assessmentInstanceId;
      }

      localStorage.setItem("assessmentInstanceId", JSON.stringify(instanceId));

      const ans = await Promise.all(
        questions.map(async (question: any, index: number) => {
          
          let value = answers[index] || "";
          let isSkipped = false;
          if(value == ""){
            value = null;
            isSkipped = true;
          }

          let scoreZone = null;
          let scoreValue = null;
          let scoreLevel = null;

          if (question.answerType === "choose_many" && Array.isArray(value)) {
            value = value.join(", ");
          }

          if (question.answerType === "number_ws") {
                const value_score = await getScore(
                  question.questionId,
                  userDetail.userId,
                  Number(value)
                );
                // console.log("✅ Extracted score:", value_score);
                scoreZone = value_score?.scoreZone ?? null;
                scoreValue = value_score?.scoreValue ?? null;
                scoreLevel = value_score?.scoreLevel ?? null;
          }

          const noteObj = notes.find(
            (n) => n.questionId === question.questionId
          );
          console.log("Note Object:", noteObj);

          return {
            questionId: question.questionId,
            value,
            scoreLevel,
            scoreValue,
            scoreZone,
            notes: noteObj ? noteObj.comment : null,
           isSkipped
          };
        })
      );

      // console.log("Submitting answers:", ans);
      await assessmet_submission(instanceId, ans);
      // await updateNextAssessmentDate(instanceId,selectedD)
    } catch (error) {
      console.error("Submission error:", error);

      enqueueSnackbar("Failed to submit assessment. Please try again.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const calculateScore = async (questionId: string, questionIndex: number) => {
    const val = answers[questionIndex];
    if (val === "" || val === undefined) {
      enqueueSnackbar(
        "Please provide an answer before calculating the score.",
        {
          variant: "warning",
          autoHideDuration: 3000,
        }
      );
      return;
    }
    try {
      const value_score = await getScore(
        questionId,
        userDetail.userId,
        Number(val)
      );

      console.log("✅ Extracted score:", value_score);
      const scoreZone =
        questions[questionIndex].scoreZones[value_score.scoreLevel];
      console.log("Score Zone:", scoreZone);

      const scoreValue = value_score.scoreValue;
      console.log("Score Value:", scoreValue);

      setSelectedScoreZones((prev) => ({
        ...prev,
        [questionIndex]: scoreZone,
      }));

      setScoreValues((prev) => ({
        ...prev,
        [questionIndex]: scoreValue,
      }));
    } catch (error) {
      console.error("Error calculating score:", error);
      enqueueSnackbar(
        "An error occurred while calculating the score. Please try again.",
        {
          variant: "error",
          autoHideDuration: 3000,
        }
      );
    }
  };

  console.log(answers);
  useEffect(() => {console.log("these",notes)}, [notes]);
  
  return (
    <div className="dashboard-container">
      {/* Fixed Header */}
      <Header />

      {/* Scrollable body area */}
      <div className="body-container">
        <div className="paper-det">
          {/* Top Info */}
          <div className="top-info">
            <div className="paper-info">
              <div className="paper-titless">
                {paperDetails.name || paperDetails.template.name}
              </div>
              <div className="paper-subtitle">
                For adults, optimizing strength, metabolism, and diet.{" "}
              </div>
            </div>

            <div className="user-det">
              <div className="flex space-x-2.5">
                <span className="label-bhav">Taking For : </span>
                <div>
                  {userDetail.name} <br /> ID: {userDetail.userId}
                </div>
              </div>
              <button
                // disabled={!allAnswered}
                onClick={handleSubmit}
                className={`submit-btn active `}
              >
                Submit
              </button>
            </div>
          </div>

          {/* Main Scrollable Panels */}
          <div className="main-container">
            {/* Left Scrollable Questions List */}
            <div className="questions-list" ref={leftPanelRef}>
              <div className="questions-title">Questions</div>
              <div className="questions-container">
                {questions.map((q, index) => (
                  <div
                    key={q.questionId}
                    ref={(el) => (leftQuestionRefs.current[index] = el)}
                    onClick={() => handleLeftQuestionClick(index)}
                    className={`question-item ${
                      selectedQuestionIndex === index ? "selected" : "hover"
                    }`}
                  >
                    {answers[index] !== "" ? (
                      <CheckCircle className="answered-icon" />
                    ) : (
                      <Circle className="unanswered-icon" />
                    )}
                    <span className="question-text">
                      <div>{index + 1})</div>
                      <div>{q.mainText}</div>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Scrollable All Questions Display */}
            <div className="questions-display" ref={rightPanelRef}>
              {questions.map((question, questionIndex: number) => (
                <div 
                  key={question.questionId} 
                  className="question-header"
                  ref={(el) => (questionRefs.current[questionIndex] = el)}
                >
                  <div className="question-subheader">
                    <div>
                      <div className="question-number">
                        Question {questionIndex + 1} /{" "}
                        <span className="question-count">
                          {questions.length}
                        </span>
                        {question.isRequired ? (
                          <span className="text-red-600"> * </span>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="font-normal mt-[5px] mb-[10px] text-[18px]">
                        {question.mainText}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveQuestionId(question.questionId);
                        const existingNote = notes.find(
                          (n) =>
                            String(n.questionId) === String(question.questionId)
                        );
                        setComment(existingNote ? existingNote.comment : "");
                        setCommentModal(true);
                      }}
                    >
                      <StickyNote
                        className={`py-1 px-2 rounded-md stick-comment ${
                          notes.find(
                            (n) =>
                              n.questionId === question.questionId &&
                              n.comment.trim() !== ""
                          )
                            ? "has-note"
                            : ""
                        }`}
                        size={40}
                      />
                    </button>
                  </div>

                  {question.answerType === "choose_one" ? (
                    <div className="options-container">
                      {question.options?.map((option, optionIndex) => {
                        const isSelected = answers[questionIndex] === option;

                        return (
                          <label
                            key={optionIndex}
                            className={`flex items-center gap-2 p-1 cursor-pointer transition-colors duration-200 ${
                              isSelected ? "text-black" : "bg-white text-black"
                            }`}
                            onClick={() =>
                              handleOptionSelect(questionIndex, option)
                            }
                          >
                            <div
                              className={`h-5 w-5 flex items-center justify-center border-2 rounded-sm ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-400"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3.5 h-3.5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M5 13l4 4L19 7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>

                            <input
                              type="radio"
                              name={`question-${questionIndex}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="hidden"
                            />
                            <span className="flex-1 option-text">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : question.answerType === "yesno" ? (
                    <div className="options-container">
                      <div className="flex items-center gap-5 p-1">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            checked={answers[questionIndex] === "yes"}
                            onChange={() =>
                              handleOptionSelect(questionIndex, "yes")
                            }
                            className="scale-150"
                          />
                          <span className="option-text">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            checked={answers[questionIndex] === "no"}
                            onChange={() =>
                              handleOptionSelect(questionIndex, "no")
                            }
                            className="scale-150"
                          />
                          <span className="option-text">No</span>
                        </label>
                      </div>
                    </div>
                  ) : question.answerType === "text" ? (
                    <div className="options-container">
                      <textarea
                        value={answers[questionIndex] || ""}
                        onChange={(e) =>
                          handleOptionSelect(questionIndex, e.target.value)
                        }
                        rows={2}
                        placeholder="Type your answer here..."
                        className="text-input border-2 border-gray-300 rounded-md p-2 w-full"
                      />
                    </div>
                  ) : question.answerType === "number" ? (
                    <div className="options-container">
                      <input
                        type="number"
                        value={answers[questionIndex] || ""}
                        onChange={(e) =>
                          handleOptionSelect(questionIndex, e.target.value)
                        }
                        placeholder="Type your answer here..."
                        className="text-input border-2 border-gray-300 rounded-md p-2 w-full"
                      />
                    </div>
                  ) : question.answerType === "number_ws" ? (
                    <div className="options-container space-y-4">
                      <div className="options-container-top flex gap-4 items-center">
                        <input
                          type="number"
                          value={answers[questionIndex] || ""}
                          onChange={(e) =>
                            handleOptionSelect(questionIndex, e.target.value)
                          }
                          placeholder="Type your answer here..."
                          className="text-input border-2 border-gray-300 rounded-md p-2 w-full"
                        />
                        <button
                          onClick={() =>
                            calculateScore(question.questionId, questionIndex)
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition duration-200"
                        >
                          Score
                        </button>
                      </div>

                      <div className="options-container-bottom overflow-x-auto">
                        <table className="min-w-full border border-gray-300 rounded-md shadow-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left px-4 py-2 border-b border-gray-300 text-sm font-semibold text-gray-700 flex items-center justify-between">
                                <span>Score Zone</span>
                                <span className="ml-2 font-normal font-semibold text-gray-900">
                                  {selectedScoreZones[questionIndex]
                                    ? `Score: ${
                                        scoreValues[questionIndex] || ""
                                      } `
                                    : ""}
                                </span>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {question.scoreZones.map(
                              (zone: string, index: number) => {
                                const isSelected =
                                  selectedScoreZones[questionIndex] === zone;
                                return (
                                  <tr
                                    key={index}
                                    className={`even:bg-gray-50 ${
                                      isSelected ? "font-semibold" : ""
                                    }`}
                                  >
                                    <td className="px-4 py-2 border-b text-sm text-gray-600 flex items-center gap-2">
                                      {/* Fixed width placeholder for tick icon */}
                                      <span className="w-5 flex justify-center">
                                        {isSelected && (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-green-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        )}
                                      </span>
                                      {/* Text content */}
                                      <span>{zone}</span>
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : question.answerType === "date" ? (
                    <div className="options-container">
                      <input
                        type="date"
                        value={answers[questionIndex] || ""}
                        onChange={(e) =>
                          handleOptionSelect(questionIndex, e.target.value)
                        }
                        className="text-input border-2 border-gray-300 rounded-md p-2 w-full"
                      />
                    </div>
                  ) : question.answerType === "choose_many" ? (
                    <div className="options-container">
                      {question.options?.map(
                        (option: string, optionIndex: number) => {
                          const selectedOptions = Array.isArray(
                            answers[questionIndex]
                          )
                            ? answers[questionIndex]
                            : [];
                          const isChecked = selectedOptions.includes(option);
                          return (
                            <label
                              key={optionIndex}
                              className="flex items-center gap-2 p-1 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  handleChooseManyOption(questionIndex, option)
                                }
                              />
                              <span className="option-text">{option}</span>
                            </label>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal && (
        <div className="comment-modal">
          <div className="comment-modal-content">
            <h2 className="comment-modal-title">Add Comment</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Write your note..."
              className="comment-textarea"
            />
            <div className="comment-modal-buttons">
              <button
                onClick={() => setCommentModal(false)}
                className="comment-modal-button cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeQuestionId !== null) {
                    setNotes((prev) => [
                      ...prev.filter(
                        (n) => String(n.questionId) !== String(activeQuestionId)
                      ),
                      { questionId: activeQuestionId, comment },
                    ]);
                    setCommentModal(false);
                    setComment("");
                    setActiveQuestionId(null);
                  }
                }}
                className="comment-modal-button save"
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

export default QuestionPaper;