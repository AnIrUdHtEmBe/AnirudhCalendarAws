import {
  Cross,
  Crosshair,
  CrossIcon,
  FileText,
  Plus,
  Save,
  Trash,
  Trash2,
  X,
} from "lucide-react";
import {
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Box,
  TextField,
} from "@mui/material";

import ShortTextIcon from "@mui/icons-material/ShortText";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import NumbersIcon from "@mui/icons-material/LooksOne";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import "./QuestionBank.css";
import { useContext, useEffect, useState, useRef } from "react";

import { useApiCalls } from "../store/axios";
import { DataContext } from "../store/DataContext";
import { LowPriority } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import AssessmentPage from "../Pages/ViewAllAssessment";
import { useLocation } from "react-router-dom";


const questionTypes = [
  { label: "Text Input", value: "text", icon: <ShortTextIcon /> },
  {
    label: "Number Input with Score",
    value: "number_ws",
    icon: <NumbersIcon />,
  },
  {
    label: "Single Choice",
    value: "choose_one",
    icon: <RadioButtonCheckedIcon />,
  },
  { label: "Multiple Choice", value: "choose_many", icon: <CheckBoxIcon /> },
  { label: "Number Input", value: "number", icon: <NumbersIcon /> },
  { label: "Yes No", value: "yesno", icon: <RadioButtonCheckedIcon /> },
  { label: "Date Selector", value: "date", icon: <CalendarTodayIcon /> },
];

