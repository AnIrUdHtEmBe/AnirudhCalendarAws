import { useContext, useEffect, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { useApiCalls } from "../store/axios";
import { Dumbbell, MinusCircle, Plus, Eye } from "lucide-react";
import "./AllSession.css";
import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Mediation, NordicWalking } from "@mui/icons-material";

function AllSession() {
  const context = useContext(DataContext);
  const { getSessions, patchSession, getActivities, getActivityById } =
    useApiCalls();
  if (!context) {
    return <div>Loading...</div>;
  }
  const {
    activities_api_call,
    sessions_api_call,
    setSelectComponent,
  } = context;
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selecteddPlan, setSelectedPlan] = useState<Session_Api_call | null>(
    null
  );
  const [planName, setPlanName] = useState<string>(selecteddPlan?.title || "");
  const [category, setCategory] = useState<string>(
    selecteddPlan?.category || "Fitness"
  );

  const [loadingRowIndex, setLoadingRowIndex] = useState<number | null>(null);

  // console.log(sessions);
  useEffect(() => {
    getSessions();
  }, []);

  useEffect(() => {
    // console.log(selecteddPlan)
    getActivities();
  }, [selecteddPlan]);

  useEffect(() => {
    if (selecteddPlan) {
      setPlanName(selecteddPlan.title || "");
      setCategory(selecteddPlan.category || "Fitness");
    }
  }, [selecteddPlan]);

  const filteredPlans = sessions_api_call.filter(
    (plan) =>
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    try {
      await patchSession(selecteddPlan?.sessionId, {
        title: planName,
        category: category,
        activityIds: selecteddPlan?.activityIds,
      });
      console.log("Session updated successfully");
    } catch (error) {
      console.error("❌ Error updating session:", error);
    }
    getSessions();
  };

  const emptyActivity: Activity_Api_call = {
    activityId: "", // or maybe use `uuid()` if needed
    name: "",
    description: "",
    target: null,
    target2: null,
    unit: "",
    unit2: "",
    icon: "",
    videoLink: "",
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

  const filterPlansAccordingTo = (category: string) => {
    if (activeFilter === category) {
      setActiveFilter(null); // Remove filter if clicked again
      setSearchTerm(""); // Show all
    } else {
      setActiveFilter(category);
      setSearchTerm(category);
    }
  };

  const handleDelete = async (index: number) => {
    console.log("Deleting activity at index:", index);
    selecteddPlan?.activities.splice(index, 1);
    selecteddPlan?.activityIds.splice(index, 1);

    setSelectedPlan({
      ...selecteddPlan,
      activities: [...selecteddPlan.activities],
      activityIds: [...selecteddPlan.activityIds],
    });
  };

  const handleVideoLinkClick = (videoLink: string) => {
    if (videoLink) {
      window.open(videoLink, '_blank');
    }
  };

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
      default:
        return "";
    }
  };

  let slNo = 1;

  return (
    <div className="all-session-container">
      {/* Left Panel */}
      <div className="left-p">
        <div className="panel-header">
          <div className="header-tit">
            Sessions <span className="badge">All</span>
          </div>
          <div className="flex justify-between items-center gap-5">
            <button
              className={`filter-btn ${activeFilter === "Fitness" ? "filter-btn-active" : ""
                }`}
              onClick={() => filterPlansAccordingTo("Fitness")}
            >
              <Dumbbell size={20} />
            </button>
            <button
              className={`filter-btn ${activeFilter === "Wellness" ? "filter-btn-active" : ""
                }`}
              onClick={() => filterPlansAccordingTo("Wellness")}
            >
              <Mediation style={{ fontSize: "20px" }} />
            </button>
            <button
              className={`filter-btn ${activeFilter === "Sports" ? "filter-btn-active" : ""
                }`}
              onClick={() => filterPlansAccordingTo("Sports")}
            >
              <NordicWalking style={{ fontSize: "20px" }} />
            </button>
          </div>

          <button
            onClick={() => setSelectComponent("/sessions")}
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
                <th className=" ththree">Category</th>
                <th className=" thtwo">Session Name</th>
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
                  <td className="table-cell-three">{session.category}</td>
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
                label="Session name"
                variant="outlined"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <FormControl fullWidth sx={{ width: "200px" }}>
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
                  <th id="acttwo">Activity</th>
                  <th className="actthree" id="acttwo">Description</th>
                  <th className="actfour">Target 1</th>
                  <th>Unit 1</th>
                  <th className="actfour">Target 2</th>
                  <th>Unit 2</th>
                  <th>Video</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="activities-table-header">
                {selecteddPlan?.activities?.map(
                  (item: Activity_Api_call, index: number) => (
                    <tr key={index} className="activity-row">
                      {loadingRowIndex === index ? (
                        <td colSpan={9} className="activity-cell text-center py-4">
                          <div className="flex items-center justify-center gap-2">
                            <CircularProgress size={30} className="text-blue-500" />
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
                                    style: {
                                      maxHeight: 200, // or whatever you need
                                      overflowY: 'auto',
                                    },
                                  },
                                }}
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
                          <td className="activity-cell" id="acttwo">{item.description}</td>
                          <td className="activity-cell">{item.target}</td>
                          <td className="activity-cell">
                            {formatUnit(item.unit)}
                          </td>
                          <td className="activity-cell">{item.target2}</td>
                          <td className="activity-cell">
                            {formatUnit(item.unit2)}
                          </td>
                          <td className="activity-cell">
                            {item.videoLink && (
                              <button
                                onClick={() => handleVideoLinkClick(item.videoLink)}
                                className="video-link-button"
                                title="Watch Video"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Eye size={16} className="text-blue-500 hover:text-blue-700" />
                              </button>
                            )}
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
            <div className="empty-state">Select a session to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AllSession;