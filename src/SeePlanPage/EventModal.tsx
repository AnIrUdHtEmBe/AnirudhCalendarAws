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
import './styles/EventModal.css';

export default function EventModal({ isOpen, onClose, eventData,sessionId,planInstanceId, regenerate,getData }) {
  if (!isOpen || !eventData) return null;
    const context = useContext(DataContext);
    const {getActivities} =useApiCalls();
    const {activities_api_call} = useContext(DataContext);
    const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
    const [emptyArr, setEmptyArr] = useState<Activity_Api_call[]>([
    {
      name: "",
      description: "",
      target: null,
      unit: "",
      icon: "",
    },
  ]);
    useEffect(() => {
      getActivities();
    }, []);
    
    // useEffect(() => {
    //     // console.log(activities_api_call,"wpwndiwon");
    // }, [activities_api_call]);

    const [selectedActivities, setSelectedActivities] = useState<{[id: number]: string;}>({});
    const updateTheActivitityById = async (activityId: string, index: number) => {
      const activity = await getActivityById(activityId);
        if (activity) {
          emptyArr[index] = activity;
          setEmptyArr([...emptyArr]);
        } else {
          console.error("Activity not found");
        }
    };
    
    const handleActivitySelectChange = (id: number, value: string) => {
          setSelectedActivities((prev) => ({ ...prev, [id]: value }));
          updateTheActivitityById(value, id);
    };



  const {getSessionById , getActivityById,getSessionInstanceById,patchSession,RemoveSessionInPlanInstance,RemoveActivityFromSession,AddActivityToSession} = useApiCalls();
  const [details, setDetails] = useState({});
  const getSessionDetails = async (eventData) => {
  try {
    if (!eventData?.extendedProps?.sessionInstanceId) {
      console.error("Invalid eventData or missing sessionInstanceId", eventData);
      return null;
    }

    const sessionId = eventData.extendedProps.sessionInstanceId;
    const sessionDetails=await getSessionInstanceById(sessionId)
    const activityDetailsArray = (await Promise.all(
      sessionDetails.activities.map(async (data:any) => {
        // console.log(data?.status,data)
        if(data?.status!="REMOVED")
        {
          // console.log("omlu i am able to enter",da/ta)
          const activityDetails = await getActivityById(data.activityId);
          return {activityInstanceId: data.activityInstanceId, activityDetails };
        }
        return null
      })
    )).filter(Boolean);

    // Store all activity details in a single object
    sessionDetails.activityDetails = {};
    for (const { activityInstanceId, activityDetails } of activityDetailsArray) {
      if (activityDetails) {
        sessionDetails.activityDetails[activityInstanceId] = activityDetails;
      }
    }

    // console.log("Session Details:", sessionDetails);
    return sessionDetails;

  } catch (error) {
    // console.error("Error fetching session details:", error);
    return null;
  }
};


  useEffect(() => {
    const fetchSessionDetails = async () => {
        const res = await getSessionDetails(eventData);
       console.log(res,"this is res from get")
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
    // console.log(details,details.category,"eventdatatttt");
  }
  , [details]); 
    
  const [showConfirm,setShowConfirm]=useState(false)
  const [showConfirmAct,setshowConfirmAct]=useState(false)
  const [activityId,setactivityId]=useState('')
  const [removalNote, setRemovalNote] = useState("");
  const handleRemove=async(removalNote:string)=>{
    // console.log(details,"8732trg387",details.sessionId,planInstanceId)
    // const confirmDelete = window.confirm("Are you sure you want to remove this session?");
    if(showConfirm)
    {
      // console.log(removalNote)
      const res=await RemoveSessionInPlanInstance(sessionId,planInstanceId,removalNote)
      if(res){
        setShowConfirm(false)
        // console.log("session updated")
        getData()
        await regenerate();
        onClose();
      }else{
        console.error("session not updated")
      }
    }else{
      console.error("Removal cancelled.");
    }
    
  }
  // this to commit the before pull
  const handleRemoveAct=async(id:string,removalNote:string)=>{
    if(showConfirmAct){
      const res=await RemoveActivityFromSession(id,sessionId,planInstanceId,removalNote)
      if(res){
        setshowConfirmAct(false)
        getData()
        await regenerate();
        onClose();
      }else{
        console.error("activity not updated")
      }
    }else{
      console.log("Removal cancelled.");
    }
  }
  const handleActivityAdd=async()=>{
    console.log(activityForTable?.activityId,sessionId,planInstanceId,"thi si new ")
    const res=await AddActivityToSession(activityForTable?.activityId,sessionId,planInstanceId)
     if(res){
        
        console.log("checjidvobuewifbvwiyvfeouy")
    //     await getData();  
    // // await regenerate();
    // setshowConfirmAct(false)

    // onClose(); 
    // setShowConfirm(false)
        // console.log("session updated")
        getData()
        await regenerate();
        onClose();
        
      }else{
        console.error("session insatnce not updated")
      }
    

  }
  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to remove this session?
            </h2>

            <label className="block mb-2 text-sm text-gray-700">
              Reason of removal:
            </label>
            <textarea
              value={removalNote}
              onChange={(e) => setRemovalNote(e.target.value)}
              rows={3}
              minLength={20}
              maxLength={100}
              className="w-full border border-gray-300 rounded-md p-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your note here..."
            />
            <p className="text-right text-sm text-gray-500 mb-4">
              {removalNote.length}/100 characters
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() =>{ setShowConfirm(false)
                   setRemovalNote("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRemove(removalNote);
                  setRemovalNote("");
                }}
                className={`px-4 py-2 rounded text-white ${
                  removalNote.trim().length>20
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
                disabled={removalNote.trim().length<20}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmAct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to remove this activity?
            </h2>

            <label className="block mb-2 text-sm text-gray-700">
              Reason of removal:
            </label>
            <textarea
              value={removalNote}
              onChange={(e) => setRemovalNote(e.target.value)}
              rows={3}
              minLength={10}
              maxLength={50}
              className="w-full border border-gray-300 rounded-md p-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your note here..."
            />
            <p className="text-right text-sm text-gray-500 mb-4">
              {removalNote.length}/50 characters
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {setshowConfirmAct(false)
                  setRemovalNote("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  
                  handleRemoveAct(activityId,removalNote);
                  setRemovalNote("");
                }}
                className={`px-4 py-2 rounded text-white ${
                  removalNote.trim().length>10
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
                disabled={removalNote.trim().length < 10}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          &times;
        </button>
        <p className="text-3xl font-bold mb-2 ">
          {eventData.title==="DUMMY"?"ACTIVITIES":eventData.title}
          
          </p>
        
        <div className="text-sm text-gray-700 space-y-2 ">
          {/* <p><strong>Plan ID:</strong> {eventData.extendedProps.planInstanceId}</p> */}
          <p className="text-xl"><strong>Plan Name: </strong>
          {eventData.title === "DUMMY"
            ? details?.activityDetails && (
                <>
                  ({Object.keys(details.activityDetails).length} activities)
                </>
              )
            : eventData.extendedProps.planTitle}
          </p>
            {details?.activityDetails && (
                <div>
                <p className="text-xl"><strong>Activities:</strong></p>
                <ol className="list-decimal pl-5 text-xl">
                    {Object.entries(details.activityDetails).map(
                    ([activityId, activity]) => (
                        <li key={activityId}>
                        <div  /*className="activity-each-row-event-modal"*/ className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                        
                          <div style={{ width:"200px"}}><strong>{activity.name}</strong>  </div>
                          <div style={{textAlign:"left", width:"200px"}}>{activity.description}</div>
                          <div>{activity.activityInstanceId}</div>
                          <div>
                            {activity?.target}{activity?.unit == "weight"
                                                    ? "Kg"
                                                    : activity?.unit == "distance"
                                                    ? "Km"
                                                    : activity?.unit == "time"
                                                    ? "Min"
                                                    : activity?.unit == "repetitions"
                                                    ? "Reps"
                                                    : ""
                            }
                          
                        </div>
                        <div> <button
                              className="ml-2 px-3 py-1 text-sm font-medium text-white bg-red rounded hover:bg-red-600 transition"
                              onClick={() => {
                                // console.log(activity,activityId,"this is instance")
                                setactivityId(activityId)
                                setshowConfirmAct(true)
                               }}
                            >
                              ➖ 
                            </button></div>
                      </div>
                      </li>
                    )
                    )}
                </ol>
                </div>
            )}
        </div>
        <div className="mt-4 flex justify-end gap-3">
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button id="remove_eventmodal"
          onClick={() => setShowConfirm(true)}
            className=" px-2 py-1 bg-red-600 text-white rounded-md  right-27 text-gray-400 hover:text-gray-600 text-xl"
          >Remove</button>
        </div>
        </div>
        <div className="EventModal_activity">
          <div>
          <tbody>
              {emptyArr.map((activity, index) => (
                <tr
                  key={index}
                  className="text-sm text-gray-800 hover:bg-gray-50"
                >
                  
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    <Autocomplete
                      options={activities_api_call}
                      getOptionLabel={(option) => option.name || ""}
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

                  {/* <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    {activity.description}
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    {activity.target}
                  </td>
                  <td className="px-4 py-7 border-b border-b-gray-200 text-center">
                    {activity.unit == "weight"
                      ? "Kg"
                      : activity.unit == "distance"
                      ? "Km"
                      : activity.unit == "time"
                      ? "Min"
                      : activity.unit == "repetitions"
                      ? "Reps"
                      : ""}
                  </td> */}
                  
                </tr>
              ))}
              </tbody>
              </div>
              <td >
                    <button  
                    onClick={()=>handleActivityAdd()}           
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Add Activity
                    </button>
                  </td>
        </div>
      </div>
    </div>
  );
}
