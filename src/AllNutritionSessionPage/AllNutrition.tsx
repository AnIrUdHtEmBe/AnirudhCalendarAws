import { useContext, useEffect, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { useApiCalls } from "../store/axios";
import { Dumbbell, MinusCircle, Plus } from "lucide-react";
// import "../allSessionPage/AllSession.css";
import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Mediation, NordicWalking } from "@mui/icons-material";

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
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selecteddPlan, setSelectedPlan] = useState<Session_Api_call | null>(
    null
  );
  const [planName, setPlanName] = useState<string>(selecteddPlan?.title || "");
  const [category, setCategory] = useState<string>(
    selecteddPlan?.category || "Nutrition"
  );

  const [loadingRowIndex, setLoadingRowIndex] = useState<number | null>(null);

  // console.log(sessions);
  useEffect(() => {
    getNutrition();
  }, []);

  useEffect(() => {
    // console.log(selecteddPlan)
    getActivities("","","NUTRITION");
  }, [selecteddPlan]);

  useEffect(() => {
    if (selecteddPlan) {
      setPlanName(selecteddPlan.title || "");
      setCategory(selecteddPlan.category || "Nutrition");
    }
  }, [selecteddPlan]);

  const filteredPlans = nutrition_api_call.filter(
    (plan) =>
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const emptyActivity: Activity_Api_call = {
    activityId: "", // or maybe use `uuid()` if needed
    name: "",
    description: "",
    target: null,
    unit: "",
    icon: "",
  };
  const addEmptyActivityRow = () => {
    const updatedActivities = [...selecteddPlan.activities, emptyActivity];
    const updatedActivityIds = [...selecteddPlan.activityIds, ""];

    console.log("Updated Activities:", updatedActivities);
    console.log("Updated Activity IDs:", updatedActivityIds);

    setSelectedPlan({
      ...selecteddPlan,
      activities: updatedActivities,
      activityIds: updatedActivityIds,
    });
  };

  console.log("Selected Plan:", selecteddPlan);
  

//   const filterPlansAccordingTo = (category: string) => {
//     if (activeFilter === category) {
//       setActiveFilter(null); // Remove filter if clicked again
//       setSearchTerm(""); // Show all
//     } else {
//       setActiveFilter(category);
//       setSearchTerm(category);
//     }
//   };

  const handleDelete = async (index : number) => {
    console.log("Deleting activity at index:", index);
    selecteddPlan?.activities.splice(index, 1);
    selecteddPlan?.activityIds.splice(index, 1);
    
    setSelectedPlan({
      ...selecteddPlan,
      activities: [...selecteddPlan.activities],
      activityIds: [...selecteddPlan.activityIds],
    });
  }


  let slNo = 1;

  return (
    <div className="all-session-container">
      {/* Left Panel */}
      <div className="left-p">
        <div className="panel-header">
          <div className="header-tit">
            Nutrition <span className="badge">All</span>
          </div>
          <div className="flex justify-between items-center gap-5">
            {/* <button
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
            </button> */}
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
                <th className=" thone">Sl.No</th>
                {/* <th className=" thtwo">Session Name</th> */}
                {/* <th className=" ththree">Category</th> */}
                <th className=" thtwo">Nutrition Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((session, index) => (
                <tr
                  key={index}
                  onClick={() => setSelectedPlan(session)}
                  // className="plan-table-row"
                  className={`plan-table-row ${selecteddPlan?.sessionId === session.sessionId ? 'highlight-row' : ''}`}

                >
                  <td className="table-cell-one">{index + 1}</td>
                  {/* <td className="table-cell-two">{session.title}</td> */}
                  {/* <td className="table-cell-three">{session.category}</td> */}
                  <td className="table-cell-two">{session.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panell">
        {/* Header */}
        <div className="right-panel-header">
          {/* Input Fields */}
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
                onChange={(e) => setPlanName(e.target.value)}
              />
            </FormControl>
          </div>

          {/* Save Button */}
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
                  <th className="acttwo">Activity</th>
                  <th className="actthree">Description</th>
                  <th className="actfour"> Target</th>
                  <th>Unit</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="activities-table-header">
                {selecteddPlan?.activities?.map(
                  (item: Activity_Api_call, index: number) => (
                    <tr key={index} className="activity-row">
                      {loadingRowIndex === index ? (
                         <td colSpan={5} className="activity-cell text-center py-4">
                         <div className="flex items-center justify-center gap-2">
                           <CircularProgress size={30} className="text-blue-500" />
                         </div>
                       </td>
                      ) : (
                        <>
                          <td className="activity-cell font-bold">{slNo++}</td>
                          <td className="activity-cell">
                            <FormControl fullWidth>
                              <Select
                                labelId={`activity-select-label-${index}`}
                                value={item.activityId}
                                onChange={async (e) => {
                                  const selectedId = e.target.value;
                                  console.log("Selected ID:", selectedId);
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

                                    console.log(
                                      "Updated Plan:",
                                      updatedActivities
                                    );
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
                          <td className="activity-cell">{item.description}</td>
                          <td className="activity-cell">{item.target}</td>
                          <td className="activity-cell">
                            {item.unit === "weight"
                              ? "Kg"
                              : item.unit === "time"
                              ? "Min"
                              : item.unit === "distance"
                              ? "Km"
                              : item.unit === "repetitions"
                              ? "Reps"
                              :  item.unit == "grams"
                              ? "g"
                              : item.unit == "meter"
                              ? "m"
                              : item.unit == "litre"
                              ? "L"
                              : item.unit == "millilitre"
                              ? "ml"
                              : ""}
                          </td>
                          <td className="activity-cell">
                            {item.type}
                          </td>
                          <td><MinusCircle className="text-red-500" onClick={ () => handleDelete(index)}></MinusCircle></td>
                        </>
                      )}
                    </tr>
                  )
                )}
                <tr>
                  <td colSpan={5} className="activity-cell">
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
            <div className="empty-state">Select a daily plans to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AllNutrition;
