// import { LucideCircleMinus, Plus, Save, X, Eye, Edit } from "lucide-react";
// import { useContext, useEffect, useMemo, useState } from "react";
// import {
//   Activity_Api_call,
//   DataContext,
//   Session_Api_call,
// } from "../store/DataContext";
// import { ActivityUtils } from "../Utils/ActivityUtils";

// import "./ActivityTable.css";
// import {
//   Autocomplete,
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   TextField,
//   Checkbox,
// } from "@mui/material";
// import { useApiCalls } from "../store/axios";
// import YouTubeVideoModal from "../Youtube/YouTubeVideoModal";
// import { API_BASE_URL, API_BASE_URL2 } from "../store/axios";
// import Header from "./Header";

// function EnhancedActivityTable() {
//   // Authentication check from EnhancedActivityTable
//   const checkAuth = () => {
//     try {
//       const token = sessionStorage.getItem("token");
//       console.log(token, "token log");
//       if (!token) return false;
//       console.log(token, "token log 1");
//       // Parse JWT payload
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       console.log(payload, "token log 2");

//       return payload.sub === "USER_MHKN56";
//     } catch (error) {
//       console.error("Auth check error:", error);
//       return false;
//     }
//   };

//   if (!checkAuth()) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         Nothing found
//       </div>
//     );
//   }

//   const context = useContext(DataContext);
//   if (!context) {
//     return <div>Loading...</div>;
//   }
//   const { getActivities, createActivity, getActivityById, createSession } =
//     useApiCalls();
//   useEffect(() => {
//     getActivities();
//   }, []);

//   const { setSelectComponent, activities_api_call } = context;
//   const [planName, setPlanName] = useState<string>("");
//   const [category, setCategory] = useState<string>("Fitness");
//   const [theme, setTheme] = useState("");
//   const [goal, setGoal] = useState("");
//   const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
//   const [showModal, setShowModal] = useState(false);
//   const [resetKey, setResetKey] = useState(0);
//   const [literals, setLiterals] = useState({
//     themes: [],
//     goals: [],
//     category: [],
//   });
//   const [showVideoModal, setShowVideoModal] = useState(false);
//   const [currentVideoUrl, setCurrentVideoUrl] = useState("");
//   const [videoTitle, setVideoTitle] = useState("");
//   const [editedActivities, setEditedActivities] = useState([]);

//   // New states for enhanced functionality
//   const [selectedFilter, setSelectedFilter] = useState<string>("");
//   const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(
//     new Set()
//   );

