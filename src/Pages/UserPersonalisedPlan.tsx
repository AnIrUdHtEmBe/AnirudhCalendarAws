import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import {
  Activity_Api_call,
  DataContext,
  Plan_Api_call,
  Plan_Instance_Api_call,
  Session_Api_call,
} from "../store/DataContext";
import {
  ArrowRight,
  CirclePlus,
  Dumbbell,
  EyeIcon,
  LucideCircleMinus,
  MinusCircle,
  Plus,
  Trash2,
} from "lucide-react";
import "./UserPersonalisedPlan.css"; // Import the CSS file

import {
  DashboardCustomize,
  Mediation,
  NordicWalking,
} from "@mui/icons-material";
import Header from "../planPageComponent/Header";
import { useApiCalls } from "../store/axios";
import { useNavigate } from "react-router-dom";

function SessionPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const {
    selectComponent,
    setSelectComponent,
    sessions_api_call,
    activities_api_call,
    setSessions_api_call,
    
  } = useContext(DataContext)!;
  const [planName, setPlanName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const checkboxRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [sessionName, setSessionName] = useState("");
  const [category, setCategory] = useState("");
  const {
    getSessions,
    getActivities,
    createPlan,
    getActivityById,
    patchSession,
    getPlanByPlanId,
    getSessionById,
    createPlanInstance,
    getPlansFull,
    getExpandedPlanByPlanId
  } = useApiCalls();
  
  useEffect(() => {
    getSessions();
    getActivities();
    getPlansFull();
  }, []);
  
function deduplicatePlanInLocalStorage() {
  const plans = JSON.parse(localStorage.getItem("selectedPlan") || "{}");

  const sessions = Array.isArray(plans.sessions) ? plans.sessions : [];

  const uniqueSessionsMap = new Map();

  sessions.forEach((session) => {
    if (session?.sessionId && !uniqueSessionsMap.has(session.sessionId)) {
      uniqueSessionsMap.set(session.sessionId, session);
    }
  });

  const updatedPlans = {
    ...plans,
    sessions: Array.from(uniqueSessionsMap.values())
  };

  localStorage.setItem("selectedPlan", JSON.stringify(updatedPlans));

  console.log("✅ Deduplicated and saved plan:", updatedPlans);
}

const plans = JSON.parse(localStorage.getItem("selectedPlan") || "{}");





async function updateLocalStorage() {
  const storedPlan = JSON.parse(localStorage.getItem("selectedPlan") || "{}");

  if (!storedPlan.templateId) {
    console.error("❌ No templateId found in localStorage.");
    return;
  }

  const ans = [storedPlan.templateId];

  const res = await getExpandedPlanByPlanId(ans);

  if (res && Array.isArray(res) && res.length > 0) {
    localStorage.setItem("selectedPlan", JSON.stringify(res[0]));

    // Deduplicate
    deduplicatePlanInLocalStorage();

    // Update state
    const updatedPlan = JSON.parse(localStorage.getItem("selectedPlan") || "{}");
    setPlan(updatedPlan);
  } else {
    console.error("❌ No valid plan data received.");
  }
}

 const [plan, setPlan] = useState(null);

  
useEffect(() => {
  deduplicatePlanInLocalStorage();

  const storedPlan = JSON.parse(localStorage.getItem("selectedPlan") || "{}");
  setPlan(storedPlan);
}, []);

  

  const handleUpdatePlan = async () => {
    await updateLocalStorage();
    
    const updatedPlan = JSON.parse(localStorage.getItem("selectedPlan"));
    setPlan(updatedPlan); // This triggers re-render with updated plan
  };



  const user = JSON.parse(localStorage.getItem("user") || "error");
  const navigate=useNavigate()
  console.log(user);

  const [activePlan, setActivePlan] = useState<Session_Api_call | null>(null);
  const [gridAssignments, setGridAssignments] = useState<{
    [key: number]: any;
  }>({});

 const filteredPlans = plan?.sessions?.filter(
  (session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.category?.toLowerCase().includes(searchTerm.toLowerCase())
) || [];


  const filterPlansAccordingTo = (category: string) => {
    if (activeFilter === category) {
      setActiveFilter(null); // Remove filter if clicked again
      setSearchTerm(""); // Show all
    } else {
      setActiveFilter(category);
      setSearchTerm(category);
    }
  };

  const isAllSelected =
    filteredPlans?.length > 0 && selectedIds.length === filteredPlans.length;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < filteredPlans.length;
    }
  }, [selectedIds, filteredPlans?.length]);

  const createANewPlan = async() => {
    const sessionTemplateIds: string[] = [];
    const scheduledDates: string[] = [];

    Object.entries(gridAssignments).forEach(([keyStr, value]) => {
      const key = parseInt(keyStr, 10);
      const dateForSession = dayjs(selectedDate).add(key, "day"); // Add days to base date

      sessionTemplateIds.push(value.sessionId);
      scheduledDates.push(dateForSession.format("YYYY-MM-DD"));
    });

    const planToSubmit: Plan_Instance_Api_call = {
      sessionTemplateIds,
      scheduledDates,
    };

    const res= await createPlanInstance(plans.templateId, user.userId, planToSubmit);
    if(res){
      navigate('/Dashboard')
      setSelectComponent("seePlan")
    }
  };

  const toggleSelectAll = () => {
    // setSelectedIds(isAllSelected ? [] : filteredPlans.map((p) => p.id));

    if (isAllSelected) {
      setSelectedIds([]);
      setActivePlan(null);
    } else {
      setSelectedIds(filteredPlans.map((p) => p.sessionId));
    }
  };

  const handleSaveSesion = async () => {
    try {
      await patchSession(previewSession.sessionId, {
        title: sessionName == "" ?  previewSession.title : sessionName,
        description: previewSession.description,
        category: category == "" ? previewSession.category : category,
        activityIds: previewSession?.activityIds,
      });
      console.log("Session updated successfully");
    } catch (error) {
      console.error("❌ Error updating session:", error);
    }
    getSessions();
    setPreviewModalOpen(false);
    handleUpdatePlan();
  };
  useEffect(() => {
    console.log("gridAssignments", gridAssignments);
  }, [gridAssignments]);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      console.log(newSelected);
      // setting active plan for the communication of grid and colums
      if (newSelected.length === 1) {
        const plan = sessions_api_call.find(
          (p) => p.sessionId === newSelected[0]
        );
        console.log(plan);
        setActivePlan(plan || null);
      } else {
        setActivePlan(null);
      }
      return newSelected;
    });
  };

  const handleGridCellClick = (index: number) => {
    if (!activePlan) return; // If no plan is selected, do nothing

    setGridAssignments((prev) => ({
      ...prev,
      [index]: activePlan,
    }));
  };

  const handleDelete = () => {
    setSessions_api_call((prev) =>
      prev.filter((p) => !selectedIds.includes(p.sessionId))
    );
    setSelectedIds([]);
  };

  const [len, setLen] = useState(30);
  const [weeks, setWeeks] = useState([0, 1, 2, 3 ,4 ,5]); // represents 4 weeks initially

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSession, setPreviewSession] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const handleRemoveWeek = (weekNumberToRemove: number) => {
    // Step 1: Remove the actual week number
    setWeeks((prevWeeks) => {
      const filtered = prevWeeks.filter((w) => w !== weekNumberToRemove);
      // Also reindex all week numbers after the removed one (to shift them down)
      const updatedWeeks = filtered.map((w) =>
        w > weekNumberToRemove ? w - 1 : w
      );
      return updatedWeeks;
    });

    // Step 2: Rebuild gridAssignments
    setGridAssignments((prevAssignments) => {
      const updatedAssignments: typeof gridAssignments = {};

      Object.entries(prevAssignments).forEach(([keyStr, value]) => {
        const key = parseInt(keyStr, 10);
        const currentWeek = Math.floor(key / 7);
        const day = key % 7;

        if (currentWeek < weekNumberToRemove) {
          // Keep entries before the deleted week
          updatedAssignments[key] = value;
        } else if (currentWeek > weekNumberToRemove) {
          // Shift down week index by 1 for entries after the deleted week
          const newKey = (currentWeek - 1) * 7 + day;
          updatedAssignments[newKey] = value;
        }
        // Entries of the deleted week are skipped
      });

      return updatedAssignments;
    });
  };

  const handleClearWeek = (weekNumberToClear: number) => {
    setGridAssignments((prevAssignments) => {
      const updatedAssignments: typeof gridAssignments = { ...prevAssignments };

      // A week has 7 days, so delete keys from weekNumberToClear * 7 to weekNumberToClear * 7 + 6
      for (let i = 0; i < 7; i++) {
        const key = weekNumberToClear * 7 + i;
        delete updatedAssignments[key];
      }

      return updatedAssignments;
    });
  };

  const handlePreviewClick = (session: Session_Api_call) => {
    setPreviewSession(session);
    setPreviewModalOpen(true);
    setSelectedSession(session);

    console.log("Previewing session:", session);
  };

  useEffect(() => {
    console.log("preview session", previewSession);
  }, [previewSession]);

  function setActivityInThePreviewSession(e: SelectChangeEvent, idx: number) {
    const selectedValue = e.target.value;
    console.log("Selected value:", selectedValue);
    async function fetchActivityDetails() {
      const activityDetails = await getActivityById(selectedValue);
      console.log("Activity details:", activityDetails);
      setPreviewSession((prev: any) => {
        if (!prev) return prev;
        const updatedActivities = [...prev.activities];
        updatedActivities[idx] = activityDetails;

        const updatedActivityIds = [...prev.activityIds];
        updatedActivityIds[idx] = selectedValue;

        return {
          ...prev,
          activityIds: updatedActivityIds,
          activities: updatedActivities,
        };
      });
    }
    fetchActivityDetails();
    console.log("preview session", previewSession);
  }

  useEffect(() => {
    const call = async () => {
      const res = await getPlanByPlanId(plans.templateId);
      console.log("plan", res);

      const updatedAssignments = {}; // <- build a new object

      await Promise.all(
        res.sessions.map(async (session) => {
          const updateSession = await getSessionById(session.sessionId);
          updatedAssignments[session.scheduledDay] = {
            sessionId: session.sessionId,
            title: updateSession.title,
            description: updateSession.description,
            category: updateSession.category,
            activityIds: updateSession.activityIds,
          };
        })
      );

      setGridAssignments(updatedAssignments); // <- trigger React update
    };

    call();
  }, []);

  return (
    <div className="responses-root">
      <Header />

      <div className="main-container ">
        {/* Left Panel: Plans Table */}
        <div className="left-panel">
          {/* Top Bar */}
          <div className="top-bar">
            {selectComponent === "/plans" || selectComponent === "dashboard" ? (
              <div className="flex items-center justify-center gap-1">
                <span className="sessions-text-header">Sessions</span>
                <span className="all-button"> All</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            <div className="button-group">
              <button
                className={`filter-btn ${
                  activeFilter === "Fitness" ? "filter-btn-active" : ""
                }`}
                onClick={() => filterPlansAccordingTo("Fitness")}
              >
                <Dumbbell size={20} />
              </button>
              <button
                className={`filter-btn ${
                  activeFilter === "Wellness" ? "filter-btn-active" : ""
                }`}
                onClick={() => filterPlansAccordingTo("Wellness")}
              >
                <Mediation style={{ fontSize: "20px" }} />
              </button>
              <button
                className={`filter-btn ${
                  activeFilter === "Sports" ? "filter-btn-active" : ""
                }`}
                onClick={() => filterPlansAccordingTo("Sports")}
              >
                <NordicWalking style={{ fontSize: "20px" }} />
              </button>
            </div>

            <button
              className="border-2 border-gray-300 px-2 py-1 rounded-md"
              onClick={handleDelete}
              disabled={selectedIds.length === 0}
            >
              <Trash2 size={20} className="text-red-500" />
            </button>
            <button className="new-button">
              <Plus size={20} />
              <span>New</span>
            </button>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="plans-table">
              <thead>
                <tr>
                  <th className="inp-header">
                    <input
                      type="checkbox"
                      className="session-checkbox"
                      ref={checkboxRef}
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>

                  <th className="session-header">Session Name</th>
                  <th className="cat-header">Category</th>
                  <th className="prev-header">Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan, idx) => (
                  <tr key={idx} className="table-row">
                    <td>
                      <input
                        type="checkbox"
                        className="session-checkbox"
                        checked={selectedIds.includes(plan.sessionId)}
                        onChange={() => toggleSelectOne(plan.sessionId)}
                      />
                    </td>

                    <td className="session-name-title">{plan.title}</td>
                    <td>{plan.category}</td>
                    <td className="p-icon">
                      <button onClick={() => handlePreviewClick(plan)}>
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Plan Details & Calendar */}
        <div className="right-panel">
          <div className="plan-details">
            <div className=" right-panel-headerr">
              <div className="plan-name-input">
                {/* <label htmlFor="planName">Plan Name</label> */}
                <input
                  type="text"
                  id="planName"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Plan name "
                  className="placeholder:font-semibold placeholder:text-gray-950"
                />
              </div>

              {selectComponent === "planCreation" ? (
                <div className="right-panel-header-right-side-component">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                    disablePast     
                      label="Select start date"
                      value={selectedDate}
                      onChange={(newDate) => setSelectedDate(newDate)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          sx={{
                            height: 50,
                            "& .MuiInputBase-root": {
                              height: 50,
                              boxSizing: "border-box",
                            },
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>

                  {/* <button className="holder-right-sode">
                    <DashboardCustomize size={20} className="text-blue-500" />
                    <span className="customise-text">Customize</span>{" "}
                  </button> */}
                </div>
              ) : null}
            </div>
            {/* Plan Name Input */}

            {/* Calendar */}
            <div className="calendar">
              <div className="calendar-header">
                <h2>My Personalised Plan</h2>
              </div>
              <div className="calendar-grid">
                {weeks.map((weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    <div className="week Label flex justify-between items-center">
                      <span>Week {weekIndex + 1}</span>
                    </div>
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const index = weekIndex * 7 + dayIndex;
                      const assignedPlan = gridAssignments[index];

                      return (
                        <div
                          key={index}
                          className={`calendar-cell ${
                            activePlan && !(selectedIds.length > 1)
                              ? "clickable"
                              : ""
                          } ${selectedIds.length > 1 ? "disabled" : ""}`}
                          onClick={() => {
                            if (!(selectedIds.length > 1)) {
                              handleGridCellClick(index);
                              console.log("assignedPlan", assignedPlan);
                            }
                          }}
                        >
                          {assignedPlan ? (
                            <div className="assigned-plan">
                              <strong>{assignedPlan.title}</strong>
                              <div className="small">
                                {assignedPlan.category}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                    <button
                      className="flex justify-center items-center"
                      onClick={() => handleRemoveWeek(weekIndex)}
                    >
                      <MinusCircle size={20} className="text-red-500" />
                    </button>
                    <button onClick={() => handleClearWeek(weekIndex)}>
                      Clear 
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <div className="flex px-6 justify-between">
              <button
                className="bg-white text-blue-700 rounded-md px-4 py-2 flex space-x-3"
                onClick={() =>
                  setWeeks((prev) => [
                    ...prev,
                    prev.length > 0 ? Math.max(...prev) + 1 : 0,
                  ])
                }
              >
                <CirclePlus size={25} />
                <span className="text-blue">Add Week</span>
              </button>
              <button
                onClick={createANewPlan}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-10"
              >
                <span>Confirm</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewModalOpen && previewSession && (
        <div
          className=" fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div className="bg-transparent p-5 relative">
            <button
              className="text-gray-500 hover:text-gray-800 absolute top-2 right-2 bg-white rounded-2xl px-2 py-1 shadow-md z-1"
              onClick={() => setPreviewModalOpen(false)}
            >
              ✕
            </button>
            <div
              className="bg-white rounded-2xl shadow-2xl p-6 relative w-[800px] h-[600px] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Form Inputs */}
              <div className="flex gap-4 mb-6 justify-between">
                <div className="flex gap-6 ">
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full border-b border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Session name"
                  />
                  <FormControl fullWidth>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category-select"
                      value={category}
                      label="Category"
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <MenuItem value="FITNESS">Fitness</MenuItem>

                      <MenuItem value="SPORTS">Sports</MenuItem>

                      <MenuItem value="WELLNESS">Wellness</MenuItem>

                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <button
                  onClick={handleSaveSesion}
                  className="save-changes-button"
                >
                  Save changes
                </button>
              </div>

              {/* Activity Table */}
              <div className="overflow-x-auto">
                <table className="table-auto w-full border border-gray-200 rounded-md text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-center">Sl No</th>
                      <th className="px-4 py-2 text-center">Activity</th>
                      <th className="px-4 py-2 text-center">Description</th>
                      <th className="px-4 py-2 text-center">Time/Reps</th>
                      <th className="px-4 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSession.activities.map(
                      (activity: Activity_Api_call, idx: number) => (
                        <tr key={idx} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-center">{idx + 1}</td>
                          <td className="px-4 py-2 text-center">
                            <FormControl fullWidth size="small">
                              <InputLabel
                                sx={{ width: "200px", display: "inline-block" }}
                                id={`activity-select-label-${idx}`}
                              >
                                Activity
                              </InputLabel>
                              <Select
                                labelId={`activity-select-label-${idx}`}
                                id={`activity-select-${idx}`}
                                value={activity.activityId || ""}
                                label="Activity"
                                onChange={(e: SelectChangeEvent) => {
                                  setActivityInThePreviewSession(e, idx);
                                }}
                              >
                                {activities_api_call.map(
                                  (item: Activity_Api_call, index) => (
                                    <MenuItem
                                      key={index}
                                      value={item.activityId}
                                    >
                                      {item.name}
                                    </MenuItem>
                                  )
                                )}
                              </Select>
                            </FormControl>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {activity.description}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {activity.reps}
                          </td>
                          <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                            <button
                              onClick={() => {
                                setPreviewSession((prev: any) => {
                                  const updatedActivities =
                                    prev.activities.filter(
                                      (_: any, i: number) => i !== idx
                                    );

                                  const updatedActivityIds =
                                    prev.activityIds.filter(
                                      (_: any, i: number) => i !== idx
                                    );

                                  return {
                                    ...prev,
                                    activities: updatedActivities,
                                    activityIds: updatedActivityIds,
                                  };
                                });
                              }}
                            >
                              <LucideCircleMinus
                                className="text-red-400 hover:text-red-600"
                                size={24}
                              />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex pt-4 ">
                <button
                  className="bg-white border border-blue-500 text-blue-500 px-6 py-2 cursor-pointer rounded-lg transition duration-200 flex justify-center items-center space-x-2"
                  onClick={() => {
                    setPreviewSession((prev: any) => {
                      const updatedActivities = [
                        ...(prev.activities || []),
                        {},
                      ];
                      const updatedActivityIds = [
                        ...(prev.activityIds || []),
                        null,
                      ]; // or "" or a default value

                      return {
                        ...prev,
                        activities: updatedActivities,
                        activityIds: updatedActivityIds,
                      };
                    });
                  }}
                >
                  <Plus size={20} />
                  Add Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionPage;