const QuestionBank = () => {
  const fetchQuestions = async () => {
    try {
      await questions(); // likely sets questionsForAPICall inside context
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };
  const { selectComponent, questionsForAPICall ,setSelectComponent} = useContext(DataContext);
  const [headingText,setheadingText]=useState("Questionnaire Creation")
  const navigate=useNavigate();
  const handleSelection=async(dataString:string)=>{
    // if(dataString=='question'){
    //   // navigate('/question-bank')
    //   setSelectComponent('/question-bank')
    //   setheadingText("Questionnaire Creation")
    // }else 
    if(dataString=='assignment'){
      // navigate('/assignment')
      console.log("reached assignme")
      setSelectComponent('/assignment')
      setheadingText("Assignmentsnnnnnnn")
    }
  }
  // used to fetch question
  useEffect(() => {
    fetchQuestions();
  }, []);


  // used to stored editted copy of questions
  const [shouldEdit, setShouldEdit] = useState(false);
  useEffect(() => {
    if (questionsForAPICall && questionsForAPICall.length > 0) {
      // Replace instead of append to avoid duplication
      const transformed = questionsForAPICall.map((q) => ({
        checked: false,
        mainText: q.mainText,
        answerType: q.answerType,
        options: q.options,
        questionId: q.questionId,
        scoreZones: q.scoreZones,
      }));
      setQuestion(transformed); // replaces the state instead of appending

      setShouldEdit(true); // trigger edit after question state updates
    }
  }, [questionsForAPICall]);

  const {
    Question_creation_Api_call,
    questions,
    question_Updation,
    questionCreation,
  } = useApiCalls();

  const [question, setQuestion] = useState([]);
  const [type, setType] = useState("");
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [options, setOptions] = useState([]);
  const [scoreZones, setScoreZones] = useState([]);
  // console.log(question);

  const inputRef = useRef(null);

  const handleApiCall = async () => {
    console.log("API call initiated");
    try {
      if (!question.length) {
        alert("Please add a question before making the API call.");
        return;
      }

      if (question.filter((q) => q.checked).length === 0) {
        alert("Please select at least one question to save.");
        return;
      }

      const response = await Question_creation_Api_call(question);
      console.log("API call successful:", response);
      alert("Questions saved successfully!");
      fetchQuestions(); // Refresh the questions after saving
    } catch (error) {
      console.error("API call failed:", error);
    }
  };
  const [editingIndex, setEditingIndex] = useState(null);

  const editQuestion = (index) => {
    const selectedQuestion = question[index];

    selectedQuestion.checked = true; // Ensure the question is checked when editing
    setValue(selectedQuestion.mainText);
    setType(selectedQuestion.answerType);
    setOptions(selectedQuestion.options || []);
    setScoreZones(selectedQuestion.scoreZones || []);
    setChecked(selectedQuestion.checked);
    setEditingIndex(index); // track which question is being edited
  };

  const updateQuestion = (index, updatedData) => {
    setQuestion((prevQuestions) =>
      prevQuestions.map((q, i) => (i === index ? { ...q, ...updatedData } : q))
    );
  };

  const addQuestion = () => {
    if (
      question[question.length - 1].mainText === "" &&
      question[question.length - 1].answerType === ""
    ) {
      editQuestion(question.length - 1);
      inputRef.current.focus();
      alert("Please fill the last question before adding a new one.");
      return;
    }
    question.push({
      checked: false,
      mainText: "",
      answerType: "",
      options: [],
    });
    setQuestion([...question]);
    setEditingIndex(question.length - 1); // Set the last question as the one being edited
    setValue("");
    setType("");
    setOptions([]);
    setChecked(false);
    inputRef.current.focus();
  };

  const handleAddQuestion = () => {
    if (!type.trim()) {
      alert("Please select a question type.");
      return;
    }

    const filteredOptions =
      type === "choose_one" || type === "choose_many"
        ? options
            .map((opt) =>
              typeof opt === "string" ? opt.trim() : typeof opt === "object"
            )
            .filter((opt) => opt !== "")
        : [];

    const newQuestion = {
      checked: true,
      mainText: value,
      answerType: type,
      options: filteredOptions,
      scoreZones: type === "number_ws" ? scoreZones : null,
    };

    if (editingIndex !== null) {
      updateQuestion(editingIndex, newQuestion);
      const questionId = question[editingIndex].questionId;
      if (questionId) {
        question_Updation(questionId, newQuestion);
      } else {
        questionCreation(newQuestion);
      }
      setEditingIndex(null);
    } else {
      setQuestion((prev) => [...prev, newQuestion]);
    }

    // Reset fields
    setValue("");
    setType("");
    setOptions([]);
    setChecked(false);
    setShouldEdit(true); // Trigger edit mode for the newly added question
  };

  const handleEditDone = () => {
    setValue("");
    setType("");
    setOptions([]);
    setChecked(false);
    if (editingIndex !== null) {
      const updatedQuestions = [...question];
      updatedQuestions[editingIndex].checked = false;
      setQuestion(updatedQuestions);
      setEditingIndex(null);
    }
  };
  useEffect(() => {
    if (shouldEdit && question.length > 0) {
      editQuestion(0);
      console.log("works");
      setShouldEdit(false);
    } else {
      // console.log("hi");
      console.log(question.length);
    }
  }, [shouldEdit, question]); // 👈 Add questions to the dependency array

  console.log("selectComponent:", selectComponent);
  const location = useLocation();

useEffect(() => {
  // If current path is '/question-bank' and selectComponent isn't '/question-bank', set it
  if (location.pathname === "/question-bank" && selectComponent !== "/question-bank") {
    setSelectComponent("/question-bank");
    setheadingText("Questionnaire Creation"); // Optional: update heading text here on load too
  }
}, [location.pathname, selectComponent, setSelectComponent]);

  return (
    <div className="question-bank-container">
      
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
    
      {/* main body */}
      { selectComponent==="/question-bank" &&(
        <div className="question-bank-body-container">
          <div className="question-bank-main-container">
            {/* main conatiner header */}
              <div className="question-bank-main-header">
                <span className="question-bank-main-header-title">
                  Question Bank
                </span>
                {/* <button
                  className="question-bank-main-header-button"
                  onClick={handleApiCall}
                >
                  <Save></Save>
                  <span>Save</span>
                </button> */}
              </div>
              {/* <div className="question-bank-main-body-left-header">
                  <span className="question-bank-main-body-left-header-title">
                    Questions
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="question-bank-main-body-left-content-add-button"
                      onClick={addQuestion}
                    >
                      <Plus size={13}></Plus>
                      <span>Add Question</span>
                    </button>
                    <button
                      className="question-bank-main-body-left-header-button"
                      // onClick={handleEditDone}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div> */}

            {/* main conatianer body */}
            <div className="question-bank-main-body">
              {/* main body left side  */}
              <div className="question-bank-main-body-left">
                <div className="question-bank-main-body-left-header">
                  <span className="question-bank-main-body-left-header-title">
                    Questions
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="question-bank-main-body-left-content-add-button"
                      onClick={addQuestion}
                    >
                      <Plus size={13}></Plus>
                      <span>Add Question</span>
                    </button>
                    <button
                      className="question-bank-main-body-left-header-button"
                      // onClick={handleEditDone}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="question-bank-main-body-left-content">
                  {question.map((item, index) => (
                    <div
                      key={index}
                      className="question-bank-main-body-left-item"
                    >
                      <input
                        type="radio"
                        name="question-select"
                        checked={editingIndex === index}
                        onChange={() => editQuestion(index)}
                      />
                      <span>{index + 1})</span>
                      <span
                        // onClick={() => editQuestion(index)}
                        className="question-bank-main-body-left-item-text"
                      >
                        {item.mainText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* main body right side */}
              <div className="question-bank-main-body-right">
                <div className="question-bank-main-body-right-box">
                  <div className="question-bank-main-body-right-header">
                    {editingIndex !== null ? (
                      <span className="question-bank-main-body-right-header-title">
                        {editingIndex + 1})
                      </span>
                    ) : (
                      <span className="question-bank-main-body-right-header-title">
                        {question.length + 1})
                      </span>
                    )}

                    <FormControl size="small" sx={{ width: "200px" }}>
                      <InputLabel id="question-type-label">
                        Select Question Type
                      </InputLabel>
                      <Select
                        labelId="question-type-label"
                        id="question-type-select"
                        value={type}
                        label="Select Question Type"
                        onChange={(e) => setType(e.target.value)}
                        renderValue={(selected) => {
                          const selectedItem = questionTypes.find(
                            (item) => item.value === selected
                          );
                          return (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {selectedItem?.icon}
                              {selectedItem?.label}
                            </Box>
                          );
                        }}
                      >
                        {questionTypes.map((item) => (
                          <MenuItem
                            key={item.value}
                            value={item.value}
                            sx={{ fontSize: "0.875rem", py: 0.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{ fontSize: "0.875rem" }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>

                  <div className="question-bank-main-body-right-content">
                    <TextField
                      inputRef={inputRef}
                      label=""
                      value={value}
                      variant="standard"
                      onChange={(e) => setValue(e.target.value)}
                      InputProps={{
                        sx: {
                          fontSize: "0.9rem", // input text size
                          fontWeight: 500, // input text weight
                          paddingY: 0.5, // vertical padding
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          fontSize: "1rem", // label text size
                          fontWeight: 400, // label text weight
                        },
                      }}
                      sx={{
                        width: "100%", // Makes the TextField shrink to fit
                      }}
                    />

                    {type === "choose_one" || type === "choose_many" ? (
                      <div className="question-option-container">
                        {options.map((option, index) => (
                          <div key={index} className="question-option">
                            {type === "choose_one" ? (
                              <input
                                type="radio"
                                name="question" // Make sure all radio buttons share the same name
                                value={option}
                              />
                            ) : (
                              <input type="Checkbox" />
                            )}
                            <TextField
                              label={`Option ${index + 1}`}
                              variant="standard"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[index] = e.target.value;
                                setOptions(newOptions);
                              }}
                              InputProps={{
                                sx: {
                                  fontSize: "0.9rem", // input text size
                                  fontWeight: 500, // input text weight
                                  paddingY: 0.5, // vertical padding
                                },
                              }}
                              InputLabelProps={{
                                sx: {
                                  fontSize: "1rem", // label text size
                                  fontWeight: 400, // label text weight
                                },
                              }}
                              sx={{
                                width: "200px", // control the overall width
                              }}
                            />
                            <button
                              className="remove-option-button"
                              onClick={() => {
                                const newOptions = options.filter(
                                  (_, i) => i !== index
                                );
                                console.log(index);
                                console.log(options);

                                console.log(newOptions);

                                setOptions(newOptions);
                              }}
                            >
                              <X className="border-2 rounded-full" size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="add-option-button"
                          onClick={() => {
                            const newOption = "";
                            setOptions([...options, newOption]);
                          }}
                        >
                          <Plus size={13}></Plus>
                          <span>Add Option</span>
                        </button>
                      </div>
                    ) : (
                      ""
                    )}

                    {type === "number_ws" ? (
                      <div className="question-option-container">
                        {scoreZones.map((option, index) => (
                          <div key={index} className="question-option">
                            <input type="checkbox" />
                            <TextField
                              label={`ScoreZone ${index + 1}`}
                              variant="standard"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...scoreZones];
                                newOptions[index] = e.target.value;
                                setScoreZones(newOptions);
                              }}
                              InputProps={{
                                sx: {
                                  fontSize: "0.9rem",
                                  fontWeight: 500,
                                  paddingY: 0.5,
                                },
                              }}
                              InputLabelProps={{
                                sx: {
                                  fontSize: "1rem",
                                  fontWeight: 400,
                                },
                              }}
                              sx={{ width: "200px" }}
                            />
                            <button
                              className="remove-option-button"
                              onClick={() => {
                                const newOptions = scoreZones.filter(
                                  (_, i) => i !== index
                                );
                                setScoreZones(newOptions);
                              }}
                            >
                              <X className="border-2 rounded-full" size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="add-option-button"
                          onClick={() => {
                            const newOption = "";
                            setScoreZones([...scoreZones, newOption]);
                          }}
                        >
                          <Plus size={13}></Plus>
                          <span>Add</span>
                        </button>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                {question[editingIndex]?.questionId ? (
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleAddQuestion}
                      className="question-bank-main-body-left-content-add-button"
                    >
                      Update changes
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleAddQuestion}
                      className="question-bank-main-body-left-content-add-button"
                    >
                      Add a new Question
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>)}
    </div>
  );
};

export default QuestionBank;
