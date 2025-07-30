import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DateRangePicker from "./DateRangePicker"; // Adjust the path if needed
import { useApiCalls } from "../store/axios";
import dayjs from "dayjs";
import EventCalendar from "./EventCalendar"; // Adjust the path if needed
import Header from "./Header";
import { setSelectComponent, DataContext } from '../store/DataContext'
function SeePlan() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useApiCalls must be used within a DataProvider");
  }
  const { getPlansForInterval, getLatestPlanAssessment } = useApiCalls();
  const { setSelectComponent } = context
  // const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [startDate, setStartDate] = useState(dayjs().year(2025).month(0).date(1));
  const [endDate, setEndDate] = useState(dayjs().year(2025).month(11).date(31));
  const [planForAlacatre, setPlanForAlacatre] = useState(null);
  // const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.userId || "defaultUserId"; // Fallback to a default user ID if not found
  const [data, setData] = React.useState(null);
  const [LatestPAdetails, setLatestPAdetails] = useState<any>()
  const getData = async () => {

    const res = await getPlansForInterval(dayjs(startDate).format("YYYY-MM-DD"), dayjs(endDate).format("YYYY-MM-DD"), userId);
    const res1 = await getLatestPlanAssessment(userId)
    console.log(res1, "asoinfewufbwi")
    setLatestPAdetails(res1)
    // console.log(res," i have called getData")
    setData(res);
  }
  useEffect(() => {
    // Convert dayjs objects to formatted strings 

    if (startDate && endDate) {
      getData();
    }
    console.log(startDate, endDate, userId);
  }, [startDate, endDate, userId]);

  useEffect(() => {
    console.log("Data updated in parent:", data);
    if (data) {
      data.map((item) => {
        if (item.planTitle == "alacartePH") {
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
  useEffect(() => {
    console.log(LatestPAdetails, "kjhgfd")
  }, [LatestPAdetails])


  if (!LatestPAdetails) 
      return (
        <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
            </div>
      ); // or return null;

  return (
    <div className="bg-white min-h-screen">
      {/* <button
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
      </button> */}
      <div className="p-4 flex flex-row  justify-between ">
        <div>
          <Header userData={user} ></Header>
          <div className="p-4 flex flex-row  justify-between ">
            <div>
              <p className="text-xl cursor-pointer"><strong>Latest Plan Instance: </strong>{LatestPAdetails?.latestPlanName || "No plans available"}</p>
              <p className="text-xl cursor-pointer "><strong>Latest Assessment: </strong><span onClick={() => {
                setSelectComponent("responses")
                navigate('/response', {
                  state: {
                    assessmentInstanceId: LatestPAdetails?.latestAssessmentId
                  }
                })
              }
              }>{LatestPAdetails?.latestAssessmentName || "no assessment available"}{""}-{""}{LatestPAdetails?.latestAssessmentScore||0}</span></p>
            </div>

          </div>
        </div>

        <div>
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
        </div>
      </div>



      <EventCalendar data={data} onEventClick={handleEventClick} getData={getData} />


      {/* <button className="border-2 p-3 bg-green-300 ">Update Changes</button> */}
    </div>
  );
}

export default SeePlan;