//   useEffect(() => {});
//   useEffect(() => {
//     const fetchLiterals = async () => {
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/session-template/getLiterlas`
//         );
//         const data = await response.json();
//         setLiterals(data);
//       } catch (error) {
//         console.error("Failed to fetch literals:", error);
//       }
//     };
//     fetchLiterals();
//   }, []);

//   const [newActivities, setNewActivities] = useState<Activity_Api_call[]>([
//     {
//       name: "",
//       description: "",
//       target: null,
//       target2: null,
//       unit: "",
//       unit2: "",
//       targetReps: null,
//       videoLink: "",
//     },
//   ]);

//   const [emptyArr, setEmptyArr] = useState<Activity_Api_call[]>([
//     {
//       name: "",
//       description: "",
//       target: null,
//       target2: null,
//       unit: "",
//       unit2: "",
//       icon: "",
//       videoLink: "",
//     },
//   ]);

//   useEffect(() => {
//     console.log(emptyArr);
//     const activityIds = emptyArr.map((activity) => activity.activityId);
//     console.log(activityIds);
//   }, [emptyArr]);

//   useEffect(() => {
//     console.log(activities_api_call);
//   }, [activities_api_call]);

//   const handlePlanSaving = () => {
//     setSelectComponent("AllSessions");
//   };

//   const handleSessionCreation = async () => {
//     const activityIds: string[] = emptyArr
//       .map((item) => item.activityId)
//       .filter((id): id is string => typeof id === "string");

//     const sessionToBeCreated: Session_Api_call = {
//       title: planName,
//       description: "",
//       category: category,
//       activityIds: activityIds,
//       themes: theme ? [theme] : [],
//       goals: goal ? [goal] : [],
//     };
//     if (editedActivities.length > 0) {
//       sessionToBeCreated.editedActivities = editedActivities;
//     }
//     console.log(sessionToBeCreated);
//     await createSession(sessionToBeCreated);
    
//     // Clear all form data after successful save
//     setPlanName("");
//     setCategory("Fitness");
//     setTheme("");
//     setGoal("");
//     setEmptyArr([
//       {
//         name: "",
//         description: "",
//         target: null,
//         target2: null,
//         unit: "",
//         unit2: "",
//         icon: "",
//         videoLink: "",
//       },
//     ]);
//     setSelectedActivities({});
//     setSelectedActivityIds(new Set());
//     setEditedActivities([]);
//     setIsEditMode(false);
//     setOriginalEmptyArr([]);
//     setResetKey(prev => prev + 1);
//   };

//   const handleAddNewRow = () => {
//     setNewActivities((prev) => [
//       ...prev,
//       {
//         activityId: Date.now().toString(),
//         name: "",
//         description: "",
//         target: null,
//         target2: null,
//         unit: "",
//         unit2: "",
//         icon: "",
//         targetReps: null,
//         videoLink: "",
//       },
//     ]);
//   };

//   const addNewRow = () => {
//     setEmptyArr((prev) => [
//       ...prev,
//       {
//         id: Date.now().toString(),
//         name: "",
//         description: "",
//         target: null,
//         target2: null,
//         unit: "",
//         unit2: "",
//         icon: "",
//         videoLink: "",
//       },
//     ]);
//   };

//   const uniqueActivities = useMemo(() => {
//     const seen = new Set();
//     return activities_api_call.filter((activity) => {
//       if (seen.has(activity.name) || !activity.name) {
//         return false;
//       }
//       seen.add(activity.name);
//       return true;
//     });
//   }, [activities_api_call]);

//   // Filter activities based on selected filter
//   const filteredActivities = useMemo(() => {
//     const unique = activities_api_call.filter(
//       (activity, index, self) =>
//         activity.name &&
//         self.findIndex((a) => a.name === activity.name) === index
//     );

//     if (!selectedFilter) return unique;
//     return unique.filter(
//       (activity) =>
//         activity.category?.toUpperCase() === selectedFilter.toUpperCase()
//     );
//   }, [activities_api_call, selectedFilter]);

//   // Handle activity selection from left panel
//   const handleActivitySelect = (activity: Activity_Api_call) => {
//     if (selectedActivityIds.has(activity.activityId!)) {
//       return; // Already selected, do nothing
//     }

//     // Find first empty row
//     const emptyIndex = emptyArr.findIndex(
//       (item) => !item.activityId || item.name === ""
//     );

//     if (emptyIndex !== -1) {
//       // Update the empty row with selected activity
//       const updatedArr = [...emptyArr];
//       updatedArr[emptyIndex] = { ...activity };
//       setEmptyArr(updatedArr);

//       // Mark activity as selected
//       setSelectedActivityIds(
//         (prev) => new Set([...prev, activity.activityId!])
//       );

//       // Set selectedActivities
//       setSelectedActivities((prev) => ({
//         ...prev,
//         [emptyIndex]: activity.activityId!,
//       }));
//     } else {
//       // No empty row found, add new row
//       const newIndex = emptyArr.length;
//       setEmptyArr((prev) => [...prev, { ...activity }]);
//       setSelectedActivityIds(
//         (prev) => new Set([...prev, activity.activityId!])
//       );

//       // Set selectedActivities
//       setSelectedActivities((prev) => ({
//         ...prev,
//         [newIndex]: activity.activityId!,
//       }));
//     }
//   };

//   const handleModalSave = async () => {
//     const validActivities = newActivities.filter(
//       (activity) =>
//         activity.name &&
//         activity.name.trim() !== "" &&
//         activity.description &&
//         activity.description.trim() !== "" &&
//         activity.target !== null &&
//         activity.target !== "" &&
//         activity.target !== "0" &&
//         activity.unit &&
//         activity.unit.trim() !== ""
//     );

//     if (validActivities.length === 0) {
//       setShowModal(false);
//       return;
//     }

//     const newItems = validActivities.map((activity) => {
//       const item: any = {
//         name: activity.name.trim(),
//         description: activity.description.trim(),
//         target: Number(activity.target),
//         unit: activity.unit.trim(),
//       };

//       // only include optional fields if provided
//       if (activity.target2 !== null && activity.target2 !== "")
//         item.target2 = Number(activity.target2);
//       if (activity.unit2 && activity.unit2.trim() !== "")
//         item.unit2 = activity.unit2.trim();
//       if (activity.videoLink && activity.videoLink.trim() !== "")
//         item.videoLink = activity.videoLink.trim();

//       return item;
//     });

//     const postEachActivity = async () => {
//       try {
//         for (const item of newItems) {
//           await createActivity(item);
//         }
//       } catch (error) {
//         console.error("Error posting some activities:", error);
//       }
//     };

//     await postEachActivity();
//     await getActivities();
//     setNewActivities([
//       {
//         name: "",
//         description: "",
//         target: null,
//         target2: null,
//         unit: "",
//         unit2: "",
//         videoLink: "",
//       },
//     ]);
//     setShowModal(false);
//   };

//   const handleDelete = (index: number) => {
//     const deletedActivity = emptyArr[index];
//     const updatedPlan = emptyArr.filter((_, i) => i !== index);
//     setEmptyArr(updatedPlan);

//     // Remove from selected activities
//     if (deletedActivity.activityId) {
//       setSelectedActivityIds((prev) => {
//         const newSet = new Set(prev);
//         newSet.delete(deletedActivity.activityId!);
//         return newSet;
//       });
//     }

//     setSelectedActivities((prev) => {
//       const newSelectedActivities = { ...prev };
//       delete newSelectedActivities[index];
//       const shiftedActivities: { [key: number]: string } = {};
//       Object.keys(newSelectedActivities).forEach((key) => {
//         const numKey = parseInt(key);
//         if (numKey > index) {
//           shiftedActivities[numKey - 1] = newSelectedActivities[numKey];
//         } else if (numKey < index) {
//           shiftedActivities[numKey] = newSelectedActivities[numKey];
//         }
//       });
//       return shiftedActivities;
//     });
//   };

//   const updateTheActivitityById = async (activityId: string, index: number) => {
//     const activity = await getActivityById(activityId);
//     if (activity) {
//       emptyArr[index] = activity;
//       setEmptyArr([...emptyArr]);
//     } else {
//       console.error("Activity not found");
//     }
//   };

//   const [selectedActivities, setSelectedActivities] = useState<{
//     [id: number]: string;
//   }>({});

//   const handleActivitySelectChange = (id: number, value: string) => {
//     setSelectedActivities((prev) => ({ ...prev, [id]: value }));
//     updateTheActivitityById(value, id);
//   };

//   const handleVideoLinkClick = (videoLink: string, activityName?: string) => {
//     if (videoLink) {
//       setCurrentVideoUrl(videoLink);
//       setVideoTitle(activityName || "Activity Video");
//       setShowVideoModal(true);
//     }
//   };

//   const formatUnit = (unit: string) => {
//     switch (unit) {
//       case "weight":
//         return "Kg";
//       case "time":
//         return "Min";
//       case "distance":
//         return "Km";
//       case "repetitions":
//         return "Reps";
//       default:
//         return "";
//     }
//   };

//   const supportedUnits = ActivityUtils.filter(
//     (unit) => formatUnit(unit) !== ""
//   );
//   console.log(newActivities);
//   useEffect(() => {
//     console.log(theme);
//     console.log(goal);
//   }, [theme, goal]);

//   useEffect(() => {
//     console.log(emptyArr, "this is emort");
//   }, [emptyArr]);

//   //new edit mode
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [originalEmptyArr, setOriginalEmptyArr] = useState<Activity_Api_call[]>(
//     []
//   );

//   return (
//     <div className="w-full h-screen flex flex-col">
//       <Header />
//       <div className="activity-table-container bg-white w-full flex flex-1 rounded-2xl shadow-lg overflow-hidden gap-3 p-3">
//         {/* Left Panel - Activities List */}
//         <div className="w-1/2 border-r border-gray-300 flex flex-col">
//           {/* Left Panel Header */}
//           <div className="p-3 border-b border-gray-200">
//             <div className="flex justify-between items-center mb-3">
//               <h2 className="text-lg font-medium">Activities</h2>
//               <div className="flex items-center gap-2">
//                 {/* Select Activity Autocomplete */}
//                 <Autocomplete
//                   key={`left-activity-${resetKey}`}
//                   options={uniqueActivities}
//                   getOptionLabel={(option) => option.name || ""}
//                   value={null}
//                   onChange={(_, newValue) => {
//                     if (newValue) {
//                       handleActivitySelect(newValue);
//                       setActivityForTable(undefined); // Clear dropdown after selection
//                     }
//                   }}
//                   filterOptions={(options, { inputValue }) => {
//                     if (!inputValue || inputValue.length < 2) {
//                       return options.slice(0, 15);
//                     }

//                     const lowerInput = inputValue.toLowerCase();
//                     const exactMatches: any[] = [];
//                     const startsMatches: any[] = [];
//                     const containsMatches: any[] = [];

//                     for (const option of options) {
//                       const nameLower = option.name.toLowerCase();

//                       if (nameLower === lowerInput) {
//                         exactMatches.push(option);
//                       } else if (nameLower.startsWith(lowerInput)) {
//                         startsMatches.push(option);
//                       } else if (nameLower.includes(lowerInput)) {
//                         containsMatches.push(option);
//                       }

//                       if (
//                         exactMatches.length +
//                           startsMatches.length +
//                           containsMatches.length >=
//                         20
//                       )
//                         break;
//                     }

//                     return [
//                       ...exactMatches,
//                       ...startsMatches.sort((a, b) =>
//                         a.name.localeCompare(b.name)
//                       ),
//                       ...containsMatches.sort((a, b) =>
//                         a.name.localeCompare(b.name)
//                       ),
//                     ].slice(0, 20);
//                   }}
//                   renderInput={(params) => (
//                     <TextField
//                       {...params}
//                       label="Select Activity"
//                       variant="outlined"
//                       size="small"
//                       sx={{ width: 200 }}
//                       value="" // Ensure input is cleared
//                     />
//                   )}
//                   sx={{ width: 200, backgroundColor: "white" }}
//                   isOptionEqualToValue={(option, value) =>
//                     option.activityId === value.activityId
//                   }
//                   freeSolo
//                   noOptionsText="Type 2+ characters to search..."
//                   disablePortal
//                   blurOnSelect
//                   clearOnBlur // Clear input on blur
//                 />

//                 {/* Create New Activity Button */}
//                 <button
//                   className="flex items-center justify-center space-x-1 p-2 text-xs plus-new-actvity"
//                   onClick={() => setShowModal(true)}
//                 >
//                   <Plus size={16} />
//                   <span>Create New</span>
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Left Panel Table */}
//           <div className="flex-1 overflow-auto">
//             <table className="w-full table-auto border-collapse text-xs">
//               <thead className="sticky top-0 bg-white z-10">
//                 <tr className="text-left text-gray-700">
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-8"></th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-10">
//                     Sl No.
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-left">
//                     Activity
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-left">
//                     Description
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-16">
//                     Target 1
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-12">
//                     Unit 1
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-16">
//                     Target 2
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-12">
//                     Unit 2
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-12">
//                     Video
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredActivities.map((activity, index) => (
//                   <tr
//                     key={activity.activityId || index}
//                     className={`text-gray-800 hover:bg-gray-50 cursor-pointer ${
//                       selectedActivityIds.has(activity.activityId!)
//                         ? "bg-blue-50 border-l-4 border-blue-500"
//                         : ""
//                     }`}
//                     onClick={() => handleActivitySelect(activity)}
//                   >
//                     <td className="px-1 py-2 border-b border-gray-200 text-center">
//                       <Checkbox
//                         checked={selectedActivityIds.has(activity.activityId!)}
//                         size="small"
//                         color="primary"
//                       />
//                     </td>
//                     <td className="px-1 py-2 border-b border-gray-200 text-center">
//                       {index + 1}
//                     </td>
//                     <td className="px-1 py-2 border-b border-gray-200">
//                       <div className="break-words font-medium text-left">
//                         {activity.name}
//                       </div>
//                     </td>
//                     <td className="px-1 py-2 border-b border-gray-200">
//                       <div className="break-words text-left">
//                         {activity.description}
//                       </div>
//                     </td>
//                     <td className="px-1 py-2 border-b border-gray-200 text-center">
//                       {activity.target}
//                     </td>
//                     <td className="px-1 py-2 border-b border-gray-200 text-center">
//                       {formatUnit(activity.unit)}
//                     </td>
//                     <td className="px-1 py-2 border-b border-gray-200 text-center">
//                       {activity.target2}
//                     </td>
//                     <td className="px-1 py-2 border-b border-gray-200 text-center">
//                       {formatUnit(activity.unit2)}
//                     </td>
//                     <td className="px-1 py-2 border-b border-gray-200 text-center">
//                       <div className="flex justify-center items-center">
//                         {activity.videoLink && (
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleVideoLinkClick(
//                                 activity.videoLink,
//                                 activity.name
//                               );
//                             }}
//                             className="video-link-button"
//                             title="Watch Video"
//                             style={{
//                               background: "none",
//                               border: "none",
//                               cursor: "pointer",
//                               padding: "4px",
//                               borderRadius: "4px",
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               height: "20px",
//                               width: "20px",
//                             }}
//                           >
//                             <Eye
//                               size={12}
//                               className="text-blue-500 hover:text-blue-700"
//                             />
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Right Panel - Session Creator */}
//         <div className="w-1/2 flex flex-col">
//           {/* Right Panel Header */}
//           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-3 gap-3 mb-3">
//             <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3">
//               <div className="flex flex-col w-full lg:w-auto min-w-0">
//                 <FormControl
//                   fullWidth
//                   variant="standard"
//                   sx={{ minWidth: 120 }}
//                 >
//                   <TextField
//                     label="Session Name"
//                     variant="standard"
//                     value={planName}
//                     onChange={(e) => setPlanName(e.target.value)}
//                     InputProps={{
//                       sx: { fontSize: "1rem", fontFamily: "Roboto" },
//                     }}
//                   />
//                 </FormControl>
//               </div>

//               <div className="flex flex-col w-full lg:w-auto min-w-0">
//                 <FormControl
//                   fullWidth
//                   variant="standard"
//                   sx={{ minWidth: 100 }}
//                 >
//                   <InputLabel id="category-select-label">Category</InputLabel>
//                   <Select
//                     value={category}
//                     label="Category"
//                     onChange={(e) => setCategory(e.target.value)}
//                     displayEmpty
//                     sx={{ fontSize: "1rem", fontFamily: "Roboto" }}
//                   >
//                     {literals.category.map((cat, i) => (
//                       <MenuItem key={i} value={cat}>
//                         {cat}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </div>

//               <div className="flex flex-col w-full lg:w-auto min-w-0">
//                 <FormControl
//                   fullWidth
//                   variant="standard"
//                   sx={{ minWidth: 100 }}
//                 >
//                   <InputLabel id="theme-select-label" shrink={true}>
//                     Theme
//                   </InputLabel>
//                   <Select
//                     labelId="theme-select-label"
//                     value={theme}
//                     onChange={(e) => setTheme(e.target.value)}
//                     displayEmpty
//                     renderValue={(selected) => {
//                       if (!selected) {
//                         return <span></span>;
//                       }
//                       return selected;
//                     }}
//                     sx={{ fontSize: "1rem", fontFamily: "Roboto" }}
//                   >
//                     <MenuItem value="">
//                       <em>None</em>
//                     </MenuItem>
//                     {literals.themes.map((theme, i) => (
//                       <MenuItem key={i} value={theme}>
//                         {theme}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </div>

//               <div className="flex flex-col w-full lg:w-auto min-w-0">
//                 <FormControl
//                   fullWidth
//                   variant="standard"
//                   sx={{ minWidth: 100 }}
//                 >
//                   <InputLabel id="goal-select-label" shrink={true}>
//                     Goal
//                   </InputLabel>
//                   <Select
//                     labelId="goal-select-label"
//                     value={goal}
//                     onChange={(e) => setGoal(e.target.value)}
//                     displayEmpty
//                     sx={{ fontSize: "1rem", fontFamily: "Roboto" }}
//                     renderValue={(selected) => {
//                       if (!selected) {
//                         return <span></span>;
//                       }
//                       return selected;
//                     }}
//                   >
//                     <MenuItem value="">None</MenuItem>
//                     {literals.goals.map((goal, i) => (
//                       <MenuItem key={i} value={goal}>
//                         {goal}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </div>

//               <div className="flex items-center gap-2 mt-2 lg:mt-0">
//                 {!isEditMode ? (
//                   <button
//                     className="flex items-center justify-center space-x-1 p-2 text-xs plus-new-actvity whitespace-nowrap"
//                     onClick={() => {
//                       setOriginalEmptyArr(JSON.parse(JSON.stringify(emptyArr)));
//                       setIsEditMode(true);
//                     }}
//                   >
//                     <Edit size={16} />
//                     <span>Edit Mode</span>
//                   </button>
//                 ) : (
//                   <>
//                     <button
//                       className="flex items-center justify-center space-x-1 text-white px-2 py-1 rounded-xl text-xs btn2 whitespace-nowrap"
//                       onClick={() => {
//                         const changes = [];
//                         emptyArr.forEach((activity, index) => {
//                           const original = originalEmptyArr[index];
//                           if (original) {
//                             const changedFields = {};
//                             if (activity.name !== original.name)
//                               changedFields.name = activity.name;
//                             if (activity.description !== original.description)
//                               changedFields.description = activity.description;
//                             if (activity.target !== original.target)
//                               changedFields.target = activity.target;
//                             if (activity.unit !== original.unit)
//                               changedFields.unit = activity.unit;
//                             if (activity.target2 !== original.target2)
//                               changedFields.target2 = activity.target2;
//                             if (activity.unit2 !== original.unit2)
//                               changedFields.unit2 = activity.unit2;
//                             if (activity.videoLink !== original.videoLink)
//                               changedFields.videoLink = activity.videoLink;
//                             if (Object.keys(changedFields).length > 0) {
//                               changes.push({
//                                 activityId: activity.activityId,
//                                 ...changedFields,
//                               });
//                             }
//                           }
//                         });
//                         setEditedActivities(changes);
//                         setIsEditMode(false);
//                       }}
//                     >
//                       <Save size={16} />
//                       <span>Save</span>
//                     </button>
//                     <button
//                       className="flex items-center justify-center space-x-1 p-2 text-xs plus-new-actvity whitespace-nowrap"
//                       onClick={() => {
//                         setEmptyArr(JSON.parse(JSON.stringify(originalEmptyArr)));
//                         setIsEditMode(false);
//                         setEditedActivities([]);
//                       }}
//                     >
//                       <span>Cancel</span>
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Save Button */}
//             <div className="flex gap-2 w-full lg:w-auto justify-end flex-shrink-0">
//               <button
//                 className="flex items-center justify-center space-x-1 text-white px-3 py-2 rounded-xl text-sm btn2 whitespace-nowrap"
//                 onClick={handleSessionCreation}
//               >
//                 <Save size={16} />
//                 <span>Save</span>
//               </button>
//             </div>
//           </div>

