import { useContext, useEffect, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
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
  const MEAL_TYPES = [
    "breakfast",
    "brunch",
    "lunch",
    "dinner",
    "morning snack",
    "evening snack",
    "midnight snack",
    "pre-bed snack",
    "before workout",
    "after workout",
    "post dinner",
  ];
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

  const [mealType, setMealType] = useState<string>(selecteddPlan?.type || "");
  const [allThemes, setAllThemes] = useState<string[]>([]);
  const [allGoals, setAllGoals] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
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
  const filteredPlans = nutrition_api_call.filter(
    (plan) =>
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleSave = async () => {
  try {
    // Calculate session-level vegNonVeg based on activities
    const hasNonVeg = selecteddPlan?.activities?.some(
      (activity) => {
        const edited = selecteddPlan.editedActivities?.find(
          (e) => (e.activityId ?? e.activityTemplateId) === activity.activityId
        );
        const mergedActivity = mergeEditedActivity(activity, edited);
        return (mergedActivity.vegNonVeg || "VEG") === "NONVEG";
      }
    );
    
    const hasEgg = selecteddPlan?.activities?.some(
      (activity) => {
        const edited = selecteddPlan.editedActivities?.find(
          (e) => (e.activityId ?? e.activityTemplateId) === activity.activityId
        );
        const mergedActivity = mergeEditedActivity(activity, edited);
        return (mergedActivity.vegNonVeg || "VEG") === "EGG";
      }
    );

    let sessionVegNonVeg = "VEG";
    if (hasNonVeg) {
      sessionVegNonVeg = "NONVEG";
    } else if (hasEgg) {
      sessionVegNonVeg = "EGG";
    }

    await patchSession(selecteddPlan?.sessionId, {
      title: planName,
      category: "NUTRITION",
      activityIds: selecteddPlan?.activityIds,
      themes: themes,
      goals: goals,
      type: mealType,
      vegNonVeg: sessionVegNonVeg, 
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
      setMealType(selecteddPlan.type || "");
    }
  }, [selecteddPlan]);
  return (
    <div className="all-session-container">
      {/* Left Panel */}
      <div className="left-p">
        <div className="panel-header">
          <div className="header-tit">
            Nutrition <span className="badge">All</span>
          </div>
          <button
            onClick={() => setSelectComponent("/nutrition_sessions")}
            className="new-button"
          >
            <Plus size={20} className="new-button-icon" />
            <span className="new-button-text">New</span>
          </button>
        </div>

        <div className="Alstable-container">
          <table className="Alstable">
            <thead className="Alstable-header">
              <tr className="header-table-row">
                <th className="thone">Sl.No</th>
                <th className="thtwo">Nutrition Name</th>
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
                label="Nutrition name"
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
              <InputLabel id="meal-type-label">Meal Type</InputLabel>
              <Select
                labelId="meal-type-label"
                id="meal-type-select"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as string)}
                label="Meal Type"
              >
                {MEAL_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
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
                              <FormControl fullWidth>
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
                              {mergedActivity.description}
                            </td>
                            <td className="activity-cell">
                              {mergedActivity.target}
                            </td>
                            <td className="activity-cell">
                              {formatUnit(mergedActivity.unit)}
                            </td>
                            <td className="activity-cell">
                              {mergedActivity.target2}
                            </td>
                            <td className="activity-cell">
                              {formatUnit(mergedActivity.unit2)}
                            </td>
                            <td className="activity-cell">
                              {mergedActivity.vegNonVeg}
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
