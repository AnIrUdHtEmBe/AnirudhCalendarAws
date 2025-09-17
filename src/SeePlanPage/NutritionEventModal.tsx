import React, { useContext, useEffect, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { useApiCalls } from "../store/axios";
import { Autocomplete, TextField } from "@mui/material";
import { Dumbbell, MinusCircle, Plus } from "lucide-react";

import "./styles/EventModal.css";

export default function NutrtitionEventModal({
  isOpen,
  onClose,
  eventData,
  sessionId,
  planInstanceId,
  regenerate,
  getData,
}) {
  if (!isOpen || !eventData) return null;
  const context = useContext(DataContext);

  // console.log("kojihugyewikjs")
  const { getActivities } = useApiCalls();
  const { activities_api_call } = useContext(DataContext);
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
    getActivities("", "", "NUTRITION");
  }, []);

  // useEffect(() => {
  //     // console.log(activities_api_call,"wpwndiwon");
  // }, [activities_api_call]);

  const [selectedActivities, setSelectedActivities] = useState<{
    [id: number]: string;
  }>({});
  const updateTheActivitityById = async (activityId: string, index: number) => {
    const activity = await getActivityById(activityId);
    if (activity) {
      emptyArr[index] = activity;
      setEmptyArr([...emptyArr]);
    } else {
      console.error("meal not found");
    }
  };

  const handleActivitySelectChange = (id: number, value: string) => {
    setSelectedActivities((prev) => ({ ...prev, [id]: value }));
    updateTheActivitityById(value, id);
  };

  const {
    getSessionById,
    getActivityById,
    getSessionInstanceById,
    patchSession,
    RemoveSessionInPlanInstance,
    RemoveActivityFromSession,
    AddActivityToSession,
  } = useApiCalls();
  const [details, setDetails] = useState({});

const mealTypes = [
  "breakfast",
  "brunch", 
  "lunch",
  "dinner",
  "morning snack",
  "evening snack",
  "midnight snack",
  "pre-bed snack",
  "before workout",
  "after workout",
  "post dinner",
];

const [selectedMealType, setSelectedMealType] = useState("");
const [originalMealType, setOriginalMealType] = useState("");


  // console.log(sessionId, "iohhhhhhhioh")
  const getSessionDetails = async (eventData: {
    extendedProps: { sessionInstanceId: any };
  }) => {
    try {
      if (!eventData?.extendedProps?.sessionInstanceId) {
        console.error(
          "Invalid eventData or missing sessionInstanceId",
          eventData
        );
        return null;
      }

      const sessionId = eventData.extendedProps.sessionInstanceId;
      const sessionDetails = await getSessionInstanceById(sessionId);

      // Fetch session template data
      const sessionTemplate = await getSessionTemplateById(
        sessionDetails.sessionTemplateId
      );

      const activityDetailsArray = (
        await Promise.all(
          sessionDetails.activities.map(
            async (data: {
              status: string;
              activityId: string;
              activityInstanceId: any;
            }) => {
              if (data?.status != "REMOVED") {
                const defaultActivity = await getActivityById(data.activityId);

                if (defaultActivity) {
                  // Create enhanced activity with prioritized values
                  const enhancedActivity = {
                    ...defaultActivity,
                    description: getPrioritizedFieldValue(
                      data.activityId,
                      "description",
                      sessionDetails.editedActivities,
                      sessionTemplate?.editedActivities,
                      defaultActivity
                    ),
                    target: getPrioritizedFieldValue(
                      data.activityId,
                      "target",
                      sessionDetails.editedActivities,
                      sessionTemplate?.editedActivities,
                      defaultActivity
                    ),
                    vegNonVeg: getPrioritizedFieldValue(
                      data.activityId,
                      "vegNonVeg",
                      sessionDetails.editedActivities,
                      sessionTemplate?.editedActivities,
                      defaultActivity
                    ),
                  };

                  return {
                    activityInstanceId: data.activityInstanceId,
                    activityDetails: enhancedActivity,
                  };
                }
              }
              return null;
            }
          )
        )
      ).filter(Boolean);

      // Store all activity details in a single object
      sessionDetails.activityDetails = {};
      for (const {
        activityInstanceId,
        activityDetails,
      } of activityDetailsArray) {
        if (activityDetails) {
          sessionDetails.activityDetails[activityInstanceId] = activityDetails;
        }
      }

      console.log("Session Details with prioritized data:", sessionDetails);
      return sessionDetails;
    } catch (error) {
      console.error("Error fetching session details:", error);
      return null;
    }
  };

