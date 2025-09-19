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
import { Autocomplete, TextField } from "@mui/material";

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
import { useApiCalls } from "../store/axios"; // Adjust if needed
import dayjs from "dayjs";
function AddActivity({ userId, userDate, planForAlacarte, getData }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(null);
  const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
  const {
    getAllSessions,
    addSessionFromCalendar,
    getActivities,
    getActivityById,
    getDummyPlanFromPlans,
    allocate_Activity_Session,
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
    getActivities("", "", "");
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
      sessionTemplateId: "SEST_YFVI33",
      sessionInstanceId: sessionInstanceId,
      userId: userId,
      scheduledDate: parsedDate.toLocaleDateString("en-CA"), // format: yyyy-mm-dd
      planInstanceId: result?.data.planInstanceId,
    };

    console.log("Session Data to be sent:", sessionData);

    const result_1 = await allocate_Activity_Session(sessionData);
    getData();
    setOpen(false);
    console.log(result_1, "this is adding acitivty");
    //   setOption("");
    //   setActivityForTable("");
    //   setDate(null);
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

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Add a Activity
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
            Activity Templates
          </Typography>

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
                              return options.slice(0, 50); // Increased for scrolling
                            }

                            const lowerInput = inputValue.toLowerCase();
                            const exactMatches = [];
                            const startsMatches = [];
                            const containsMatches = [];

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
                                100
                              ) {
                                break;
                              }
                            }

                            return [
                              ...exactMatches,
                              ...startsMatches.sort((a, b) =>
                                a.name.localeCompare(b.name)
                              ),
                              ...containsMatches.sort((a, b) =>
                                a.name.localeCompare(b.name)
                              ),
                            ].slice(0, 100); // Increased limit for scrolling
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Activity"
                              variant="outlined"
                              size="small"
                              sx={{ width: 250 }}
                            />
                          )}
                          sx={{
                            width: 250,
                            backgroundColor: "white",
                            "& .MuiAutocomplete-listbox": {
                              maxHeight: "200px", // Enable scroll with max height
                              overflow: "auto",
                            },
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.activityId === value.activityId
                          }
                          freeSolo
                          noOptionsText="Type 2+ characters to search..."
                          blurOnSelect
                          clearOnBlur
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </div>
            </div>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              sx={{ width: "100%", mb: 2 }}
              format="DD-MM-YYYY"
            />
          </LocalizationProvider>
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

export default AddActivity;
