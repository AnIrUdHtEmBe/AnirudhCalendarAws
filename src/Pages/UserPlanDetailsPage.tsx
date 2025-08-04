import { useState } from "react";
import UserPlanModal from "../UserPlanDetailsComponent/UserPlanModal"
import { useLocation, useNavigate } from "react-router-dom";

const UserPlanDetailsPage = () => {
    const [open, setOpen] = useState(true);

    const navigate = useNavigate();
  const location = useLocation();

  const handleClose =() => {
    setOpen(false);
  }
  
    return(
        <UserPlanModal open={open} handleClose={handleClose} />
    )
}

export default UserPlanDetailsPage;