//           {/* Right Panel Table */}
//           <div className="flex-1 w-full overflow-y-auto">
//             <table className="w-full table-fixed border-collapse">
//               <thead className="sticky top-0 bg-white z-10">
//                 <tr className="text-left text-gray-700 text-xs">
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[8%] text-center">
//                     Sl No.
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[18%] text-left">
//                     Activity
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[22%] text-left">
//                     Description
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[10%] text-center">
//                     Target 1
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[10%] text-center">
//                     Unit 1
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[10%] text-center">
//                     Target 2
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[10%] text-center">
//                     Unit 2
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[7%] text-center">
//                     Video
//                   </th>
//                   <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[5%] text-center"></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {emptyArr.map((activity, index) => (
//                   <tr
//                     key={index}
//                     className="text-xs text-gray-800 hover:bg-gray-50"
//                   >
//                     <td className="w-[8%] px-1 py-2 border-b border-gray-200 text-center align-middle">
//                       {index + 1}
//                     </td>

//                     {/* Activity Name/Select - Conditional for edit mode */}
//                     <td
//                       className="w-[18%] px-1 py-2 border-b border-gray-200 align-middle"
//                     >
//                       <div className="flex justify-center">
//                         {!isEditMode ? (
//                           /* Your original Autocomplete code here - paste it unchanged */
//                           <Autocomplete
//                             key={`activity-${index}-${resetKey}`}
//                             options={uniqueActivities}
//                             getOptionLabel={(option) =>
//                               typeof option === "string"
//                                 ? option
//                                 : option.name || ""
//                             }
//                             isOptionEqualToValue={(option, value) => {
//                               if (typeof value === "string") return false;
//                               return option.activityId === value.activityId;
//                             }}
//                             value={
//                               selectedActivities[index]
//                                 ? uniqueActivities.find(
//                                     (a) =>
//                                       a.activityId === selectedActivities[index]
//                                   ) || null
//                                 : activity.name || null
//                             }
//                             onChange={(_, newValue) => {
//                               if (typeof newValue === "string") {
//                                 const updated = [...emptyArr];
//                                 updated[index].name = newValue;
//                                 setEmptyArr(updated);
//                                 setSelectedActivities((prev) => {
//                                   const newPrev = { ...prev };
//                                   delete newPrev[index];
//                                   return newPrev;
//                                 });
//                               } else {
//                                 handleActivitySelectChange(
//                                   index,
//                                   newValue ? newValue.activityId : ""
//                                 );
//                                 setActivityForTable(newValue);
//                               }
//                             }}
//                             filterOptions={(options, { inputValue }) => {
//                               if (!inputValue || inputValue.length < 2) {
//                                 return options.slice(0, 15);
//                               }

