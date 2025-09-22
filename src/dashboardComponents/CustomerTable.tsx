import { useContext, useEffect, useRef, useState } from "react";
import { Customers_Api_call, DataContext } from "../store/DataContext";
import "./CustomerTable.css";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import { useApiCalls } from "../store/axios";
import {
  Button,
  CircularProgress,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { SearchIcon } from "lucide-react";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  EmojiFoodBeverage,
  Fastfood,
  Password,
  People,
  Restaurant,
} from "@mui/icons-material";
import Modal from "./Modal";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputLabel,
  FormControl,
  Box,
  Paper,
  Grid,
  Divider,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhoneIcon from "@mui/icons-material/Phone";
import HeightIcon from "@mui/icons-material/Height";
import MonitorWeightIcon from "@mui/icons-material/MonitorWeight";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import { API_BASE_URL, API_BASE_URL2 } from "../store/axios";
import React from "react";

const actions = ["Edit profile", "See plan", "Take Assessment", "Go to chat"];

interface ActionsContainerProps {
  takeAssessment: () => void;
  seePlan: () => void;
  editProfile: () => void;
  goToChat: () => void;
}

const ActionsContainer = ({
  takeAssessment,
  seePlan,
  editProfile,
  goToChat,
}: ActionsContainerProps) => {
  const [value, setValue] = useState("Go to profile");

  const changeHandler = (event: SelectChangeEvent) => {
    const selectedAction = event.target.value;
    console.log("Action selected:", selectedAction);

    // Don't update the display value, keep it as "Go to profile"
    setValue("Go to profile");

    if (selectedAction === "Take Assessment") {
      takeAssessment();
    } else if (selectedAction === "See plan") {
      seePlan();
    } else if (selectedAction === "Edit profile") {
      editProfile();
    } else if (selectedAction === "Go to chat") {
      goToChat();
    }
  };

  return (
    <Select
      value={value}
      size="small"
      sx={{
        bgcolor: "#0070FF",
        color: "white",
        fontSize: "0.75rem",
        minHeight: "20px", // Fixed height
        width: "120px", // Fixed width
        ".MuiSelect-select": {
          padding: "6px 32px 6px 12px !important", // Proper padding for arrow space
          minHeight: "auto",
          display: "flex",
          alignItems: "center",
          fontSize: "0.75rem",
          lineHeight: 1.2,
        },
        ".MuiSelect-icon": {
          color: "white",
          right: "8px", // Proper arrow positioning
          fontSize: "20px", // Ensure arrow is visible but not too large
        },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "white",
        },
      }}
      onChange={changeHandler}
    >
      <MenuItem value="Go to profile" style={{ display: "none" }}>
        Go to profile
      </MenuItem>
      {actions.map((action) => (
        <MenuItem key={action} value={action}>
          {action}
        </MenuItem>
      ))}
    </Select>
  );
};

interface FormFieldWithIconProps {
  Icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}

