import React,{useState , useEffect}from 'react'
import { Button,
    Modal,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    IconButton,
    
 } from '@mui/material'
 import CloseIcon from '@mui/icons-material/Close';
 import { DatePicker } from '@mui/x-date-pickers/DatePicker';
 import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
 import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
 const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 350,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  outline: 'none'
};
import { useApiCalls } from "../store/axios"; // Adjust if needed
import dayjs from 'dayjs';
function AddSession({ userId , userDate ,planForAlacarte }) {
     const [open, setOpen] = useState(false);
     const [option, setOption] = useState("");
     const [date, setDate] = useState( null);
    const {getAllSessions } = useApiCalls();
    const [sessions, setSessions] = useState([]);
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const sessions = await getAllSessions();
                setSessions(sessions);
            } catch (error) {
                console.error("Error fetching sessions:", error);
            }
        }
        fetchSessions();
        
    },[])
useEffect(() => {
    console.log("User date in AddSession:", userDate);
    if (userDate) {
        setDate(dayjs(userDate));
    }   
}, [userDate]);

  useEffect(() => {
      console.log("Selected session option:", option);
  }, [option]);

    const handleConfirm = () => {
        if (!option || !date) {
            console.error("Please select a session and a date.");
            return;
        }
        const sessionData = {
            sessionId: option,
            userId: userId,
            date: date.toISOString(),
            planId: planForAlacarte?.planInstanceId // Ensure date is in ISO format
        };
        console.log("Session Data to be sent:", sessionData);
        alert("Session added successfully!");
        setOpen(false);
        setOption("");
        setDate(null);
      }   
  return (
    <div>
        <Button variant="contained" onClick={() => setOpen(true)} >
             Add a Session
        </Button>
        <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          {/* Cross Button */}
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h6" mb={2}>
            Session Templates
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="plan-select-label">Select Session</InputLabel>
            <Select
              labelId="plan-select-label"
              value={option}
              label="Select Plan"
              onChange={(e) => setOption(e.target.value)}
            >
              {sessions.map((session) => (
                <MenuItem key={session.sessionId} value={session.sessionId}>
                  {session.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label="Date"
                value={date}
                onChange={(newValue) => setDate(newValue)}
                sx={{ width: '100%', mb: 2 }}
            />
            </LocalizationProvider>
          {/* Confirm Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            fullWidth
            disabled={!option}
          >
            Confirm
          </Button>
        </Box>
      </Modal>
    </div>
  )
}

export default AddSession