//                               const lowerInput = inputValue.toLowerCase();
//                               const exactMatches: any[] = [];
//                               const startsMatches: any[] = [];
//                               const containsMatches: any[] = [];

//                               for (const option of options) {
//                                 const nameLower = option.name.toLowerCase();

//                                 if (nameLower === lowerInput) {
//                                   exactMatches.push(option);
//                                 } else if (nameLower.startsWith(lowerInput)) {
//                                   startsMatches.push(option);
//                                 } else if (nameLower.includes(lowerInput)) {
//                                   containsMatches.push(option);
//                                 }

//                                 if (
//                                   exactMatches.length +
//                                     startsMatches.length +
//                                     containsMatches.length >=
//                                   20
//                                 )
//                                   break;
//                               }

//                               return [
//                                 ...exactMatches,
//                                 ...startsMatches.sort((a, b) =>
//                                   a.name.localeCompare(b.name)
//                                 ),
//                                 ...containsMatches.sort((a, b) =>
//                                   a.name.localeCompare(b.name)
//                                 ),
//                               ].slice(0, 20);
//                             }}
//                             renderInput={(params) => (
//                               <TextField
//                                 {...params}
//                                 label="Select Activity"
//                                 variant="outlined"
//                                 size="small"
//                                 sx={{ width: 150 }}
//                               />
//                             )}
//                             sx={{ width: 150, backgroundColor: "white" }}
//                             isOptionEqualToValue={(option, value) =>
//                               option.activityId === value.activityId
//                             }
//                             freeSolo
//                             noOptionsText="Type 2+ characters to search..."
//                             disablePortal
//                             blurOnSelect
//                           />
//                         ) : (
//                           <TextField
//                             label="Activity Name"
//                             variant="outlined"
//                             size="small"
//                             value={activity.name || ""}
//                             onChange={(e) => {
//                               const updated = [...emptyArr];
//                               updated[index].name = e.target.value;
//                               setEmptyArr(updated);
//                               // Clear id to treat as custom
//                               setSelectedActivities((prev) => {
//                                 const newPrev = { ...prev };
//                                 delete newPrev[index];
//                                 return newPrev;
//                               });
//                             }}
//                             sx={{ width: 150 }}
//                           />
//                         )}
//                       </div>
//                     </td>

