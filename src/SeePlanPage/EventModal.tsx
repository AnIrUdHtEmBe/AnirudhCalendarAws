import React, { useContext,useEffect , useState} from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { useApiCalls } from "../store/axios";
import {
  Autocomplete,
  
  TextField,
} from "@mui/material";

export default function EventModal({ isOpen, onClose, eventData,sessionId,planInstanceId, regenerate,getData }) {
  if (!isOpen || !eventData) return null;
    const context = useContext(DataContext);
    const { setSelectComponent, activities_api_call } = useContext(DataContext);
    const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
    
    useEffect(() => {
        console.log(activities_api_call,"wpwndiwon");
      }, [activities_api_call]);
      const [selectedActivities, setSelectedActivities] = useState<{
          [id: number]: string;
        }>({});
      const updateTheActivitityById = async (activityId: string, index: number) => {
      const activity = await getActivityById(activityId);
      if (activity) {
        // emptyArr[index] = activity;
        // setEmptyArr([...emptyArr]);
      } else {
        console.error("Activity not found");
      }
  };
        const handleActivitySelectChange = (id: number, value: string) => {
          setSelectedActivities((prev) => ({ ...prev, [id]: value }));
          updateTheActivitityById(value, id);
        };



  const {getSessionById , getActivityById,patchSession,RemoveSessionInPlanInstance} = useApiCalls();
  const [details, setDetails] = useState({});
  const getSessionDetails = async (eventData) => {
  try {
    const sessionDetails = await getSessionById(eventData.id);

    const activityDetailsArray = await Promise.all(
      sessionDetails.activityIds.map(async (activityId) => {
        const activityDetails = await getActivityById(activityId);
        return { activityId, activityDetails };
      })
    );

    // Store all activity details in a single object
    sessionDetails.activityDetails = {};
    for (const { activityId, activityDetails } of activityDetailsArray) {
      if (activityDetails) {
        sessionDetails.activityDetails[activityId] = activityDetails;
      }
    }

    console.log("Session Details:", sessionDetails);
    return sessionDetails;

  } catch (error) {
    console.error("Error fetching session details:", error);
    return null;
  }
};


  useEffect(() => {
    const fetchSessionDetails = async () => {
        const res = await getSessionDetails(eventData);
       
        if (res) {
            setDetails(res);
        } else {
            console.error("Failed to fetch session details");
        }
    };
    fetchSessionDetails();
    
  }
  , []);
  useEffect(() => {
    console.log(details,details.category,"eventdatatttt");
  }
  , [details]); 
    
  const handleRemove=async()=>{
    // console.log(details,"8732trg387",details.sessionId,planInstanceId)

    
    const res=await RemoveSessionInPlanInstance(sessionId,planInstanceId)
    if(res){
      console.log("session updated")
        getData()
       await regenerate();

      // ✅ Close the modal
      onClose();
    }else{
      console.error("session not updated")
    }
  }
  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2">{eventData.title}</h2>
        <div className="mt-4 flex justify-end">
          <button id="remove_eventmodal"
          onClick={()=>handleRemove()}
            className=" px-2 py-1 absolute bg-red-600 text-white rounded-md top-3 right-17 text-gray-400 hover:text-gray-600 text-xl"
          >Remove</button>
        </div>
        <div className="text-sm text-gray-700 space-y-2">
          {/* <p><strong>Plan ID:</strong> {eventData.extendedProps.planInstanceId}</p> */}
          <p><strong>Plan Name: </strong>{eventData.extendedProps.planTitle}</p>
            {details?.activityDetails && (
                <div>
                <strong>Activities:</strong>
                <ul className="list-disc pl-5">
                    {Object.entries(details.activityDetails).map(
                    ([activityId, activity]) => (
                        <li key={activityId}>
                        {activity.name} : {activity.description}
                        </li>
                    )
                    )}
                </ul>
                </div>
            )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
        <div>
          <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                              <Autocomplete
                                options={activities_api_call}
                                getOptionLabel={(option) => option.name || ""}
                                getOptionDisabled={() => true} 
                                value={
                                  activities_api_call.find(
                                    (a) => a.activityId === selectedActivities[index]
                                  ) || null
                                }
                                onChange={(_, newValue) => {
                                  // newValue is the selected activity object or null
                                  handleActivitySelectChange(
                                    index,
                                    newValue ? newValue.activityId : ""
                                  );
                                  setActivityForTable(newValue);
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
                                sx={{ width: 100, backgroundColor: "white" }}
                                isOptionEqualToValue={(option, value) =>
                                  option.activityId === value.activityId
                                }
                                freeSolo
                              />
                            </td>
        </div>
      </div>
    </div>
  );
}
