import { useContext, useState, useEffect } from "react";
import { DataContext } from "../store/DataContext";
import { ChevronRight, X } from "lucide-react";
import { useApiCalls } from "../store/axios";
import "./QuestionPaperSet.css";
import { Switch } from "@mui/material";

import {
  Question_Api_call,
  createAssessmentTemplate,
} from "../store/DataContext";
import { enqueueSnackbar } from "notistack";


function QuestionPaperSet() {
  const { questions, submitAssesment } = useApiCalls();
  useEffect(() => {
    questions();
  }, []);
  const context = useContext(DataContext);

  if (!context) return <div>Loading...</div>;

  const {
    setSelectComponent,
    selectComponent,
    setQuestionsForAPICall,
    questionsForAPICall,
  } = context;
  const [assesmentName, setAssesmentName] = useState<string>("");
  const [assesmentTemplate, setAssesmentTemplate] =
    useState<createAssessmentTemplate>({
      name: assesmentName,
      questions: [],
    });
  const [showOptions, setShowoptions] = useState(true);

  const [selectedQuestion, setSelectedQuestions] = useState<
    Question_Api_call[]
  >([]);
  const [finalQuestion, setFinalQuestion] = useState<Question_Api_call[]>([]);

  console.log(finalQuestion);

  const formSubmission = async () => {
    try {
      // Build the template directly from finalQuestion
      const updatedTemplate = {
        name: assesmentName,
        questions: finalQuestion.map((question) => ({
          questionId: question.questionId,
          isRequired: isQuestionRequired(question.questionId),
        })),
      };

      setAssesmentTemplate(updatedTemplate);

      console.log("Assessment Template to submit:", updatedTemplate);
      if (!updatedTemplate.name || updatedTemplate.questions.length === 0) {
        // window.alert("Please provide a name and add at least one question.");
        enqueueSnackbar(
          "Please provide a name and add at least one question.",
          {
            variant: "warning",
            autoHideDuration: 3000,
          }
        );
        return;
      }

      await submitAssesment(updatedTemplate);

      enqueueSnackbar("Assessment created successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });
      // Optionally, you can navigate away or reset state here
    } catch (error) {
      console.error("❌ Error submitting assessment:", error);
      // Show failure alert
      enqueueSnackbar("Failed to create assessment. Please try again.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleSelect = (question: Question_Api_call) => {
    if (selectedQuestion.includes(question)) {
      setSelectedQuestions(
        selectedQuestion.filter((item) => item !== question)
      );
    } else {
      setSelectedQuestions([...selectedQuestion, question]);
    }
  };

  const handleMoveToQp = () => {
    const newQuestions = selectedQuestion
      .filter(
        (question) =>
          !finalQuestion.some((q) => q.questionId === question.questionId)
      )
      .map((q) => ({ ...q })); // Add required field

    setFinalQuestion([...finalQuestion, ...newQuestions]);
    setSelectedQuestions([]);
  };

  const toggleRequired = (id: string) => {
    setAssesmentTemplate((prev) => {
      const exists = prev.questions.find((q) => q.questionId === id);

      const updatedQuestions = exists
        ? prev.questions.map((question) =>
            question.questionId === id
              ? { ...question, isRequired: !question.isRequired }
              : question
          )
        : [...prev.questions, { questionId: id, isRequired: true }];

      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
  };

  const isQuestionRequired = (id: string) => {
    const found = assesmentTemplate.questions.find((q) => q.questionId === id);
    return found?.isRequired || false;
  };

  let questionIdNumber = 1;
  const handleDelete = (question: Question_Api_call) => {
    const deletedSet = finalQuestion.filter(
      (item) => item.questionId !== question.questionId
    );
    setFinalQuestion(deletedSet);
  };

  return (
    <div className="qp-container">

      {/* Header */}
      <div className="qp-header">
        <div className="qp-header-text">
          <input
            className="qp-title-assesment"
            placeholder="Assessment Name"
            value={assesmentName}
            onChange={(e) => setAssesmentName(e.target.value)}
          ></input>
          <p className="qp-description">Description</p>
        </div>
        <button onClick={formSubmission} className="qp-finish-btn">
          Finish
        </button>
      </div>

      {/* Main Content */}
      <div className="qp-content">
        {/* Question Selection Panel */}
        <div className="qp-question-bank">
          <h2 className="qp-section-title">Questions</h2>
          <div className="qp-question-list">
            {questionsForAPICall.map((question) => (
              <div key={question.questionId} className="qp-question-item">
                <input
                  type="checkbox"
                  onClick={() => handleSelect(question)}
                  checked={selectedQuestion.some(
                    (q) => q.questionId === question.questionId
                  )}
                  className="qp-checkbox"
                />
                <label className="qp-label">
                  <span className="qp-label-id">{questionIdNumber++})</span>
                  {question.mainText}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Button Panel */}
        <div className="qp-move-btn-container">
          <button className="qp-move-btn" onClick={handleMoveToQp}>
            Move To QP <ChevronRight size={20} />
          </button>
        </div>

        {/* Final Question Paper Section */}
        <div className="qp-final-section">
          <div className="qp-toggle-section">
            {/* NOTE THE BELOW CODE IS NO TO BE REMOVED , THIS IS AN IMPORTANT PIECE OF CODE  */}

            {/* <span className="qp-toggle-text">Q only</span>
            <button
              className="qp-toggle-options"
              onClick={() => setShowoptions(!showOptions)}
            >
              <Switch defaultChecked></Switch>
            </button>
            <span className="qp-toggle-text">Q & A</span> */}
          </div>

          {finalQuestion.length !== 0 ? (
            finalQuestion.map((question, index) => (
              <div
                key={index}
                className={`qp-final-question ${
                  showOptions ? "qp-show" : "qp-hide"
                }`}
              >
                <div className="qp-final-header">
                  <div className="qp-question-header">
                    <span className="qp-question-number">
                      Question {index + 1} /
                      <span className="qp-question-count">
                        {finalQuestion.length}
                      </span>
                    </span>
                    <button className="qp-required-toggle">
                      <Switch
                        checked={isQuestionRequired(question.questionId)}
                        onChange={() => toggleRequired(question.questionId)}
                      />
                      <span className="qp-required-text">
                        {isQuestionRequired(question.questionId)
                          ? "Required"
                          : "Not-Required"}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(question)}
                    className="qp-delete-btn"
                  >
                    <X color="red" size={25} />
                  </button>
                </div>

                <p className="qp-question-text">{question.mainText}</p>

                {showOptions && (
                  <>
                    {question.answerType === "choose_one" ||
                    question.answerType === "choose_many" ? (
                      <div className="qp-options">
                        {question.options?.map((item, i) => (
                          <div key={i} className="qp-option">
                            <input className="qp-checkbox" type="checkbox" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    ) : question.answerType === "text" ? (
                      <div>
                        <textarea
                          className="qp-textarea"
                          placeholder="This is the format to type your answer here...This will not be Saved in the database"
                        ></textarea>
                      </div>
                    ) : question.answerType === "number" ? (
                      <div>
                        <input
                          type="number"
                          className="qp-number-input"
                          placeholder="Answer will be a number...This will not be Saved in the database"
                        />
                      </div>
                    ) : question.answerType === "date" ? (
                      <div>
                        <input
                          type="date"
                          className="qp-date-input"
                          placeholder="Answer will be a Date...This will not be Saved in the database"
                        />
                      </div>
                    ) : question.answerType === "yesno" ? (
                      <div className="qp-radio">
                        <input
                          type="radio"
                          name={`yesno-${question.questionId}`}
                          value="yes"
                        />
                        <label>Yes</label>
                        <input
                          type="radio"
                          name={`yesno-${question.questionId}`}
                          value="no"
                        />
                        <label>No</label>
                      </div>
                    ) : question.answerType === "number_ws" ? (
                      <div>
                        <table className="min-w-full border border-gray-300 rounded-md shadow-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left px-4 py-2 border-b border-gray-300 text-sm font-semibold text-gray-700 flex items-center justify-between">
                                <span>Score Zone</span>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {question.scoreZones.map(
                              (zone: string, index: number) => {
                                return (
                                  <tr key={index} className={`even:bg-gray-50`}>
                                    <td className="px-4 py-2 border-b text-sm text-gray-600 flex items-center gap-2">
                                      <span>{zone}</span>
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      ""
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="qp-no-questions">
              No Questions Added
              <br />
              Please select questions from the left panel
              <br />
              and click on Move to QP
              <br />
              Note: You can select multiple questions at once
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionPaperSet;