//                     {/* Description - Conditional */}
//                     <td
//                       className="w-[22%] px-1 py-2 border-b border-gray-200 text-center align-middle"
//                     >
//                       {!isEditMode ? (
//                         <div className="break-words overflow-hidden text-left">
//                           {activity.description}
//                         </div>
//                       ) : (
//                         <TextField
//                           label="Description"
//                           variant="outlined"
//                           size="small"
//                           value={activity.description || ""}
//                           onChange={(e) => {
//                             const updated = [...emptyArr];
//                             updated[index].description = e.target.value;
//                             setEmptyArr(updated);
//                           }}
//                           sx={{ width: 120 }}
//                         />
//                       )}
//                     </td>

//                     {/* Target 1 - Conditional */}
//                     <td className="w-[10%] px-1 py-2 border-b border-gray-200 text-center align-middle">
//                       {!isEditMode ? (
//                         activity.target
//                       ) : (
//                         <TextField
//                           type="number"
//                           label="Target 1"
//                           variant="outlined"
//                           size="small"
//                           value={activity.target ?? ""}
//                           onChange={(e) => {
//                             const updated = [...emptyArr];
//                             updated[index].target = e.target.value
//                               ? Number(e.target.value)
//                               : null;
//                             setEmptyArr(updated);
//                           }}
//                           sx={{ width: 80 }}
//                         />
//                       )}
//                     </td>