useEffect(() => {
  const fetchSessionDetails = async () => {
    const res = await getSessionDetails(eventData);
    // console.log(res, "this is res from get")
    if (res) {
      setDetails(res);
      // Set meal type from session instance
      if (res.mealType) {
        setSelectedMealType(res.mealType);
        setOriginalMealType(res.mealType);
      }
    } else {
      console.error("Failed to fetch meal details");
    }
  };
  fetchSessionDetails();
}, []);


  useEffect(() => {
    // console.log(details,details.category,"eventdatatttt");
  }, [details]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmAct, setshowConfirmAct] = useState(false);
  const [activityId, setactivityId] = useState("");
  const [removalNote, setRemovalNote] = useState("");

  const handleRemove = async (removalNote: string) => {
    if (showConfirm) {
      try {
        const res = await RemoveSessionInPlanInstance(
          sessionId,
          planInstanceId,
          removalNote
        );

        if (res) {
          // When removing entire session, always set vegNonVeg to VEG
          const patchResponse = await fetch(
            `https://testforgebackend.forgehub.in/session-instances/${sessionId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                vegNonVeg: "VEG",
              }),
            }
          );

          if (!patchResponse.ok) {
            console.error(
              "Failed to update session instance vegNonVeg after session removal"
            );
          }

          setShowConfirm(false);
          getData();
          await regenerate();
          onClose();
        } else {
          console.error("meal not updated");
        }
      } catch (error) {
        console.error("Error in handleRemove:", error);
      }
    } else {
      console.error("Removal cancelled.");
    }
  };

  const getSessionTemplateById = async (sessionTemplateId: any) => {
    try {
      const response = await fetch(
        `https://testforgebackend.forgehub.in/session-templates/${sessionTemplateId}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch session template: ${response.statusText}`
        );
      }
      const sessionTemplate = await response.json();
      return sessionTemplate;
    } catch (error) {
      console.error("Error fetching session template:", error);
      return null;
    }
  };

  const getPrioritizedFieldValue = (
    activityId: any,
    fieldName: string,
    sessionInstanceEdited: any[],
    sessionTemplateEdited: any[],
    defaultActivity: { [x: string]: any }
  ) => {
    // Priority 1: Check sessionInstance editedActivities
    const sessionInstanceEdit = sessionInstanceEdited?.find(
      (edit: { activityId: any }) => edit.activityId === activityId
    );
    if (sessionInstanceEdit && sessionInstanceEdit[fieldName] !== undefined) {
      return sessionInstanceEdit[fieldName];
    }

    // Priority 2: Check sessionTemplate editedActivities
    const sessionTemplateEdit = sessionTemplateEdited?.find(
      (edit: { activityTemplateId: any }) =>
        edit.activityTemplateId === activityId
    );
    if (sessionTemplateEdit && sessionTemplateEdit[fieldName] !== undefined) {
      return sessionTemplateEdit[fieldName];
    }

    // Priority 3: Use default activity value
    return defaultActivity[fieldName];
  };

  const getActivityVegNonVegWithPriority = async (
    activityId,
    sessionInstanceEdited,
    sessionTemplateEdited
  ) => {
    // Get default activity data
    const defaultActivity = await getActivityById(activityId);

    // Apply hierarchical priority for vegNonVeg
    return getPrioritizedFieldValue(
      activityId,
      "vegNonVeg",
      sessionInstanceEdited,
      sessionTemplateEdited,
      defaultActivity
    );
  };

  const calculateVegNonVegFromRemainingActivities = async (
    sessionDetails,
    sessionTemplate,
    excludeActivityInstanceId = null
  ) => {
    // Get all remaining activities (excluding the one being removed)
    const remainingActivities = sessionDetails.activities.filter(
      (activity) =>
        activity.status !== "REMOVED" &&
        (excludeActivityInstanceId
          ? activity.activityInstanceId !== excludeActivityInstanceId
          : true)
    );

    if (remainingActivities.length === 0) {
      return "VEG"; // Default to VEG when no activities remain
    }

    // Get vegNonVeg for all remaining activities using hierarchical priority
    const vegNonVegPromises = remainingActivities.map(async (activity) => {
      return await getActivityVegNonVegWithPriority(
        activity.activityId,
        sessionDetails.editedActivities,
        sessionTemplate?.editedActivities
      );
    });

    const vegNonVegValues = await Promise.all(vegNonVegPromises);
    const allVegNonVeg = vegNonVegValues.map((v) => v?.toUpperCase() || "VEG");

    // Apply priority: NONVEG > EGG > VEG
    const priority = { NONVEG: 3, EGG: 2, VEG: 1 };
    const maxPriority = Math.max(...allVegNonVeg.map((v) => priority[v] || 1));
    return (
      Object.keys(priority).find((k) => priority[k] === maxPriority) || "VEG"
    );
  };

  // this to commit the before pull
  const handleRemoveAct = async (id: string, removalNote: string) => {
    if (showConfirmAct) {
      try {
        const res = await RemoveActivityFromSession(
          id,
          sessionId,
          planInstanceId,
          removalNote
        );

        if (res) {
          // Fetch current session details and calculate new vegNonVeg priority
          const sessionDetails = await getSessionInstanceById(sessionId);
          const sessionTemplate = await getSessionTemplateById(
            sessionDetails.sessionTemplateId
          );

          // Calculate vegNonVeg from remaining activities (excluding the removed one)
          const newVegNonVeg = await calculateVegNonVegFromRemainingActivities(
            sessionDetails,
            sessionTemplate,
            id
          );

          // Update session instance with new vegNonVeg
          const patchResponse = await fetch(
            `https://testforgebackend.forgehub.in/session-instances/${sessionId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                vegNonVeg: newVegNonVeg,
              }),
            }
          );

          if (!patchResponse.ok) {
            console.error(
              "Failed to update session instance vegNonVeg after activity removal"
            );
          }

          setshowConfirmAct(false);
          getData();
          // await regenerate();
          onClose();
        } else {
          console.error("meal not updated");
        }
      } catch (error) {
        console.error("Error in handleRemoveAct:", error);
      }
    } else {
      console.log("Removal cancelled.");
    }
  };

  const handleActivityAdd = async (e) => {
    e.preventDefault();
    if (!activityForTable?.activityId) return;

    try {
      // Fetch current session details to get existing activities and session template
      const sessionDetails = await getSessionInstanceById(sessionId);
      const sessionTemplate = await getSessionTemplateById(
        sessionDetails.sessionTemplateId
      );

      // Get vegNonVeg values for all existing activities using hierarchical priority
      const existingVegNonVegPromises = sessionDetails.activities
        .filter((activity) => activity.status !== "REMOVED")
        .map(async (activity) => {
          return await getActivityVegNonVegWithPriority(
            activity.activityId,
            sessionDetails.editedActivities,
            sessionTemplate?.editedActivities
          );
        });

      const existingVegNonVeg = await Promise.all(existingVegNonVegPromises);

      // Get vegNonVeg for the new activity being added using hierarchical priority
      const newVegNonVeg = await getActivityVegNonVegWithPriority(
        activityForTable.activityId,
        sessionDetails.editedActivities,
        sessionTemplate?.editedActivities
      );

      // Combine all vegNonVeg values
      const allVegNonVeg = [...existingVegNonVeg, newVegNonVeg].map(
        (v) => v?.toUpperCase() || "VEG"
      );

      // Apply priority: NONVEG > EGG > VEG
      const priority = { NONVEG: 3, EGG: 2, VEG: 1 };
      const maxPriority = Math.max(
        ...allVegNonVeg.map((v) => priority[v] || 1)
      );
      const finalVegNonVeg =
        Object.keys(priority).find((k) => priority[k] === maxPriority) || "VEG";

      // Call existing AddActivityToSession
      const res = await AddActivityToSession(
        activityForTable?.activityId,
        sessionId,
        planInstanceId,
        "NUTRITION",
        finalVegNonVeg
      );

      if (res) {
        // Call new patch API to update session instance vegNonVeg
        const patchResponse = await fetch(
          `https://testforgebackend.forgehub.in/session-instances/${sessionId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              vegNonVeg: finalVegNonVeg,
            }),
          }
        );

        if (!patchResponse.ok) {
          console.error("Failed to update session instance vegNonVeg");
        }

        getData();
        onClose();
      } else {
        console.error("session instance not updated");
      }
    } catch (error) {
      console.error("Error in handleActivityAdd:", error);
    }
  };


  const handleSaveMealType = async () => {
  try {
    const response = await fetch(
      `https://testforgebackend.forgehub.in/session-instances/${sessionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedMealType,
        }),
      }
    );

    if (response.ok) {
      setOriginalMealType(selectedMealType);
      console.log("Meal type updated successfully");
    } else {
      console.error("Failed to update meal type");
    }
  } catch (error) {
    console.error("Error updating meal type:", error);
  }
};

  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to remove this meal?
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
                onClick={() => {
                  setShowConfirm(false);
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
                  removalNote.trim().length > 20
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
                disabled={removalNote.trim().length < 20}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmAct && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to remove this item?
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
                onClick={() => {
                  setshowConfirmAct(false);
                  setRemovalNote("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRemoveAct(activityId, removalNote);
                  setRemovalNote("");
                }}
                className={`px-4 py-2 rounded text-white ${
                  removalNote.trim().length > 10
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
          {eventData.title === "DUMMY" ? "ACTIVITIES" : eventData.title}
        </p>

        <div className="text-sm text-gray-700 space-y-2 ">
          {/* <p><strong>Plan ID:</strong> {eventData.extendedProps.planInstanceId}</p> */}
          {/* <p className="text-xl"><strong>Plan Name: </strong>
                        {eventData.title === "DUMMY"
                            ? details?.activityDetails && (
                                <>
                                    ({Object.keys(details.activityDetails).length} activities)
                                </>
                            )
                            : eventData.extendedProps.planTitle}
                    </p> */}
          {details?.activityDetails && (
  <div>
    <div className="flex items-center gap-4 mb-4">
      <p className="text-xl">
        <strong>Meals:</strong>
      </p>
      <div className="flex items-center gap-2">
        <select
          value={selectedMealType}
          onChange={(e) => setSelectedMealType(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Type</option>
          {mealTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        {selectedMealType !== originalMealType && (
          <button
            onClick={handleSaveMealType}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Save
          </button>
        )}
      </div>
    </div>
    <ol className="list-decimal pl-5 text-xl">
      <ol style={{ listStyleType: "none" }}>
        <div className="flex flex-wrap  bg-gray-200 font-semibold border border-gray-300 rounded">
          <div className="w-1/5 p-2">Item</div>
          <div className="w-1/5 p-2">Description</div>
          <div className="w-1/5 p-2">Target</div>
          <div className="w-1/5 p-2">vegNonVeg</div>
          <div className="w-1/5 p-2">Remove</div>
        </div>
      </ol>
      {Object.entries(details.activityDetails).map(
        ([activityId, activity]) => (
          <li key={activityId}>
            <div
              /*className="activity-each-row-event-modal"*/ className="flex flex-wrap"
            >
              <div className="w-1/5 p-2">
                <strong className="nameCell">{activity.name}</strong>{" "}
              </div>
              <div className="w-1/5 p-2">{activity.description}</div>
              {/* <div className="w-1/5 p-2">{activity.activityInstanceId}</div> */}
              <div className="w-1/5 p-2">
                {activity?.target}
                {activity?.unit == "weight"
                  ? "Kg"
                  : activity?.unit == "distance"
                  ? "Km"
                  : activity?.unit == "time"
                  ? "Min"
                  : activity?.unit == "repetitions"
                  ? "Reps"
                  : activity?.unit == "grams"
                  ? "g"
                  : activity?.unit == "meter"
                  ? "m"
                  : activity?.unit == "litre"
                  ? "L"
                  : activity?.unit == "millilitre"
                  ? "ml"
                  : activity?.unit == "glasses"
                  ? "glasses"
                  : ""}
              </div>
              <div className="w-1/5 p-2">
                {activity?.vegNonVeg || "-"}
              </div>
              <div className="w-1/5 p-2">
                <MinusCircle
                  className="ml-2 w-5 h-5 text-red-500 hover:text-red-600 cursor-pointer transition"
                  onClick={() => {
                    setactivityId(activityId);
                    setshowConfirmAct(true);
                  }}
                />
              </div>
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
            <button
              id="remove_eventmodal"
              onClick={() => setShowConfirm(true)}
              className=" px-2 py-1 bg-red-600 text-white rounded-md  right-27 text-gray-400 hover:text-gray-600 text-xl"
            >
              Remove
            </button>
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
                          (a: { activityId: string }) =>
                            a.activityId === selectedActivities[index]
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
                          label="Select Item"
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
          <td>
            <button
              onClick={(e) => handleActivityAdd(e)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Item
            </button>
          </td>
        </div>
      </div>
    </div>
  );
}
