import { LucideCircleMinus, Plus, Save, X, Eye, Edit } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { ActivityUtils } from "../Utils/ActivityUtils";
import { API_BASE_URL, API_BASE_URL2 } from "../store/axios";
import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Checkbox,
} from "@mui/material";
import { useApiCalls } from "../store/axios";
import { NutritionUnits, NutritionUtils } from "../Utils/NutritionUtils";

function NutritionActivityTable() {
  const context = useContext(DataContext);
  if (!context) {
    return <div>Loading...</div>;
  }
  const {
    getActivities,
    createNutritionActivity,
    getActivityById,
    createSession,
  } = useApiCalls();

  useEffect(() => {
    getActivities("", "", "NUTRITION");
  }, []);

  const { setSelectComponent, activities_api_call } = context;

  const [planName, setPlanName] = useState<string>("");
  const [category, setCategory] = useState<string>("NUTRITION");
  const [theme, setTheme] = useState("");
  const [goal, setGoal] = useState("");

  const [mealType, setMealType] = useState("");
  const mealTypes = [
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

  const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
  const [showModal, setShowModal] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [literals, setLiterals] = useState({
    themes: [],
    goals: [],
  });

  // New states for enhanced functionality
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {}, []);
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

  const [newActivities, setNewActivities] = useState<Activity_Api_call[]>([
    {
      name: "",
      description: "",
      target: null,
      target2: null,
      unit: "",
      unit2: "",
      // type: "",
      videoLink: "",
      vegNonVeg: "VEG",
    },
  ]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [originalEmptyArr, setOriginalEmptyArr] = useState<Activity_Api_call[]>(
    []
  );
  const [editedActivities, setEditedActivities] = useState([]);

  const [emptyArr, setEmptyArr] = useState<Activity_Api_call[]>([
    {
      name: "",
      description: "",
      target: null,
      target2: null,
      unit: "",
      unit2: "",
      icon: "",
      // type: "",
      videoLink: "",
      vegNonVeg: "VEG",
    },
  ]);

  useEffect(() => {
    console.log(emptyArr);
    const activityIds = emptyArr.map((activity) => activity.activityId);
    console.log(activityIds);
  }, [emptyArr]);

  useEffect(() => {
    console.log(activities_api_call);
  }, [activities_api_call]);

  const handlePlanSaving = () => {
    setSelectComponent("AllSessions");
  };

  const handleSessionCreation = async () => {
    const activityIds: string[] = emptyArr
      .map((item) => item.activityId)
      .filter((id): id is string => typeof id === "string");

    // Determine session-level vegNonVeg
    const hasNonVeg = emptyArr.some(
      (activity) => (activity.vegNonVeg || "VEG") === "NONVEG"
    );
    const hasEgg = emptyArr.some(
      (activity) => (activity.vegNonVeg || "VEG") === "EGG"
    );
    let sessionVegNonVeg = "VEG";
    if (hasNonVeg) {
      sessionVegNonVeg = "NONVEG";
    } else if (hasEgg) {
      sessionVegNonVeg = "EGG";
    }

    const sessionToBeCreated: Session_Api_call = {
      title: planName,
      description: "",
      category: category,
      activityIds: activityIds,
      themes: theme ? [theme] : [],
      goals: goal ? [goal] : [],
      vegNonVeg: sessionVegNonVeg,
      type: mealType,
    };
    if (editedActivities.length > 0) {
      sessionToBeCreated.editedActivities = editedActivities.map(
        (activity) => ({
          ...activity,
          vegNonVeg: activity.vegNonVeg || "VEG", // Default to "Veg" if undefined
        })
      );
    }
    console.log(sessionToBeCreated);
    await createSession(sessionToBeCreated);
    // Clear all fields
    setPlanName("");
    setTheme("");
    setGoal("");
    setMealType("");
    setEmptyArr([
      {
        name: "",
        description: "",
        target: null,
        target2: null,
        unit: "",
        unit2: "",
        icon: "",
        //type: "",
        videoLink: "",
        vegNonVeg: "VEG",
        activityId: "",
      },
    ]);
    setSelectedActivities({});
    setSelectedActivityIds(new Set());
    setEditedActivities([]);
    setResetKey((prev) => prev + 1);
  };

  const handleAddNewRow = () => {
    setNewActivities((prev) => [
      ...prev,
      {
        activityId: Date.now().toString(),
        name: "",
        description: "",
        target: null,
        target2: null,
        unit: "",
        unit2: "",
        icon: "",
        // type: "",
        videoLink: "",
        vegNonVeg: "VEG",
      },
    ]);
  };

  const addNewRow = () => {
    setEmptyArr((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        target: null,
        target2: null,
        unit: "",
        unit2: "",
        icon: "",
        // type: "",
        videoLink: "",
        vegNonVeg: "VEG",
      },
    ]);
  };

  // Handle activity selection from left panel
  const handleActivitySelect = (activity: Activity_Api_call) => {
    if (selectedActivityIds.has(activity.activityId!)) {
      return; // Already selected, do nothing
    }

    // Find first empty row
    const emptyIndex = emptyArr.findIndex(
      (item) => !item.activityId || item.name === ""
    );

    if (emptyIndex !== -1) {
      // Update the empty row with selected activity
      const updatedArr = [...emptyArr];
      updatedArr[emptyIndex] = {
        ...activity,
        vegNonVeg: activity.vegNonVeg || "VEG", // Default to VEG if undefined
      };
      setEmptyArr(updatedArr);

      // Mark activity as selected
      setSelectedActivityIds(
        (prev) => new Set([...prev, activity.activityId!])
      );

      // Set selectedActivities
      setSelectedActivities((prev) => ({
        ...prev,
        [emptyIndex]: activity.activityId!,
      }));
    } else {
      // No empty row found, add new row
      const newIndex = emptyArr.length;
      setEmptyArr((prev) => [
        ...prev,
        {
          ...activity,
          vegNonVeg: activity.vegNonVeg || "VEG", // Default to VEG if undefined
        },
      ]);
      setSelectedActivityIds(
        (prev) => new Set([...prev, activity.activityId!])
      );

      // Set selectedActivities
      setSelectedActivities((prev) => ({
        ...prev,
        [newIndex]: activity.activityId!,
      }));
    }
  };

  const handleModalSave = async () => {
    const validActivities = newActivities.filter(
      (activity) =>
        activity.name &&
        activity.name.trim() !== "" &&
        activity.description &&
        activity.description.trim() !== "" &&
        activity.target &&
        activity.target !== "" &&
        activity.target !== null &&
        activity.target !== "0" &&
        activity.unit &&
        activity.unit.trim() !== ""
    );

    if (validActivities.length === 0) {
      alert(
        "Please fill in all required fields (Name, Description, Target, Unit)"
      );
      setShowModal(false);
      return;
    }

    const newItems = validActivities.map((activity) => {
      const item = {
        name: activity.name.trim(),
        description: activity.description.trim(),
        target: Number(activity.target),
        unit: activity.unit,
        // type: activity.type || "",
        videoLink: "",
        vegNonVeg: activity.vegNonVeg || "VEG", // Default to "Veg" if undefined
      };

      if (
        activity.target2 &&
        activity.target2 !== "" &&
        activity.target2 !== null
      ) {
        item.target2 = Number(activity.target2);
      }

      if (activity.unit2 && activity.unit2 !== "" && activity.unit2 !== null) {
        item.unit2 = activity.unit2;
      }

      return item;
    });

    const postEachActivity = async () => {
      try {
        for (const item of newItems) {
          console.log("Sending item to API:", item);
          await createNutritionActivity(item);
          console.log("Successfully created:", item.name);
        }
      } catch (error) {
        console.error("Error posting activities:", error);
        console.error("Failed item data:", newItems);
        alert(
          "Some activities could not be saved. Please check the console for details."
        );
        throw error;
      }
    };
    await postEachActivity();
    await getActivities("", "", "NUTRITION");
    setNewActivities([
      {
        name: "",
        description: "",
        target: null,
        target2: null,
        unit: "",
        unit2: "",
        videoLink: "",
        vegNonVeg: "VEG",
        activityId: "",
      },
    ]);
    setShowModal(false);
  };

  const uniqueActivities = useMemo(() => {
    const seen = new Set();
    return activities_api_call.filter((activity) => {
      if (seen.has(activity.name) || !activity.name) {
        return false;
      }
      seen.add(activity.name);
      return true;
    });
  }, [activities_api_call]);

  // Filter activities based on selected filter
  const filteredActivities = useMemo(() => {
    const unique = activities_api_call.filter(
      (activity, index, self) =>
        activity.name &&
        self.findIndex((a) => a.name === activity.name) === index
    );

    if (!selectedFilter) return unique;
    return unique.filter(
      (activity) =>
        activity.category?.toUpperCase() === selectedFilter.toUpperCase()
    );
  }, [activities_api_call, selectedFilter]);

  const handleDelete = (index: number) => {
    const deletedActivity = emptyArr[index];
    const updatedPlan = emptyArr.filter((_, i) => i !== index);
    setEmptyArr(updatedPlan);

    // Remove from selected activities
    if (deletedActivity.activityId) {
      setSelectedActivityIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deletedActivity.activityId!);
        return newSet;
      });
    }

    setSelectedActivities((prev) => {
      const newSelectedActivities = { ...prev };
      delete newSelectedActivities[index];
      // Shift all indices after the deleted one
      const shiftedActivities: { [key: number]: string } = {};
      Object.keys(newSelectedActivities).forEach((key) => {
        const numKey = parseInt(key);
        if (numKey > index) {
          shiftedActivities[numKey - 1] = newSelectedActivities[numKey];
        } else if (numKey < index) {
          shiftedActivities[numKey] = newSelectedActivities[numKey];
        }
      });
      return shiftedActivities;
    });
  };

  const updateTheActivitityById = async (activityId: string, index: number) => {
    if (!activityId) return;
    const activity = await getActivityById(activityId);
    console.log(activity, "['pilkujhgfd");
    if (activity) {
      emptyArr[index] = {
        ...activity,
        vegNonVeg: activity.vegNonVeg || "VEG", // Default to "Veg" if API returns undefined
      };
      setEmptyArr([...emptyArr]);
    } else {
      console.error("Activity not found");
    }
  };

  const [selectedActivities, setSelectedActivities] = useState<{
    [id: number]: string;
  }>({});

  const handleActivitySelectChange = (id: number, value: string) => {
    setSelectedActivities((prev) => ({ ...prev, [id]: value }));
    if (value) {
      updateTheActivitityById(value, id);
    } else {
      // Clear the row if no activity is selected
      const updated = [...emptyArr];
      updated[id] = {
        name: "",
        description: "",
        target: null,
        target2: null,
        unit: "",
        unit2: "",
        icon: "",
        // type: "",
        videoLink: "",
        vegNonVeg: "VEG",
        activityId: "",
      };
      setEmptyArr(updated);
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

  console.log(newActivities);
  useEffect(() => {
    console.log(theme);
    console.log(goal);
  }, [theme, goal]);

  useEffect(() => {
    console.log(emptyArr, "this is emort");
  }, [emptyArr]);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="activity-table-container bg-white w-full flex flex-1 rounded-2xl shadow-lg overflow-hidden gap-3 p-3">
        {/* Left Panel - Activities List */}
        <div className="w-full md:w-2/3 border-b md:border-r md:border-b-0 border-gray-300 flex flex-col">
          {/* Left Panel Header */}
          <div className="p-2 border-b border-gray-200">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-medium">List of Food Items</h2>
              <div className="flex flex-col gap-2">
                {/* Select Activity Autocomplete */}
                <Autocomplete
                  key={`left-nutrition-${resetKey}`}
                  options={uniqueActivities}
                  getOptionLabel={(option) => option.name || ""}
                  value={null}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      handleActivitySelect(newValue);
                      setActivityForTable(undefined);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Food Items"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value=""
                    />
                  )}
                  sx={{ width: "100%", backgroundColor: "white" }}
                  isOptionEqualToValue={(option, value) =>
                    option.activityId === value.activityId
                  }
                  freeSolo
                  noOptionsText="Type 2+ characters to search..."
                  disablePortal
                  blurOnSelect
                  clearOnBlur
                />

                {/* Create New Activity Button */}
                <button
                  className="flex items-center justify-center space-x-1 p-2 text-xs plus-new-actvity w-full rounded border border-blue-500 hover:bg-blue-50"
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={16} />
                  <span>Create New Food Items</span>
                </button>
              </div>
            </div>
          </div>

          {/* Left Panel Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full table-auto border-collapse text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-gray-700">
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-6"></th>
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-8">
                    Sl
                  </th>
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-left">
                    Item
                  </th>
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-left">
                    Description
                  </th>
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-12">
                    T1
                  </th>
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-10">
                    U1
                  </th>
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-12">
                    T2
                  </th>
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-10">
                    U2
                  </th>
                  <th className="font-roberto px-1 py-2 border-b border-gray-300 text-center w-12">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, index) => (
                  <tr
                    key={activity.activityId || index}
                    className={`text-gray-800 hover:bg-gray-50 cursor-pointer ${
                      selectedActivityIds.has(activity.activityId!)
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    }`}
                    onClick={() => handleActivitySelect(activity)}
                  >
                    <td className="px-1 py-2 border-b border-gray-200 text-center">
                      <Checkbox
                        checked={selectedActivityIds.has(activity.activityId!)}
                        size="small"
                        color="primary"
                      />
                    </td>
                    <td className="px-1 py-2 border-b border-gray-200 text-center">
                      {index + 1}
                    </td>
                    <td className="px-1 py-2 border-b border-gray-200">
                      <div className="break-words font-medium text-left">
                        {activity.name}
                      </div>
                    </td>
                    <td className="px-1 py-2 border-b border-gray-200">
                      <div className="break-words text-left">
                        {activity.description}
                      </div>
                    </td>
                    <td className="px-1 py-2 border-b border-gray-200 text-center">
                      {activity.target}
                    </td>
                    <td className="px-1 py-2 border-b border-gray-200 text-center">
                      {formatUnit(activity.unit)}
                    </td>
                    <td className="px-1 py-2 border-b border-gray-200 text-center">
                      {activity.target2}
                    </td>
                    <td className="px-1 py-2 border-b border-gray-200 text-center">
                      {formatUnit(activity.unit2)}
                    </td>
                    <td className="px-1 py-2 border-b border-gray-200 text-center">
                      {activity.vegNonVeg || "VEG"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Session Creator */}
        <div className="w-full md:w-6/3 flex flex-col">
          {/* Right Panel Header */}

          <div className="flex flex-col gap-3 py-3 mb-3 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              <div className="min-w-0">
                <FormControl fullWidth variant="standard">
                  <TextField
                    label="Meal Name"
                    variant="standard"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    InputProps={{
                      sx: { fontSize: "0.9rem", fontFamily: "Roboto" },
                    }}
                    size="small"
                  />
                </FormControl>
              </div>

              <div className="min-w-0">
                <FormControl fullWidth variant="standard">
                  <TextField
                    label="Category"
                    variant="standard"
                    value={category}
                    InputProps={{
                      sx: { fontSize: "0.9rem", fontFamily: "Roboto" },
                      readOnly: true,
                    }}
                    size="small"
                  />
                </FormControl>
              </div>

              <div className="min-w-0">
                <FormControl fullWidth variant="standard">
                  <InputLabel id="theme-select-label" shrink={true}>
                    Theme
                  </InputLabel>
                  <Select
                    labelId="theme-select-label"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span></span>;
                      }
                      return selected;
                    }}
                    sx={{ fontSize: "0.9rem", fontFamily: "Roboto" }}
                    size="small"
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

              <div className="min-w-0">
                <FormControl fullWidth variant="standard">
                  <InputLabel id="goal-select-label" shrink={true}>
                    Goal
                  </InputLabel>
                  <Select
                    labelId="goal-select-label"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    displayEmpty
                    sx={{ fontSize: "0.9rem", fontFamily: "Roboto" }}
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span></span>;
                      }
                      return selected;
                    }}
                    size="small"
                  >
                    <MenuItem value="">None</MenuItem>
                    {literals.goals.map((goal, i) => (
                      <MenuItem key={i} value={goal}>
                        {goal}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="min-w-0">
                <FormControl fullWidth variant="standard">
                  <InputLabel id="meal-type-select-label" shrink={true}>
                    Type
                  </InputLabel>
                  <Select
                    labelId="meal-type-select-label"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span></span>;
                      }
                      return selected;
                    }}
                    sx={{ fontSize: "0.9rem", fontFamily: "Roboto" }}
                    size="small"
                  >
                    <MenuItem value="">None</MenuItem>
                    {mealTypes.map((type, i) => (
                      <MenuItem key={i} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-end gap-2">
              {!isEditMode ? (
                <>
                  <button
                    className="flex items-center justify-center space-x-1 p-2 text-xs plus-new-actvity whitespace-nowrap"
                    onClick={() => {
                      setOriginalEmptyArr(JSON.parse(JSON.stringify(emptyArr)));
                      setIsEditMode(true);
                    }}
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="flex items-center justify-center space-x-1 text-white px-3 py-2 rounded-xl text-xs btn2 whitespace-nowrap"
                    onClick={handleSessionCreation}
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="flex items-center justify-center space-x-1 text-white px-3 py-2 rounded-xl text-xs btn2 whitespace-nowrap"
                    onClick={() => {
                      const changes = [];
                      emptyArr.forEach((activity, index) => {
                        const original = originalEmptyArr[index];
                        if (original) {
                          const changedFields = {};
                          if (activity.name !== original.name) {
                            changedFields.name = activity.name;
                            setSelectedActivities((prev) => ({
                              ...prev,
                              [index]:
                                activity.activityId ||
                                prev[index] ||
                                Date.now().toString(),
                            }));
                          }
                          if (activity.description !== original.description)
                            changedFields.description = activity.description;
                          if (activity.target !== original.target)
                            changedFields.target = activity.target;
                          if (activity.unit !== original.unit)
                            changedFields.unit = activity.unit;
                          if (activity.target2 !== original.target2)
                            changedFields.target2 = activity.target2;
                          if (activity.unit2 !== original.unit2)
                            changedFields.unit2 = activity.unit2;
                          if (activity.vegNonVeg !== original.vegNonVeg)
                            changedFields.vegNonVeg =
                              activity.vegNonVeg || "VEG";
                          if (Object.keys(changedFields).length > 0) {
                            changes.push({
                              activityId: activity.activityId,
                              ...changedFields,
                            });
                          }
                        }
                      });
                      setEditedActivities(changes);
                      setIsEditMode(false);
                    }}
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                  <button
                    className="flex items-center justify-center space-x-1 p-2 text-xs plus-new-actvity whitespace-nowrap"
                    onClick={() => {
                      setEmptyArr(JSON.parse(JSON.stringify(originalEmptyArr)));
                      setIsEditMode(false);
                      setEditedActivities([]);
                    }}
                  >
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Panel Table */}
          <div className="flex-1 w-full overflow-auto">
            {/* Right Panel Table - Replace the existing table in your right panel */}
            <div className="flex-1 w-full overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-left text-gray-700 text-xs">
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-4 text-center">
                      Sl
                    </th>
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[270px] text-left">
                      Item
                    </th>
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[180px] text-left">
                      Description
                    </th>
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-28 text-center">
                      Target 1
                    </th>
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[50px] text-center">
                      Unit 1
                    </th>
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-28 text-center">
                      Target 2
                    </th>
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[50px] text-center">
                      Unit 2
                    </th>
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-[60px] text-center">
                      Type
                    </th>
                    <th className="font-roberto px-1 py-2 border-b border-gray-300 w-4 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {emptyArr.map((activity, index) => (
                    <tr
                      key={index}
                      className="text-xs text-gray-800 hover:bg-gray-50"
                    >
                      <td className="border-b border-gray-200 text-center">
                        {index + 1}
                      </td>

                      {/* Item Name/Select - COMPACT */}
                      <td className="border-b border-gray-200">
                        {!isEditMode ? (
                          <Autocomplete
                            key={`nutrition-${index}-${resetKey}`}
                            options={uniqueActivities}
                            getOptionLabel={(option) => option.name || ""}
                            value={
                              uniqueActivities.find(
                                (a) =>
                                  a.activityId === selectedActivities[index]
                              ) ||
                              (activity.name
                                ? {
                                    name: activity.name,
                                    activityId: activity.activityId,
                                  }
                                : null)
                            }
                            onChange={(_, newValue) => {
                              if (newValue && typeof newValue === "string") {
                                const updated = [...emptyArr];
                                updated[index].name = newValue;
                                const newId = Date.now().toString();
                                updated[index].activityId = newId;
                                setEmptyArr(updated);
                                setSelectedActivities((prev) => ({
                                  ...prev,
                                  [index]: newId,
                                }));
                                setActivityForTable({
                                  name: newValue,
                                  activityId: newId,
                                });
                              } else {
                                handleActivitySelectChange(
                                  index,
                                  newValue ? newValue.activityId : ""
                                );
                                setActivityForTable(newValue);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                fullWidth
                                InputProps={{
                                  ...params.InputProps,
                                  style: { fontSize: "11px" },
                                }}
                                InputLabelProps={{
                                  ...params.InputLabelProps,
                                  style: { fontSize: "10px" },
                                }}
                              />
                            )}
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                minHeight: "28px",
                                "& fieldset": {
                                  borderColor: "#e0e0e0",
                                },
                              },
                            }}
                            isOptionEqualToValue={(option, value) =>
                              option.activityId === value.activityId
                            }
                            freeSolo
                            noOptionsText="Type 2+ characters..."
                            disablePortal
                            blurOnSelect
                          />
                        ) : (
                          <TextField
                            variant="outlined"
                            size="small"
                            value={activity.name || ""}
                            onChange={(e) => {
                              const updated = [...emptyArr];
                              updated[index].name = e.target.value;
                              if (!updated[index].activityId) {
                                updated[index].activityId =
                                  Date.now().toString();
                              }
                              setEmptyArr(updated);
                              setSelectedActivities((prev) => ({
                                ...prev,
                                [index]: updated[index].activityId,
                              }));
                            }}
                            fullWidth
                            InputProps={{
                              style: { fontSize: "11px" },
                            }}
                            InputLabelProps={{
                              style: { fontSize: "10px" },
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                minHeight: "28px",
                              },
                            }}
                          />
                        )}
                      </td>

                      {/* Description - COMPACT */}
                      <td className="px-1 py-1 border-b border-gray-200">
                        {!isEditMode ? (
                          <div className="break-words overflow-hidden text-left text-xs p-1">
                            {activity.description}
                          </div>
                        ) : (
                          <TextField
                            variant="outlined"
                            size="small"
                            value={activity.description || ""}
                            onChange={(e) => {
                              const updated = [...emptyArr];
                              updated[index].description = e.target.value;
                              setEmptyArr(updated);
                            }}
                            fullWidth
                            multiline
                            maxRows={2}
                            InputProps={{
                              style: { fontSize: "11px" },
                            }}
                            InputLabelProps={{
                              style: { fontSize: "10px" },
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                minHeight: "28px",
                              },
                            }}
                          />
                        )}
                      </td>

                      {/* Target 1 - COMPACT */}
                      <td className="px-1 py-1 border-b border-gray-200">
                        {!isEditMode ? (
                          <div className="text-xs">{activity.target}</div>
                        ) : (
                          <TextField
                            type="number"
                            variant="outlined"
                            size="small"
                            value={activity.target ?? ""}
                            onChange={(e) => {
                              const updated = [...emptyArr];
                              updated[index].target = e.target.value
                                ? Number(e.target.value)
                                : null;
                              setEmptyArr(updated);
                            }}
                            fullWidth
                            InputProps={{
                              style: { fontSize: "11px" },
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                minHeight: "28px",
                              },
                              "& input[type=number]": {
                                "-moz-appearance": "textfield",
                              },
                              "& input[type=number]::-webkit-outer-spin-button":
                                {
                                  "-webkit-appearance": "none",
                                  margin: 0,
                                },
                              "& input[type=number]::-webkit-inner-spin-button":
                                {
                                  "-webkit-appearance": "none",
                                  margin: 0,
                                },
                            }}
                          />
                        )}
                      </td>

                      {/* Unit 1 - COMPACT */}
                      <td className="px-1 py-1 border-b border-gray-200">
                        {!isEditMode ? (
                          <div className="text-xs">
                            {formatUnit(activity.unit)}
                          </div>
                        ) : (
                          <Autocomplete
                            options={NutritionUnits}
                            getOptionLabel={(option) =>
                              formatUnit(option) || ""
                            }
                            value={activity.unit || ""}
                            onChange={(_, newValue) => {
                              const updated = [...emptyArr];
                              updated[index].unit = newValue || "";
                              setEmptyArr(updated);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                InputProps={{
                                  ...params.InputProps,
                                  style: { fontSize: "10px" },
                                }}
                              />
                            )}
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                minHeight: "24px",
                              },
                            }}
                          />
                        )}
                      </td>

                      {/* Target 2 - COMPACT */}
                      <td className="px-1 py-1 border-b border-gray-200">
                        {!isEditMode ? (
                          <div className="text-xs">{activity.target2}</div>
                        ) : (
                          <TextField
                            type="number"
                            variant="outlined"
                            size="small"
                            value={activity.target2 ?? ""}
                            onChange={(e) => {
                              const updated = [...emptyArr];
                              updated[index].target2 = e.target.value
                                ? Number(e.target.value)
                                : null;
                              setEmptyArr(updated);
                            }}
                            fullWidth
                            InputProps={{
                              style: { fontSize: "11px" },
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                minHeight: "28px",
                              },
                              "& input[type=number]": {
                                "-moz-appearance": "textfield",
                              },
                              "& input[type=number]::-webkit-outer-spin-button":
                                {
                                  "-webkit-appearance": "none",
                                  margin: 0,
                                },
                              "& input[type=number]::-webkit-inner-spin-button":
                                {
                                  "-webkit-appearance": "none",
                                  margin: 0,
                                },
                            }}
                          />
                        )}
                      </td>

                      {/* Unit 2 - COMPACT */}
                      <td className="px-1 py-1 border-b border-gray-200">
                        {!isEditMode ? (
                          <div className="text-xs">
                            {formatUnit(activity.unit2)}
                          </div>
                        ) : (
                          <Autocomplete
                            options={NutritionUnits}
                            getOptionLabel={(option) =>
                              formatUnit(option) || ""
                            }
                            value={activity.unit2 || ""}
                            onChange={(_, newValue) => {
                              const updated = [...emptyArr];
                              updated[index].unit2 = newValue || "";
                              setEmptyArr(updated);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                InputProps={{
                                  ...params.InputProps,
                                  style: { fontSize: "10px" },
                                }}
                              />
                            )}
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                minHeight: "24px",
                              },
                            }}
                          />
                        )}
                      </td>

                      {/* VegNonVeg Type - COMPACT */}
                      <td className="px-1 py-1 border-b border-gray-200">
                        {!isEditMode ? (
                          <div className="text-xs">
                            {activity.vegNonVeg || "VEG"}
                          </div>
                        ) : (
                          <Autocomplete
                            options={["VEG", "NONVEG", "EGG"]}
                            getOptionLabel={(option) => option || ""}
                            value={activity.vegNonVeg || "VEG"}
                            onChange={(_, newValue) => {
                              const updated = [...emptyArr];
                              updated[index].vegNonVeg = newValue || "VEG";
                              setEmptyArr(updated);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                InputProps={{
                                  ...params.InputProps,
                                  style: { fontSize: "10px" },
                                }}
                              />
                            )}
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                minHeight: "24px",
                              },
                            }}
                          />
                        )}
                      </td>

                      {/* Delete Button */}
                      <td className="px-1 py-1 border-b border-gray-200">
                        <button
                          onClick={() => handleDelete(index)}
                          className="flex items-center justify-center w-full hover:bg-red-50 rounded p-1"
                        >
                          <LucideCircleMinus
                            className="text-red-400"
                            size={14}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-b-gray-300">
                    <td className="p-2" colSpan={9}>
                      <button
                        className="flex items-center space-x-1 px-3 py-1 add-row text-xs hover:bg-blue-50 rounded border border-blue-200"
                        onClick={addNewRow}
                      >
                        <Plus size={10} />
                        <span>Add Row</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8">
            <div className="relative bg-transparent p-5">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 z-10 rounded-full bg-white p-1 text-gray-500 hover:text-black shadow-md"
              >
                <X size={20} />
              </button>

              <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative p-6">
                {/* Close Button */}

                <div className="flex justify-between items-center border-gray-200 border-b pb-2 mb-4">
                  <h2 className="text-xl font-[500]">Create New Meal</h2>
                  <button
                    onClick={handleModalSave}
                    className="activity-save-button mx-6 m flex items-center space-x-2 bg-[#0070FF] text-white px-4 py-2 rounded-xl"
                  >
                    <Save size={20} />
                    <span>Save</span>
                  </button>
                </div>

                {/* Modal Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-center">Sl.No</th>
                        <th className="px-4 py-2 text-center">Item Name</th>
                        <th className="px-4 py-2 text-center">Description</th>
                        <th className="px-4 py-2 text-center">Target 1</th>
                        <th className="px-4 py-2 text-center">Unit 1</th>
                        <th className="px-4 py-2 text-center">Target 2</th>
                        <th className="px-4 py-2 text-center">Unit 2</th>
                        <th className="px-4 py-2 text-center">VegNonVeg</th>
                        <th className="px-4 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {newActivities.map((activity, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-center border-b-2 border-gray-200 align-middle">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
                            <div className="flex justify-center">
                              <Autocomplete
                                options={uniqueActivities}
                                getOptionLabel={(option) => option.name || ""}
                                value={
                                  uniqueActivities.find(
                                    (a) => a.name === activity.name
                                  ) || null
                                }
                                onInputChange={(_, newInputValue) => {
                                  const updated = [...newActivities];
                                  updated[index].name = newInputValue;
                                  setNewActivities(updated);
                                }}
                                filterOptions={(options, { inputValue }) => {
                                  if (!inputValue || inputValue.length < 2) {
                                    return options.slice(0, 10);
                                  }

                                  const lowerInput = inputValue.toLowerCase();
                                  const results: any[] = [];

                                  for (const option of options) {
                                    const nameLower = option.name.toLowerCase();
                                    if (nameLower.includes(lowerInput)) {
                                      results.push({
                                        ...option,
                                        _priority: nameLower.startsWith(
                                          lowerInput
                                        )
                                          ? 0
                                          : 1,
                                      });
                                      if (results.length >= 15) break;
                                    }
                                  }

                                  return results
                                    .sort((a, b) => {
                                      if (a._priority !== b._priority)
                                        return a._priority - b._priority;
                                      return a.name.localeCompare(b.name);
                                    })
                                    .slice(0, 10);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Select Food Items"
                                    variant="outlined"
                                    size="small"
                                    sx={{ width: 180 }}
                                  />
                                )}
                                freeSolo
                                noOptionsText="Type to search..."
                                disablePortal
                                blurOnSelect
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
                            <div className="flex justify-center">
                              <input
                                type="text"
                                value={activity.description}
                                onChange={(e) => {
                                  const updated = [...newActivities];
                                  updated[index].description = e.target.value;
                                  setNewActivities(updated);
                                }}
                                className="w-full rounded p-2 border border-gray-400 text-center"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                value={activity.target}
                                onChange={(e) => {
                                  const updated = [...newActivities];
                                  updated[index].target = e.target.value;
                                  setNewActivities(updated);
                                }}
                                className="w-full border border-gray-400 rounded p-2 text-center"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
                            <div className="flex justify-center">
                              <Autocomplete
                                options={NutritionUnits}
                                getOptionLabel={(option) =>
                                  formatUnit(option) || ""
                                }
                                value={activity.unit || ""}
                                onChange={(_, newValue) => {
                                  const updated = [...newActivities];
                                  updated[index].unit = newValue || "";
                                  setNewActivities(updated);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Select Unit"
                                    variant="outlined"
                                    size="small"
                                    sx={{ width: 120 }}
                                  />
                                )}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                value={activity.target2 || ""}
                                onChange={(e) => {
                                  const updated = [...newActivities];
                                  updated[index].target2 = e.target.value;
                                  setNewActivities(updated);
                                }}
                                className="w-full border border-gray-400 rounded p-2 text-center"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
                            <div className="flex justify-center">
                              <Autocomplete
                                options={NutritionUnits}
                                getOptionLabel={(option) =>
                                  formatUnit(option) || ""
                                }
                                value={activity.unit2 || ""}
                                onChange={(_, newValue) => {
                                  const updated = [...newActivities];
                                  updated[index].unit2 = newValue || "";
                                  setNewActivities(updated);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Select Unit"
                                    variant="outlined"
                                    size="small"
                                    sx={{ width: 120 }}
                                  />
                                )}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 border-b-2 border-gray-200 align-middle">
                            <div className="flex justify-center">
                              <Autocomplete
                                options={["VEG", "NONVEG", "EGG"]}
                                getOptionLabel={(option) => option || ""}
                                value={activity.vegNonVeg || ""}
                                onChange={(_, newValue) => {
                                  const updated = [...newActivities];
                                  updated[index].vegNonVeg = newValue || "";
                                  setNewActivities(updated);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Veg/NonVeg"
                                    variant="outlined"
                                    size="small"
                                    sx={{ width: 120 }}
                                  />
                                )}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 border-b-2 border-gray-200 text-center align-middle">
                            <div className="flex justify-center items-center">
                              <button
                                onClick={() => {
                                  const updated = [...newActivities];
                                  updated.splice(index, 1);
                                  setNewActivities(updated);
                                }}
                              >
                                <LucideCircleMinus
                                  className="text-red-500"
                                  size={20}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-start">
                  <button
                    onClick={handleAddNewRow}
                    className="flex items-center space-x-2 border bg-white text-[#0070FF] px-4 py-2 heya"
                  >
                    <Plus />
                    <span>Create another item</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NutritionActivityTable;
