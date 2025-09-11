import { useContext, useEffect, useRef, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";

import {
  Activity_Api_call,
  DataContext,
  Plan_Api_call,
  Session_Api_call,
} from "../store/DataContext";
import {
  ArrowRight,
  CirclePlus,
  Dumbbell,
  EyeIcon,
  LucideCircleMinus,
  Plus,
  Trash2,
} from "lucide-react";
import "./SessionPage.css"; // Import the CSS file

import { Mediation, NordicWalking } from "@mui/icons-material";
import Header from "../planPageComponent/Header";
import { useApiCalls } from "../store/axios";
import PlanCreatorGrid from "./PlanCreatorGrid";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, API_BASE_URL2 } from "../store/axios";
function SessionPage() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState(28);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const {
    setSelectComponent,
    sessions_api_call,
    activities_api_call,
    setSessions_api_call,
  } = useContext(DataContext)!;
  const [planName, setPlanName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const checkboxRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [category, setCategory] = useState("");

  // *** NEW FILTER STATES ***
  const [planNameFilter, setPlanNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [theme, setTheme] = useState(""); // currently selected theme

  const [goal, setGoal] = useState(""); // current selected goal

  const [literals, setLiterals] = useState({
    themes: [],
    goals: [],
    category: [],
  });

  useEffect(() => {
    const fetchLiterals = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/session-template/getLiterlas`
        );
        const data = await response.json();
        setLiterals(data);
      } catch (error) {
        console.error("Failed to fetch literals:", error);
      }
    };
    fetchLiterals();
  }, []);

  useEffect(() => {
    if (activeFilter === null) {
      setCategoryFilter("");
    } else {
      setCategoryFilter(activeFilter.toUpperCase());
    }
  }, [activeFilter]);

  const handleCategoryFilterChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setCategoryFilter(value);
    if (value === "") {
      setActiveFilter(null);
    } else {
      setActiveFilter(value.toLowerCase());
    }
  };

  // console.log(selectedIds,"eleczzzz")
  const {
    getSessions,
    getActivities,
    createPlan,
    getActivityById,
    patchSession,
  } = useApiCalls();
  useEffect(() => {
    getSessions();
    getActivities();
    searchSessions(); 
  }, []);

  console.log(sessions_api_call);
  // grid and checked cell interaction
  const [activePlan, setActivePlan] = useState<Session_Api_call | null>(null);
const searchSessions = async () => {
  try {
    const body = {
      themes: theme ? [theme] : [],
      goals: goal ? [goal] : [],
      category: categoryFilter ? [categoryFilter] : [],
      matchMode: "any",
      skip: 0,
      limit: 500
    };

    const response = await fetch(
      `${API_BASE_URL}/session-templates/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    
    const data = await response.json();
    setSessions_api_call(data);
  } catch (error) {
    console.error("Failed to search sessions:", error);
  }
};
  // Updated filteredSessions applying *all* filters: your old searchTerm + activeFilter + new filters
// const filteredSessions = sessions_api_call.filter((plan) => {
//   const matchesSearchOrActiveFilter =
//     plan.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     plan.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (activeFilter
//       ? plan.category?.toLowerCase() === activeFilter.toLowerCase()
//       : true);
//   const matchesPlanNameFilter = planNameFilter
//     ? plan.title?.toLowerCase().includes(planNameFilter.toLowerCase())
//     : true;
//   const matchesCategoryFilter = categoryFilter
//     ? plan.category?.toLowerCase().includes(categoryFilter.toLowerCase())
//     : true;
// const matchesThemeFilter = theme && theme !== "All"
//   ? Array.isArray(plan.themes)
//     ? plan.themes.map(String).includes(theme)
//     : false
//   : true; // Show all when theme is empty, "all", or "n/a"
// const matchesGoalFilter = goal && goal !== "All" 
//   ? Array.isArray(plan.goals)
//     ? plan.goals.map(String).includes(goal)
//     : false
//   : true; // Show all when goal is empty, "all", or "n/a"
//   return (
//     matchesSearchOrActiveFilter &&
//     matchesPlanNameFilter &&
//     matchesCategoryFilter &&
//     matchesThemeFilter &&
//     matchesGoalFilter
//   );
// });
const filteredSessions = sessions_api_call.filter((plan) => {
  const matchesNameFilter = planNameFilter
    ? plan.title?.toLowerCase().includes(planNameFilter.toLowerCase())
    : true;
  const matchesSearchTerm = searchTerm
    ? plan.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.category?.toLowerCase().includes(searchTerm.toLowerCase())
    : true;
  
  return matchesNameFilter && matchesSearchTerm;
});

useEffect(() => {
  searchSessions();
}, [theme, goal, categoryFilter]);


  const filterPlansAccordingTo = (category: string) => {
    const categoryLower = category.toLowerCase();

    if (activeFilter === categoryLower) {
      // Clear selection
      setActiveFilter(null);
      setCategoryFilter("");
      setSearchTerm("");
    } else {
      setActiveFilter(categoryLower);
      setCategoryFilter(category.toUpperCase());
      setSearchTerm(category);
    }
  };

  const isAllSelected =
    filteredSessions.length > 0 &&
    selectedIds.length === filteredSessions.length;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < filteredSessions.length;
    }
  }, [selectedIds, filteredSessions.length]);

  const createANewPlan = () => {
    const planToSubmit: Plan_Api_call = {
      title: planName,
      description: "",
      category: "FITNESS",
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        scheduledDay: session.scheduledDay,
      })),
    };
    createPlan(planToSubmit);
  };

  const toggleSelectAll = () => {
    // setSelectedIds(isAllSelected ? [] : filteredSessions.map((p) => p.id));

    if (isAllSelected) {
      setSelectedIds([]);
      setActivePlan(null);
    } else {
      setSelectedIds(filteredSessions.map((p) => p.sessionId));
    }
  };

  const handleSaveSesion = async () => {
    try {
      await patchSession(previewSession.sessionId, {
        title: sessionName == "" ? previewSession.title : sessionName,

        description: previewSession.description,
        category: category == "" ? previewSession.category : category,
        activityIds: previewSession?.activityIds,
      });
      console.log("Session updated successfully");
    } catch (error) {
      console.error("❌ Error updating session:", error);
    }
    getSessions();
  };

  // const toggleSelectOne = (id: string) => {
  //   setSelectedIds((prev) => {
  //     const newSelected = prev.includes(id)
  //       ? prev.filter((i) => i !== id)
  //       : [...prev, id];
  //     console.log(newSelected,"newSelectedddd");
  //     // setting active plan for the communication of grid and colums
  //     if (newSelected.length === 1) {
  //       const plan = sessions_api_call.find(
  //         (p) => p.sessionId === newSelected[0]
  //       );
  //       console.log(plan,"9999000");
  //       setActivePlan(plan || null);
  //     } else {
  //       setActivePlan(null);
  //     }
  //     return newSelected;
  //   });
  // };
  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [id];
      console.log(newSelected, "newSelectedddd");
      // setting active plan for the communication of grid and colums
      if (newSelected.length === 1) {
        const plan = sessions_api_call.find(
          (p) => p.sessionId === newSelected[0]
        );
        console.log(plan, "9999000");
        setActivePlan(plan || null);
      } else {
        setActivePlan(null);
      }
      return newSelected;
    });
  };

  const handleDelete = () => {
    setSessions_api_call((prev) =>
      prev.filter((p) => !selectedIds.includes(p.sessionId))
    );
    setSelectedIds([]);
  };

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSession, setPreviewSession] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const handlePreviewClick = (session: Session_Api_call) => {
    setPreviewSession(session);
    setPreviewModalOpen(true);
    setSelectedSession(session);

    console.log("Previewing session:", session);
  };

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

  // new states
  const [sessions, setSessions] = useState<any>([]);
  const [sessionSelected, setSessionSelected] = useState<any>(null);
  const [updateModal, setUpdateModal] = useState<number | null>(null);

  // new functions

  const sessionConverter = (session: Session_Api_call) => {
    const convertSession = {
      ...session,
      scheduledDay: undefined,
    };
    console.log(convertSession);
    setSessionSelected(convertSession);
    // setSessions((prev) => [...prev, convertSession]);
  };

  const addingSessionToGrid = (day: number) => {
    if (!sessionSelected) return;

    const existingSession = sessions.find(
      (session) => session.scheduledDay === day
    );
    console.log(existingSession);

    if (existingSession) {
      setUpdateModal(day);
    } else {
      const newSession = { ...sessionSelected, scheduledDay: day };
      setSessions((prevSessions) => [...prevSessions, newSession]);
    }
  };

  const handleUpdateExistingSession = () => {
    setSessions((prevSessions) =>
      prevSessions.filter((session) => session.scheduledDay !== updateModal)
    );

    const newSession = {
      ...sessionSelected,
      scheduledDay: updateModal,
    };
    setSessions((prevSessions) => [...prevSessions, newSession]);
  };

  const deletingSessionFromGrid = (day: number) => {
    setSessions((sessions) =>
      sessions.filter((session) => session.scheduledDay !== day)
    );
  };

  console.log(sessions);
  console.log(updateModal);

  const handleRouting = () => {
    navigate("/sessions");
    setSelectComponent("/sessions");
  };
  return (
    <div className="responses-root">
      <Header />

      <div className="main-container  ">
        {/* Left Panel: Plans Table */}
        <div className="left-panel">
          {/* Top Bar */}
          <div className="top-bar">
            <div className="flex items-center justify-center gap-1">
              <span className="sessions-text-header">Sessions</span>
              <span className="all-button"> All</span>
            </div>

            <div className="button-group">
              <button
                className={`filter-btn ${
                  activeFilter === "fitness" ? "filter-btn-active" : ""
                }`}
                onClick={() => filterPlansAccordingTo("Fitness")}
              >
                <Dumbbell size={20} />
              </button>
              <button
                className={`filter-btn ${
                  activeFilter === "wellness" ? "filter-btn-active" : ""
                }`}
                onClick={() => filterPlansAccordingTo("Wellness")}
              >
                <Mediation style={{ fontSize: "20px" }} />
              </button>
              <button
                className={`filter-btn ${
                  activeFilter === "sports" ? "filter-btn-active" : ""
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
            <button className="new-button" onClick={handleRouting}>
              <Plus size={20} />
              <span>New</span>
            </button>
          </div>

          {/*New filter inputs with improved responsive structure*/}
          <div className="filter-inputs-container">
            <div className="filter-input-wrapper">
              <FormControl fullWidth variant="standard" sx={{ minWidth: 0 }}>
                <TextField
                  label="Session Name"
                  variant="standard"
                  value={planNameFilter}
                  onChange={(e) => setPlanNameFilter(e.target.value)}
                  InputProps={{
                    sx: {
                      fontSize: { xs: "1rem", sm: "1.25rem" },
                      fontFamily: "Roboto",
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                  }}
                />
              </FormControl>
            </div>

            <div className="filter-input-wrapper">
              <FormControl fullWidth variant="standard" sx={{ minWidth: 0 }}>
                <InputLabel
                  id="category-filter-label"
                  shrink={true}
                  sx={{
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                >
                  Category
                </InputLabel>
                <Select
                  labelId="category-filter-label"
                  value={categoryFilter}
                  label="Category"
                  onChange={handleCategoryFilterChange}
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                    fontFamily: "Roboto",
                  }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {literals.category.map((cat, i) => (
                    <MenuItem key={i} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="filter-input-wrapper">
              <FormControl fullWidth variant="standard" sx={{ minWidth: 0 }}>
                <InputLabel id="theme-select-label" shrink={true}>
                  Theme
                </InputLabel>
                <Select
                  labelId="theme-select-label"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) return <span></span>;
                    return selected;
                  }}
                  sx={{ fontSize: "1.25rem", fontFamily: "Roboto" }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {literals.themes.map((theme, i) => (
                    <MenuItem key={i} value={theme}>
                      {theme}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="filter-input-wrapper">
              <FormControl fullWidth variant="standard" sx={{ minWidth: 0 }}>
                <InputLabel id="goal-select-label" shrink={true}>
                  Goal
                </InputLabel>
                <Select
                  labelId="goal-select-label"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  displayEmpty
                  sx={{ fontSize: "1.25rem", fontFamily: "Roboto" }}
                  renderValue={(selected) => {
                    if (!selected) return <span></span>;
                    return selected;
                  }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {literals.goals.map((goal, i) => (
                    <MenuItem key={i} value={goal}>
                      {goal}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Table */}
          <div className="table-container1">
            <table className="plans-table">
              <thead>
                <tr>
                  <th className="inp-header">
                    {/* <input
                      type="checkbox"
                      className="session-checkbox"
                      ref={checkboxRef}
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    /> */}
                  </th>

                  <th className="session-header">Session Name</th>
                  <th className="cat-header">Category</th>
                  <th className="prev-header">Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session, idx) => (
                  <tr
                    onClick={() => sessionConverter(session)}
                    key={session.sessionId}
                    className={`table-row ${
                      session.sessionId === sessionSelected?.sessionId
                        ? "selected_plan"
                        : ""
                    }`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        className="session-checkbox"
                        checked={selectedIds.includes(session.sessionId)}
                        onChange={() => toggleSelectOne(session.sessionId)}
                      />
                    </td>

                    <td className="plan-title" style={{ marginBottom: "18px" }}>
                      {session.title}
                    </td>
                    <td>{session.category}</td>
                    <td className="p-icon">
                      <button onClick={() => handlePreviewClick(session)}>
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
            </div>
            {/* Plan Name Input */}

            {/* Calendar */}
            <div className="pl-5 pr-5 pb-5">
              <PlanCreatorGrid
                sessions={sessions}
                blocks={blocks}
                selectedSession={sessionSelected}
                addingSessionToGrid={addingSessionToGrid}
                deletingSessionFromGrid={deletingSessionFromGrid}
              ></PlanCreatorGrid>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex px-6 justify-between">
            <button
              className="bg-white text-blue-700 rounded-md px-4 py-2 flex space-x-3"
              onClick={() => setBlocks((prev) => prev + 7)}
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
                                // setPreviewSession((prev: any) => {
                                //   const updatedActivities =
                                //     prev.activities.filter(
                                //       (_: any, i: number) => i !== idx
                                //     );
                                //   return {
                                //     ...prev,
                                //     activities: updatedActivities,
                                //   };
                                // });
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

      {updateModal !== null && (
        <div className="update-modal-overlay">
          <div className="update-modal">
            <p className="update-modal-text">
              Are you sure you want to replace the session for day {updateModal}
              ?
            </p>
            <div className="update-modal-actions">
              <button
                className="update-modal-btn yes"
                onClick={() => {
                  handleUpdateExistingSession();
                  setUpdateModal(null);
                }}
              >
                Yes
              </button>
              <button
                className="update-modal-btn no"
                onClick={() => setUpdateModal(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionPage;
