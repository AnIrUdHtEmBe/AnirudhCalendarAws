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
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { SearchIcon } from "lucide-react";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Password, People } from "@mui/icons-material";
import Modal from "./Modal";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputLabel,
  FormControl,
  Box
} from '@mui/material';
import { enqueueSnackbar } from "notistack";
import CloseIcon from '@mui/icons-material/Close';

const actions = ["Edit profile", "See plan", "Take Assessment"];

interface ActionsContainerProps {
  takeAssessment: () => void;
  seePlan: () => void;
  editProfile: () => void;
}

const ActionsContainer = ({
  takeAssessment,
  seePlan,
  editProfile,
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
        minHeight: "30px",
        ".MuiSelect-icon": { color: "white" },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "white",
        },
      }}
      onChange={changeHandler}
    >
      <MenuItem value="Go to profile" style={{ display: 'none' }}>
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

const CustomerTable = () => {
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

  // console.log("Customers API Call:", customers_Api_call);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    mobile: "",
    email: "",
    password:"",
    type:"",
    height: "",
    weight: "",
    healthCondition: "",
    membershipType: "",
    startDate: "",
    endDate: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    age: "",
    gender: "",
    mobile: "",
    email: "",
    password:"",
    type:"",
    height: "",
    weight: "",
    healthCondition: "",
    membershipType: "",
    startDate: "",
    endDate: "",
  });

  const modalHeaderStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "1.3rem",
    fontWeight: 600,
    color: "#222",
    letterSpacing: "0.02em",
    textAlign: "center",
  };

  const modalFormStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const modalInputStyle: React.CSSProperties = {
    padding: "0.7rem 1rem",
    borderRadius: "7px",
    border: "1px solid #e0e0e0",
    fontSize: "1rem",
    outline: "none",
    background: "#f8f9fa",
  };

  const modalButtonStyle: React.CSSProperties = {
    marginTop: "0.5rem",
    padding: "0.7rem 1rem",
    borderRadius: "7px",
    border: "none",
    background: "#1976d2",
    color: "#fff",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background 0.18s",
  };

  //changed to handle new form data
const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  setFormData(prevData => {
    const newData = { ...prevData, [name]: value };
    
    // Auto-calculate end date when start date or membership type changes
    if (name === 'startDate' || name === 'membershipType') {
      const endDate = calculateEndDate(
        name === 'startDate' ? value : newData.startDate,
        name === 'membershipType' ? value : newData.membershipType
      );
      newData.endDate = endDate;
    }
    
    return newData;
  });
};

