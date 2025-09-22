import { useContext, useEffect, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { enqueueSnackbar } from "notistack";
import { API_BASE_URL, useApiCalls } from "../store/axios";
import { MinusCircle, Plus } from "lucide-react";
import {
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Checkbox,
  ListItemText,
  OutlinedInput,
  InputLabel,
} from "@mui/material";
interface LiteralsResponse {
  themes: string[];
  goals: string[];
  category: string[];
}
function AllNutrition() {
  const context = useContext(DataContext);
  const { getNutrition, patchSession, getActivities, getActivityById } =
    useApiCalls();

  if (!context) {
    return <div>Loading...</div>;
  }

  const { activities_api_call, nutrition_api_call, setSelectComponent } =
    context;
  const [searchTerm, setSearchTerm] = useState(""); // KEEP original
  const [selecteddPlan, setSelectedPlan] = useState<Session_Api_call | null>(
    null
  );
  const [planName, setPlanName] = useState<string>(selecteddPlan?.title || "");
  const [category, setCategory] = useState<string>(
    selecteddPlan?.category || "Nutrition"
  );
  const [loadingRowIndex, setLoadingRowIndex] = useState<number | null>(null);
  const [themes, setThemes] = useState<string[]>(selecteddPlan?.themes || []);
  const [goals, setGoals] = useState<string[]>(selecteddPlan?.goals || []);
  const [allThemes, setAllThemes] = useState<string[]>([]);
  const [allGoals, setAllGoals] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [vegNonVegStatus, setVegNonVegStatus] = useState<string>("VEG");
  const [nameFilter, setNameFilter] = useState(""); // For name-based search
  const [vegFilter, setVegFilter] = useState("All"); // For veg/non-veg filter
  // Add these state variables after your existing ones
  const [themesFilter, setThemesFilter] = useState<string[]>([]);
  const [goalsFilter, setGoalsFilter] = useState<string[]>([]);
  const fetchLiterals = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/session-template/getLiterlas`
      );
      const data: LiteralsResponse = await response.json();
      setAllThemes(
        data.themes.filter((theme) => theme !== "All" && theme !== "NA")
      );
      setAllGoals(data.goals.filter((goal) => goal !== "All" && goal !== "NA"));
      setAllCategories(data.category);
    } catch (error) {
      console.error("Error fetching literals:", error);
    }
  };
  useEffect(() => {
    getNutrition();
    fetchLiterals();
  }, []);

  useEffect(() => {
    getActivities("", "", "NUTRITION");
  }, [selecteddPlan]);

  useEffect(() => {
    if (selecteddPlan) {
      setPlanName(selecteddPlan.title || "");
      setCategory(selecteddPlan.category || "Nutrition");
    }
  }, [selecteddPlan]);

  // ✅ RESTORED your original filter logic
  const filteredPlans = nutrition_api_call.filter((plan) => {
    // Name-based search filter
    const matchesName =
      plan.title.toLowerCase().includes(nameFilter.toLowerCase()) ||
      plan.category?.toLowerCase().includes(nameFilter.toLowerCase());

    // Veg/Non-veg filter
    const planVegStatus = plan.vegNonVeg || "VEG";
    const matchesVegFilter = vegFilter === "All" || planVegStatus === vegFilter;

    // New theme filter
    const matchesThemes =
      themesFilter.length === 0 ||
      (plan.themes &&
        plan.themes.some((theme) => themesFilter.includes(theme)));

    // New goals filter
    const matchesGoals =
      goalsFilter.length === 0 ||
      (plan.goals && plan.goals.some((goal) => goalsFilter.includes(goal)));

    return matchesName && matchesVegFilter && matchesThemes && matchesGoals;
  });

  /** Shared unit formatting */
  const formatUnit = (unit: string) => {
    switch (unit) {
      case "weight":
        return "Kg";
      case "time":
        return "Min";
      case "distance":
        return "Km";
      case "repetitions":
        return "Reps";
      case "grams":
        return "g";
      case "meter":
        return "m";
      case "litre":
        return "L";
      case "millilitre":
        return "ml";
      case "glasses":
        return "glasses";
      default:
        return "";
    }
  };

  const handleThemeChange = (event: any) => {
    const value = event.target.value;
    setThemes(typeof value === "string" ? value.split(",") : value);
  };

  const handleGoalChange = (event: any) => {
    const value = event.target.value;
    setGoals(typeof value === "string" ? value.split(",") : value);
  };
  useEffect(() => {
    if (selecteddPlan?.activities) {
      // Use your existing calculation logic
      const hasNonVeg = selecteddPlan?.activities?.some((activity) => {
        const edited = selecteddPlan.editedActivities?.find(
          (e) => (e.activityId ?? e.activityTemplateId) === activity.activityId
        );
        const mergedActivity = mergeEditedActivity(activity, edited);
        return (mergedActivity.vegNonVeg || "VEG") === "NONVEG";
      });

      const hasEgg = selecteddPlan?.activities?.some((activity) => {
        const edited = selecteddPlan.editedActivities?.find(
          (e) => (e.activityId ?? e.activityTemplateId) === activity.activityId
        );
        const mergedActivity = mergeEditedActivity(activity, edited);
        return (mergedActivity.vegNonVeg || "VEG") === "EGG";
      });

      let status = "VEG";
      if (hasNonVeg) {
        status = "NONVEG";
      } else if (hasEgg) {
        status = "EGG";
      }
      setVegNonVegStatus(status);
    }
  }, [selecteddPlan?.activities, selecteddPlan?.editedActivities]);
  const handleSave = async () => {
    try {
      // Validation
      const missingFields = [];

      if (!planName?.trim()) missingFields.push("Nutrition name");
      if (!category?.trim()) missingFields.push("Category");
      if (!themes || themes.length === 0) missingFields.push("Themes");
      if (!goals || goals.length === 0) missingFields.push("Goals");

      if (missingFields.length > 0) {
        console.error(
          `❌ Please fill in the following required fields: ${missingFields.join(
            ", "
          )}`
        );
        enqueueSnackbar(
          `Please fill in the following required fields:\n${missingFields.join(
            "\n"
          )}`,
          {
            variant: "warning",
            autoHideDuration: 3000,
          }
        );
        return;
      }

      await patchSession(selecteddPlan?.sessionId, {
        title: planName,
        category: "NUTRITION",
        activityIds: selecteddPlan?.activityIds,
        themes: themes,
        goals: goals,
        vegNonVeg: vegNonVegStatus,
        editedActivities: selecteddPlan?.editedActivities || [], // Add this line
      });
      console.log("Session updated successfully");
    } catch (error) {
      console.error("❌ Error updating session:", error);
    }
    getNutrition();
  };

  // ✅ Added missing fields here
  const emptyActivity: Activity_Api_call = {
    activityId: "",
    name: "",
    description: "",
    target: null,
    target2: null,
    unit: "",
    unit2: "",
    //type: "",
    icon: "",
    vegNonVeg: "",
  };

  const addEmptyActivityRow = () => {
    if (!selecteddPlan) return;
    const updatedActivities = [...selecteddPlan.activities, emptyActivity];
    const updatedActivityIds = [...selecteddPlan.activityIds, ""];
    setSelectedPlan({
      ...selecteddPlan,
      activities: updatedActivities,
      activityIds: updatedActivityIds,
    });
  };

  const handleDelete = (index: number) => {
    if (!selecteddPlan) return;
    selecteddPlan.activities.splice(index, 1);
    selecteddPlan.activityIds.splice(index, 1);
    setSelectedPlan({
      ...selecteddPlan,
      activities: [...selecteddPlan.activities],
      activityIds: [...selecteddPlan.activityIds],
    });
  };

  let slNo = 1;
  const mergeEditedActivity = (
    activity: Activity_Api_call,
    editedActivity?: {
      activityId: string;
      target?: number;
      target2?: number;
      unit?: string;
      unit2?: string;
      description?: string;
      vegNonVeg?: string;
      name?: string;
    }
  ): Activity_Api_call => {
    if (!editedActivity) return activity;

    return {
      ...activity,
      target: editedActivity.target ?? activity.target,
      target2: editedActivity.target2 ?? activity.target2,
      unit: editedActivity.unit ?? activity.unit,
      unit2: editedActivity.unit2 ?? activity.unit2,
      description: editedActivity.description ?? activity.description,
      vegNonVeg: editedActivity.vegNonVeg ?? activity.vegNonVeg,
      name: editedActivity.name ?? activity.name,
    };
  };
  useEffect(() => {
    if (selecteddPlan) {
      setPlanName(selecteddPlan.title || "");
      setCategory(selecteddPlan.category || "");
      setThemes(selecteddPlan.themes || []);
      setGoals(selecteddPlan.goals || []);
    }
  }, [selecteddPlan]);
  const updateEditedActivity = (
    activityId: string,
    field: string,
    value: any
  ) => {
    if (!selecteddPlan) return;

    const updatedEditedActivities = [...(selecteddPlan.editedActivities || [])];
    const existingIndex = updatedEditedActivities.findIndex(
      (edited) => edited.activityId === activityId
    );

    if (existingIndex >= 0) {
      // Update existing edited activity
      updatedEditedActivities[existingIndex] = {
        ...updatedEditedActivities[existingIndex],
        [field]: value,
      };
    } else {
      // Create new edited activity entry
      const newEditedActivity = {
        activityId: activityId,
        [field]: value,
      };
      updatedEditedActivities.push(newEditedActivity);
    }

    setSelectedPlan({
      ...selecteddPlan,
      editedActivities: updatedEditedActivities,
    });
  };
  return (
    <div className="all-session-container">
      {/* Left Panel */}
      <div className="left-p">
        <div className="panel-header">
          <div className="header-tit">Meals</div>
          <button
            onClick={() => setSelectComponent("/nutrition_sessions")}
            className="new-button"
          >
            <Plus size={20} className="new-button-icon" />
            <span className="new-button-text">New</span>
          </button>
        </div>
        {/* Search and Veg/NonVeg Row */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            paddingTop: "0.5rem",
            marginBottom: "0.5rem",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "150px", minWidth: "150px" }}>
            <TextField
              fullWidth
              size="small"
              label="Search by name"
              variant="outlined"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Enter meal name..."
            />
          </div>
          <div style={{ width: "150px", minWidth: "150px" }}>
            <FormControl fullWidth size="small">
              <InputLabel id="veg-filter-label">Veg-NonVeg</InputLabel>
              <Select
                labelId="veg-filter-label"
                value={vegFilter}
                onChange={(e) => setVegFilter(e.target.value)}
                label="Filter by Type"
              >
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="VEG">Veg</MenuItem>
                <MenuItem value="EGG">Egg</MenuItem>
                <MenuItem value="NONVEG">Non-Veg</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Themes and Goals Row */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            paddingTop: "0.5rem",
            marginBottom: "0.5rem",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "150px", minWidth: "150px" }}>
            <FormControl fullWidth size="small">
              <InputLabel id="themes-filter-label">Themes</InputLabel>
              <Select
                labelId="themes-filter-label"
                multiple
                value={themesFilter}
                onChange={(e) => setThemesFilter(e.target.value as string[])}
                input={<OutlinedInput label="Themes" />}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {allThemes.map((theme) => (
                  <MenuItem key={theme} value={theme}>
                    <Checkbox checked={themesFilter.indexOf(theme) > -1} />
                    <ListItemText primary={theme} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div style={{ width: "150px", minWidth: "150px" }}>
            <FormControl fullWidth size="small">
              <InputLabel id="goals-filter-label">Goals</InputLabel>
              <Select
                labelId="goals-filter-label"
                multiple
                value={goalsFilter}
                onChange={(e) => setGoalsFilter(e.target.value as string[])}
                input={<OutlinedInput label="Goals" />}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {allGoals.map((goal) => (
                  <MenuItem key={goal} value={goal}>
                    <Checkbox checked={goalsFilter.indexOf(goal) > -1} />
                    <ListItemText primary={goal} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
        <div className="Alstable-container">
          <table className="Alstable">
            <thead className="Alstable-header">
              <tr className="header-table-row">
                <th className="thone">Sl.No</th>
                <th className="thtwo">Meal Name</th>
                <th className="thone">VegNonVeg</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((session, index) => (
                <tr
                  key={index}
                  onClick={() => setSelectedPlan(session)}
                  className={`plan-table-row ${
                    selecteddPlan?.sessionId === session.sessionId
                      ? "highlight-row"
                      : ""
                  }`}
                >
                  <td className="table-cell-one">{index + 1}</td>
                  <td className="table-cell-two">{session.title}</td>
                  <td className="table-cell-three">
                    {session.vegNonVeg || "VEG"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panell">
        <div className="right-panel-header">
          <div className="input-container">
            <div className="input-group">
              <TextField
                fullWidth
                label="Meal Name"
                variant="outlined"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>
            <FormControl fullWidth sx={{ width: "200px" }}>
              <TextField
                fullWidth
                label="Category"
                variant="outlined"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </FormControl>
            <FormControl fullWidth sx={{ width: "200px" }}>
              <InputLabel id="themes-label">Themes</InputLabel>
              <Select
                labelId="themes-label"
                id="themes-select"
                multiple
                value={themes}
                onChange={handleThemeChange}
                input={<OutlinedInput label="Themes" />}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {allThemes.map((theme) => (
                  <MenuItem key={theme} value={theme}>
                    <Checkbox checked={themes.indexOf(theme) > -1} />
                    <ListItemText primary={theme} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* NEW: Goals Multi-Select */}
            <FormControl fullWidth sx={{ width: "200px" }}>
              <InputLabel id="goals-label">Goals</InputLabel>
              <Select
                labelId="goals-label"
                id="goals-select"
                multiple
                value={goals}
                onChange={handleGoalChange}
                input={<OutlinedInput label="Goals" />}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {allGoals.map((goal) => (
                  <MenuItem key={goal} value={goal}>
                    <Checkbox checked={goals.indexOf(goal) > -1} />
                    <ListItemText primary={goal} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ width: "200px" }}>
              <TextField
                fullWidth
                label="Veg/NonVeg Status"
                variant="outlined"
                value={vegNonVegStatus}
                InputProps={{ readOnly: true }}
              />
            </FormControl>
          </div>
          <button onClick={handleSave} className="save-button">
            Save Changes
          </button>
        </div>

        {/* Activities Table */}
        <div className="Alstable-container">
          {selecteddPlan ? (
            <table className="activities-table">
              <thead className="activities-table-header">
                <tr>
                  <th className="actone">Sl.No</th>
                  <th id="acttwo">Food Item</th>
                  <th className="actthree" id="acttwo">
                    Description
                  </th>
                  <th>Target 1</th>
                  <th>Unit 1</th>
                  <th>Target 2</th>
                  <th>Unit 2</th>
                  {/* <th>Type</th> */}
                  <th>VegNonVeg</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="activities-table-header">
                {selecteddPlan.activities?.map(
                  (item: Activity_Api_call, index: number) => {
                    const edited = selecteddPlan.editedActivities?.find(
                      (e) =>
                        (e.activityId ?? e.activityTemplateId) ===
                        item.activityId
                    );
                    const mergedActivity = mergeEditedActivity(item, edited);

                    return (
                      <tr key={index} className="activity-row">
                        {loadingRowIndex === index ? (
                          <td
                            colSpan={9}
                            className="activity-cell text-center py-4"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <CircularProgress size={30} />
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="activity-cell font-bold">
                              {slNo++}
                            </td>
                            <td className="activity-cell" id="acttwo">
                              <FormControl fullWidth size="small">
                                <Select
                                  labelId={`activity-select-label-${index}`}
                                  value={mergedActivity.activityId}
                                  MenuProps={{
                                    PaperProps: {
                                      style: {
                                        maxHeight: 200,
                                        overflowY: "auto",
                                      },
                                    },
                                  }}
                                  onChange={async (e) => {
                                    const selectedId = e.target.value;
                                    setLoadingRowIndex(index);
                                    try {
                                      const edittedActivity =
                                        await getActivityById(selectedId);
                                      const updatedActivities = [
                                        ...selecteddPlan.activities,
                                      ];
                                      updatedActivities[index] =
                                        edittedActivity;

                                      const updatedActivityIds = [
                                        ...selecteddPlan.activityIds,
                                      ];
                                      updatedActivityIds[index] =
                                        edittedActivity.activityId;

                                      setSelectedPlan({
                                        ...selecteddPlan,
                                        activities: updatedActivities,
                                        activityIds: updatedActivityIds,
                                      });
                                    } catch (err) {
                                      console.error(
                                        "Failed to fetch activity:",
                                        err
                                      );
                                    } finally {
                                      setLoadingRowIndex(null);
                                    }
                                  }}
                                >
                                  {activities_api_call.map(
                                    (
                                      activity: Activity_Api_call,
                                      idx: number
                                    ) => (
                                      <MenuItem
                                        key={idx}
                                        value={activity.activityId}
                                      >
                                        {activity.name}
                                      </MenuItem>
                                    )
                                  )}
                                </Select>
                              </FormControl>
                            </td>
                            <td className="activity-cell" id="acttwo">
                              <TextField
                                fullWidth
                                size="small"
                                multiline
                                maxRows={2}
                                value={mergedActivity.description || ""}
                                onChange={(e) =>
                                  updateEditedActivity(
                                    mergedActivity.activityId,
                                    "description",
                                    e.target.value
                                  )
                                }
                                variant="outlined"
                              />
                            </td>
                            <td className="activity-cell">
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={mergedActivity.target || ""}
                                onChange={(e) =>
                                  updateEditedActivity(
                                    mergedActivity.activityId,
                                    "target",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                variant="outlined"
                              />
                            </td>
                            <td className="activity-cell">
                              <FormControl fullWidth size="small">
                                <Select
                                  value={mergedActivity.unit || ""}
                                  onChange={(e) =>
                                    updateEditedActivity(
                                      mergedActivity.activityId,
                                      "unit",
                                      e.target.value
                                    )
                                  }
                                >
                                  <MenuItem value="grams">g</MenuItem>
                                  <MenuItem value="meter">glasses</MenuItem>
                                  <MenuItem value="litre">L</MenuItem>
                                  <MenuItem value="millilitre">ml</MenuItem>
                                </Select>
                              </FormControl>
                            </td>
                            <td className="activity-cell">
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={mergedActivity.target2 || ""}
                                onChange={(e) =>
                                  updateEditedActivity(
                                    mergedActivity.activityId,
                                    "target2",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                variant="outlined"
                              />
                            </td>
                            <td className="activity-cell">
                              <FormControl fullWidth size="small">
                                <Select
                                  value={mergedActivity.unit2 || ""}
                                  onChange={(e) =>
                                    updateEditedActivity(
                                      mergedActivity.activityId,
                                      "unit2",
                                      e.target.value
                                    )
                                  }
                                >
                                  <MenuItem value="">None</MenuItem>
                                  <MenuItem value="grams">g</MenuItem>
                                  <MenuItem value="meter">glasses</MenuItem>
                                  <MenuItem value="litre">L</MenuItem>
                                  <MenuItem value="millilitre">ml</MenuItem>
                                </Select>
                              </FormControl>
                            </td>
                            <td className="activity-cell">
                              <FormControl fullWidth size="small">
                                <Select
                                  value={mergedActivity.vegNonVeg || "VEG"}
                                  onChange={(e) =>
                                    updateEditedActivity(
                                      mergedActivity.activityId,
                                      "vegNonVeg",
                                      e.target.value
                                    )
                                  }
                                >
                                  <MenuItem value="VEG">VEG</MenuItem>
                                  <MenuItem value="EGG">EGG</MenuItem>
                                  <MenuItem value="NONVEG">NONVEG</MenuItem>
                                </Select>
                              </FormControl>
                            </td>
                            <td>
                              <MinusCircle
                                className="text-red-500 cursor-pointer hover:text-red-700"
                                onClick={() => handleDelete(index)}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  }
                )}
                <tr>
                  <td colSpan={9} className="activity-cell">
                    <button
                      onClick={addEmptyActivityRow}
                      className="add-activity-button"
                    >
                      <Plus size={18} />
                      <span>Add Food Item</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              Select a daily plan to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AllNutrition;
