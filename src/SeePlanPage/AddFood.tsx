import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Button,
  Modal,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
} from "@mui/material";
import { CheckIcon } from "lucide-react";
import { Autocomplete, TextField } from "@mui/material";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Activity_Api_call, DataContext } from "../store/DataContext";
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 350,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  outline: "none",
};
import { API_BASE_URL, API_BASE_URL2, useApiCalls } from "../store/axios"; // Adjust if needed
import dayjs from "dayjs";
function AddFood({ userId, userDate, planForAlacarte, getData }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(null);
  const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
  const MEAL_TIMINGS = [
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
  ] as const;
  const [mealTiming, setMealTiming] =
    useState<(typeof MEAL_TIMINGS)[number]>("breakfast");
  const [nutritionKYC, setNutritionKYC] = useState(null);
  const [dayType, setDayType] = useState("VEG");
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [selectedMealFilter, setSelectedMealFilter] = useState("VEG");
  const getVegNonVegColor = (vegNonVeg: any) => {
    switch (vegNonVeg) {
      case "VEG":
        return {
          backgroundColor: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
        };
      case "EGG":
        return {
          backgroundColor: "#f4e4bc",
          color: "#8B4513",
          border: "1px solid #e6d3a3",
        };
      case "NONVEG":
        return {
          backgroundColor: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f1b0b7",
        };
      default:
        return {
          backgroundColor: "#f8f9fa",
          color: "#495057",
          border: "1px solid #dee2e6",
        };
    }
  };

  const getVegNonVegIcon = (vegNonVeg: any) => {
    switch (vegNonVeg) {
      case "VEG":
        return "🟢";
      case "EGG":
        return "🟤";
      case "NONVEG":
        return "🔴";
      default:
        return "⚪";
    }
  };
  useEffect(() => {
    const fetchKYC = async () => {
      if (!userId) {
        setDayType("VEG");
        return;
      }

      setIsLoadingNutrition(true);
      try {
        const response = await fetch(`${API_BASE_URL2}/human/${userId}`);
        const data = await response.json();

        if (data && data.nutritionKYC) {
          setNutritionKYC(data.nutritionKYC);
        } else {
          setNutritionKYC(null);
          setDayType("VEG");
        }
      } catch (error) {
        console.error("Failed to fetch nutrition KYC:", error);
        setNutritionKYC(null);
        setDayType("VEG");
      } finally {
        setIsLoadingNutrition(false);
      }
    };

    if (userId) {
      fetchKYC();
    }
  }, [userId]);

  useEffect(() => {
    if (date) {
      if (nutritionKYC) {
        const day = dayjs(date).format("ddd").toUpperCase();
        const pref = nutritionKYC[day];
        const typeMap = { 0: "VEG", 1: "EGG", 2: "NONVEG" };
        const mealType = typeMap[pref] || "VEG";
        setDayType(mealType);
        setSelectedMealFilter(mealType);
      } else {
        setDayType("VEG");
        setSelectedMealFilter("VEG");
      }
    } else {
      setDayType("VEG");
      setSelectedMealFilter("VEG");
    }
  }, [date, nutritionKYC]);
  const {
    getAllSessions,
    addSessionFromCalendar,
    getActivities,
    getActivityById,
    getDummyPlanFromPlans,
    allocate_Nutrtion_Session,
  } = useApiCalls();
  const context = useContext(DataContext);
  if (context) {
    console.log("Loading");
  }
  const { activities_api_call } = context;
  const [emptyArr, setEmptyArr] = useState<Activity_Api_call[]>([
    {
      name: "",
      description: "",
      target: null,
      unit: "",
      icon: "",
    },
  ]);
  useEffect(() => {
    getActivities("", "", "NUTRITION");
  }, [open]);
  const [selectedActivities, setSelectedActivities] = useState<{
    [id: number]: string;
  }>({});
  const updateTheActivitityById = async (activityId: string, index: number) => {
    const activity = await getActivityById(activityId);
    if (activity) {
      emptyArr[index] = activity;
      setEmptyArr([...emptyArr]);
    } else {
      console.error("Activity not found");
    }
  };

  const handleActivitySelectChange = (id: number, value: string) => {
    setSelectedActivities((prev) => ({ ...prev, [id]: value }));
    updateTheActivitityById(value, id);
  };

  useEffect(() => {
    console.log("User date in AddSession:", userDate);
    if (userDate) {
      setDate(dayjs(userDate));
    }
  }, [userDate]);

  const handleConfirm = async () => {
    if (!activityForTable || !date) {
      console.error("Please select a session and a date.");
      return;
    }

    // Ensure 'date' is a Date object
    const parsedDate = new Date(date);
    const user = localStorage.getItem("user");
    const user_new = JSON.parse(user);
    // console.log(user_new?.plansAllocated)
    const result = await getDummyPlanFromPlans(user_new?.plansAllocated);
    const total = result?.data.sessionInstances;
    const sessionInstanceId = total[0].sessionInstanceId;

    // console.log(sessionInstanceId);
    console.log(result);

    if (isNaN(parsedDate.getTime())) {
      console.error("Invalid date provided:", date);
      return;
    }

    const sessionData = {
      // activityid from table needs to template activityid
      activityId: activityForTable.activityId,
      sessionTemplateId: "SENT_UIHY77",
      sessionInstanceId: sessionInstanceId,
      userId: userId,
      scheduledDate: parsedDate.toLocaleDateString("en-CA"), // format: yyyy-mm-dd
      planInstanceId: result?.data.planInstanceId,
    };

    console.log("Session Data to be sent:", sessionData);

    const result_1 = await allocate_Nutrtion_Session(sessionData);
    const newSessionInstanceId =
      result_1.data.sessionInstance.sessionInstanceId; // ← NEW ID

    /* 3. PATCH the newly-created instance --------------------------------- */
    const patchPayload = { type: mealTiming };
    await axios.patch(
      `${API_BASE_URL}/session-instances/${newSessionInstanceId}`,
      patchPayload,
      { headers: { "Content-Type": "application/json" } }
    );
    console.log(patchPayload, "patch-payload for", newSessionInstanceId);

    getData();
    setOpen(false);
    console.log(result_1, "this is adding acitivty");
    //   setOption("");
    //   setActivityForTable("");
    //   setDate(null);
  };
// Replace the existing uniqueActivities useMemo with this:
const uniqueActivities = useMemo(() => {
  const seen = new Set();
  return activities_api_call
    .filter((activity: Activity_Api_call) => {
      const effectiveVegNonVeg = activity.vegNonVeg || "VEG";
      return effectiveVegNonVeg === selectedMealFilter;
    })
    .filter((activity: Activity_Api_call) => {
      if (seen.has(activity.name) || !activity.name) {
        return false;
      }
      seen.add(activity.name);
      return true;
    });
}, [activities_api_call, selectedMealFilter]);

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Add a Food Item
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          {/* Cross Button */}
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h6" mb={2}>
            Food Items
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              sx={{ width: "100%", mb: 2 }}
              format="DD-MM-YYYY"
            />
          </LocalizationProvider>
          {/* Nutrition KYC Display */}
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: "#f8f9fa",
              borderRadius: 1,
              border: "1px solid #e9ecef",
            }}
          >
            {isLoadingNutrition ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "60px",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Loading nutrition preferences...
                </Typography>
              </Box>
            ) : (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    mb: 1.5,
                    textAlign: "center",
                    fontWeight: 500,
                    color:
                      dayType === "VEG"
                        ? "#155724"
                        : dayType === "EGG"
                        ? "#8B4513"
                        : "#721c24",
                  }}
                >
                  This is {dayType} day
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    justifyContent: "space-around",
                  }}
                >
                  {["VEG", "EGG", "NONVEG"].map((mealType) => (
                    <Box
                      key={mealType}
                      onClick={() => setSelectedMealFilter(mealType)}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.25,
                        flex: 1,
                        minWidth: "50px",
                        p: 0.5,
                        borderRadius: 0.5,
                        textAlign: "center",
                        cursor: "pointer",
                        bgcolor:
                          selectedMealFilter === mealType
                            ? mealType === "VEG"
                              ? "#d4edda"
                              : mealType === "EGG"
                              ? "#f4e4bc"
                              : "#f8d7da"
                            : "#f8f9fa",
                        border:
                          selectedMealFilter === mealType
                            ? mealType === "VEG"
                              ? "1.5px solid #28a745"
                              : mealType === "EGG"
                              ? "1.5px solid #8B4513"
                              : "1.5px solid #dc3545"
                            : "1px solid #dee2e6",
                        opacity: selectedMealFilter === mealType ? 1 : 0.5,
                        transition: "all 0.2s ease",
                        "&:hover": { opacity: 0.8, transform: "scale(0.98)" },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: dayType === mealType ? "bold" : "normal",
                          fontSize: "0.7rem",
                        }}
                      >
                        {mealType}
                      </Typography>
                      {dayType === mealType ? (
                        <CheckIcon sx={{ fontSize: "12px" }} />
                      ) : (
                        <CloseIcon sx={{ fontSize: "12px" }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.6rem", mt: 0.25 }}
                      >
                        {dayType === mealType ? "Allowed" : "Not Allowed"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <div className="EventModal_activity">
              <div>
                <tbody>
                  {emptyArr.map((activity, index) => (
                    <tr
                      key={index}
                      className="text-sm text-gray-800 hover:bg-gray-50"
                    >
                      <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                        <Autocomplete
                         options={uniqueActivities}
                          getOptionLabel={(option) => option.name || ""}
                          value={
                            activities_api_call.find(
                              (a: { activityId: string; }) => a.activityId === selectedActivities[index]
                            ) || null
                          }
                          onChange={(_, newValue) => {
                            handleActivitySelectChange(
                              index,
                              newValue ? newValue.activityId : ""
                            );
                            setActivityForTable(newValue);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Food Item"
                              variant="outlined"
                              size="small"
                              sx={{ width: 250 }}
                            />
                          )}
                          renderOption={(props, option) => {
                            const vegNonVegValue = option.vegNonVeg || "VEG";
                            const vegNonVegStyle =
                              getVegNonVegColor(vegNonVegValue);
                            const vegNonVegIcon =
                              getVegNonVegIcon(vegNonVegValue);

                            return (
                              <Box
                                component="li"
                                {...props}
                                sx={{
                                  ...vegNonVegStyle,
                                  borderRadius: "4px",
                                  margin: "2px",
                                  "&:hover": {
                                    opacity: 0.8,
                                    transform: "scale(0.98)",
                                  },
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "12px",
                                    marginRight: "8px",
                                  }}
                                >
                                  {vegNonVegIcon}
                                </span>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "medium" }}
                                  >
                                    {option.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ opacity: 0.8, fontSize: "0.7rem" }}
                                  >
                                    {option.vegNonVeg || "VEG"}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          }}
                          sx={{ width: 250, backgroundColor: "white" }}
                          isOptionEqualToValue={(option, value) =>
                            option.activityId === value.activityId
                          }
                          freeSolo
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </div>
            </div>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Meal timing</InputLabel>
            <Select
              value={mealTiming}
              label="Meal timing"
              onChange={(e) => setMealTiming(e.target.value as any)}
            >
              {MEAL_TIMINGS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Confirm Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            fullWidth
            disabled={!activityForTable}
          >
            Confirm
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

export default AddFood;