const handleEditInputChange = (e) => {
  const { name, value } = e.target;
  
  setEditFormData(prevData => {
    const newData = { ...prevData, [name]: value };
    
    // Auto-calculate end date when start date or membership type changes
    if (name === 'startDate' || name === 'membershipType') {
      const endDate = calculateEndDate(
        name === 'startDate' ? value : newData.startDate,
        name === 'membershipType' ? value : newData.membershipType
      );
      newData.endDate = endDate;
    }
    
    return newData;
  });
};

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Convert numeric fields
    const payload = {
      ...formData,
      age: Number(formData.age),
      height: Number(formData.height) || null ,
      weight: Number(formData.weight) || null,
      healthCondition: formData.healthCondition || null,
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

    console.log(payload,"payload")

    const res=await customer_creation(payload); // assuming this returns a promise
    if(res)
    {
    setModalOpen(false);
      // Clear the form by resetting formData to initial empty values
    setFormData({
      name: "",
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
      height: Number(editFormData.height) || null ,
      weight: Number(editFormData.weight) || null,
      healthCondition: editFormData.healthCondition || null,
    };

    console.log("Edit payload:", payload);
    // TODO: Add edit API call here
    
    setEditModalOpen(false);
    setEditingCustomer(null);
    // Clear the edit form
    setEditFormData({
      name: "",
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
    });
  };

  const handleCloseModal = () => setModalOpen(false);
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingCustomer(null);
    setEditFormData({
      name: "",
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
    });
  };

  const {
    customers_fetching,
    customer_creation,
    patch_user,
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

  const editProfileHandler = (customer: Customers_Api_call) => {
    console.log("Edit profile clicked for customer:", customer);
    setEditingCustomer(customer);
    // Pre-fill the edit form with customer data
    setEditFormData({
      name: customer.name || "",
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
  // console.log(dateChangeHandler("1"),"data")
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
      // { field: "planAllocated", headerName: "Plan Allocated" },
      {
        field: "action",
        headerName: "",
        renderCell: (params: any) => (
          <ActionsContainer
            takeAssessment={() => assessmentHandler(params.row.customerData)}
            seePlan={() => seePlanHandler(params.row.customerData)}
            editProfile={() => editProfileHandler(params.row.customerData)}
          />
        ),
      },
    ];
  };

  // const generateRows = async () => {
    
  //   const rows = await Promise.all(
  //     customers_Api_call.map(async (customer :any, i :any) => {
  //       console.log(customer,"eeee",customer.plansAllocated?.[0])
  //       const plan =  await getPlanInstanceByPlanID(customer.plansAllocated[0]).then(
  //               (plan) => {
  //                 console.log(plan.PlanTemplateName,"hhhhuhhh")
  //                 plan?.PlanTemplateName == "alacartePH" ?  "-" : plan?.PlanTemplateName 
  //               }
  //             )
            
  //           console.log("rrrrr",plan)
  //       // const planInstance = await getPlanInstanceByPlanID(customer.plansAllocated[0]);
  //       // const plan = planInstance?.PlanTemplateName === "alacartePH" 
  //       //   ? "-" 
  //       //   : planInstance?.PlanTemplateName;

  //       //   console.log(plan,"plannnningggsss",plan.PlanTemplateName)

  //       return {
  //         no: i + 1,
  //         id: customer.userId,
  //         name: customer.name,
  //         age: customer.age,
  //         gender: customer.gender || "-",
  //         email: customer.email || "-",
  //         joinedOn: dateChangeHandler(customer.created_on),
  //         phoneNumber: customer.mobile || "-",
  //         memberShip: customer.membershipType,
  //         lastAssessedOn: customer.lastAssessed || "-",
  //         planAllocated: plan ,
  //         customerData: customer,
  //       };
  //     })
  //   );

  //   return rows;
  // };
  const generateRows = async () => {
  const rows = await Promise.all(
    customers_Api_call.map(async (customer: any, i: any) => {
      // console.log(customer, "eeee", customer.plansAllocated?.[0]);

      // const planInstance = await getPlanInstanceByPlanID(customer.plansAllocated?.[customer.plansAllocated.length-1]);

      // const plan = planInstance?.PlanTemplateName === "alacartePH"
      //   ? "-"
      //   : planInstance?.PlanTemplateName;

      const plan='-'
      // console.log("rtrtrtrtrt", planInstance?.PlanTemplateName,customer.name,customer.plansAllocated?.[-1]);
      // console.log(customer.createdOn,"createdzzzzzzzzzz")

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
        // planAllocated: plan,
        customerData: customer,
      };
    })
  );

  return rows;
};

  // console.log(rows,"roweeeees")

  const formatColumns = (columns: GridColDef[]) => {
    const width = ref.current?.clientWidth || 900;
    return columns.map((col) => {
      if (col.field === "no") {
        return { ...col, width: 70, headerAlign: "center", align: "center" };
      }
      if (col.field === "action") {
        return { ...col, width: 150, headerAlign: "center", align: "center" };
      }
      if(col.field === "gender"){
        return {...col , width: 100, headerAlign: "center", align: "center"};
      }
      if(col.field === "age"){
        return {...col , width: 80, headerAlign: "center", align: "center"};
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
      // console.log("console")
      const _rows = await generateRows(); 
      const _columns = formatColumns(generateColumns());

      setRows(_rows);
      setFilteredRows(_rows);
      setColumns(_columns);
    };

    fetchData(); // ✅ Call the async wrapper
  }, [customers_Api_call]);

  useEffect(() => {
    const lowerTerm = term.toLowerCase();
    const filtered = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(lowerTerm) ||
        row.phoneNumber?.includes(lowerTerm) ||
        row.memberShip?.toLowerCase().includes(lowerTerm) || 
        row.email?.toLowerCase().includes(lowerTerm)||
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
      // Use Promise.all to wait for all patch_user requests in parallel
      await Promise.all(selectedIdsArray.map((id) => patch_user(id)));
      enqueueSnackbar("user deactivated successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });
      customers_fetching();
      // Optional: refresh data or show success message
      console.log("All users deactivated successfully.");
    } catch (error) {
      console.error("Deactivation failed:", error);
    }
  };

  // console.log("Selected User IDs:", selectedUserIDs);

  if (isLoading) {
    return (
      <div className="loading-state">
        <CircularProgress style={{ color: "#1976d2" }} />{" "}
        {/* Default MUI blue */}
      </div>
    );
  }
  const neverAssessedCount = rows.filter(
    (row) => !row.lastAssessedOn || row.lastAssessedOn === "-"
  ).length;

  // enddate calculation
  const calculateEndDate = (startDate, membershipType) => {
  if (!startDate || !membershipType) return '';
  
  const start = new Date(startDate);
  const endDate = new Date(start);
  
  switch (membershipType.toLowerCase()) {
    case 'basic':
      endDate.setMonth(start.getMonth() + 1);
      break;
    case 'premium':
      endDate.setMonth(start.getMonth() + 3);
      break;
    case 'vip':
      endDate.setMonth(start.getMonth() + 6);
      break;
    default:
      return '';
  }
  
  // Format date to YYYY-MM-DD for input field
  return endDate.toISOString().split('T')[0];
};

  return (
    <>
    
    <div className="customer-dashboard-outlay-container">
      <div className="--side-bar"></div>
      <div className="customer-dashboard-container" ref={ref}>
        <div className="customer-dashboard-main-table-container">
          <div className="customer-dashboard-main-top-filter-container">
            <div className="customer-dashboard-search-container">
              <TextField
                onChange={(e) => setTerm(e.target.value)}
                variant="outlined"
                size="small"
                placeholder="Search by name, mobile or membership..."
                sx={{ width: 300 }}
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
                <People className="text-green-700"></People>
                <button className="text-green-700" onClick={handleModal}>
                  Add New Customer
                </button>
              </div>
              <div className="--date">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
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
                  onClick={() => handleDeactivate()}
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
              sx={{ border: 0 }}
              onRowSelectionModelChange={(ids) => setSelectedUserIDs(ids)}
            />
          </div>
        </div>
        {/* <div className="customer-dashboard-footer-container">
          <div className="--customer-dashboard-bottom-box">
            <span className="--head">{neverAssessedCount}</span>
            <span className="--tail">Assessment Due</span>
          </div>
          <div className="--customer-dashboard-bottom-box">
            <span className="--head">{rows.length}</span>
            <span className="--tail">Total Customers</span>
          </div>
          <div className="--customer-dashboard-bottom-box">
            <span className="--head">{rows.length}</span>
            <span className="--tail">Total Members</span>
          </div>
        </div> */}
      </div>

      <div>
        {/* Add New Customer Modal */}
        <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
          <DialogTitle>
            Create New Customer
            <IconButton
              aria-label="close"
              onClick={handleCloseModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '70vh',  // adjust height as needed
              p: 0,
            }}
          >
            <Box
              component="form"
              id="create-customer-form"
              onSubmit={handleFormSubmit}
              sx={{
                flex: 1,            // take all vertical space available in DialogContent
                overflowY: 'auto',  // enable vertical scrolling only inside the Box
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {/* Your form inputs */}
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  label="Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="forge">Forge</MenuItem>
                  <MenuItem value="play">Play</MenuItem>
                  <MenuItem value="coach_wellness">COACH WELLNESS</MenuItem>
                  <MenuItem value="coach_fitness">COACH FITNESS</MenuItem>
                  <MenuItem value="coach_sports">COACH SPORTS</MenuItem>
                  <MenuItem value="employee">EMPLOYEE</MenuItem>
                  <MenuItem value="other">OTHERS</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={handleInputChange}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <TextField
                label="Password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleInputChange}
              />
              <FormControl fullWidth>
                <InputLabel>Membership</InputLabel>
                <Select
                  name="membershipType"
                  value={formData.membershipType}
                  label="Membership"
                  onChange={handleInputChange}
                >
                  <MenuItem value="premium">PREMIUM</MenuItem>
                  <MenuItem value="basic">BASIC</MenuItem>
                  <MenuItem value="vip">VIP</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                  },
                }}
              />
              <TextField
                label="Height (cm)"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleInputChange}
              />
              <TextField
                label="Weight (kg)"
                name="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={handleInputChange}
              />
              <TextField
                label="Health Condition"
                name="healthCondition"
                value={formData.healthCondition}
                onChange={handleInputChange}
              />
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              position: 'sticky',    // keeps buttons visible on scroll
              bottom: 0,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              form="create-customer-form"  
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Customer Modal */}
        <Dialog open={editModalOpen} onClose={handleCloseEditModal} fullWidth maxWidth="sm">
          <DialogTitle>
            Edit Customer Profile
            <IconButton
              aria-label="close"
              onClick={handleCloseEditModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '70vh',
              p: 0,
            }}
          >
            <Box
              component="form"
              id="edit-customer-form"
              onSubmit={handleEditFormSubmit}
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <TextField
                label="Name"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                required
              />
              <TextField
                label="Age"
                type="number"
                name="age"
                value={editFormData.age}
                onChange={handleEditInputChange}
                required
              />
              <TextField
                label="Start Date"
                name="startDate"
                type="date"
                value={editFormData.startDate}
                onChange={handleEditInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={editFormData.type}
                  label="Type"
                  onChange={handleEditInputChange}
                >
                  <MenuItem value="forge">Forge</MenuItem>
                  <MenuItem value="play">Play</MenuItem>
                  <MenuItem value="coach_wellness">COACH WELLNESS</MenuItem>
                  <MenuItem value="coach_fitness">COACH FITNESS</MenuItem>
                  <MenuItem value="coach_sports">COACH SPORTS</MenuItem>
                  <MenuItem value="employee">EMPLOYEE</MenuItem>
                  <MenuItem value="other">OTHERS</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={editFormData.gender}
                  label="Gender"
                  onChange={handleEditInputChange}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Mobile"
                name="mobile"
                value={editFormData.mobile}
                onChange={handleEditInputChange}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditInputChange}
              />
              <TextField
                label="Password"
                name="password"
                type="text"
                value={editFormData.password}
                onChange={handleEditInputChange}
              />
              <FormControl fullWidth>
                <InputLabel>Membership</InputLabel>
                <Select
                  name="membershipType"
                  value={editFormData.membershipType}
                  label="Membership"
                  onChange={handleEditInputChange}
                >
                  <MenuItem value="premium">PREMIUM</MenuItem>
                  <MenuItem value="basic">BASIC</MenuItem>
                  <MenuItem value="vip">VIP</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="End Date"
                name="endDate"
                type="date"
                value={editFormData.endDate}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                  },
                }}
              />
              <TextField
                label="Height (cm)"
                name="height"
                type="number"
                value={editFormData.height}
                onChange={handleEditInputChange}
              />
              <TextField
                label="Weight (kg)"
                name="weight"
                type="number"
                step="0.1"
                value={editFormData.weight}
                onChange={handleEditInputChange}
              />
              <TextField
                label="Health Condition"
                name="healthCondition"
                value={editFormData.healthCondition}
                onChange={handleEditInputChange}
              />
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              position: 'sticky',
              bottom: 0,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <Button onClick={handleCloseEditModal}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              form="edit-customer-form"
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>

      </div>

      
    </div>
    </>
  );
};

export default CustomerTable;