//                     {/* Unit 1 - Conditional */}
//                     <td className="w-[10%] px-1 py-2 border-b border-gray-200 text-center align-middle">
//                       {!isEditMode ? (
//                         formatUnit(activity.unit)
//                       ) : (
//                         <Autocomplete
//                           options={supportedUnits}
//                           getOptionLabel={(option) => formatUnit(option) || ""}
//                           value={activity.unit || ""}
//                           onChange={(_, newValue) => {
//                             const updated = [...emptyArr];
//                             updated[index].unit = newValue || "";
//                             setEmptyArr(updated);
//                           }}
//                           renderInput={(params) => (
//                             <TextField
//                               {...params}
//                               label="Unit 1"
//                               variant="outlined"
//                               size="small"
//                             />
//                           )}
//                           sx={{ minWidth: 80 }}
//                         />
//                       )}
//                     </td>

//                     {/* Target 2 - Conditional */}
//                     <td className="w-[10%] px-1 py-2 border-b border-gray-200 text-center align-middle">
//                       {!isEditMode ? (
//                         activity.target2
//                       ) : (
//                         <TextField
//                           type="number"
//                           label="Target 2"
//                           variant="outlined"
//                           size="small"
//                           value={activity.target2 ?? ""}
//                           onChange={(e) => {
//                             const updated = [...emptyArr];
//                             updated[index].target2 = e.target.value
//                               ? Number(e.target.value)
//                               : null;
//                             setEmptyArr(updated);
//                           }}
//                           sx={{ width: 80 }}
//                         />
//                       )}
//                     </td>

//                     {/* Unit 2 - Conditional */}
//                     <td className="w-[10%] px-1 py-2 border-b border-gray-200 text-center align-middle">
//                       {!isEditMode ? (
//                         formatUnit(activity.unit2)
//                       ) : (
//                         <Autocomplete
//                           options={supportedUnits}
//                           getOptionLabel={(option) => formatUnit(option) || ""}
//                           value={activity.unit2 || ""}
//                           onChange={(_, newValue) => {
//                             const updated = [...emptyArr];
//                             updated[index].unit2 = newValue || "";
//                             setEmptyArr(updated);
//                           }}
//                           renderInput={(params) => (
//                             <TextField
//                               {...params}
//                               label="Unit 2"
//                               variant="outlined"
//                               size="small"
//                             />
//                           )}
//                           sx={{ minWidth: 80 }}
//                         />
//                       )}
//                     </td>