const FormFieldWithIcon = React.memo<FormFieldWithIconProps>(
  ({ Icon, label, children }) => (
    <Box sx={{ mb: 0.2 }}>
      {" "}
      {/* Changed from mb: 0.8 to mb: 0.2 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 0.1 }}>
        {" "}
        {/* Changed from mb: 0.2 to mb: 0.1 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 12,
            height: 12,
            mr: 0.4,
            color: "#1976d2",
          }}
        >
          <Icon sx={{ fontSize: "12px" }} />
        </Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 500, color: "#333", fontSize: "0.65rem" }}
        >
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  )
);

const CustomerTable = () => {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const defaultWeeklyPlan = {
    MON: 0,
    TUE: 0,
    WED: 0,
    THU: 0,
    FRI: 0,
    SAT: 0,
    SUN: 0,
  };

  const mealTypes = [
    { value: 0, label: "Veg", icon: <Restaurant fontSize="small" /> },
    { value: 1, label: "Egg", icon: <EmojiFoodBeverage fontSize="small" /> },
    { value: 2, label: "Non Veg", icon: <Fastfood fontSize="small" /> },
  ];

  const { setSelectComponent, customers_Api_call } = useContext(DataContext);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserIDs, setSelectedUserIDs] = useState<Array<string>>([]);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [currentWeeklyPlan, setCurrentWeeklyPlan] = useState(defaultWeeklyPlan);
  const [isCreatingWeekly, setIsCreatingWeekly] = useState(false);
  const [isCreateWeeklySaved, setIsCreateWeeklySaved] = useState(false);
  const [isEditWeeklySaved, setIsEditWeeklySaved] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    dob: "",
    gender: "",
    mobile: "",
    email: "",
    password: "",
    type: "",
    height: "",
    weight: "",
    healthCondition: "",
    membershipType: "",
    startDate: "",
    endDate: "",
    assignedRM: "",
    nutritionKYC: defaultWeeklyPlan,
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    age: "",
    dob: "",
    gender: "",
    mobile: "",
    email: "",
    password: "",
    type: "",
    height: "",
    weight: "",
    healthCondition: "",
    membershipType: "",
    startDate: "",
    endDate: "",
    assignedRM: "",
    nutritionKYC: defaultWeeklyPlan,
  });

  const fetchAdminUsers = async () => {
    setLoadingAdmins(true);
    try {
      // Fetch both admin and RM users in parallel
      const [adminResponse, rmResponse] = await Promise.all([
        fetch(`${API_BASE_URL2}/human/all?type=admin`), // Fetch admins
        fetch(`${API_BASE_URL2}/human/all?type=RM`), // Fetch RMs
      ]);

      const adminData = await adminResponse.json();
      const rmData = await rmResponse.json();

      // Add correct type property to each user
      const adminUsers = adminData.map((user: any) => ({
        ...user,
        userType: "admin", // Correctly label as admin
      }));
      const rmUsers = rmData.map((user: any) => ({
        ...user,
        userType: "RM", // Correctly label as RM
      }));

      // Combine both arrays
      const combinedUsers = [...adminUsers, ...rmUsers];
      setAdminUsers(combinedUsers);
    } catch (error) {
      console.error("Failed to fetch admin users:", error);
      enqueueSnackbar("Failed to load admin users", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Function to calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return "";

    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age.toString();
  };

  //changed to handle new form data
  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const newData = { ...prevData, [name]: value };

      // Auto-calculate age when DOB changes
      if (name === "dob") {
        newData.age = calculateAge(value);
      }

      // Auto-calculate end date when start date or membership type changes
      if (name === "startDate" || name === "membershipType") {
        const endDate = calculateEndDate(
          name === "startDate" ? value : newData.startDate,
          name === "membershipType" ? value : newData.membershipType
        );
        newData.endDate = endDate;
      }

      return newData;
    });
  };

  const handleEditInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;

    setEditFormData((prevData) => {
      const newData = { ...prevData, [name]: value };

      // Auto-calculate age when DOB changes
      if (name === "dob") {
        newData.age = calculateAge(value);
      }

      // Auto-calculate end date when start date or membership type changes
      if (name === "startDate" || name === "membershipType") {
        const endDate = calculateEndDate(
          name === "startDate" ? value : newData.startDate,
          name === "membershipType" ? value : newData.membershipType
        );
        newData.endDate = endDate;
      }

      return newData;
    });
  };

  const assignUserToRM = async (
    rmId: string,
    userId: string,
    silent = false,
    suppressError = false
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL2}/human/rm/assignusers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rmId, userIds: [userId] }),
      });

      if (!res.ok) throw new Error("Failed to assign user to RM");

      if (!silent) {
        enqueueSnackbar("Successfully assigned user to RM", {
          variant: "success",
          autoHideDuration: 3000,
        });
      }
    } catch (e) {
      if (!silent && !suppressError) {
        enqueueSnackbar("Failed to assign user to RM", {
          variant: "error",
          autoHideDuration: 3000,
        });
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Convert numeric fields
    const payload = {
      ...formData,
      age: Number(formData.age),
      height: Number(formData.height) || null,
      weight: Number(formData.weight) || null,
      healthCondition: formData.healthCondition || null,
      nutritionKYC: formData.nutritionKYC,
    };
    const phoneRegex = /^[0-9]{10}$/; // 10-digit numeric only
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(payload.mobile)) {
      enqueueSnackbar("Invalid phone number. It should be 10 digits.", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    if (!emailRegex.test(payload.email)) {
      enqueueSnackbar("Invalid email address.", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    console.log(payload, "payload");

    const res = await customer_creation(payload); // assuming this returns a promise
    if (res) {
      if (formData.assignedRM) {
        // The user ID should be available in res.data.userId based on your customer_creation function
        await assignUserToRM(formData.assignedRM, res.userId);
      }
      setModalOpen(false);
      setIsCreateWeeklySaved(false);
      // Clear the form by resetting formData to initial empty values
      setFormData({
        name: "",
        dob: "",
        age: "",
        gender: "",
        mobile: "",
        email: "",
        password: "",
        type: "",
        height: "",
        weight: "",
        healthCondition: "",
        membershipType: "",
        startDate: "",
        endDate: "",
        assignedRM: "",
        nutritionKYC: defaultWeeklyPlan,
      });
    }
    // Optionally, reset form fields here
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Convert numeric fields
    const payload = {
      ...editFormData,
      age: Number(editFormData.age),
      height: Number(editFormData.height) || null,
      weight: Number(editFormData.weight) || null,
      healthCondition: editFormData.healthCondition || null,
      nutritionKYC: editFormData.nutritionKYC,
    };

    console.log("Edit payload:", payload);
    const res = await patch_customer(editingCustomer.userId, payload);
    if (res && editFormData.assignedRM !== editingCustomer.assignedRM) {
      await assignUserToRM(
        editFormData.assignedRM,
        editingCustomer.userId,
        false,
        true
      ); // Pass suppressError as true
    }
    setEditModalOpen(false);
    setIsEditWeeklySaved(false);
    setEditingCustomer(null);
    // Clear the edit form
    setEditFormData({
      name: "",
      dob: "",
      age: "",
      gender: "",
      mobile: "",
      email: "",
      password: "",
      type: "",
      height: "",
      weight: "",
      healthCondition: "",
      membershipType: "",
      startDate: "",
      endDate: "",
      assignedRM: "",
      nutritionKYC: defaultWeeklyPlan,
    });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData((prev) => ({ ...prev, nutritionKYC: defaultWeeklyPlan }));
    setIsCreateWeeklySaved(false);
  };
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingCustomer(null);
    setEditFormData({
      name: "",
      age: "",
      dob: "",
      gender: "",
      mobile: "",
      email: "",
      password: "",
      type: "",
      height: "",
      weight: "",
      healthCondition: "",
      membershipType: "",
      startDate: "",
      endDate: "",
      assignedRM: "",
      nutritionKYC: defaultWeeklyPlan,
    });
    setIsEditWeeklySaved(false);
  };

  const {
    customers_fetching,
    customer_creation,
    patch_user,
    patch_customer,
    getPlanInstanceByPlanID,
  } = useApiCalls();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await customers_fetching();
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const assessmentHandler = (customer: Customers_Api_call) => {
    localStorage.setItem("user", JSON.stringify(customer));
    setSelectComponent("assessment");
  };

  const seePlanHandler = (customer: Customers_Api_call) => {
    localStorage.setItem("user", JSON.stringify(customer));
    setSelectComponent("seePlan");
  };

  const goToChatHandler = (customer: Customers_Api_call) => {
    localStorage.setItem("user", JSON.stringify(customer));
    setSelectComponent("goToChat");
  };

  const editProfileHandler = (customer: Customers_Api_call) => {
    console.log("Edit profile clicked for customer:", customer);
    setEditingCustomer(customer);
    // Pre-fill the edit form with customer data
    const dobValue = customer.dob
      ? new Date(customer.dob + "Z").toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        })
      : "";
    setEditFormData({
      name: customer.name || "",
      dob: dobValue || "",
      age: customer.age?.toString() || "",
      gender: customer.gender || "",
      mobile: customer.mobile || "",
      email: customer.email || "",
      password: customer.password || "",
      type: customer.type || "",
      height: customer.height?.toString() || "",
      weight: customer.weight?.toString() || "",
      healthCondition: customer.healthCondition || "",
      membershipType: customer.membershipType || "",
      startDate: customer.startDate || "",
      endDate: customer.endDate || "",
      assignedRM: customer.assignedRM || "",
      nutritionKYC: customer.nutritionKYC || defaultWeeklyPlan,
    });
    console.log("Opening edit modal");
    setEditModalOpen(true);
  };

  const dateChangeHandler = (date: any) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const generateColumns = () => {
    return [
      { field: "no", headerName: "SI.No" },
      { field: "name", headerName: "Name" },
      { field: "age", headerName: "Age" },
      { field: "gender", headerName: "Gender" },
      { field: "email", headerName: "Email" },
      { field: "joinedOn", headerName: "Joined On" },
      { field: "endsOn", headerName: "Ends On" },
      { field: "phoneNumber", headerName: "Phone Number" },
      { field: "memberShip", headerName: "Membership" },
      { field: "lastAssessedOn", headerName: "Last Assessed On" },
      {
        field: "action",
        headerName: "",
        renderCell: (params: any) => (
          <ActionsContainer
            takeAssessment={() => assessmentHandler(params.row.customerData)}
            seePlan={() => seePlanHandler(params.row.customerData)}
            editProfile={() => editProfileHandler(params.row.customerData)}
            goToChat={() => goToChatHandler(params.row.customerData)}
          />
        ),
      },
    ];
  };

  const generateRows = async () => {
    const rows = await Promise.all(
      customers_Api_call.map(async (customer: any, i: any) => {
        const plan = "-";

        return {
          no: i + 1,
          id: customer.userId,
          name: customer.name,
          age: customer.age,
          gender: customer.gender || "-",
          email: customer.email || "-",
          joinedOn: dateChangeHandler(customer.createdOn),
          endsOn: dateChangeHandler(customer.createdOn),
          phoneNumber: customer.mobile || "-",
          memberShip: customer.membershipType,
          lastAssessedOn: customer.lastAssessed || "-",
          customerData: customer,
        };
      })
    );

    return rows;
  };

  const formatColumns = (columns: GridColDef[]) => {
    const width = ref.current?.clientWidth || 900;
    return columns.map((col) => {
      if (col.field === "no") {
        return { ...col, width: 70, headerAlign: "center", align: "center" };
      }
      if (col.field === "action") {
        return { ...col, width: 150, headerAlign: "center", align: "center" };
      }
      if (col.field === "gender") {
        return { ...col, width: 100, headerAlign: "center", align: "center" };
      }
      if (col.field === "age") {
        return { ...col, width: 80, headerAlign: "center", align: "center" };
      }
      return {
        ...col,
        flex: 1,
        headerAlign: "left",
        align: "left",
      };
    });
  };

  useEffect(() => {
    if (!ref.current) return;

    const fetchData = async () => {
      const _rows = await generateRows();
      const _columns = formatColumns(generateColumns());

      setRows(_rows);
      setFilteredRows(_rows);
      setColumns(_columns);
    };

    fetchData();
  }, [customers_Api_call]);

  useEffect(() => {
    const lowerTerm = term.toLowerCase();
    const filtered = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(lowerTerm) ||
        row.phoneNumber?.includes(lowerTerm) ||
        row.memberShip?.toLowerCase().includes(lowerTerm) ||
        row.email?.toLowerCase().includes(lowerTerm) ||
        row.gender?.toLowerCase().includes(lowerTerm)
    );
    setFilteredRows(filtered);
  }, [term, rows]);

  useEffect(() => {
    if (!selectedDate) {
      setFilteredRows(rows);
      return;
    }

    const targetDate = new Date(selectedDate).toDateString();

    const filtered = rows.filter((row) => {
      const rowDate = new Date(row.joinedOn).toDateString();
      return rowDate === targetDate;
    });

    setFilteredRows(filtered);
  }, [selectedDate, rows]);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      filteredRows
        .map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleModal = () => {
    setModalOpen(true);
  };

  const handleDeactivate = async () => {
    if (selectedUserIDs.length === 0 || !selectedUserIDs.ids) {
      enqueueSnackbar("Please select at least one user to deactivate.", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    try {
      const selectedIdsArray = Array.from(selectedUserIDs.ids);
      await Promise.all(selectedIdsArray.map((id) => patch_user(id)));
      enqueueSnackbar("user deactivated successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });
      customers_fetching();
      console.log("All users deactivated successfully.");
    } catch (error) {
      console.error("Deactivation failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <CircularProgress style={{ color: "#1976d2" }} />
      </div>
    );
  }

  const neverAssessedCount = rows.filter(
    (row) => !row.lastAssessedOn || row.lastAssessedOn === "-"
  ).length;

  // enddate calculation
  const calculateEndDate = (
    startDate: string | number | Date,
    membershipType: string
  ) => {
    if (!startDate || !membershipType) return "";

    const start = new Date(startDate);
    const endDate = new Date(start);

    switch (membershipType.toLowerCase()) {
      case "basic":
        endDate.setMonth(start.getMonth() + 1);
        break;
      case "premium":
        endDate.setMonth(start.getMonth() + 3);
        break;
      case "vip":
        endDate.setMonth(start.getMonth() + 6);
        break;
      default:
        return "";
    }

    return endDate.toISOString().split("T")[0];
  };

  const getWeeklyPlanSummary = (
    plan: { [s: string]: unknown } | ArrayLike<unknown>
  ) => {
    const dayLabels = {
      MON: "Mon",
      TUE: "Tue",
      WED: "Wed",
      THU: "Thu",
      FRI: "Fri",
      SAT: "Sat",
      SUN: "Sun",
    };
    const valueLabels = { 0: "Veg", 1: "Egg", 2: "Non Veg" };

    return Object.entries(plan)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([day, value]) => `${dayLabels[day]}: ${valueLabels[value]}`)
      .join(", ");
  };

  // Custom Form Field Component
  // Compact Form Field Component
  // Memoized FormFieldWithIcon component to prevent re-renders
  // const FormFieldWithIcon = React.memo(({ Icon, label, children }) => (
  //   <Box sx={{ mb: 0.8 }}>
  //     <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.2 }}>
  //       <Box sx={{
  //         display: 'flex',
  //         alignItems: 'center',
  //         justifyContent: 'center',
  //         width: 12,
  //         height: 12,
  //         mr: 0.4,
  //         color: '#1976d2'
  //       }}>
  //         <Icon sx={{ fontSize: '12px' }} />
  //       </Box>
  //       <Typography variant="caption" sx={{ fontWeight: 500, color: '#333', fontSize: '0.65rem' }}>
  //         {label}
  //       </Typography>
  //     </Box>
  //     {children}
  //   </Box>
  // ));

  return (
    <>
      <div className="customer-dashboard-outlay-container">
        <div className="--side-bar"></div>
        <div className="customer-dashboard-container" ref={ref}>
          <div className="customer-dashboard-main-table-container">
            <div className="customer-dashboard-main-top-filter-container">
              <div className="customer-dashboard-search-container">
                <TextField
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="Search by name, mobile or membership..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      fontSize: "1rem",
                      "& input": { py: 1.5, px: 1.5 },
                      "&:hover fieldset": { borderColor: "#1976d2" },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              <div className="customer-dashboard-filter-container">
                <div className="--add-customer">
                  <People className="text-green-700" />
                  <button className="text-green-700" onClick={handleModal}>
                    Add New Customer
                  </button>
                </div>
                <div className="--date">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      value={selectedDate}
                      onChange={(newDate) => setSelectedDate(newDate)}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: { maxWidth: 150, fontSize: "0.8rem" },
                        },
                      }}
                      label="Joined On"
                    />
                  </LocalizationProvider>
                </div>
                <div className="--delete">
                  <Button
                    onClick={handleDeactivate}
                    variant="outlined"
                    color="error"
                    sx={{
                      padding: "5px 12px",
                      border: "1.3px solid rgba(0,0,0,0.15)",
                    }}
                    startIcon={<DeleteIcon />}
                    size="small"
                  >
                    Deactivate
                  </Button>
                </div>
                <div className="--export">
                  <Button
                    onClick={handleExport}
                    variant="outlined"
                    sx={{
                      padding: "5px 12px",
                      background: "#FFFFFF",
                      color: "rgba(0, 0, 0, 0.8)",
                      border: "1.3px solid rgba(0,0,0,0.15)",
                    }}
                    startIcon={<FileDownloadIcon />}
                    size="small"
                  >
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>
            <div className="customer-dashboard-table">
              <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSizeOptions={[5, 10]}
                checkboxSelection
                sx={{
                  border: 0,
                  // Use proper MUI DataGrid row height configuration
                  "& .MuiDataGrid-row": {
                    minHeight: "40px !important", // Reduced height
                    maxHeight: "40px !important",
                  },
                  "& .MuiDataGrid-cell": {
                    padding: "8px 10px", // Reduced padding
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 1.3,
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    minHeight: "40px !important", // Reduced header height
                  },
                  "& .MuiDataGrid-columnHeader": {
                    padding: "8px 6px",
                  },
                  // Ensure smooth scrolling performance
                  "& .MuiDataGrid-virtualScroller": {
                    // Remove any height constraints that might break virtualization
                  },
                  "& .MuiDataGrid-virtualScrollerContent": {
                    width: "100%",
                  },
                  // Action column specific styling
                  '& .MuiDataGrid-cell[data-field="action"]': {
                    justifyContent: "center",
                    padding: "4px 8px",
                  },
                }}
                onRowSelectionModelChange={(ids) => setSelectedUserIDs(ids)}
                // Add these performance optimizations
                rowHeight={44} // Reduced row height
                columnHeaderHeight={40} // Reduced header height
                disableRowSelectionOnClick
                disableColumnMenu
                disableColumnSelector
                disableDensitySelector
              />
            </div>
          </div>
        </div>

        {/* ---------- ADD CUSTOMER MODAL ---------- */}
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              height: "80vh",
              maxHeight: "80vh",
              m: 1,
              width: "65%",
              maxWidth: "1000px",
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#f8f9fa",
              py: 0.8,
              px: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: "#1976d2", fontSize: "1rem" }}
              >
                Create New Customer
              </Typography>
              <IconButton
                aria-label="close"
                onClick={handleCloseModal}
                size="small"
                sx={{ color: "#666" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent
            sx={{
              p: 0,
              bgcolor: "#fafafa",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              component="form"
              id="create-customer-form"
              onSubmit={handleFormSubmit}
              sx={{
                height: "100%",
                display: "flex",
                flex: 1,
                overflow: "hidden",
              }}
            >
              {/* LEFT PANEL */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  bgcolor: "white",
                  borderRight: "1px solid #e0e0e0",
                  borderRadius: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderBottom: "1px solid #1976d2",
                    bgcolor: "#f8f9fa",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "#1976d2",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <PersonIcon sx={{ fontSize: "12px" }} /> Personal Info
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.2,
                    flex: 1,
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 0.2,
                    alignContent: "start",
                  }}
                >
                  <FormFieldWithIcon Icon={PersonIcon} label="Full Name">
                    <TextField
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      size="small"
                      placeholder="Enter full name"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          "& input": { py: 0.2, px: 0.8 },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </FormFieldWithIcon>
                  <FormFieldWithIcon Icon={EmailIcon} label="Email">
                    <TextField
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      placeholder="Enter email"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          "& input": { py: 0.5, px: 0.8 },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </FormFieldWithIcon>
                  <FormFieldWithIcon Icon={LockIcon} label="Password">
                    <TextField
                      name="password"
                      type="text"
                      value={formData.password}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      placeholder="Enter password"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          "& input": { py: 0.5, px: 0.8 },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </FormFieldWithIcon>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon
                      Icon={CalendarTodayIcon}
                      label="Date of Birth"
                    >
                      <TextField
                        name="dob"
                        type="date"
                        value={formData.dob}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        required
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                    <FormFieldWithIcon Icon={CalendarTodayIcon} label="Age">
                      <TextField
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        InputProps={{ readOnly: true }}
                        required
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon Icon={PersonIcon} label="Gender">
                      <FormControl fullWidth required size="small">
                        <Select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          sx={{
                            borderRadius: 1,
                            fontSize: "0.8rem",
                            "& .MuiSelect-select": { py: 0.6 },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#1976d2",
                            },
                          }}
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </FormFieldWithIcon>
                    <FormFieldWithIcon Icon={PhoneIcon} label="Mobile">
                      <TextField
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        fullWidth
                        size="small"
                        placeholder="10-digit mobile"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                  </Box>
                </Box>
              </Paper>

              {/* RIGHT PANEL */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  bgcolor: "white",
                  borderRadius: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderBottom: "1px solid #1976d2",
                    bgcolor: "#f8f9fa",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "#1976d2",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <BusinessCenterIcon sx={{ fontSize: "12px" }} />{" "}
                    Professional & Health
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    flex: 1,
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 1,
                    alignContent: "start",
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon Icon={HeightIcon} label="Height (cm)">
                      <TextField
                        name="height"
                        type="number"
                        value={formData.height}
                        onChange={handleInputChange}
                        fullWidth
                        size="small"
                        placeholder="Height"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                    <FormFieldWithIcon
                      Icon={MonitorWeightIcon}
                      label="Weight (kg)"
                    >
                      <TextField
                        name="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={handleInputChange}
                        fullWidth
                        size="small"
                        placeholder="Weight"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                  </Box>
                  <FormFieldWithIcon
                    Icon={LocalHospitalIcon}
                    label="Health Condition"
                  >
                    <TextField
                      name="healthCondition"
                      value={formData.healthCondition}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      placeholder="Health conditions"
                      multiline
                      rows={1.5}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          "& textarea": { py: 0.5, px: 0.8 },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </FormFieldWithIcon>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon Icon={BusinessCenterIcon} label="Type">
                      <FormControl fullWidth required size="small">
                        <Select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          sx={{
                            borderRadius: 1,
                            fontSize: "0.8rem",
                            "& .MuiSelect-select": { py: 0.6 },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#1976d2",
                            },
                          }}
                        >
                          <MenuItem value="forge">Forge</MenuItem>
                          <MenuItem value="play">Play</MenuItem>
                          <MenuItem value="coach_wellness">
                            COACH WELLNESS
                          </MenuItem>
                          <MenuItem value="coach_fitness">
                            COACH FITNESS
                          </MenuItem>
                          <MenuItem value="coach_sports">COACH SPORTS</MenuItem>
                          <MenuItem value="employee">EMPLOYEE</MenuItem>
                          <MenuItem value="other">OTHERS</MenuItem>
                        </Select>
                      </FormControl>
                    </FormFieldWithIcon>
                    <FormFieldWithIcon
                      Icon={CardMembershipIcon}
                      label="Membership"
                    >
                      <FormControl fullWidth size="small">
                        <Select
                          name="membershipType"
                          value={formData.membershipType}
                          onChange={handleInputChange}
                          sx={{
                            borderRadius: 1,
                            fontSize: "0.8rem",
                            "& .MuiSelect-select": { py: 0.6 },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#1976d2",
                            },
                          }}
                        >
                          <MenuItem value="premium">PREMIUM</MenuItem>
                          <MenuItem value="basic">BASIC</MenuItem>
                          <MenuItem value="vip">VIP</MenuItem>
                        </Select>
                      </FormControl>
                    </FormFieldWithIcon>
                  </Box>
                  <FormFieldWithIcon
                    Icon={SupervisorAccountIcon}
                    label="Assign RM"
                  >
                    <FormControl fullWidth size="small">
                      <Select
                        name="assignedRM"
                        value={formData.assignedRM}
                        onChange={handleInputChange}
                        disabled={loadingAdmins}
                        sx={{
                          borderRadius: 1,
                          fontSize: "0.8rem",
                          "& .MuiSelect-select": { py: 0.6 },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#1976d2",
                          },
                        }}
                      >
                        {adminUsers.map((admin) => (
                          <MenuItem key={admin.userId} value={admin.userId}>
                            {admin.name} ({admin.userType})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </FormFieldWithIcon>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon
                      Icon={CalendarTodayIcon}
                      label="Start Date"
                    >
                      <TextField
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        required
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                    <FormFieldWithIcon
                      Icon={CalendarTodayIcon}
                      label="End Date"
                    >
                      <TextField
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                  </Box>
                  <FormFieldWithIcon Icon={Restaurant} label="Meal Plan">
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setCurrentWeeklyPlan(formData.nutritionKYC);
                          setIsCreatingWeekly(true);
                          setWeeklyModalOpen(true);
                        }}
                        sx={{
                          borderRadius: 1,
                          textTransform: "none",
                          borderColor: "#1976d2",
                          color: "#1976d2",
                          fontSize: "0.7rem",
                          py: 0.4,
                          minHeight: "auto",
                          "&:hover": { bgcolor: "#1976d2", color: "white" },
                        }}
                      >
                        Configure Meal Plan
                      </Button>
                      {isCreateWeeklySaved &&
                        getWeeklyPlanSummary(formData.nutritionKYC) && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#666",
                              p: 0.5,
                              bgcolor: "#f0f8ff",
                              borderRadius: 0.5,
                              fontSize: "0.65rem",
                              lineHeight: 1.2,
                            }}
                          >
                            {getWeeklyPlanSummary(formData.nutritionKYC)}
                          </Typography>
                        )}
                    </Box>
                  </FormFieldWithIcon>
                </Box>
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "space-between",
              p: 1,
              borderTop: "1px solid #e0e0e0",
              bgcolor: "#f8f9fa",
              flexShrink: 0,
            }}
          >
            <Button
              onClick={handleCloseModal}
              size="small"
              sx={{
                color: "#666",
                textTransform: "none",
                fontSize: "0.8rem",
                "&:hover": { bgcolor: "#f0f0f0" },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              form="create-customer-form"
              size="small"
              sx={{
                textTransform: "none",
                px: 2,
                fontSize: "0.8rem",
                borderRadius: 1,
                boxShadow: "0 2px 8px rgba(25,118,210,0.3)",
              }}
            >
              Create Customer
            </Button>
          </DialogActions>
        </Dialog>

        {/* ---------- EDIT CUSTOMER MODAL ---------- */}
        <Dialog
          open={editModalOpen}
          onClose={handleCloseEditModal}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              height: "80vh",
              maxHeight: "80vh",
              m: 1,
              width: "65%",
              maxWidth: "1000px",
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid #e0e0e0",
              bgcolor: "#f8f9fa",
              py: 0.8,
              px: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: "#1976d2", fontSize: "1rem" }}
              >
                Edit Customer
              </Typography>
              <IconButton
                aria-label="close"
                onClick={handleCloseEditModal}
                size="small"
                sx={{ color: "#666" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent
            sx={{
              p: 0,
              bgcolor: "#fafafa",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              component="form"
              id="edit-customer-form"
              onSubmit={handleEditFormSubmit}
              sx={{
                height: "100%",
                display: "flex",
                flex: 1,
                overflow: "hidden",
              }}
            >
              {/* LEFT PANEL */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  bgcolor: "white",
                  borderRight: "1px solid #e0e0e0",
                  borderRadius: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderBottom: "1px solid #1976d2",
                    bgcolor: "#f8f9fa",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "#1976d2",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <PersonIcon sx={{ fontSize: "12px" }} /> Personal Info
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.2,
                    flex: 1,
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 0.8,
                    alignContent: "start",
                  }}
                >
                  <FormFieldWithIcon Icon={PersonIcon} label="Full Name">
                    <TextField
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      required
                      fullWidth
                      size="small"
                      placeholder="Enter full name"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          "& input": { py: 0.5, px: 0.8 },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </FormFieldWithIcon>
                  <FormFieldWithIcon Icon={EmailIcon} label="Email">
                    <TextField
                      name="email"
                      type="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      fullWidth
                      size="small"
                      placeholder="Enter email"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          "& input": { py: 0.5, px: 0.8 },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </FormFieldWithIcon>
                  <FormFieldWithIcon Icon={LockIcon} label="Password">
                    <TextField
                      name="password"
                      type="text"
                      value={editFormData.password}
                      onChange={handleEditInputChange}
                      fullWidth
                      size="small"
                      placeholder="Enter password"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          "& input": { py: 0.5, px: 0.8 },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </FormFieldWithIcon>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon
                      Icon={CalendarTodayIcon}
                      label="Date of Birth"
                    >
                      <TextField
                        name="dob"
                        type="date"
                        value={editFormData.dob}
                        onChange={handleEditInputChange}
                        InputLabelProps={{ shrink: true }}
                        required
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                    <FormFieldWithIcon Icon={CalendarTodayIcon} label="Age">
                      <TextField
                        type="number"
                        name="age"
                        value={editFormData.age}
                        onChange={handleEditInputChange}
                        InputProps={{ readOnly: true }}
                        required
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon Icon={PersonIcon} label="Gender">
                      <FormControl fullWidth required size="small">
                        <Select
                          name="gender"
                          value={editFormData.gender}
                          onChange={handleEditInputChange}
                          sx={{
                            borderRadius: 1,
                            fontSize: "0.8rem",
                            "& .MuiSelect-select": { py: 0.6 },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#1976d2",
                            },
                          }}
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </FormFieldWithIcon>
                    <FormFieldWithIcon Icon={PhoneIcon} label="Mobile">
                      <TextField
                        name="mobile"
                        value={editFormData.mobile}
                        onChange={handleEditInputChange}
                        fullWidth
                        size="small"
                        placeholder="10-digit mobile"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                  </Box>
                </Box>
              </Paper>

              {/* RIGHT PANEL */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  bgcolor: "white",
                  borderRadius: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderBottom: "1px solid #1976d2",
                    bgcolor: "#f8f9fa",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "#1976d2",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <BusinessCenterIcon sx={{ fontSize: "12px" }} />{" "}
                    Professional & Health
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    flex: 1,
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 1,
                    alignContent: "start",
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon Icon={HeightIcon} label="Height (cm)">
                      <TextField
                        name="height"
                        type="number"
                        value={editFormData.height}
                        onChange={handleEditInputChange}
                        fullWidth
                        size="small"
                        placeholder="Height"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                    <FormFieldWithIcon
                      Icon={MonitorWeightIcon}
                      label="Weight (kg)"
                    >
                      <TextField
                        name="weight"
                        type="number"
                        step="0.1"
                        value={editFormData.weight}
                        onChange={handleEditInputChange}
                        fullWidth
                        size="small"
                        placeholder="Weight"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                  </Box>
                  <FormFieldWithIcon
                    Icon={LocalHospitalIcon}
                    label="Health Condition"
                  >
                    <TextField
                      name="healthCondition"
                      value={editFormData.healthCondition}
                      onChange={handleEditInputChange}
                      fullWidth
                      size="small"
                      placeholder="Health conditions"
                      multiline
                      rows={1.5}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          "& textarea": { py: 0.5, px: 0.8 },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </FormFieldWithIcon>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon Icon={BusinessCenterIcon} label="Type">
                      <FormControl fullWidth required size="small">
                        <Select
                          name="type"
                          value={editFormData.type}
                          onChange={handleEditInputChange}
                          sx={{
                            borderRadius: 1,
                            fontSize: "0.8rem",
                            "& .MuiSelect-select": { py: 0.6 },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#1976d2",
                            },
                          }}
                        >
                          <MenuItem value="forge">Forge</MenuItem>
                          <MenuItem value="play">Play</MenuItem>
                          <MenuItem value="coach_wellness">
                            COACH WELLNESS
                          </MenuItem>
                          <MenuItem value="coach_fitness">
                            COACH FITNESS
                          </MenuItem>
                          <MenuItem value="coach_sports">COACH SPORTS</MenuItem>
                          <MenuItem value="employee">EMPLOYEE</MenuItem>
                          <MenuItem value="other">OTHERS</MenuItem>
                        </Select>
                      </FormControl>
                    </FormFieldWithIcon>
                    <FormFieldWithIcon
                      Icon={CardMembershipIcon}
                      label="Membership"
                    >
                      <FormControl fullWidth size="small">
                        <Select
                          name="membershipType"
                          value={editFormData.membershipType}
                          onChange={handleEditInputChange}
                          sx={{
                            borderRadius: 1,
                            fontSize: "0.8rem",
                            "& .MuiSelect-select": { py: 0.6 },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#1976d2",
                            },
                          }}
                        >
                          <MenuItem value="premium">PREMIUM</MenuItem>
                          <MenuItem value="basic">BASIC</MenuItem>
                          <MenuItem value="vip">VIP</MenuItem>
                        </Select>
                      </FormControl>
                    </FormFieldWithIcon>
                  </Box>
                  <FormFieldWithIcon
                    Icon={SupervisorAccountIcon}
                    label="Assign RM"
                  >
                    <FormControl fullWidth size="small">
                      <Select
                        name="assignedRM"
                        value={editFormData.assignedRM}
                        onChange={handleEditInputChange}
                        disabled={loadingAdmins}
                        sx={{
                          borderRadius: 1,
                          fontSize: "0.8rem",
                          "& .MuiSelect-select": { py: 0.6 },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#1976d2",
                          },
                        }}
                      >
                        {adminUsers.map((admin) => (
                          <MenuItem key={admin.userId} value={admin.userId}>
                            {admin.name} ({admin.userType})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </FormFieldWithIcon>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <FormFieldWithIcon
                      Icon={CalendarTodayIcon}
                      label="Start Date"
                    >
                      <TextField
                        name="startDate"
                        type="date"
                        value={editFormData.startDate}
                        onChange={handleEditInputChange}
                        InputLabelProps={{ shrink: true }}
                        required
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                    <FormFieldWithIcon
                      Icon={CalendarTodayIcon}
                      label="End Date"
                    >
                      <TextField
                        name="endDate"
                        type="date"
                        value={editFormData.endDate}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            "& input": { py: 0.5, px: 0.8 },
                            "&:hover fieldset": { borderColor: "#1976d2" },
                          },
                        }}
                      />
                    </FormFieldWithIcon>
                  </Box>
                  <FormFieldWithIcon Icon={Restaurant} label="Meal Plan">
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setCurrentWeeklyPlan(editFormData.nutritionKYC);
                          setIsCreatingWeekly(false);
                          setWeeklyModalOpen(true);
                        }}
                        sx={{
                          borderRadius: 1,
                          textTransform: "none",
                          borderColor: "#1976d2",
                          color: "#1976d2",
                          fontSize: "0.7rem",
                          py: 0.4,
                          minHeight: "auto",
                          "&:hover": { bgcolor: "#1976d2", color: "white" },
                        }}
                      >
                        Configure Meal Plan
                      </Button>
                      {isEditWeeklySaved &&
                        getWeeklyPlanSummary(editFormData.nutritionKYC) && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#666",
                              p: 0.5,
                              bgcolor: "#f0f8ff",
                              borderRadius: 0.5,
                              fontSize: "0.65rem",
                              lineHeight: 1.2,
                            }}
                          >
                            {getWeeklyPlanSummary(editFormData.nutritionKYC)}
                          </Typography>
                        )}
                    </Box>
                  </FormFieldWithIcon>
                </Box>
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "space-between",
              p: 1,
              borderTop: "1px solid #e0e0e0",
              bgcolor: "#f8f9fa",
              flexShrink: 0,
            }}
          >
            <Button
              onClick={handleCloseEditModal}
              size="small"
              sx={{
                color: "#666",
                textTransform: "none",
                fontSize: "0.8rem",
                "&:hover": { bgcolor: "#f0f0f0" },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              form="edit-customer-form"
              size="small"
              sx={{
                textTransform: "none",
                px: 2,
                fontSize: "0.8rem",
                borderRadius: 1,
                boxShadow: "0 2px 8px rgba(25,118,210,0.3)",
              }}
            >
              Update Customer
            </Button>
          </DialogActions>
        </Dialog>

        {/* ---------- WEEKLY MEAL PLAN MODAL ---------- */}
        <Dialog
          open={weeklyModalOpen}
          onClose={() => setWeeklyModalOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Weekly Meal Plan
            <IconButton
              aria-label="close"
              onClick={() => setWeeklyModalOpen(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    backgroundColor:
                      Object.values(currentWeeklyPlan).every(
                        (day) => day === 0
                      ) &&
                      Object.values(currentWeeklyPlan).every(
                        (day) => day !== null
                      )
                        ? "#007bff"
                        : "transparent",
                    color:
                      Object.values(currentWeeklyPlan).every(
                        (day) => day === 0
                      ) &&
                      Object.values(currentWeeklyPlan).every(
                        (day) => day !== null
                      )
                        ? "white"
                        : "inherit",
                  }}
                  onClick={() => {
                    const allVeg = days.reduce(
                      (acc, day) => ({ ...acc, [day]: 0 }),
                      {}
                    );
                    setCurrentWeeklyPlan(allVeg);
                  }}
                >
                  All Veg
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    backgroundColor:
                      Object.values(currentWeeklyPlan).every(
                        (day) => day === 2
                      ) &&
                      Object.values(currentWeeklyPlan).every(
                        (day) => day !== null
                      )
                        ? "#007bff"
                        : "transparent",
                    color:
                      Object.values(currentWeeklyPlan).every(
                        (day) => day === 2
                      ) &&
                      Object.values(currentWeeklyPlan).every(
                        (day) => day !== null
                      )
                        ? "white"
                        : "inherit",
                  }}
                  onClick={() => {
                    const allNonVeg = days.reduce(
                      (acc, day) => ({ ...acc, [day]: 2 }),
                      {}
                    );
                    setCurrentWeeklyPlan(allNonVeg);
                  }}
                >
                  All Non-Veg
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    backgroundColor:
                      Object.values(currentWeeklyPlan).every(
                        (day) => day === 1
                      ) &&
                      Object.values(currentWeeklyPlan).every(
                        (day) => day !== null
                      )
                        ? "#007bff"
                        : "transparent",
                    color:
                      Object.values(currentWeeklyPlan).every(
                        (day) => day === 1
                      ) &&
                      Object.values(currentWeeklyPlan).every(
                        (day) => day !== null
                      )
                        ? "white"
                        : "inherit",
                  }}
                  onClick={() => {
                    const allEgg = days.reduce(
                      (acc, day) => ({ ...acc, [day]: 1 }),
                      {}
                    );
                    setCurrentWeeklyPlan(allEgg);
                  }}
                >
                  All Egg
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    backgroundColor:
                      !(
                        Object.values(currentWeeklyPlan).every(
                          (day) => day === 0
                        ) &&
                        Object.values(currentWeeklyPlan).every(
                          (day) => day !== null
                        )
                      ) &&
                      !(
                        Object.values(currentWeeklyPlan).every(
                          (day) => day === 2
                        ) &&
                        Object.values(currentWeeklyPlan).every(
                          (day) => day !== null
                        )
                      ) &&
                      !(
                        Object.values(currentWeeklyPlan).every(
                          (day) => day === 1
                        ) &&
                        Object.values(currentWeeklyPlan).every(
                          (day) => day !== null
                        )
                      ) &&
                      Object.values(currentWeeklyPlan).some(
                        (day) => day !== null
                      )
                        ? "#007bff"
                        : "transparent",
                    color:
                      !(
                        Object.values(currentWeeklyPlan).every(
                          (day) => day === 0
                        ) &&
                        Object.values(currentWeeklyPlan).every(
                          (day) => day !== null
                        )
                      ) &&
                      !(
                        Object.values(currentWeeklyPlan).every(
                          (day) => day === 2
                        ) &&
                        Object.values(currentWeeklyPlan).every(
                          (day) => day !== null
                        )
                      ) &&
                      !(
                        Object.values(currentWeeklyPlan).every(
                          (day) => day === 1
                        ) &&
                        Object.values(currentWeeklyPlan).every(
                          (day) => day !== null
                        )
                      ) &&
                      Object.values(currentWeeklyPlan).some(
                        (day) => day !== null
                      )
                        ? "white"
                        : "inherit",
                  }}
                  onClick={() => {
                    const custom = days.reduce(
                      (acc, day) => ({ ...acc, [day]: null }),
                      {}
                    );
                    setCurrentWeeklyPlan(custom);
                  }}
                >
                  Custom
                </Button>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  p: 2,
                  bgcolor: "#fafafa",
                }}
              >
                {days.map((day) => (
                  <Box key={day} sx={{ textAlign: "left" }}>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#333",
                      }}
                    >
                      {day.charAt(0).toUpperCase() +
                        day.slice(1).substring(0, 2)}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {[0, 1, 2].map((option) => (
                        <Box
                          key={option}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            p: 0.25,
                          }}
                          onClick={() => {
                            setCurrentWeeklyPlan((prev) => ({
                              ...prev,
                              [day]: prev[day] === option ? null : option,
                            }));
                          }}
                        >
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              border: "1px solid #ccc",
                              borderRadius: "2px",
                              mr: 0.75,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor:
                                currentWeeklyPlan[day] === option
                                  ? "#007bff"
                                  : "white",
                              color:
                                currentWeeklyPlan[day] === option
                                  ? "white"
                                  : "transparent",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </Box>
                          <span style={{ userSelect: "none" }}>
                            {option === 0
                              ? "Veg"
                              : option === 2
                              ? "Non-Veg"
                              : "Egg"}
                          </span>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWeeklyModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (isCreatingWeekly) {
                  setFormData((prev) => ({
                    ...prev,
                    nutritionKYC: currentWeeklyPlan,
                  }));
                  setIsCreateWeeklySaved(true);
                } else {
                  setEditFormData((prev) => ({
                    ...prev,
                    nutritionKYC: currentWeeklyPlan,
                  }));
                  setIsEditWeeklySaved(true);
                }
                setWeeklyModalOpen(false);
              }}
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default CustomerTable;
