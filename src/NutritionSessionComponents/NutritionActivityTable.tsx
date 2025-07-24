import { LucideCircleMinus, Plus, Save, X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { ActivityUtils } from "../Utils/ActivityUtils";

import "../sessionsPageComponets/ActivityTable.css";
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
  const { getActivities, createNutritionActivity, getActivityById, createSession ,getTags} =
    useApiCalls();
  useEffect(() => {
    getActivities("","","NUTRITION");
  }, []);

  
  const { setSelectComponent, activities_api_call } = context;
  const [tags, setTags] = useState([]);
  const [planName, setPlanName] = useState<string>("");
  const [category, setCategory] = useState<string>("Nutrition");
  const [theme, setTheme] = useState("");
  const [goal, setGoal] = useState("");
  const [themes , setThemes] = useState([]);
  const [goals, setGoals ] = useState([]);
   const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
  const [showModal, setShowModal] = useState(false);
  // const [trackDublicate , setTrackDublicate] = useState<object[]>([]);
  // console.log(trackDublicate)
  useEffect(() => {} , [])

  useEffect(() => {
    const taggetter = async () => {
      const res = await getTags();
      if (res) {
        setTags(res);
        setThemes(res.filter((tag) => tag.type === "theme"));
        setGoals(res.filter((tag) => tag.type === "goal"));
      } else {
        console.error("Failed to fetch tags");
      }
    };
    taggetter();

     
  }, []);
  useEffect(() => {
    // console.log("Tags fetched:", tags);
  }, [tags]);
  const [newActivities, setNewActivities] = useState<Activity_Api_call[]>([
    {
      name: "",
      description: "",
      target: null,
      unit: "",
      type:"",
    },
  ]);
  const [emptyArr, setEmptyArr] = useState<Activity_Api_call[]>([
    {
      name: "",
      description: "",
      target: null,
      unit: "",
      icon: "",
      type:"",
    },
  ]);

  useEffect(() => {
    console.log(emptyArr);
    const activityIds = emptyArr.map((activity) => activity.activityId);
    // console.log(activityIds);
  }, [emptyArr]);

  useEffect(() => {
    // console.log(activities_api_call);
  }, [activities_api_call]);

  const handlePlanSaving = () => {
    setSelectComponent("AllSessions");
  };

  const handleSessionCreation = async () => {
    // const activityIds = emptyArr.map((activity) => activity.activityId);
    const activityIds: string[] = emptyArr
      .map((item) => item.activityId)
      .filter((id): id is string => typeof id === "string");

    const sessionToBeCreated: Session_Api_call = {
      title: planName,
      description: "",
      category: "NUTRITION",
      activityIds: activityIds,
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
        unit: "",
        icon: "",
        type:"",
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
        unit: "",
        icon: "",
        type:"",
      },
    ]);
  };

  const handleModalSave = async () => {
    const validActivities = newActivities.filter(
      (activity) =>
        activity.name.trim() !== "" &&
        activity.description.trim() !== "" &&
        (activity.target !== 0 || activity.target !== null) &&
        activity.unit.trim() !== ""
    );

    if (validActivities.length === 0) {
      setShowModal(false);
      return;
    }

    const newItems = validActivities.map((activity) => ({
      name: activity.name,
      description: activity.description,
      target: activity.target,
      unit: activity.unit,
      type:activity.type,
    }));
    const postEachActivity = async () => {
      try {
        for (const item of newItems) {
          console.log(item,"jiiji")
          await createNutritionActivity(item);
        }
      } catch (error) {
        console.error("Error posting some activities:", error);
      }
    };
    // ✅ Wait for posting to finish
    await postEachActivity();
    // ✅ Then update the state
    await getActivities("","","NUTRITION");
    setNewActivities([
      {
        name: "",
        description: "",
        target: null,
        unit: "",
        type:"",
      },
    ]);
    setShowModal(false);
  };

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
    console.log(activity,"['pilkujhgfd")
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

  // console.log(newActivities);