//                     {/* Video - Conditional */}
//                     <td className="w-[7%] px-1 py-2 border-b border-gray-200 text-center align-middle">
//                       <div className="flex justify-center items-center">
//                         {!isEditMode ? (
//                           <>
//                             {activity.videoLink && (
//                               <button
//                                 onClick={() =>
//                                   handleVideoLinkClick(
//                                     activity.videoLink,
//                                     activity.name
//                                   )
//                                 }
//                                 className="video-link-button"
//                                 title="Watch Video"
//                                 style={{
//                                   background: "none",
//                                   border: "none",
//                                   cursor: "pointer",
//                                   padding: "4px",
//                                   borderRadius: "4px",
//                                   display: "flex",
//                                   alignItems: "center",
//                                   justifyContent: "center",
//                                   height: "24px",
//                                   width: "24px",
//                                 }}
//                               >
//                                 <Eye
//                                   size={12}
//                                   className="text-blue-500 hover:text-blue-700"
//                                 />
//                               </button>
//                             )}
//                           </>
//                         ) : (
//                           <>
//                             <TextField
//                               label="Video Link"
//                               variant="outlined"
//                               size="small"
//                               value={activity.videoLink || ""}
//                               onChange={(e) => {
//                                 const updated = [...emptyArr];
//                                 updated[index].videoLink = e.target.value;
//                                 setEmptyArr(updated);
//                               }}
//                               sx={{ width: 100 }}
//                             />
//                             {activity.videoLink && (
//                               <button
//                                 onClick={() =>
//                                   handleVideoLinkClick(
//                                     activity.videoLink,
//                                     activity.name
//                                   )
//                                 }
//                                 className="video-link-button"
//                                 title="Watch Video"
//                                 style={{
//                                   background: "none",
//                                   border: "none",
//                                   cursor: "pointer",
//                                   padding: "4px",
//                                   borderRadius: "4px",
//                                   display: "flex",
//                                   alignItems: "center",
//                                   justifyContent: "center",
//                                   height: "24px",
//                                   width: "24px",
//                                 }}
//                               >
//                                 <Eye
//                                   size={12}
//                                   className="text-blue-500 hover:text-blue-700"
//                                 />
//                               </button>
//                             )}
//                           </>
//                         )}
//                       </div>
//                     </td>

//                     {/* Delete remains unchanged */}
//                     <td className="w-[5%] px-1 py-2 border-b border-gray-200 text-center align-middle">
//                       <div className="flex justify-center items-center">
//                         <button onClick={() => handleDelete(index)}>
//                           <LucideCircleMinus
//                             className="text-red-400"
//                             size={16}
//                           />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 <tr className="border-b border-b-gray-300">
//                   <td className="p-2" colSpan={9}>
//                     <button
//                       className="flex items-center space-x-1 px-3 py-1 add-row text-xs"
//                       onClick={addNewRow}
//                     >
//                       <Plus size={10} />
//                       <span>Add Row</span>
//                     </button>
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* YouTube Video Modal */}
//         <YouTubeVideoModal
//           isOpen={showVideoModal}
//           onClose={() => {
//             setShowVideoModal(false);
//             setCurrentVideoUrl("");
//             setVideoTitle("");
//           }}
//           videoUrl={currentVideoUrl}
//           title={videoTitle}
//         />

//         {/* Create New Activity Modal */}
//         {showModal && (
//           <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8">
//             <div className="relative bg-transparent p-5">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="absolute top-2 right-2 z-10 rounded-full bg-white p-1 text-gray-500 hover:text-black shadow-md"
//               >
//                 <X size={20} />
//               </button>

//               <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative p-6">
//                 <div className="flex justify-between items-center border-gray-200 border-b pb-2 mb-4">
//                   <h2 className="text-xl font-[500]">Create New Activities</h2>
//                   <button
//                     onClick={handleModalSave}
//                     className="activity-save-button mx-6 m flex items-center space-x-2 bg-[#0070FF] text-white px-4 py-2 rounded-xl"
//                   >
//                     <Save size={20} />
//                     <span>Save</span>
//                   </button>
//                 </div>

//                 {/* Modal Table */}
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm">
//                     <thead>
//                       <tr className="border-b border-gray-200">
//                         <th className="px-4 py-2 text-center">Sl.No</th>
//                         <th className="px-4 py-2 text-center">Activity Name</th>
//                         <th className="px-4 py-2 text-center">Description</th>
//                         <th className="px-4 py-2 text-center">Target 1</th>
//                         <th className="px-4 py-2 text-center">Unit 1</th>
//                         <th className="px-4 py-2 text-center">Target 2</th>
//                         <th className="px-4 py-2 text-center">Unit 2</th>
//                         <th className="px-4 py-2 text-center">Video Link</th>
//                         <th className="px-4 py-2 text-center"></th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {newActivities.map((activity, index) => (
//                         <tr key={index}>
//                           <td className="px-4 py-2 text-center border-b-2 border-gray-200 align-middle">
//                             {index + 1}
//                           </td>
//                           <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
//                             <div className="flex justify-center">
//                               <Autocomplete
//                                 options={uniqueActivities}
//                                 getOptionLabel={(option) => option.name || ""}
//                                 value={
//                                   uniqueActivities.find(
//                                     (a) => a.name === activity.name
//                                   ) || null
//                                 }
//                                 onInputChange={(_, newInputValue) => {
//                                   const updated = [...newActivities];
//                                   updated[index].name = newInputValue;
//                                   setNewActivities(updated);
//                                 }}
//                                 filterOptions={(options, { inputValue }) => {
//                                   if (!inputValue || inputValue.length < 2) {
//                                     return options.slice(0, 10);
//                                   }

