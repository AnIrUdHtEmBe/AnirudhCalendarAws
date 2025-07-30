import React, { useEffect, useState , useContext } from 'react';
import {
  Button,
  Modal,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useApiCalls } from "../store/axios"; // Adjust if needed
import { DataContext } from '../store/DataContext';
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

function AddPlanInstance({userId}) {
 const context = useContext(DataContext);
  const { getPlans, getExpandedPlanByPlanId} = useApiCalls();
  const [plans, setPlans] = useState([]);
  const [option, setOption] = useState("");
  const [open, setOpen] = useState(false);
  const {
    setSelectComponent
} = context; 
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const fetchedPlans = await getPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };
    fetchPlans();
    console.log(userId);
    
  }, []);

    // const handleConfirm = async () => {
    // try {
    //     console.log("Confirmed selection:", option);
    //     const fullPlan = await getExpandedPlanByPlanId([option]); // waits here

    //     console.log("Fetched full plan:", fullPlan);

    //     // Store it as a string
    //     localStorage.setItem("selectedPlan", JSON.stringify(fullPlan));

    //     setOpen(false); // close modal after saving

    //     setSelectComponent("planCreation");
    // } catch (error) {
    //     console.error("Failed to fetch or save full plan:", error);
    // }
    // };

    const handleConfirm = async () => {
  try {
    const response = await getExpandedPlanByPlanId([option]);

    // Extract the first value from the object if it looks like { 0: {...}, sessions: [] }
    const fullPlan = response[0] || Object.values(response)[0];

    console.log("Storing full plan:", fullPlan);

    localStorage.setItem("selectedPlan", JSON.stringify(fullPlan));

    setOpen(false);

    setSelectComponent("planCreation");
  } catch (error) {
    console.error("Failed to fetch or save full plan:", error);
  }
};


  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Create New Plan Instance
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
            Plan Templates
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="plan-select-label">Select Plan</InputLabel>
            <Select
              labelId="plan-select-label"
              value={option}
              label="Select Plan"
               MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 200, // or whatever you need
                              overflowY: 'auto',
                            },
                          },
                        }}
              onChange={(e) => setOption(e.target.value)}
            >
              {plans.map((plan) => (
                <MenuItem key={plan.templateId} value={plan.templateId}>
                  {plan.title}
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
            disabled={!option}
          >
            Confirm
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

export default AddPlanInstance;
