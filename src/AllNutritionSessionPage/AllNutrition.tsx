import { useContext, useEffect, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { useApiCalls } from "../store/axios";
import { MinusCircle, Plus } from "lucide-react";
import {
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

function AllNutrition() {
  const context = useContext(DataContext);
  const { getNutrition, patchSession, getActivities, getActivityById } =
    useApiCalls();

  if (!context) {
    return <div>Loading...</div>;
  }

  const {
    activities_api_call,
    nutrition_api_call,
    setSelectComponent,
  } = context;

  const [searchTerm, setSearchTerm] = useState(""); // KEEP original
  const [selecteddPlan, setSelectedPlan] = useState<Session_Api_call | null>(
    null
  );
  const [planName, setPlanName] = useState<string>(selecteddPlan?.title || "");
  const [category, setCategory] = useState<string>(
    selecteddPlan?.category || "Nutrition"
  );
  const [loadingRowIndex, setLoadingRowIndex] = useState<number | null>(null);

  useEffect(() => {
    getNutrition();
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

  const handleSave = async () => {
    try {
      await patchSession(selecteddPlan?.sessionId, {
        title: planName,
        category: "NUTRITION",
        activityIds: selecteddPlan?.activityIds,
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
    type: "",
    icon: "",
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
                  <th id="acttwo">Activity</th>
                  <th className="actthree" id="acttwo">Description</th>
                  <th>Target 1</th>
                  <th>Unit 1</th>
                  <th>Target 2</th>
                  <th>Unit 2</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="activities-table-header">
                {selecteddPlan.activities?.map(
                  (item: Activity_Api_call, index: number) => (
                    <tr key={index} className="activity-row">
                      {loadingRowIndex === index ? (
                        <td colSpan={9} className="activity-cell text-center py-4">
                          <div className="flex items-center justify-center gap-2">
                            <CircularProgress size={30} />
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="activity-cell font-bold">{slNo++}</td>
                          <td className="activity-cell" id="acttwo">
                            <FormControl fullWidth>
                              <Select
                                labelId={`activity-select-label-${index}`}
                                value={item.activityId}
                                MenuProps={{
                                  PaperProps: {
                                    style: { maxHeight: 200, overflowY: "auto" },
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
                                    updatedActivities[index] = edittedActivity;

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
                                    console.error("Failed to fetch activity:", err);
                                  } finally {
                                    setLoadingRowIndex(null);
                                  }
                                }}
                              >
                                {activities_api_call.map(
                                  (activity: Activity_Api_call, idx: number) => (
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
                            {item.description}
                          </td>
                          <td className="activity-cell">{item.target}</td>
                          <td className="activity-cell">
                            {formatUnit(item.unit)}
                          </td>
                          <td className="activity-cell">{item.target2}</td>
                          <td className="activity-cell">
                            {formatUnit(item.unit2)}
                          </td>
                          <td className="activity-cell">{item.type}</td>
                          <td>
                            <MinusCircle
                              className="text-red-500 cursor-pointer hover:text-red-700"
                              onClick={() => handleDelete(index)}
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  )
                )}
                <tr>
                  <td colSpan={9} className="activity-cell">
                    <button
                      onClick={addEmptyActivityRow}
                      className="add-activity-button"
                    >
                      <Plus size={18} />
                      <span>Add Activity</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="empty-state">Select a daily plan to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AllNutrition;