//                                   const lowerInput = inputValue.toLowerCase();
//                                   const results: any[] = [];

//                                   for (const option of options) {
//                                     const nameLower = option.name.toLowerCase();
//                                     if (nameLower.includes(lowerInput)) {
//                                       results.push({
//                                         ...option,
//                                         _priority: nameLower.startsWith(
//                                           lowerInput
//                                         )
//                                           ? 0
//                                           : 1,
//                                       });
//                                       if (results.length >= 15) break;
//                                     }
//                                   }

//                                   return results
//                                     .sort((a, b) => {
//                                       if (a._priority !== b._priority)
//                                         return a._priority - b._priority;
//                                       return a.name.localeCompare(b.name);
//                                     })
//                                     .slice(0, 10);
//                                 }}
//                                 renderInput={(params) => (
//                                   <TextField
//                                     {...params}
//                                     label="Activity Name"
//                                     variant="outlined"
//                                     size="small"
//                                     sx={{ width: 180 }}
//                                   />
//                                 )}
//                                 freeSolo
//                                 noOptionsText="Type to search..."
//                                 disablePortal
//                                 blurOnSelect
//                               />
//                             </div>
//                           </td>
//                           <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
//                             <div className="flex justify-center">
//                               <input
//                                 type="text"
//                                 value={activity.description}
//                                 onChange={(e) => {
//                                   const updated = [...newActivities];
//                                   updated[index].description = e.target.value;
//                                   setNewActivities(updated);
//                                 }}
//                                 className="w-full rounded p-2 border border-gray-400 text-center"
//                               />
//                             </div>
//                           </td>
//                           <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
//                             <div className="flex justify-center">
//                               <input
//                                 type="number"
//                                 value={activity.target}
//                                 onChange={(e) => {
//                                   const updated = [...newActivities];
//                                   updated[index].target = e.target.value;
//                                   setNewActivities(updated);
//                                 }}
//                                 className="w-full border border-gray-400 rounded p-2 text-center"
//                               />
//                             </div>
//                           </td>
//                           <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
//                             <div className="flex justify-center">
//                               <Autocomplete
//                                 options={ActivityUtils}
//                                 getOptionsLable={(option: any) => option || ""}
//                                 value={activity.unit || ""}
//                                 onChange={(_, newValue) => {
//                                   const updated = [...newActivities];
//                                   updated[index].unit = newValue || "";
//                                   setNewActivities(updated);
//                                 }}
//                                 renderInput={(params) => (
//                                   <TextField
//                                     {...params}
//                                     label="Select Unit"
//                                     variant="outlined"
//                                     size="small"
//                                     sx={{ width: 120 }}
//                                   />
//                                 )}
//                               />
//                             </div>
//                           </td>
//                           <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
//                             <div className="flex justify-center">
//                               <input
//                                 type="number"
//                                 value={activity.target2 || ""}
//                                 onChange={(e) => {
//                                   const updated = [...newActivities];
//                                   updated[index].target2 = e.target.value;
//                                   setNewActivities(updated);
//                                 }}
//                                 className="w-full border border-gray-400 rounded p-2 text-center"
//                               />
//                             </div>
//                           </td>
//                           <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
//                             <div className="flex justify-center">
//                               <Autocomplete
//                                 options={ActivityUtils}
//                                 getOptionsLable={(option: any) => option || ""}
//                                 value={activity.unit2 || ""}
//                                 onChange={(_, newValue) => {
//                                   const updated = [...newActivities];
//                                   updated[index].unit2 = newValue || "";
//                                   setNewActivities(updated);
//                                 }}
//                                 renderInput={(params) => (
//                                   <TextField
//                                     {...params}
//                                     label="Select Unit"
//                                     variant="outlined"
//                                     size="small"
//                                     sx={{ width: 120 }}
//                                   />
//                                 )}
//                               />
//                             </div>
//                           </td>
//                           <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
//                             <div className="flex justify-center">
//                               <input
//                                 type="url"
//                                 placeholder="https://..."
//                                 value={activity.videoLink || ""}
//                                 onChange={(e) => {
//                                   const updated = [...newActivities];
//                                   updated[index].videoLink = e.target.value;
//                                   setNewActivities(updated);
//                                 }}
//                                 className="w-full border border-gray-400 rounded p-2 text-center"
//                               />
//                             </div>
//                           </td>
//                           <td className="px-4 py-2 border-b-2 border-gray-200 text-center align-middle">
//                             <div className="flex justify-center items-center">
//                               <button
//                                 onClick={() => {
//                                   const updated = [...newActivities];
//                                   updated.splice(index, 1);
//                                   setNewActivities(updated);
//                                 }}
//                               >
//                                 <LucideCircleMinus
//                                   className="text-red-500"
//                                   size={20}
//                                 />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>

//                 <div className="mt-4 flex justify-start">
//                   <button
//                     onClick={handleAddNewRow}
//                     className="flex items-center space-x-2 border bg-white text-[#0070FF] px-4 py-2 heya"
//                   >
//                     <Plus />
//                     <span>Create another activity</span>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default EnhancedActivityTable;