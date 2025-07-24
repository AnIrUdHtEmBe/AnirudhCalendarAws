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
import { enqueueSnackbar } from "notistack";

const actions = ["Go to profile", "See plan", "Take Assessment"];

interface ActionsContainerProps {
  takeAssessment: () => void;
  seePlan: () => void;
}

const ActionsContainer = ({
  takeAssessment,
  seePlan,
}: ActionsContainerProps) => {
  const [value, setValue] = useState(actions[0]);

  const changeHandler = (event: SelectChangeEvent) => {
    const selectedAction = event.target.value;
    setValue(selectedAction);

    if (selectedAction === "Take Assessment") {
      takeAssessment();
    } else if (selectedAction === "See plan") {
      seePlan();
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
  const [selectedUserIDs, setSelectedUserIDs] = useState<Array<string>>([]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    }
    // Optionally, reset form fields here
  };

  const handleCloseModal = () => setModalOpen(false);

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
        width: width / 10,
        headerAlign: "left",
        align: "left",
      };
    });
  };

  useEffect(() => {
    if (!ref.current) return;

    const fetchData = async () => {
      // console.log("console")
      const _rows = await generateRows(); // ✅ Wait for async rows
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

  return (
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
              sx={{ border: 0, maxHeight: "600px" }}
              onRowSelectionModelChange={(ids) => setSelectedUserIDs(ids)}
            />
          </div>
        </div>
        <div className="customer-dashboard-footer-container">
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
        </div>
      </div>

      <div>
        <Modal isOpen={modalOpen} onClose={handleCloseModal}>
          <h2 style={modalHeaderStyle}>Create New Customer</h2>
          <form style={modalFormStyle} onSubmit={handleFormSubmit}>
            <input
              style={modalInputStyle}
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <input
              style={modalInputStyle}
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleInputChange}
              required
            />
            <select
              style={modalInputStyle}
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled hidden>
                Select Type
              </option>
              <option value="forge">Forge</option>
              <option value="play">Play</option>
              <option value="coach_wellness">COACH WELLNESS</option>
              <option value="coach_fitness">COACH FITNESS</option>
              <option value="coach_sports">COACH SPORTS</option>
              <option value="employee">EMPLOYEE</option>
              <option value="other">OTHERS</option>
            </select>
            <select
              style={modalInputStyle}
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled hidden>
                Select Gender
              </option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="female">Female</option>
            </select>
            <input
              type="text"
              style={modalInputStyle}
              onChange={handleInputChange}
              value={formData.mobile}
              placeholder="Mobile"
              name="mobile"
            />
             <input
              type="email"
              style={modalInputStyle}
              onChange={handleInputChange}
              value={formData.email}
              placeholder="Email"
              name="email"
            />
             <input
              type="text"
              style={modalInputStyle}
              onChange={handleInputChange}
              value={formData.password}
              placeholder="Password ***"
              name="password"
            />
            <select
              style={modalInputStyle}
              name="membershipType"
              value={formData.membershipType}
              onChange={handleInputChange}
            >
              <option value="">Select Membership</option>
              <option value="premium">PREMIUM</option>
              <option value="basic">BASIC</option>
              <option value="vip">VIP</option>
            </select>
            <input
              style={modalInputStyle}
              type="number"
              name="height"
              placeholder="Height (cm)"
              value={formData.height}
              onChange={handleInputChange}
            />
            <input
              style={modalInputStyle}
              type="number"
              step="0.1"
              name="weight"
              placeholder="Weight (kg)"
              value={formData.weight}
              onChange={handleInputChange}
            />
            <input
              style={modalInputStyle}
              type="text"
              name="healthCondition"
              placeholder="Health Condition"
              value={formData.healthCondition}
              onChange={handleInputChange}
            />
            <button style={modalButtonStyle} type="submit">
              Create
            </button>
          </form>
        </Modal>
      </div>

      
    </div>
  );
};

export default CustomerTable;
