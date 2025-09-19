import React, { useState, useEffect } from "react";
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
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
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
import { CheckIcon } from "lucide-react";

function AddNutrition({ userId, userDate, planForAlacarte, getData }) {
  const [open, setOpen] = useState(false);
  const [option, setOption] = useState("");
  const [date, setDate] = useState(null);
  const { getAllNutrition, addSessionFromCalendar } = useApiCalls();
  const [nutritionKYC, setNutritionKYC] = useState(null);
  const [dayType, setDayType] = useState("VEG"); // Default to VEG
  const [sessions, setSessions] = useState([]);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [selectedMealFilter, setSelectedMealFilter] = useState("VEG");
  const [searchTerm, setSearchTerm] = useState("");
  // assuming initial empty
  const [selectOpen, setSelectOpen] = useState(false);

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
        return "🟢"; // Green circle for veg
      case "EGG":
        return "🟤"; // Brown circle for egg
      case "NONVEG":
        return "🔴"; // Red circle for non-veg
      default:
        return "⚪"; // White circle for unknown
    }
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessions = await getAllNutrition();
        console.log("Fetched nutrition sessions:", sessions); // Add this log
        console.log("Number of sessions:", sessions?.length);
        setSessions(sessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    console.log("User date in AddSession:", userDate);
    if (userDate) {
      setDate(dayjs(userDate));
    }
  }, [userDate]);

  useEffect(() => {
    console.log("Selected session option:", option);
  }, [option]);

  useEffect(() => {
    const fetchKYC = async () => {
      if (!userId) {
        console.log("No userId provided, keeping default VEG");
        setDayType("VEG");
        return;
      }

      setIsLoadingNutrition(true);
      try {
        console.log("Fetching nutrition KYC for userId:", userId);
        const response = await fetch(`${API_BASE_URL2}/human/${userId}`);
        const data = await response.json();

        if (data && data.nutritionKYC) {
          console.log("Nutrition KYC data:", data.nutritionKYC);
          setNutritionKYC(data.nutritionKYC);
        } else {
          console.log("No nutrition KYC data found, keeping default VEG");
          setNutritionKYC(null);
          setDayType("VEG");
        }
      } catch (error) {
        console.error("Failed to fetch nutrition KYC:", error);
        setNutritionKYC(null);
        setDayType("VEG"); // Keep default VEG on error
      } finally {
        setIsLoadingNutrition(false);
      }
    };

    if (userId) {
      fetchKYC();
    }
  }, [userId]);

  useEffect(() => {
    console.log("Date changed:", date);
    console.log("Current nutritionKYC:", nutritionKYC);

    if (date) {
      if (nutritionKYC) {
        const day = dayjs(date).format("ddd").toUpperCase();
        const pref = nutritionKYC[day];
        const typeMap = { 0: "VEG", 1: "EGG", 2: "NONVEG" };
        const mealType = typeMap[pref] || "VEG";
        setDayType(mealType);
        setSelectedMealFilter(mealType);
        console.log(`Set meal type for ${day}:`, mealType);
      } else {
        // If no nutrition KYC data, default to VEG
        setDayType("VEG");
        setSelectedMealFilter("VEG");
      }
    } else {
      // Reset to default VEG when no date is selected
      setDayType("VEG");
      setSelectedMealFilter("VEG");
    }
  }, [date, nutritionKYC]);

  const handleConfirm = async () => {
    if (!option || !date) {
      console.error("Please select a session and a date.");
      return;
    }

    // Ensure 'date' is a Date object
    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      console.error("Invalid date provided:", date);
      return;
    }

    // Find the selected session to get its vegNonVeg and type values
    const selectedSession = sessions.find(
      (session) => session.sessionId === option
    );
    const sessionVegNonVeg = selectedSession?.vegNonVeg || "VEG";
    const mealType = selectedSession?.type || null;

    const sessionData = {
      sessionTemplateId: option,
      userId: userId,
      scheduledDate: parsedDate.toLocaleDateString("en-CA"), // format: yyyy-mm-dd
      planInstanceId: planForAlacarte?.planInstanceId,
      type: "NUTRITION",
      vegNonVeg: sessionVegNonVeg, // Add the vegNonVeg from selected session
      mealType: mealType, // Add the type from selected session
    };

    console.log("Session Data to be sent:", sessionData);

    await addSessionFromCalendar(sessionData);
    getData();
    setOpen(false);
    setOption("");
    setDate(null);
    // Reset to default state
    setDayType("VEG");
    setIsLoadingNutrition(false);
  };

  const handleModalClose = () => {
    setOpen(false);
    setOption("");
    setDate(null);
    setSearchTerm("");
    // Reset to default state
    setDayType("VEG");
    setSelectedMealFilter("VEG");
    setIsLoadingNutrition(false);
  };

  const getFilteredAndSortedSessions = () => {
    let filtered = sessions.filter(
      (session) => session.vegNonVeg === selectedMealFilter
    );

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      // Split into exact matches and partial matches
      const exactMatches = filtered.filter((session) =>
        session.title.toLowerCase().includes(search)
      );

      const partialMatches = filtered.filter(
        (session) =>
          session.title.toLowerCase().includes(search) === false &&
          session.title
            .toLowerCase()
            .split(" ")
            .some((word: string) => word.startsWith(search))
      );

      // Sort exact matches by relevance (starts with search term first)
      const sortedExactMatches = exactMatches.sort((a, b) => {
        const aStartsWith = a.title.toLowerCase().startsWith(search);
        const bStartsWith = b.title.toLowerCase().startsWith(search);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.title.localeCompare(b.title);
      });

      return [...sortedExactMatches, ...partialMatches];
    }

    return filtered;
  };

  useEffect(() => {
    setTimeout(() => {
      console.log(userId, "Props Data", userDate, planForAlacarte, getData);
    }, 2000);
  }, []);

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Add a Daily Meal
      </Button>
      <Modal open={open} onClose={handleModalClose}>
        <Box sx={modalStyle}>
          {/* Cross Button */}
          <IconButton
            aria-label="close"
            onClick={handleModalClose}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h6" mb={2}>
            Nutriton Templates
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
          {
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
                      mb: 1,
                      fontWeight: 600,
                      color: "#495057",
                      textAlign: "center",
                    }}
                  >
                    {/* Meal Type for {date?.format("dddd")} (
                    {date?.format("DD-MM-YYYY")}) */}
                  </Typography>

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
                          "&:hover": {
                            opacity: 0.8,
                            transform: "scale(0.98)",
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight:
                              dayType === mealType ? "bold" : "normal",
                            color:
                              dayType === mealType
                                ? mealType === "VEG"
                                  ? "#155724"
                                  : mealType === "EGG"
                                  ? "#8B4513"
                                  : "#721c24"
                                : "#6c757d",
                            display: "block",
                            fontSize: "0.7rem",
                          }}
                        >
                          {mealType}
                        </Typography>

                        {dayType === mealType ? (
                          <CheckIcon
                            sx={{
                              color:
                                mealType === "VEG"
                                  ? "#28a745"
                                  : mealType === "EGG"
                                  ? "#8B4513"
                                  : "#dc3545",
                              fontSize: "12px",
                            }}
                          />
                        ) : (
                          <CloseIcon
                            sx={{
                              color: "#dc3545",
                              fontSize: "12px",
                            }}
                          />
                        )}

                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color:
                              dayType === mealType
                                ? mealType === "VEG"
                                  ? "#155724"
                                  : mealType === "EGG"
                                  ? "#8B4513"
                                  : "#721c24"
                                : "#dc3545",
                            fontSize: "0.6rem",
                            mt: 0.25,
                          }}
                        >
                          {dayType === mealType ? "Allowed" : "Not Allowed"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          }
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="plan-select-label">Select Meal</InputLabel>
            <Select
              labelId="plan-select-label"
              value={option}
              label="Select Plan"
              open={selectOpen}
              onOpen={() => {
                setSelectOpen(true);
                setSearchTerm("");
              }}
              onClose={() => setSelectOpen(false)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    overflowY: "auto",
                  },
                },
                MenuListProps: {
                  component: "div",
                  style: { padding: 0 },
                },
              }}
              onChange={(e) => {
                setOption(e.target.value);
                setSelectOpen(false);
              }}
            >
              {/* Search Input with auto-focus */}
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  bgcolor: "white",
                  p: 1,
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="Search meals... (start typing)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </Box>

              {/* Menu Items */}
              {getFilteredAndSortedSessions().length === 0 ? (
                <MenuItem
                  disabled
                  sx={{ justifyContent: "center", color: "text.secondary" }}
                >
                  No meals found
                </MenuItem>
              ) : (
                getFilteredAndSortedSessions().map((session) => {
                  const vegNonVegStyle = getVegNonVegColor(session.vegNonVeg);
                  const vegNonVegIcon = getVegNonVegIcon(session.vegNonVeg);

                  return (
                    <MenuItem
                      key={session.sessionId}
                      value={session.sessionId}
                      sx={{
                        ...vegNonVegStyle,
                        borderRadius: "4px",
                        margin: "2px",
                        "&:hover": {
                          opacity: 0.8,
                          transform: "scale(0.98)",
                        },
                        "&.Mui-selected": {
                          fontWeight: "bold",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        },
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ fontSize: "12px", marginRight: "8px" }}>
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
                          {session.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.8, fontSize: "0.7rem" }}
                        >
                          {session.vegNonVeg} • {session.type}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })
              )}
            </Select>
          </FormControl>
          {/* Confirm Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            fullWidth
            disabled={!option || !date}
          >
            Confirm
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

export default AddNutrition;
