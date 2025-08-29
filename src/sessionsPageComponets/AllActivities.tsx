import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef, GridRowsProp, GridEditInputCell } from "@mui/x-data-grid";
import {
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
} from "@mui/material";
import { SearchIcon, Plus, Save, Trash2, Edit } from "lucide-react";
import Header from "./Header";
import "./AllActivities.css";
import { enqueueSnackbar } from "notistack";

interface Activity {
  activityId: string;
  name: string;
  description: string;
  target: number;
  unit: string;
  target2: number;
  unit2: string;
  videoLink: string;
}

// YouTube Video Modal Component
const YouTubeVideoModal = ({
  isOpen,
  onClose,
  videoUrl,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}) => {
  if (!isOpen) return null;

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
          >
            ×
          </button>
        </div>
        <div className="aspect-video">
          {embedUrl ? (
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <p className="text-gray-500">Invalid YouTube URL</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
      return unit;
  }
};

const AllActivities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<Array<string>>(
    []
  );
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalActivities, setOriginalActivities] = useState<Activity[]>([]);
  const [editedActivities, setEditedActivities] = useState<Activity[]>([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityData, setNewActivityData] = useState<Activity | null>(null);
  const createEmptyActivity = (): Activity => ({
    activityId: `temp-${Date.now()}`, // Temporary ID for new activity
    name: "",
    description: "",
    target: 0,
    unit: "",
    target2: 0,
    unit2: "",
    videoLink: "",
  });

  const unitOptions = ["repetitions", "weight", "time", "distance"];

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    const sourceData = isEditMode ? editedActivities : activities;
    const filtered = sourceData.filter(
      (activity) =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredActivities(filtered);
  }, [searchTerm, activities, editedActivities, isEditMode]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://forge-play-backend.forgehub.in/activity-templates"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data);
      setFilteredActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
      alert("Failed to load activities. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const createActivity = async (activityData: Omit<Activity, "activityId">) => {
    try {
      const response = await fetch(
        "https://forge-play-backend.forgehub.in/activity-templates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activityData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create activity");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  };
  const handleAddActivity = () => {
    if (isEditMode) {
      alert("Please save or cancel edit mode before adding a new activity.");
      return;
    }
    const newActivity = createEmptyActivity();
    setNewActivityData(newActivity);
    setIsAddingActivity(true);
    console.log("Add activity clicked");
  };

  const handleSaveNewActivity = async () => {
    if (!newActivityData) return;

    try {
      // Validate required fields
      const name = newActivityData.name.trim();
      const description = newActivityData.description.trim();
      const unit = newActivityData.unit.trim();
      if (!name || !description || newActivityData.target <= 0 || !unit) {
        enqueueSnackbar(
          "Please fill in all required fields: Name, Description, Target (greater than 0), and Unit",
          {
            variant: "error",
            autoHideDuration: 3000,
          }
        );
        return false;
      }
      // Prepare data for API (excluding temporary ID)
      const activityToCreate: any = {
        name,
        description,
        target: Number(newActivityData.target),
        unit,
      };

      // Include optional fields if provided
      if (newActivityData.target2 > 0) {
        activityToCreate.target2 = Number(newActivityData.target2);
      }
      if (newActivityData.unit2.trim() !== "") {
        activityToCreate.unit2 = newActivityData.unit2.trim();
      }
      if (newActivityData.videoLink.trim() !== "") {
        activityToCreate.videoLink = newActivityData.videoLink.trim();
      }

      // Create the activity via API
      await createActivity(activityToCreate);

      // Refetch activities to update the list
      await fetchActivities();

      enqueueSnackbar("Activity created successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });
      return true;
    } catch (error) {
      console.error("Error saving new activity:", error);
      alert("Failed to create activity. Please try again.");
    }
  };

  const handleSave = () => {
    // Save logic here
    console.log("Save clicked");
  };

  const handleDelete = async () => {
    if (selectedActivityIds.length === 0) {
      alert("Please select at least one activity to delete.");
      return;
    }

    try {
      // Add your delete API logic here
      console.log("Deleting activities:", selectedActivityIds);

      // For now, just remove from local state
      const updatedActivities = activities.filter(
        (activity) => !selectedActivityIds.includes(activity.activityId)
      );
      setActivities(updatedActivities);
      setSelectedActivityIds([]);

      // Show success message
      alert("Activities deleted successfully!");
    } catch (error) {
      console.error("Error deleting activities:", error);
      alert("Failed to delete activities. Please try again.");
    }
  };

  const handleVideoLinkClick = (videoLink: string, activityName: string) => {
    if (videoLink) {
      setCurrentVideoUrl(videoLink);
      setVideoTitle(activityName || "Activity Video");
      setShowVideoModal(true);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "slNo",
      headerName: "Sl No.",
      width: 80,
      headerAlign: "center",
      align: "center",
      sortable: false,
      editable: false, // Always non-editable
    },
    {
      field: "name",
      headerName: "Name",
      flex: 0.75,
      minWidth: 56,
      headerAlign: "center",
      align: "left",
      editable: isEditMode || isAddingActivity,
      renderCell: (params) => {
    if (params.row.id === "new-activity" && (!params.value || params.value === "")) {
      return <span style={{ color: 'gray', fontStyle: 'italic' }}>Add New Activity Here</span>;
    }
    return params.value;
  },
  renderEditCell: (params) => <GridEditInputCell {...params} placeholder="Add name" />,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 0.75,
      minWidth: 112,
      headerAlign: "center",
      align: "left",
      editable: isEditMode || isAddingActivity,
        renderEditCell: (params) => <GridEditInputCell {...params} placeholder="Add description" />,

    },
    {
      field: "target",
      headerName: "Target",
      width: 120,
      headerAlign: "center",
      align: "center",
      editable: isEditMode || isAddingActivity,
      type: "number",
        renderEditCell: (params) => <GridEditInputCell {...params} placeholder="Add target" />,

    },
    {
      field: "unit",
      headerName: "Unit",
      width: 120,
      headerAlign: "center",
      align: "center",
      editable: isEditMode || isAddingActivity,
      type: "singleSelect",
      valueOptions: unitOptions,
      renderCell: (params) => formatUnit(params.value) || params.value,
    },
    {
      field: "target2",
      headerName: "Target 2",
      width: 120,
      headerAlign: "center",
      align: "center",
      editable: isEditMode || isAddingActivity,
      type: "number",
              renderEditCell: (params) => <GridEditInputCell {...params} placeholder="Add target2" />,

    },
    {
      field: "unit2",
      headerName: "Unit 2",
      width: 120,
      headerAlign: "center",
      align: "center",
      editable: isEditMode || isAddingActivity,
      type: "singleSelect",
      valueOptions: unitOptions,
      renderCell: (params) => formatUnit(params.value) || params.value,
    },
    {
      field: "videoLink",
      headerName: "Video Link",
      flex: 0.75,
      minWidth: 200,
      headerAlign: "center",
      align: "left",
      editable: isEditMode || isAddingActivity,
              renderEditCell: (params) => <GridEditInputCell {...params} placeholder="Add video link" />,
      renderCell: (params) => {
        if (params.value) {
          return (
            <button
              onClick={() =>
                handleVideoLinkClick(params.value, params.row.name)
              }
              className="text-blue-500 hover:text-blue-700 underline cursor-pointer"
              style={{
                textDecoration: "underline",
                background: "none",
                border: "none",
                color: "#3b82f6",
                cursor: "pointer",
                padding: 0,
                font: "inherit",
                textAlign: "left",
              }}
            >
              {params.value.length > 30
                ? `${params.value.substring(0, 30)}...`
                : params.value}
            </button>
          );
        }
        return "-";
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      headerAlign: "center",
      align: "center",
      sortable: false,
      editable: false, // Always non-editable
      renderCell: () => <div>{/* Empty for now */}</div>,
    },
  ];

  const rows: GridRowsProp = React.useMemo(() => {
    let rowData = [...filteredActivities];

    // Add the new activity row at the top when in adding mode
    if (isAddingActivity && newActivityData) {
      rowData = [newActivityData, ...rowData];
    }

    return rowData.map((activity, index) => ({
      id: isAddingActivity && index === 0 ? "new-activity" : index,
      slNo: index + 1,
      activityId: activity.activityId,
      name: activity.name,
      description: activity.description,
      target: activity.target,
      unit: activity.unit,
      target2: activity.target2,
      unit2: activity.unit2,
      videoLink: activity.videoLink,
    }));
  }, [filteredActivities, isAddingActivity, newActivityData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="all-acts-container">
        <div className="search-container">
          <div className="search-and-actions">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={20} />
                  </InputAdornment>
                ),
              }}
              className="search-field"
            />
            <div className="action-buttons">
              {!isEditMode && !isAddingActivity ? (
                // Normal mode buttons
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={handleAddActivity}
                    className="action-button"
                  >
                    Add Activity
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Edit size={16} />}
                    onClick={() => {
                      setIsEditMode(true);
                      setOriginalActivities([...activities]);
                      setEditedActivities([...activities]);
                    }}
                    className="action-button save-button"
                  >
                    Edit Mode
                  </Button>
                </>
              ) : isEditMode ? (
                // Edit mode buttons
                <div className="edit-mode-buttons">
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={() => {
                      setActivities([...editedActivities]);
                      setIsEditMode(false);
                      console.log("Changes saved");
                    }}
                    className="action-button save-button"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditedActivities([...originalActivities]);
                      setActivities([...originalActivities]);
                      setIsEditMode(false);
                    }}
                    className="action-button"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                // Add activity mode buttons
                <div className="edit-mode-buttons">
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={async () => {
                      if (newActivityData) {
                        const success = await handleSaveNewActivity();
                        if (success) {
                          setIsAddingActivity(false);
                          setNewActivityData(null);
                          console.log("New activity saved");
                        }
                      }
                    }}
                    className="action-button save-button"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsAddingActivity(false);
                      setNewActivityData(null);
                    }}
                    className="action-button"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="table-container">
          <DataGrid
           getRowClassName={(params) => {
    if (params.row.id === "new-activity") return "new-activity-row";
    if (isEditMode) return "new-activity-row"; // Apply the same style to all rows in edit mode
    return "";
  }}
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 50 },
              },
            }}
            pageSizeOptions={[5, 10, 20]}
            checkboxSelection
            className="data-grid"
            onRowSelectionModelChange={(ids) => {
              // Map back to activityIds using the row data
              const activityIds = ids
                .map((id) => {
                  const row = rows.find((r) => r.id === id);
                  return row ? row.activityId : null;
                })
                .filter(Boolean) as string[];
              setSelectedActivityIds(activityIds);
            }}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f8f9fa",
                fontWeight: "700",
                position: "sticky",
                top: 0,
                zIndex: 1,
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f8f9fa",
              },
              "& .MuiDataGrid-virtualScroller": {
                overflow: "auto",
              },
            }}
            processRowUpdate={(newRow) => {
              if (isAddingActivity && newRow.id === "new-activity") {
                // Handle new activity updates
                const updatedNewActivity = {
                  ...newActivityData!,
                  name: newRow.name,
                  description: newRow.description,
                  target: newRow.target,
                  unit: newRow.unit,
                  target2: newRow.target2,
                  unit2: newRow.unit2,
                  videoLink: newRow.videoLink,
                };
                setNewActivityData(updatedNewActivity);
              } else if (isEditMode) {
                // Handle existing activity updates in edit mode
                const activityId = newRow.activityId;
                const activityIndex = editedActivities.findIndex(
                  (activity) => activity.activityId === activityId
                );

                if (activityIndex !== -1) {
                  const updatedEditedActivities = [...editedActivities];
                  updatedEditedActivities[activityIndex] = {
                    ...updatedEditedActivities[activityIndex],
                    name: newRow.name,
                    description: newRow.description,
                    target: newRow.target,
                    unit: newRow.unit,
                    target2: newRow.target2,
                    unit2: newRow.unit2,
                    videoLink: newRow.videoLink,
                  };

                  setEditedActivities(updatedEditedActivities);
                }
              }

              return newRow;
            }}
            onProcessRowUpdateError={(error) => {
              console.error("Row update error:", error);
            }}
          />
        </div>
      </div>

      {/* YouTube Video Modal */}
      <YouTubeVideoModal
        isOpen={showVideoModal}
        onClose={() => {
          setShowVideoModal(false);
          setCurrentVideoUrl("");
          setVideoTitle("");
        }}
        videoUrl={currentVideoUrl}
        title={videoTitle}
      />
    </>
  );
};

export default AllActivities;
