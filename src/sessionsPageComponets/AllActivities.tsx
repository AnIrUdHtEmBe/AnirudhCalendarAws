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
import { SearchIcon, Plus, Save, Edit, ChevronDown } from "lucide-react";
import Header from "./Header";
import "./AllActivities.css";
import { enqueueSnackbar } from "notistack";
import { API_BASE_URL, API_BASE_URL2 } from "../store/axios";
import { DataContext, Activity_Api_call } from "../store/DataContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
} from "@mui/material";
import YouTubeVideoModal from "../Youtube/YouTubeVideoModal";
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

// YouTube Video Modal Component
// const YouTubeVideoModal = ({
//   isOpen,
//   onClose,
//   videoUrl,
//   title,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   videoUrl: string;
//   title: string;
// }) => {
//   if (!isOpen) return null;

//   // Extract YouTube video ID from URL
//   const getYouTubeVideoId = (url: string) => {
//     const regExp =
//       /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
//     const match = url.match(regExp);
//     return match && match[2].length === 11 ? match[2] : null;
//   };

//   const videoId = getYouTubeVideoId(videoUrl);
//   const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";

//   return (
//     <div
//       className="fixed inset-0 flex items-center justify-center z-50"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[80vh] overflow-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold">{title}</h3>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
//           >
//             ×
//           </button>
//         </div>
//         <div className="aspect-video">
//           {embedUrl ? (
//             <iframe
//               width="100%"
//               height="100%"
//               src={embedUrl}
//               title={title}
//               frameBorder="0"
//               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//               allowFullScreen
//             />
//           ) : (
//             <div className="flex items-center justify-center h-full bg-gray-100">
//               <p className="text-gray-500">Invalid YouTube URL</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

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
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [uploadOpen, setUploadOpen] = useState(false); // modal open/close
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvName, setCsvName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [csvScratchIds, setCsvScratchIds] = useState<string[]>([]);
  const context = useContext(DataContext);
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
  // 1.  memoise the countdown logic
  const startCountDown = React.useCallback(() => {
    let n = 5;
    setCountDown(n);
    const t = setInterval(() => {
      n -= 1;
      setCountDown(n);
      if (n === 0) {
        clearInterval(t);
        setCountDown(0);
        setUploadOpen(false); // close modal
        enqueueSnackbar("CSV parsed successfully!", { variant: "success" });
        context.setSelectComponent("BulkAddTable");
      }
    }, 1000);
  }, [context]);
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
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/activity-templates:csv-scratch/count?category=act`
        );
        const { pending } = await res.json();
        setPendingCount(pending);
      } catch {
        setPendingCount(0);
      }
    })();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/activity-templates`);
      console.log(API_BASE_URL);

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
      const response = await fetch(`${API_BASE_URL}/activity-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      });
      console.log(API_BASE_URL, "ADD");
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
      enqueueSnackbar("Failed to create activity", { variant: "error" });
      return false;
    }
  };

  const bulkUpdateActivities = async (
    updates: Array<{ activityId: string } & Partial<Activity>>
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/activity-templates:batch`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      console.log(API_BASE_URL, "EDIT");
      if (!response.ok) {
        throw new Error("Failed to bulk update activities");
      }
      console.log(updates);

      return await response.json();
    } catch (error) {
      console.error("Error bulk updating activities:", error);
      throw error;
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
      headerAlign: "left",
      align: "left",
      editable: isEditMode || isAddingActivity,
      renderCell: (params) => {
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
        return params.value;
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
      headerAlign: "left",
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
  //csv download functions
  // ----------  CSV download  ----------
  const handleDownloadSample = () => {
    const headers = [
      "Name",
      "Description",
      "Target",
      "Unit",
      "Target2",
      "Unit2",
      "VideoLink",
    ];
    const csvContent = headers.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_activities.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // ----------  CSV parse  ----------
  const handleParse = async () => {
    if (!csvFile) return;
    setParsing(true);
    try {
      const text = await csvFile.text();

      /* ----------  simple CSV -> 2-D array  ---------- */
      const rows: string[][] = [];
      let cur = "",
        insideQuote = false,
        row: string[] = [];
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const n = text[i + 1];
        if (c === '"') {
          if (insideQuote && n === '"') {
            cur += '"';
            i++;
          } // escaped quote
          else {
            insideQuote = !insideQuote;
          }
        } else if (c === "," && !insideQuote) {
          row.push(cur);
          cur = "";
        } else if (c === "\n" && !insideQuote) {
          row.push(cur);
          rows.push(row);
          cur = "";
          row = [];
        } else {
          cur += c;
        }
      }
      if (cur || row.length) {
        row.push(cur);
        rows.push(row);
      } // last line

      if (!rows.length) throw new Error("Empty file");
      const EXPECTED_HEADERS = [
        "Name",
        "Description",
        "Target",
        "Unit",
        "Target2",
        "Unit2",
        "VideoLink",
      ];
      const [firstRow] = rows;
      const normalizedIncoming = firstRow.map((h) => h.trim());
      const match =
        normalizedIncoming.length === EXPECTED_HEADERS.length &&
        normalizedIncoming.every((h, idx) => h === EXPECTED_HEADERS[idx]);

      if (!match) {
        enqueueSnackbar(
          "CSV headers do not match the required format. Download Sample Form to check",
          { variant: "error" }
        );
        setParsing(false);
        return;
      }
      /* ----------  build objects  ---------- */
      const [, ...data] = rows;
      const payload = data.map((r) => ({
        name: r[0] ?? "",
        description: r[1] ?? "",
        target: parseFloat(r[2]) || 0,
        unit: (r[3] ?? "").trim().toLowerCase(),
        target2: parseFloat(r[4]) || 0,
        unit2: (r[5] ?? "").trim().toLowerCase(),
        videoLink: r[6] ?? "",
        category: "act",
      }));

      /* ----------  send to backend  ---------- */
      const res = await fetch(
        `${API_BASE_URL}/activity-templates:csv-scratch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to store CSV rows");

      const { inserted_ids } = await res.json();
      const freshRes = await fetch(
        `${API_BASE_URL}/activity-templates:csv-scratch?ids=${inserted_ids.join(
          ","
        )}&category=act`
      );
      const freshRows = await freshRes.json();
      context.setActivities_api_call(freshRows);
      setCsvScratchIds(inserted_ids);
      startCountDown();
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Failed to parse CSV.", { variant: "error" });
    } finally {
      setParsing(false);
    }
  };
  const handleContinue = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/activity-templates:csv-scratch?category=act`
      );
      if (!res.ok) throw new Error("Could not fetch pending rows");

      const rows = await res.json(); // already in Activity_Api_call shape
      context.setActivities_api_call(rows); // fill bulk-add table
      setUploadOpen(false); // close modal if open
      context.setSelectComponent("BulkAddTable"); // go to bulk-add page
    } catch (err) {
      enqueueSnackbar("Failed to load pending activities", {
        variant: "error",
      });
    }
  };
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
                  <div
                    className="excel-download-container"
                    title="Download Sample Excel"
                    onClick={handleDownloadSample}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="30"
                      height="30"
                      viewBox="0 0 48 48"
                      className="excel-download-icon"
                      style={{
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <rect
                        width="16"
                        height="9"
                        x="28"
                        y="15"
                        fill="#21a366"
                      ></rect>
                      <path
                        fill="#185c37"
                        d="M44,24H12v16c0,1.105,0.895,2,2,2h28c1.105,0,2-0.895,2-2V24z"
                      ></path>
                      <rect
                        width="16"
                        height="9"
                        x="28"
                        y="24"
                        fill="#107c42"
                      ></rect>
                      <rect
                        width="16"
                        height="9"
                        x="12"
                        y="15"
                        fill="#3fa071"
                      ></rect>
                      <path
                        fill="#33c481"
                        d="M42,6H28v9h16V8C44,6.895,43.105,6,42,6z"
                      ></path>
                      <path
                        fill="#21a366"
                        d="M14,6h14v9H12V8C12,6.895,12.895,6,14,6z"
                      ></path>
                      <path
                        d="M22.319,13H12v24h10.319C24.352,37,26,35.352,26,33.319V16.681C26,14.648,24.352,13,22.319,13z"
                        opacity=".05"
                      ></path>
                      <path
                        d="M22.213,36H12V13.333h10.213c1.724,0,3.121,1.397,3.121,3.121v16.425	C25.333,34.603,23.936,36,22.213,36z"
                        opacity=".07"
                      ></path>
                      <path
                        d="M22.106,35H12V13.667h10.106c1.414,0,2.56,1.146,2.56,2.56V32.44C24.667,33.854,23.520,35,22.106,35z"
                        opacity=".09"
                      ></path>
                      <linearGradient
                        id="excelDownloadGrad"
                        x1="4.725"
                        x2="23.055"
                        y1="14.725"
                        y2="33.055"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0" stopColor="#18884f"></stop>
                        <stop offset="1" stopColor="#0b6731"></stop>
                      </linearGradient>
                      <path
                        fill="url(#excelDownloadGrad)"
                        d="M22,34H6c-1.105,0-2-0.895-2-2V16c0-1.105,0.895-2,2-2h16c1.105,0,2,0.895,2,2v16	C24,33.105,23.105,34,22,34z"
                      ></path>
                      <path
                        fill="#fff"
                        d="M9.807,19h2.386l1.936,3.754L16.175,19h2.229l-3.071,5l3.141,5h-2.351l-2.11-3.93L11.912,29H9.526	l3.193-5.018L9.807,19z"
                      ></path>

                      {/* Download arrow overlay */}
                      <g transform="translate(24, 12)">
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="rgba(255,255,255,0.9)"
                          stroke="#21a366"
                          strokeWidth="1"
                        />
                        <path
                          d="M6 8 L10 12 L14 8"
                          stroke="#21a366"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 4 L10 12"
                          stroke="#21a366"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </g>
                    </svg>
                    <span
                      className="excel-action-label"
                      style={{ paddingLeft: "0.3rem" }}
                    >
                      SAMPLE FORM
                    </span>
                  </div>
                  <div
                    className="excel-upload-container"
                    title="Upload Excel File"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvName("");
                      setUploadOpen(true);
                    }}
                    style={{
                      cursor: isParsing ? "not-allowed" : "pointer",
                      opacity: isParsing ? 0.5 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="30"
                      height="30"
                      viewBox="0 0 48 48"
                      className="excel-upload-icon"
                    >
                      <rect
                        width="16"
                        height="9"
                        x="28"
                        y="15"
                        fill="#21a366"
                      ></rect>
                      <path
                        fill="#185c37"
                        d="M44,24H12v16c0,1.105,0.895,2,2,2h28c1.105,0,2-0.895,2-2V24z"
                      ></path>
                      <rect
                        width="16"
                        height="9"
                        x="28"
                        y="24"
                        fill="#107c42"
                      ></rect>
                      <rect
                        width="16"
                        height="9"
                        x="12"
                        y="15"
                        fill="#3fa071"
                      ></rect>
                      <path
                        fill="#33c481"
                        d="M42,6H28v9h16V8C44,6.895,43.105,6,42,6z"
                      ></path>
                      <path
                        fill="#21a366"
                        d="M14,6h14v9H12V8C12,6.895,12.895,6,14,6z"
                      ></path>
                      <path
                        d="M22.319,13H12v24h10.319C24.352,37,26,35.352,26,33.319V16.681C26,14.648,24.352,13,22.319,13z"
                        opacity=".05"
                      ></path>
                      <path
                        d="M22.213,36H12V13.333h10.213c1.724,0,3.121,1.397,3.121,3.121v16.425	C25.333,34.603,23.936,36,22.213,36z"
                        opacity=".07"
                      ></path>
                      <path
                        d="M22.106,35H12V13.667h10.106c1.414,0,2.56,1.146,2.56,2.56V32.44C24.667,33.854,23.520,35,22.106,35z"
                        opacity=".09"
                      ></path>
                      <linearGradient
                        id="excelUploadGrad"
                        x1="4.725"
                        x2="23.055"
                        y1="14.725"
                        y2="33.055"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0" stopColor="#18884f"></stop>
                        <stop offset="1" stopColor="#0b6731"></stop>
                      </linearGradient>
                      <path
                        fill="url(#excelUploadGrad)"
                        d="M22,34H6c-1.105,0-2-0.895-2-2V16c0-1.105,0.895-2,2-2h16c1.105,0,2,0.895,2,2v16	C24,33.105,23.105,34,22,34z"
                      ></path>
                      <path
                        fill="#fff"
                        d="M9.807,19h2.386l1.936,3.754L16.175,19h2.229l-3.071,5l3.141,5h-2.351l-2.11-3.93L11.912,29H9.526	l3.193-5.018L9.807,19z"
                      ></path>

                      {/* Upload arrow overlay */}
                      <g transform="translate(24, 12)">
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="rgba(255,255,255,0.9)"
                          stroke="#21a366"
                          strokeWidth="1"
                        />
                        <path
                          d="M14 12 L10 8 L6 12"
                          stroke="#21a366"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 16 L10 8"
                          stroke="#21a366"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </g>
                    </svg>
                    <span
                      className="excel-action-label"
                      style={{ paddingLeft: "0.3rem" }}
                    >
                      {isParsing ? "PARSING..." : "UPLOAD BULK DATA"}
                    </span>
                  </div>
                  {pendingCount > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Button variant="contained" onClick={handleContinue}>
                        VIEW AND RESOLVE
                      </Button>
                      <span className="pending-badge">
                        {pendingCount} uploaded activities not in DB
                      </span>
                    </div>
                  )}
                </>
              ) : isEditMode ? (
                // Edit mode buttons
                <div className="edit-mode-buttons">
                  <Button
                    variant="contained"
                    startIcon={<Save size={16} />}
                    onClick={async () => {
                      if (changedActivities.size > 0) {
                        try {
                          const updates = Array.from(
                            changedActivities.values()
                          );
                          await bulkUpdateActivities(updates);

                          // Update local state with changes
                          setActivities([...editedActivities]);

                          enqueueSnackbar(
                            `${updates.length} activities updated successfully!`,
                            {
                              variant: "success",
                              autoHideDuration: 3000,
                            }
                          );
                        } catch (error) {
                          enqueueSnackbar(
                            "Failed to update activities. Please try again.",
                            {
                              variant: "error",
                              autoHideDuration: 3000,
                            }
                          );
                          return;
                        }
                      }

                      setIsEditMode(false);
                      setChangedActivities(new Map());
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
            rowBufferPx={35}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 50 },
              },
            }}
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
      {/* ----------  CSV-upload dialog  ---------- */}
      <Dialog
        open={uploadOpen}
        onClose={() => !(parsing || countDown) && setUploadOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ position: "relative" }}>
          Upload CSV
          <button
            onClick={() => setUploadOpen(false)}
            disabled={parsing || countDown}
            style={{
              position: "absolute",
              right: "24px",
              top: "8px",
              background: "none",
              border: "none",
              fontSize: "25px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </DialogTitle>
        <DialogContent>
          {/* file name + browse */}
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TextField
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
              value={csvName}
              placeholder="No file chosen"
            />
            <Button
              variant="outlined"
              component="label"
              disabled={parsing || !!countDown}
            >
              Browse
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setCsvFile(f);
                  setCsvName(f?.name || "");
                }}
              />
            </Button>
          </Box>

          {/* status + parse */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={2}
            sx={{
              minHeight: "40px", // Prevent layout shift
            }}
          >
            {(parsing || countDown > 0) && (
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  background:
                    "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                  border: "1px solid #1976d2",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  animation: "fadeIn 0.3s ease-in-out",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.2)",
                  "@keyframes fadeIn": {
                    "0%": { opacity: 0, transform: "translateY(-10px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress
                    size={18}
                    sx={{
                      color: "#1976d2",
                      "& .MuiCircularProgress-circle": {
                        strokeLinecap: "round",
                      },
                    }}
                  />
                  {/* Pulsing dot overlay for extra visual feedback */}
                  <Box
                    sx={{
                      position: "absolute",
                      width: "6px",
                      height: "6px",
                      backgroundColor: "#1976d2",
                      borderRadius: "50%",
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 0.3, transform: "scale(1)" },
                        "50%": { opacity: 1, transform: "scale(1.2)" },
                      },
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: "#1565c0",
                    fontSize: "0.875rem",
                  }}
                >
                  {countDown > 0 ? `Analysing ${countDown}…` : "Parsing CSV…"}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              disabled={!csvFile || parsing || !!countDown}
              onClick={handleParse}
            >
              Parse CSV
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AllActivities;
