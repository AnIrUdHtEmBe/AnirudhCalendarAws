import React, { useState, useEffect, useContext, useRef } from "react";
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridEditInputCell,
  useGridApiRef,
} from "@mui/x-data-grid";
import {
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
} from "@mui/material";
import {
  SearchIcon,
  Plus,
  Save,
  Trash2,
  Edit,
  ChevronDown,
  DiamondPlus,
  CornerDownLeft,
} from "lucide-react";
import Header from "./Header";
import "./AllActivities.css";
import { enqueueSnackbar } from "notistack";
import { API_BASE_URL, API_BASE_URL2 } from "../store/axios";
import { DataContext } from "../store/DataContext";
interface Activity {
  activityId: string;
  mongoId?: string;
  name: string;
  description: string;
  target: number;
  unit: string;
  target2: number;
  unit2: string;
  videoLink: string;
}
export interface CsvRowPatch {
  _id: string; // Mongo _id
  name?: string;
  description?: string;
  target?: number;
  unit?: string;
  target2?: number;
  unit2?: string;
  videoLink?: string;
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
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
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

const BulkAddTable: React.FC = () => {
  const apiRef = useGridApiRef();
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
  const [changedActivities, setChangedActivities] = useState<
    Map<string, Partial<Activity>>
  >(new Map());
  const [errorCells, setErrorCells] = useState<
    { rowId: string; field: keyof Activity }[]
  >([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [invalidCount, setInvalidCount] = useState(0);
  const context = useContext(DataContext);
  const [dupInfo, setDupInfo] = useState<Record<string, number[]>>({});
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  if (!context) {
    return <div>Loading...</div>;
  }
  const { setSelectComponent } = context;
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
    if (context.activities_api_call && context.activities_api_call.length > 0) {
      const mapped: Activity[] = context.activities_api_call.map((a, i) => ({
        activityId: a.id || a._id, // Use MongoDB ID
        name: a.name,
        description: a.description,
        target: a.target || 0,
        unit: a.unit || "",
        target2: a.target2 || 0,
        unit2: a.unit2 || "",
        videoLink: a.videoLink || "",
      }));
      setActivities(mapped);
      setFilteredActivities(mapped);
      setLoading(false);
    }
  }, [context.activities_api_call]);
  useEffect(() => {
    let currentActivities: Activity[] = isEditMode
      ? editedActivities
      : activities;
    if (isAddingActivity && newActivityData) {
      currentActivities = [newActivityData, ...currentActivities];
    }

    const path: { rowId: string; field: keyof Activity }[] = [];

    // Validate required fields
    currentActivities.forEach((row) => {
      if (!row.name?.trim())
        path.push({ rowId: row.activityId, field: "name" });
      if (!row.description?.trim())
        path.push({ rowId: row.activityId, field: "description" });
      if (!row.target || row.target <= 0)
        path.push({ rowId: row.activityId, field: "target" });
      if (!unitOptions.includes(row.unit))
        path.push({ rowId: row.activityId, field: "unit" });
    });

    // Track seen names to identify duplicates
    const seenNames = new Set<string>();
    const duplicateIds = new Set<string>();

    currentActivities.forEach((r) => {
      const key = r.name.trim().toLowerCase();
      if (seenNames.has(key)) {
        // This is a duplicate (not the first occurrence)
        duplicateIds.add(r.activityId);
        path.push({ rowId: r.activityId, field: "name" });
      } else {
        // This is the first occurrence
        seenNames.add(key);
      }
    });

    // Compute dupInfo - only for actual duplicates
    const nameToIds: Record<string, string[]> = {};
    currentActivities.forEach((a) => {
      const key = a.name.trim().toLowerCase();
      nameToIds[key] = nameToIds[key] || [];
      nameToIds[key].push(a.activityId);
    });

    const dupInfoTemp: Record<string, number[]> = {};
    currentActivities.forEach((a, index) => {
      const key = a.name.trim().toLowerCase();
      // Only add dupInfo for activities that are marked as duplicates
      if (nameToIds[key]?.length > 1 && duplicateIds.has(a.activityId)) {
        const otherIds = nameToIds[key].filter((id) => id !== a.activityId);
        const otherSlnos = otherIds
          .map((id) => {
            const idx = currentActivities.findIndex(
              (act) => act.activityId === id
            );
            return idx !== -1 ? idx + 1 : null;
          })
          .filter((sl): sl is number => sl !== null)
          .sort((a, b) => a - b);
        dupInfoTemp[a.activityId] = otherSlnos;
      }
    });

    setDupInfo(dupInfoTemp);
    setErrorCells(path);
    setInvalidCount(path.length);
  }, [
    activities,
    editedActivities,
    isEditMode,
    isAddingActivity,
    newActivityData,
  ]);

  useEffect(() => {
    const sourceData = isEditMode ? editedActivities : activities;
    const filtered = sourceData.filter(
      (activity) =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredActivities(filtered);
  }, [searchTerm, activities, editedActivities, isEditMode]);

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
    if (!newActivityData) return false;

    // basic validation
    const name = newActivityData.name.trim();
    const description = newActivityData.description.trim();
    const unit = newActivityData.unit.trim();
    if (!name || !description || newActivityData.target <= 0 || !unit) {
      enqueueSnackbar("Fill required fields", { variant: "error" });
      return false;
    }

    try {
      // 1. send to scratch collection
      const created = await addScratchRow({
        name,
        description,
        target: Number(newActivityData.target),
        unit,
        target2: Number(newActivityData.target2) || 0,
        unit2: newActivityData.unit2.trim() || "",
        videoLink: newActivityData.videoLink.trim() || "",
      });

      // 2. merge into local list so grid shows it instantly
      const newRow: Activity = {
        activityId: created.id, // mongo _id from backend
        name: created.name,
        description: created.description,
        target: created.target,
        unit: created.unit,
        target2: created.target2 || 0,
        unit2: created.unit2 || "",
        videoLink: created.videoLink || "",
      };
      setActivities((prev) => [newRow, ...prev]);

      enqueueSnackbar("Activity added to scratch!", { variant: "success" });
      return true;
    } catch (e) {
      enqueueSnackbar("Failed to add", { variant: "error" });
      return false;
    }
  };
  const handleVideoLinkClick = (videoLink: string, activityName: string) => {
    if (videoLink) {
      setCurrentVideoUrl(videoLink);
      setVideoTitle(activityName || "Activity Video");
      setShowVideoModal(true);
    }
  };
  const handleDeleteActivity = async (activityId: string) => {
    try {
      // Call delete API using the MongoDB ID
      const response = await fetch(
        `${API_BASE_URL}/activity-templates:csv-scratch/${activityId}`,
        {
          method: "DELETE",
        }
      );
      console.log("deleting", activityId);
      if (!response.ok) {
        throw new Error("Failed to delete from server");
      }

      // Remove from local state
      const updatedActivities = activities.filter(
        (activity) => activity.activityId !== activityId
      );
      setActivities(updatedActivities);

      if (isEditMode) {
        const updatedEditedActivities = editedActivities.filter(
          (activity) => activity.activityId !== activityId
        );
        setEditedActivities(updatedEditedActivities);

        setChangedActivities((prev) => {
          const newMap = new Map(prev);
          newMap.delete(activityId);
          return newMap;
        });
      }

      enqueueSnackbar("Activity removed!", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      enqueueSnackbar("Failed to delete activity", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };
  // Add this helper function before the columns definition (around line 370):
  const hasCellError = (rowId: string, field: keyof Activity): boolean => {
    // Don't show errors for the new activity being added (temp IDs start with "temp-")
    if (rowId.startsWith("temp-")) {
      return false;
    }
    return errorCells.some(
      (error) => error.rowId === rowId && error.field === field
    );
  };

  // Update the columns array with cell-level error highlighting:
  const columns: GridColDef[] = [
    {
      field: "slNo",
      headerName: "Sl No.",
      width: 80,
      headerAlign: "center",
      align: "center",
      sortable: false,
      editable: false,
    },
    {
      field: "name",
      headerName: "Name",
      flex: 0.75,
      minWidth: 56,
      headerAlign: "left",
      align: "left",
      editable: isEditMode || isAddingActivity,
      renderCell: (params) => {
        const activityId = params.row.activityId;
        const hasError = hasCellError(activityId, "name");
        let displayValue = params.value;

        if (dupInfo[activityId]?.length > 0) {
          displayValue += ` (duplicate)`;
        }

        if (
          params.row.id === "new-activity" &&
          (!params.value || params.value === "")
        ) {
          return (
            <span style={{ color: "gray", fontStyle: "italic" }}>
              Add New Activity Here
            </span>
          );
        }

        return (
          <div
            style={{
              border: hasError ? "1px solid red" : "none",
              padding: hasError ? "3px" : "4px",
              borderRadius: "3px",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            {displayValue}
          </div>
        );
      },
      renderEditCell: (params) => (
        <GridEditInputCell {...params} placeholder="Add name" />
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 0.75,
      minWidth: 112,
      headerAlign: "left",
      align: "left",
      editable: isEditMode || isAddingActivity,
      renderCell: (params) => {
        const hasError = hasCellError(params.row.activityId, "description");
        return (
          <div
            style={{
              border: hasError ? "1px solid red" : "none",
              padding: hasError ? "3px" : "4px",
              borderRadius: "3px",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            {params.value || "-"}
          </div>
        );
      },
      renderEditCell: (params) => (
        <GridEditInputCell {...params} placeholder="Add description" />
      ),
    },
    {
      field: "target",
      headerName: "Target",
      width: 120,
      headerAlign: "center",
      align: "center",
      editable: isEditMode || isAddingActivity,
      type: "number",
      renderCell: (params) => {
        const hasError = hasCellError(params.row.activityId, "target");
        return (
          <div
            style={{
              border: hasError ? "1px solid red" : "none",
              padding: hasError ? "3px" : "4px",
              borderRadius: "3px",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            {params.value || "-"}
          </div>
        );
      },
      renderEditCell: (params) => (
        <GridEditInputCell {...params} placeholder="Add target" />
      ),
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
      renderCell: (params) => {
        const hasError = hasCellError(
          params.row.activityId,
          "unit",
          params.row
        );
        const isEditable =
          isEditMode || (isAddingActivity && params.row.id === "new-activity");
        const value = formatUnit(params.value as string) || "";

        if (isEditable) {
          return (
            <div
              style={{
                border: hasError ? "1px solid red" : "none",
                padding: hasError ? "3px" : "4px",
                borderRadius: "3px",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              {value || (
                <span style={{ color: "gray", fontStyle: "italic" }}>
                  Select unit
                </span>
              )}
              <ChevronDown
                size={16}
                style={{ marginLeft: "4px", color: "gray" }}
              />
            </div>
          );
        } else {
          return (
            <div
              style={{
                border: hasError ? "1px solid red" : "none",
                padding: hasError ? "3px" : "4px",
                borderRadius: "3px",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              {value || "-"}
            </div>
          );
        }
      },
    },
    {
      field: "target2",
      headerName: "Target 2",
      width: 120,
      headerAlign: "center",
      align: "center",
      editable: isEditMode || isAddingActivity,
      type: "number",
      renderEditCell: (params) => (
        <GridEditInputCell {...params} placeholder="Add target2" />
      ),
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
      renderCell: (params) => {
        const isEditable =
          isEditMode || (isAddingActivity && params.row.id === "new-activity");
        const value = formatUnit(params.value as string) || "";
        if (isEditable) {
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              {value || (
                <span style={{ color: "gray", fontStyle: "italic" }}>
                  Select unit
                </span>
              )}
              <ChevronDown
                size={16}
                style={{ marginLeft: "4px", color: "gray" }}
              />
            </div>
          );
        } else {
          return value || "-";
        }
      },
    },
    {
      field: "videoLink",
      headerName: "Video Link",
      flex: 0.75,
      minWidth: 200,
      headerAlign: "center",
      align: "left",
      editable: isEditMode || isAddingActivity,
      renderEditCell: (params) => (
        <GridEditInputCell {...params} placeholder="Add video link" />
      ),
      renderCell: (params) => {
        if (isEditMode || isAddingActivity) {
          return params.value || "-";
        } else {
          if (params.value) {
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoLinkClick(params.value, params.row.name);
                }}
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
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      headerAlign: "center",
      align: "center",
      sortable: false,
      editable: false,
      renderCell: (params) => {
        if (params.row.id === "new-activity") {
          return <div></div>;
        }

        return (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteActivity(params.row.activityId);
              }}
              className="text-red-500 hover:text-red-700 cursor-pointer p-1"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: "1rem",
              }}
              title="Delete activity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
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
  const doBulkAddPage = async () => {
    const { page, pageSize } = paginationModel;

    const start = page * pageSize;
    const end = start + pageSize;
    const pageRows = filteredActivities.slice(start, end);

    if (!pageRows.length) {
      enqueueSnackbar("No valid rows on this page", { variant: "warning" });
      return;
    }

    const payload = pageRows.map((a) => ({
      name: a.name,
      description: a.description,
      target: a.target,
      unit: a.unit,
      target2: a.target2 || undefined,
      unit2: a.unit2 || undefined,
      videoLink: a.videoLink || undefined,
      scratchId: a.activityId,
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/activity-templates:bulk-add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      const result = await res.json();
      enqueueSnackbar(
        `Page saved: ${result.created?.length || 0} added, ${
          result.skipped?.length || 0
        } skipped`,
        { variant: "success" }
      );

      /* === LAST-PAGE CHECK === */
      // total pages after we remove the rows we just saved
      const totalRowsAfterSave =
        activities.length - (result.created?.length || 0);
      const totalPagesAfterSave = Math.ceil(totalRowsAfterSave / pageSize);

      if (page + 1 >= totalPagesAfterSave) {
        // we were on the last page → go home
        context.setActivities_api_call([]);
        setSelectComponent("AllActivities");
        return;
      }

      /* === NOT last page → refresh remaining rows === */
      const savedIds = new Set(
        result.created?.map((c: any) => c.scratchId) || []
      );
      const remainingIds = activities
        .map((a) => a.activityId)
        .filter((id) => !savedIds.has(id));

      if (remainingIds.length) {
        const freshRes = await fetch(
          `${API_BASE_URL}/activity-templates:csv-scratch?ids=${remainingIds.join(
            ","
          )}`
        );
        if (!freshRes.ok) throw new Error("Failed to refresh");
        context.setActivities_api_call(await freshRes.json());
      }
    } catch (e) {
      enqueueSnackbar("Page save failed", { variant: "error" });
    }
  };
  const addScratchRow = async (row: Omit<Activity, "activityId">) => {
    const payload = {
      name: row.name,
      description: row.description,
      target: row.target,
      unit: row.unit,
      target2: row.target2 || undefined,
      unit2: row.unit2 || undefined,
      videoLink: row.videoLink || undefined,
    };
    const res = await fetch(
      `${API_BASE_URL}/activity-templates:csv-scratch:single`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    const fresh = await res.json();
    return fresh; // contains the new mongo _id
  };
  const bulkUpdateCsvScratch = async (updates: CsvRowPatch[]) => {
    const res = await fetch(
      `${API_BASE_URL}/activity-templates:csv-scratch:batch`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json(); // returns updated docs
  };
  return (
    <>
      <Header />
      <div className="all-acts-container">
        <div className="search-container">
          <div className="search-and-actions">
            <Button
              variant="outlined"
              startIcon={<CornerDownLeft size={16} />}
              onClick={() => {
                setSelectComponent("AllActivities");
              }}
              className="action-button"
            >
              Return
            </Button>
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
                    variant="outlined"
                    startIcon={<Edit size={16} />}
                    onClick={() => {
                      setIsEditMode(true);
                      setOriginalActivities([...activities]);
                      setEditedActivities([...activities]);
                    }}
                    className="action-button"
                  >
                    Edit Mode
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={doBulkAddPage}
                    className="action-button"
                  >
                    Save page
                  </Button>
                </>
              ) : isEditMode ? (
                // Edit mode buttons
                <div className="edit-mode-buttons">
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={async () => {
                      if (changedActivities.size === 0) {
                        setIsEditMode(false);
                        return;
                      }

                      const patches: CsvRowPatch[] = Array.from(
                        changedActivities.values()
                      ).map((ch) => ({
                        _id: ch.activityId, // mongo _id
                        name: ch.name,
                        description: ch.description,
                        target: ch.target,
                        unit: ch.unit,
                        target2: ch.target2,
                        unit2: ch.unit2,
                        videoLink: ch.videoLink,
                      }));

                      try {
                        const freshDocs = await bulkUpdateCsvScratch(patches);

                        // Fast lookup map of updated docs
                        const updatedMap = new Map(
                          freshDocs.map((d: any) => [d.id, d])
                        );

                        // Merge: updated rows overwrite, untouched rows stay
                        const merged = activities.map((old) => {
                          const upd = updatedMap.get(old.activityId);
                          if (!upd) return old; // unchanged row
                          return {
                            activityId: upd.id,
                            name: upd.name,
                            description: upd.description,
                            target: upd.target,
                            unit: upd.unit,
                            target2: upd.target2,
                            unit2: upd.unit2,
                            videoLink: upd.videoLink,
                          };
                        });

                        setActivities(merged);
                        setEditedActivities(merged);
                        setChangedActivities(new Map());
                        enqueueSnackbar("Bulk edit saved!", {
                          variant: "success",
                        });
                        setIsEditMode(false);
                      } catch (e) {
                        enqueueSnackbar("Save failed", { variant: "error" });
                      }
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
                      setChangedActivities(new Map()); // Clear tracked changes
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
                          // No need to refetch - activity is already added to state
                          console.log("New activity added locally");
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
            apiRef={apiRef}
            onCellClick={(params) => {
              if ((isEditMode || isAddingActivity) && params.isEditable) {
                apiRef.current.startCellEditMode({
                  id: params.id,
                  field: params.field,
                });
              }
            }}
            getRowClassName={(params) => {
              if (params.row.id === "new-activity") return "new-activity-row";
              if (isEditMode) {
                const hasChanges = changedActivities.has(params.row.activityId);
                return hasChanges
                  ? "new-activity-row changed-row"
                  : "new-activity-row";
              }
              return "";
            }}
            rows={rows}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20]}
            checkboxSelection
            className="data-grid"
            onRowSelectionModelChange={(ids) => {
              // Ensure ids is an array
              const idsArray = Array.isArray(ids) ? ids : Array.from(ids);

              // Map back to activityIds using the row data
              const activityIds = idsArray
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
                // Keep existing new activity logic unchanged
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
                const activityId = newRow.activityId;
                const originalActivity = originalActivities.find(
                  (a) => a.activityId === activityId
                );

                if (originalActivity) {
                  // Track only actually changed fields
                  const changes: Partial<Activity> = {};
                  if (newRow.name !== originalActivity.name)
                    changes.name = newRow.name;
                  if (newRow.description !== originalActivity.description)
                    changes.description = newRow.description;
                  if (newRow.target !== originalActivity.target)
                    changes.target = newRow.target;
                  if (newRow.unit !== originalActivity.unit)
                    changes.unit = newRow.unit;
                  if (newRow.target2 !== originalActivity.target2)
                    changes.target2 = newRow.target2;
                  if (newRow.unit2 !== originalActivity.unit2)
                    changes.unit2 = newRow.unit2;
                  if (newRow.videoLink !== originalActivity.videoLink)
                    changes.videoLink = newRow.videoLink;

                  // Update changedActivities map
                  setChangedActivities((prev) => {
                    const newMap = new Map(prev);
                    if (Object.keys(changes).length > 0) {
                      newMap.set(activityId, { activityId, ...changes });
                    } else {
                      newMap.delete(activityId);
                    }
                    return newMap;
                  });

                  // Update editedActivities for display
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
              }
              /* ---------- real-time error reduction ---------- */
              const updatedRow = newRow as Activity;
              const fresh: { rowId: string; field: keyof Activity }[] = [];

              // rebuild errors for **this row only**
              if (!updatedRow.name?.trim())
                fresh.push({ rowId: updatedRow.activityId, field: "name" });
              if (!updatedRow.description?.trim())
                fresh.push({
                  rowId: updatedRow.activityId,
                  field: "description",
                });
              if (!updatedRow.target || updatedRow.target <= 0)
                fresh.push({ rowId: updatedRow.activityId, field: "target" });
              if (!unitOptions.includes(updatedRow.unit))
                fresh.push({ rowId: updatedRow.activityId, field: "unit" });

              // merge with errors from **other rows**
              const otherErrors = errorCells.filter(
                (e) => e.rowId !== updatedRow.activityId
              );
              setErrorCells([...otherErrors, ...fresh]);
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
      <Dialog open={bulkConfirmOpen} onClose={() => setBulkConfirmOpen(false)}>
        <DialogTitle>Confirm Bulk Add</DialogTitle>
        <DialogContent>
          {invalidCount === 0
            ? "No errors found. Proceed to add all valid rows?"
            : `${invalidCount} invalid field(s) found. Invalid rows will be skipped. Proceed?`}
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setBulkConfirmOpen(false)}>
            Cancel
          </MuiButton>
          <MuiButton
            onClick={() => {
              setBulkConfirmOpen(false);
              // doBulkAdd();
            }}
            variant="contained"
          >
            Confirm
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkAddTable;
