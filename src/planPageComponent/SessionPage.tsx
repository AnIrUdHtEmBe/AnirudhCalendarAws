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
  const [planCategory, setPlanCategory] = useState("");
  const [planTheme, setPlanTheme] = useState("");
  const [planGoal, setPlanGoal] = useState("");
  const [sessionThemes, setSessionThemes] = useState<string[]>([]);
  const [sessionGoals, setSessionGoals] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

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
        limit: 500,
      };

      const response = await fetch(`${API_BASE_URL}/session-templates/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

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
      category: planCategory || "FITNESS",
      themes: planTheme ? [planTheme] : ["NA"],
      goals: planGoal ? [planGoal] : ["NA"],
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        scheduledDay: session.scheduledDay,
      })),
    };
    createPlan(planToSubmit);
    setPlanName("");
    setSessions([]);
    setSessionSelected(null);
    setBlocks(28);
    setTheme("");
    setGoal("");
    setCategoryFilter("");
    setActiveFilter(null);
    setPlanNameFilter("");
    setSearchTerm("");
    setSelectedIds([]);
    setPlanCategory("");
    setPlanTheme("");
    setPlanGoal("");
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
        themes: selectedTheme ? [selectedTheme] : previewSession.themes,
        goals: selectedGoal ? [selectedGoal] : previewSession.goals,
        activityIds: previewSession?.activityIds,
      });
      console.log("Session updated successfully");

      // Close modal and refresh
      setPreviewModalOpen(false);
      getSessions();
    } catch (error) {
      console.error("❌ Error updating session:", error);
    }
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

    // Prefill session name
    setSessionName(session.title || "");
    setCategory(session.category || "");

    // Set themes and goals
    setSessionThemes(Array.isArray(session.themes) ? session.themes : []);
    setSessionGoals(Array.isArray(session.goals) ? session.goals : []);
    setSelectedTheme(
      Array.isArray(session.themes) && session.themes.length > 0
        ? session.themes[0]
        : ""
    );
    setSelectedGoal(
      Array.isArray(session.goals) && session.goals.length > 0
        ? session.goals[0]
        : ""
    );

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
      {/* Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-4 relative max-w-4xl max-h-[80vh] overflow-hidden">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 bg-white rounded-full p-1 shadow-md z-10"
              onClick={() => {
                setVideoModalOpen(false);
                setVideoUrl("");
              }}
            >
              ✕
            </button>
            <div className="w-full h-full">
              <iframe
                width="800"
                height="450"
                src={videoUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}

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

                  <th className="session-header" style={{ textAlign: "left" }}>
                    Session Name
                  </th>
                  <th className="cat-header" >
                    Category
                  </th>
                  <th className="prev-header" >
                    Preview
                  </th>
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

                    <td
                      className="plan-title"
                      style={{
                        marginBottom: "1px",
                        textAlign: "left",
                      }}
                    >
                      {session.title}
                    </td>
                    <td >{session.category}</td>
                    <td className="p-icon" style={{ textAlign: "left" }}>
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
              <div className="plan-name-input flex gap-4 items-end">
                <input
                  type="text"
                  id="planName"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Plan name "
                  className="placeholder:font-semibold placeholder:text-gray-950"
                />
                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                  <InputLabel shrink>Category</InputLabel>
                  <Select
                    value={planCategory}
                    onChange={(e) => setPlanCategory(e.target.value)}
                    label="Category"
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
                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                  <InputLabel shrink>Theme</InputLabel>
                  <Select
                    value={planTheme}
                    onChange={(e) => setPlanTheme(e.target.value)}
                    displayEmpty
                    label="Theme"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {literals.themes.map((th, i) => (
                      <MenuItem key={i} value={th}>
                        {th}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                  <InputLabel shrink>Goal</InputLabel>
                  <Select
                    value={planGoal}
                    onChange={(e) => setPlanGoal(e.target.value)}
                    displayEmpty
                    label="Goal"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {literals.goals.map((gl, i) => (
                      <MenuItem key={i} value={gl}>
                        {gl}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
          className=" fixed inset-0 z-50 flex items-center justify-center bg-opacity-50"
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
              className="bg-white rounded-2xl shadow-2xl p-6 relative w-[1200px] max-w-[95vw] h-[700px] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Form Inputs */}
              {/* Form Inputs */}
              {/* Form Inputs */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex gap-4 justify-between items-start">
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="flex-1 min-w-0 border-b border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Session name"
                  />
                  <button
                    onClick={handleSaveSesion}
                    className="save-changes-button whitespace-nowrap"
                  >
                    Save changes
                  </button>
                </div>

                {/* Theme, Goal, and Category dropdowns */}
                <div className="flex gap-4">
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="theme-label">Theme</InputLabel>
                    <Select
                      labelId="theme-label"
                      value={selectedTheme}
                      label="Theme"
                      onChange={(e) => setSelectedTheme(e.target.value)}
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

                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="goal-label">Goal</InputLabel>
                    <Select
                      labelId="goal-label"
                      value={selectedGoal}
                      label="Goal"
                      onChange={(e) => setSelectedGoal(e.target.value)}
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

                  <FormControl sx={{ minWidth: 200 }}>
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
              </div>

              {/* Activity Table */}
              {/* Activity Table */}
              {/* Activity Table */}
              <div className="overflow-hidden">
                <div className="min-w-full">
                  <div className="bg-gray-100 grid grid-cols-10 gap-2 p-2 text-sm font-medium">
                    <div className="text-center">Sl No</div>
                    <div className="text-center col-span-2">Activity</div>
                    <div className="text-center">Description</div>
                    <div className="text-center">Target 1</div>
                    <div className="text-center">Unit</div>
                    <div className="text-center">Target 2</div>
                    <div className="text-center">Unit 2</div>
                    <div className="text-center">Video</div>
                    <div className="text-center">Remove</div>
                  </div>

                  {previewSession.activities.map(
                    (activity: Activity_Api_call, idx: number) => (
                      <div
                        key={idx}
                        className="grid grid-cols-10 gap-2 p-2 border-t border-gray-200 text-sm items-center"
                      >
                        <div className="text-center">{idx + 1}</div>
                        <div className="col-span-2">
                          <FormControl fullWidth size="small">
                            <InputLabel id={`activity-select-label-${idx}`}>
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
                                  <MenuItem key={index} value={item.activityId}>
                                    {item.name}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        </div>
                        <div className="text-center text-xs overflow-hidden">
                          <div
                            className="truncate"
                            title={activity.description || "-"}
                          >
                            {activity.description || "-"}
                          </div>
                        </div>
                        <div className="text-center">
                          {activity.target || "-"}
                        </div>
                        <div className="text-center text-xs">
                          {activity.unit || "-"}
                        </div>
                        <div className="text-center">
                          {activity.target2 || "-"}
                        </div>
                        <div className="text-center text-xs">
                          {activity.unit2 || "-"}
                        </div>
                        <div className="text-center">
                          {activity.videoLink ? (
                            <button
                              onClick={() => {
                                // Convert YouTube URL to embed format if needed
                                let embedUrl = activity.videoLink;
                                if (
                                  activity.videoLink.includes(
                                    "youtube.com/watch?v="
                                  )
                                ) {
                                  const videoId = activity.videoLink
                                    .split("v=")[1]
                                    .split("&")[0];
                                  embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                } else if (
                                  activity.videoLink.includes("youtu.be/")
                                ) {
                                  const videoId = activity.videoLink
                                    .split("youtu.be/")[1]
                                    .split("?")[0];
                                  embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                } else if (
                                  activity.videoLink.includes(
                                    "youtube.com/shorts/"
                                  )
                                ) {
                                  const videoId = activity.videoLink
                                    .split("shorts/")[1]
                                    .split("?")[0];
                                  embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                }
                                setVideoUrl(embedUrl);
                                setVideoModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 underline text-xs"
                            >
                              Play
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        <div className="text-center">
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
                              size={20}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
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