useEffect(() => {
  // console.log(theme);
  // console.log(goal);
}
, [theme, goal]);

useEffect(() => {
    if (theme && goal) {
      console.log("Theme and Goal are set:", theme, goal);
      getActivities(theme, goal,"NUTRITION");
      return;
      // You can add any additional logic here that depends on both theme and goal being set
    }
    if(theme){
      console.log("Theme is set:", theme);
      getActivities(theme,"","NUTRITION");
      return;
    }
    if(goal){
      console.log("Goal is set:", goal);
      getActivities("",goal,"NUTRITION");
      return;
    }if(category){
        getActivities("","","NUTRITION")
    }
    getActivities("","","NUTRITION");
  }, [theme , goal]);

  useEffect(()=>{
    // console.log(emptyArr,"this is emort")
  },[emptyArr])
  return (
    <div className="activity-table-container bg-white w-full flex flex-col px-4 md:px-8">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <div className="flex w-2xl gap-8">
          <div className="flex flex-col w-full">
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

          <div className="flex flex-col w-full ">
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
         <div className="flex flex-col w-full">
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
          return <span ></span>;
        }
        return selected;
      }}
      sx={{ fontSize: "1.25rem", fontFamily: "Roboto" }}
    >
      <MenuItem value="">
        <em>None</em>
      </MenuItem>
      {themes.map((tag, i) => (
        <MenuItem key={i} value={tag?.title}>
          {tag.title}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</div>


          <div className="flex flex-col w-full ">
            <FormControl fullWidth variant="standard" sx={{ minWidth: 120 }}>
              <InputLabel id="demo-select-label" shrink={true}> Goal</InputLabel>
              <Select
                labelId="demo-select-label"
                value={goal}
               
                onChange={(e) => setGoal(e.target.value)}
                displayEmpty
                sx={{ fontSize: "1.25rem", fontFamily: "Roboto" }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <span ></span>;
                  }
                  return selected;
                }}
              >
                <MenuItem value="">
                  None
                </MenuItem>
                {goals.map((tag, i) => (
                  <MenuItem key={i} value={tag?.title}>
                    {tag.title}
                  </MenuItem>
                ))}
                
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Right Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center space-x-2 p-2  text-sm md:text-base plus-new-actvity"
            onClick={() => setShowModal(true)}
          >
            <Plus />
            <span>Create New Item</span>
          </button>
          <button
            className="flex items-center space-x-2 text-white px-4 py-2 rounded-xl text-sm md:text-base btn2 "
            onClick={handleSessionCreation}
          >
            <Save size={20} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-auto flex-1 w-full">
        <div className="min-w-[600px]">
          <table className="w-full table-auto border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-left text-gray-700 text-sm md:text-base">
                {[
                  "Sl No.",
                  "Item",
                  "Description",
                  "Target",
                  "Unit",
                  "Type",
                  "",
                ].map((item, index) => (
                  <th
                    key={index}
                    className="justify-center font-roberto px-4 py-2 md:py-6 border-b border-b-gray-300 text-center"
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
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    {index + 1}
                  </td>

                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    <Autocomplete
                      options={activities_api_call}
                      getOptionLabel={(option) => option.name || ""}
                      value={
                        activities_api_call.find(
                          (a) => a.activityId === selectedActivities[index]
                        ) || null
                      }
                      onChange={(_, newValue) => {
                        // newValue is the selected activity object or null
                        handleActivitySelectChange(
                          index,
                          newValue ? newValue.activityId : ""
                        );
                        setActivityForTable(newValue);
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
                      sx={{ width: 100, backgroundColor: "white" }}
                      isOptionEqualToValue={(option, value) =>
                        option.activityId === value.activityId
                      }
                      freeSolo
                    />
                  </td>

                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    {activity.description}
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    {activity.target}
                  </td>
                  
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    {activity.unit == "weight"
                      ? "Kg"
                      : activity.unit == "distance"
                      ? "Km"
                      : activity.unit == "time"
                      ? "Min"
                      : activity.unit == "repetitions"
                      ? "Reps"
                      :  activity.unit == "grams"
                      ? "g"
                      : activity.unit == "meter"
                      ? "m"
                      : activity.unit == "litre"
                      ? "L"
                      : activity.unit == "millilitre"
                      ? "ml"
                      : activity?.unit == "glasses"
                                                            ? "glasses"
                      : ""}
                  </td>
                  <td  className="px-4 py-7 border-b border-b-gray-200 text-center">
                    {activity.type}
                    
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    <button onClick={() => handleDelete(index)}>
                      <LucideCircleMinus className="text-red-400" size={24} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-b border-b-gray-300">
                <td className="p-3  " colSpan={5}>
                  <button
                    className="space-x-2 px-4 py-2 add-row"
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

            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative p-6 ">
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
                      <th className="px-4 py-2">Sl.No</th>
                      <th className="px-4 py-2">Item Name</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Target</th>
                      <th className="px-4 py-2">Unit</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {newActivities.map((activity, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-center border-b-2 border-gray-200">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 border-b-2 border-gray-200">
                          <Autocomplete
                            options={activities_api_call}
                            getOptionLabel={(option) => option.name || ""}
                            getOptionDisabled={() => true} // disables all options
                            value={
                              activities_api_call.find(
                                (a) => a.name === activity.name
                              ) || null
                            }
                            onInputChange={(_, newInputValue) => {
                              const updated = [...newActivities];
                              updated[index].name = newInputValue;
                              // Optionally, clear other fields if not matching an existing activity
                              setNewActivities(updated);
                              // Optionally, call handleType here if you want live type detection
                            }}
                            // onChange={(_, newValue) => {
                            //   const updated = [...newActivities];
                            //   if (newValue) {
                            //     updated[index].name = newValue.name;
                            //     updated[index].description =
                            //       newValue.description || "";
                            //     updated[index].unit = newValue.unit || "";
                            //     updated[index].target = newValue.target ||"";
                            //     // setTrackDublicate((prev) => [...prev, {name : newValue.name , index}]);
                            //   } else {
                            //     updated[index].name = "";
                            //     updated[index].description = "";
                            //     updated[index].unit = "";
                            //     updated[index].target = "";
                            //   }
                            //   setNewActivities(updated);
                            // }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Item"
                                variant="outlined"
                                size="small"
                                sx={{ width: 200 }}
                              />
                            )}
                            freeSolo // allows custom input as well as selection
                          />
                        </td>
                        <td className="px-4 py-2 border-b-2 border-gray-200">
                          <input
                            type="text"
                            value={activity.description}
                            onChange={(e) => {
                              const updated = [...newActivities];
                              updated[index].description = e.target.value;
                              setNewActivities(updated);
                            }}
                            className="w-full rounded p-2 border border-gray-400"
                          />
                        </td>
                        <td className="px-4 py-2 border-b-2 border-gray-200">
                          <input
                            type="number"
                            value={activity.target}
                            onChange={(e) => {
                              const updated = [...newActivities];
                              updated[index].target = e.target.value;
                              setNewActivities(updated);
                            }}
                            className="w-full border border-gray-400 rounded p-2"
                          />
                        </td>
                        <td className="px-4 py-2 border-b-2 border-gray-200">
                           <Autocomplete
                              options ={NutritionUnits}
                              getOptionsLable={(option :any) => option || ""}
                              value={activity.unit || ""}
                              onChange={(_ , newValue) => {
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
                                  sx={{ width: 180 }}
                                />
                              )}
                            />
                        </td>
                        <td>
                            <Autocomplete
                              options ={NutritionUtils}
                              getOptionsLable={(option :any) => option || ""}
                              value={activity.type || ""}
                              onChange={(_ , newValue) => {
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
                                  sx={{ width: 180 }}
                                />
                              )}
                            />
                        </td>
                        <td className="px-4 py-2 border-b-2 border-gray-200 text-center">
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
