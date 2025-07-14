import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DateRangePicker from "./DateRangePicker"; // Adjust the path if needed
import { useApiCalls } from "../store/axios";
import dayjs from "dayjs";
import EventCalendar from "./EventCalendar"; // Adjust the path if needed
import Header from "./Header";
function SeePlan() {
  const {getPlansForInterval} = useApiCalls();
  // const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [startDate, setStartDate] = useState(dayjs().year(2025).month(0).date(1));
  const [endDate, setEndDate] = useState(dayjs().year(2025).month(11).date(31));
  const [planForAlacatre, setPlanForAlacatre] = useState(null);
// const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");    
  const userId =  user.userId || "defaultUserId"; // Fallback to a default user ID if not found
    const [data, setData] = React.useState(null);
     const getData = async () => {

            const res = await getPlansForInterval(dayjs(startDate).format("YYYY-MM-DD"), dayjs(endDate).format("YYYY-MM-DD"),userId); 
            console.log(res," i have called getData")
            setData(res);
        }
  useEffect( () => {
        // Convert dayjs objects to formatted strings 
       
      if (startDate && endDate) {
         getData();
      }
    console.log(startDate, endDate, userId);
  }, [startDate, endDate, userId]);
  
  useEffect(() => {
  console.log("Data updated in parent:", data);
    if(data){
      data.map((item) => {
        if(item.planTitle == "alacartePH"){
          setPlanForAlacatre(item);
        }
      })
    }
  }, [data]);

  useEffect(() => {
    console.log("Plan for Alacarte:", planForAlacatre);
  }, [planForAlacatre]);
  const [userDate, setUserDate] = useState(null);
  const handleEventClick = (eventData) => {
    // const date = new Date(eventData);
    setUserDate(eventData); // Set the userDate to the clicked event's start date
  // You can update state or trigger effects here
};

      

    
  return (
    <div className="bg-white min-h-screen">
      <button
        onClick={() => navigate('/profile')}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer'
        }}
        aria-label="Go Back"
      >
        ←
      </button>
    <Header userData={user} ></Header>
    
      <DateRangePicker
        userId={userId}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        userDate={userDate}
        planForAlacatre={planForAlacatre}
        getData={getData}
      />
      <EventCalendar data={data} onEventClick={handleEventClick} getData={getData}/>

    
    {/* <button className="border-2 p-3 bg-green-300 ">Update Changes</button> */}
    </div>
  );
}

export default SeePlan;
