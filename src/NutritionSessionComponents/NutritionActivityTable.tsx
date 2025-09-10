import { LucideCircleMinus, Plus, Save, X } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { ActivityUtils } from "../Utils/ActivityUtils";

import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
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

  const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
  const [showModal, setShowModal] = useState(false);
  const [literals, setLiterals] = useState({
    themes: [],
    goals: [],
  });
  useEffect(() => {}, []);
  useEffect(() => {
    const fetchLiterals = async () => {
      try {
        const response = await fetch(
          "https://forge-play-backend.forgehub.in/session-template/getLiterlas"
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
      type: "",
      videoLink: "",
    },
  ]);

  const [emptyArr, setEmptyArr] = useState<Activity_Api_call[]>([
    {
      name: "",
      description: "",
      target: null,
      target2: null,
      unit: "",
      unit2: "",
      icon: "",
      type: "",
      videoLink: "",
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

    const sessionToBeCreated: Session_Api_call = {
      title: planName,
      description: "",
      category: category,
      activityIds: activityIds,
      themes: theme ? [theme] : [],
      goals: goal ? [goal] : [],
    };
    console.log(sessionToBeCreated);
    await createSession(sessionToBeCreated);
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
        type: "",
        videoLink: "",
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
        type: "",
        videoLink: "",
      },
    ]);
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
      // Ensure all fields have proper values and types
      const item = {
        name: activity.name.trim(),
        description: activity.description.trim(),
        target: Number(activity.target), // Convert to number
        unit: activity.unit,
        type: activity.type || "",
        videoLink: "", // Always pass empty string for nutrition
      };

      // Only include target2 and unit2 if they have values
      if (
        activity.target2 &&
        activity.target2 !== "" &&
        activity.target2 !== null
      ) {
        item.target2 = Number(activity.target2); // Convert to number
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
        // Still show user feedback but don't break the flow
        alert(
          "Some activities could not be saved. Please check the console for details."
        );
        throw error; // Re-throw to prevent continuing
      }
    };
    // ✅ Wait for posting to finish
    await postEachActivity();
    // ✅ Then update the state
    await getActivities("", "", "NUTRITION");
    setNewActivities([
      {
        name: "",
        description: "",
        target: null,
        target2: null,
        unit: "",
        unit2: "",
        type: "",
        videoLink: "",
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

  const handleDelete = (index: number) => {
    const updatedPlan = emptyArr.filter((_, i) => i !== index);
    setEmptyArr(updatedPlan);
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
    const activity = await getActivityById(activityId);
    console.log(activity, "['pilkujhgfd");
    if (activity) {
      emptyArr[index] = activity;
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
    updateTheActivitityById(value, id);
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

  //controlling acitivites with theme adn goal
  useEffect(() => {
    if (theme && goal) {
      console.log("Theme and Goal are set:", theme, goal);
      getActivities(theme, goal, "NUTRITION");
      return;
    }
    if (theme) {
      console.log("Theme is set:", theme);
      getActivities(theme, "", "NUTRITION");
      return;
    }
    if (goal) {
      console.log("Goal is set:", goal);
      getActivities("", goal, "NUTRITION");
      return;
    }
    getActivities("", "", "NUTRITION");
  }, [theme, goal]);

  useEffect(() => {
    console.log(emptyArr, "this is emort");
  }, [emptyArr]);

  return (
    <div className="activity-table-container bg-white w-full flex flex-col px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-4 gap-4">
        <div className="flex flex-col lg:flex-row w-full lg:w-auto gap-4 lg:gap-8">
          <div className="flex flex-col w-full lg:w-auto min-w-0">
            <FormControl fullWidth variant="standard" sx={{ minWidth: 170 }}>
              <TextField
                label="Nutrition Name"
                variant="standard"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                InputProps={{
                  sx: { fontSize: "1.25rem", fontFamily: "Roboto" },
                }}
              />
            </FormControl>
          </div>

          <div className="flex flex-col w-full lg:w-auto min-w-0">
            <FormControl fullWidth variant="standard" sx={{ minWidth: 120 }}>
              <TextField
                label="Category"
                variant="standard"
                value={category}
                InputProps={{
                  sx: { fontSize: "1.25rem", fontFamily: "Roboto" },
                }}
              />
            </FormControl>
          </div>

          <div className="flex flex-col w-full lg:w-auto min-w-0">
            <FormControl fullWidth variant="standard" sx={{ minWidth: 120 }}>
              <InputLabel id="demo-select-label" shrink={true}>
                Theme
              </InputLabel>
              <Select
                labelId="demo-select-label"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <span></span>;
                  }
                  return selected;
                }}
                sx={{ fontSize: "1.25rem", fontFamily: "Roboto" }}
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

          <div className="flex flex-col w-full lg:w-auto min-w-0">
            <FormControl fullWidth variant="standard" sx={{ minWidth: 120 }}>
              <InputLabel id="demo-select-label" shrink={true}>
                {" "}
                Goal
              </InputLabel>
              <Select
                labelId="demo-select-label"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                displayEmpty
                sx={{ fontSize: "1.25rem", fontFamily: "Roboto" }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <span></span>;
                  }
                  return selected;
                }}
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
        </div>

        {/* Right Buttons */}
        <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
          <button
            className="flex items-center justify-center space-x-2 p-2 text-sm md:text-base plus-new-actvity whitespace-nowrap"
            onClick={() => setShowModal(true)}
          >
            <Plus />
            <span>Create New Item</span>
          </button>
          <button
            className="flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-xl text-sm md:text-base btn2 whitespace-nowrap"
            onClick={handleSessionCreation}
          >
            <Save size={20} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-auto flex-1 w-full">
        <div className="min-w-[1200px]">
          <table className="w-full table-auto border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-left text-gray-700 text-sm md:text-base">
                {[
                  "Sl No.",
                  "Item",
                  "Description",
                  "Target 1",
                  "Unit 1",
                  "Target 2",
                  "Unit 2",
                  "Type",
                  "",
                ].map((item, index) => (
                  <th
                    key={index}
                    className="font-roberto px-4 py-2 md:py-6 border-b border-b-gray-300 text-center"
                    style={{
                      minWidth:
                        index === 1 ? "280px" : index === 2 ? "200px" : "auto",
                    }}
                  >
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emptyArr.map((activity, index) => (
                <tr
                  key={index}
                  className="text-sm text-gray-800 hover:bg-gray-50"
                >
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center align-middle">
                    {index + 1}
                  </td>

                  <td
                    className="px-4 py-7 border-b border-b-gray-200 align-middle"
                    style={{ minWidth: "280px" }}
                  >
                    <div className="flex justify-center">
                      <Autocomplete
                        options={uniqueActivities}
                        getOptionLabel={(option) => option.name || ""}
                        value={
                          uniqueActivities.find(
                            (a) => a.activityId === selectedActivities[index]
                          ) || null
                        }
                        onChange={(_, newValue) => {
                          handleActivitySelectChange(
                            index,
                            newValue ? newValue.activityId : ""
                          );
                          setActivityForTable(newValue);
                        }}
                        filterOptions={(options, { inputValue }) => {
                          if (!inputValue || inputValue.length < 2) {
                            return options.slice(0, 15);
                          }

                          const lowerInput = inputValue.toLowerCase();
                          const exactMatches: any[] = [];
                          const startsMatches: any[] = [];
                          const containsMatches: any[] = [];

                          for (const option of options) {
                            const nameLower = option.name.toLowerCase();

                            if (nameLower === lowerInput) {
                              exactMatches.push(option);
                            } else if (nameLower.startsWith(lowerInput)) {
                              startsMatches.push(option);
                            } else if (nameLower.includes(lowerInput)) {
                              containsMatches.push(option);
                            }

                            if (
                              exactMatches.length +
                                startsMatches.length +
                                containsMatches.length >=
                              20
                            )
                              break;
                          }

                          return [
                            ...exactMatches,
                            ...startsMatches.sort((a, b) =>
                              a.name.localeCompare(b.name)
                            ),
                            ...containsMatches.sort((a, b) =>
                              a.name.localeCompare(b.name)
                            ),
                          ].slice(0, 20);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Item"
                            variant="outlined"
                            size="small"
                            sx={{ width: 250 }}
                          />
                        )}
                        sx={{ width: 250, backgroundColor: "white" }}
                        isOptionEqualToValue={(option, value) =>
                          option.activityId === value.activityId
                        }
                        freeSolo
                        noOptionsText="Type 2+ characters to search..."
                        disablePortal
                        blurOnSelect
                      />
                    </div>
                  </td>

                  <td
                    className="px-4 py-7 border-b border-b-gray-200 text-center align-middle"
                    style={{ minWidth: "200px" }}
                  >
                    <div className="break-words">{activity.description}</div>
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center align-middle">
                    {activity.target}
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center align-middle">
                    {formatUnit(activity.unit)}
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center align-middle">
                    {activity.target2}
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center align-middle">
                    {formatUnit(activity.unit2)}
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center align-middle">
                    {activity.type}
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center align-middle">
                    <div className="flex justify-center items-center">
                      <button onClick={() => handleDelete(index)}>
                        <LucideCircleMinus className="text-red-400" size={24} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-b border-b-gray-300">
                <td className="p-3" colSpan={9}>
                  <button
                    className="flex items-center space-x-2 px-4 py-2 add-row"
                    onClick={addNewRow}
                  >
                    <Plus />
                    <span>Add Row</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
                      <th className="px-4 py-2 text-center">Type</th>
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
                                  label="Select Item"
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
                              getOptionsLable={(option: any) => option || ""}
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
                              getOptionsLable={(option: any) => option || ""}
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
                              options={NutritionUtils}
                              getOptionsLable={(option: any) => option || ""}
                              value={activity.type || ""}
                              onChange={(_, newValue) => {
                                const updated = [...newActivities];
                                updated[index].type = newValue || "";
                                setNewActivities(updated);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Select Type"
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
  );
}

export default NutritionActivityTable;
