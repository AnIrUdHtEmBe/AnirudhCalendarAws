import React, { useContext, useEffect, useState } from "react";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { API_BASE_URL, useApiCalls } from "../store/axios";
import { Autocomplete, TextField, Button } from "@mui/material";
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
                    name: getPrioritizedFieldValue(
                      data.activityId,
                      "name",
                      sessionDetails.editedActivities,
                      sessionTemplate?.editedActivities,
                      defaultActivity
                    ),
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
                    unit: getPrioritizedFieldValue(
                      data.activityId,
                      "unit",
                      sessionDetails.editedActivities,
                      sessionTemplate?.editedActivities,
                      defaultActivity
                    ),
                    target2: getPrioritizedFieldValue(
                      data.activityId,
                      "target2",
                      sessionDetails.editedActivities,
                      sessionTemplate?.editedActivities,
                      defaultActivity
                    ),
                    unit2: getPrioritizedFieldValue(
                      data.activityId,
                      "unit2",
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
        // Set meal type from session details - check both type and mealType fields
        const mealTypeValue = res.type || res.mealType || "";
        if (mealTypeValue) {
          setSelectedMealType(mealTypeValue);
          setOriginalMealType(mealTypeValue);
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
            `${API_BASE_URL}/session-instances/${sessionId}`,
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
        `${API_BASE_URL}/session-templates/${sessionTemplateId}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch session template: ${response.statusText}`
        );
      }
      const sessionTemplate = await response.json();
      console.log("temaplte data :", sessionTemplate);

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

    // Priority 2: Check sessionTemplate editedActivities - FIXED
    const sessionTemplateEdit = sessionTemplateEdited?.find(
      (edit: { activityId: any }) => edit.activityId === activityId // ✅ FIXED
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
            `${API_BASE_URL}/session-instances/${sessionId}`,
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
          `${API_BASE_URL}/session-instances/${sessionId}`,
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
        `${API_BASE_URL}/session-instances/${sessionId}`,
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
  //new edit fucntionality code
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  /* ----------  enter/exit edit ---------- */
  const enterEdit = () => {
    const clone: Record<string, any> = {};
    Object.entries(details.activityDetails || {}).forEach(
      ([actInstId, act]: any) => {
        clone[actInstId] = {
          activityId: act.activityId,
          name: act.name,
          description: act.description,
          vegNonVeg: act.vegNonVeg,
          target: act.target,
          unit: act.unit,
          target2: act.target2,
          unit2: act.unit2,
        };
      }
    );
    setDraft(clone);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraft({});
    setEditMode(false);
  };
  const updateDraft = (
    actInstId: string,
    field:
      | "name"
      | "description"
      | "vegNonVeg"
      | "target"
      | "unit"
      | "target2"
      | "unit2",
    value: any
  ) => {
    setDraft((prev) => ({
      ...prev,
      [actInstId]: { ...prev[actInstId], [field]: value },
    }));
  };
  const saveEdit = async () => {
    /* 1. Build a delta object per activityId */
    const deltaMap = new Map<string, any>();

    Object.entries(draft).forEach(([activityInstanceId, d]) => {
      const original = details.activityDetails[activityInstanceId];
      if (!original) return;

      const changes: any = { activityId: d.activityId };
      if (d.name !== original.name) changes.name = d.name;
      if (d.description !== original.description)
        changes.description = d.description;
      if (d.vegNonVeg !== original.vegNonVeg) changes.vegNonVeg = d.vegNonVeg;
      if (d.target !== original.target) changes.target = d.target;
      if (d.unit !== original.unit) changes.unit = d.unit;
      if (d.target2 !== original.target2) changes.target2 = d.target2;
      if (d.unit2 !== original.unit2) changes.unit2 = d.unit2;

      if (Object.keys(changes).length > 1) {
        deltaMap.set(d.activityId, changes);
      }
    });

    /* 2. Merge deltas into existing server editedActivities */
    const serverMap = new Map(
      (details.editedActivities || []).map((item) => [
        item.activityId,
        { ...item },
      ])
    );

    deltaMap.forEach((delta, activityId) => {
      const existing = serverMap.get(activityId) || { activityId };
      serverMap.set(activityId, { ...existing, ...delta });
    });

    const editedActivities = Array.from(serverMap.values());

    /* 3. Nothing to do? */
    if (!editedActivities.length) {
      setEditMode(false);
      return;
    }

    try {
      // ADD THIS: Calculate new vegNonVeg status before patching
      const sessionTemplate = await getSessionTemplateById(
        details.sessionTemplateId
      );

      // Get all non-removed activities' vegNonVeg values using hierarchical priority
      const activeActivities =
        details.activities?.filter(
          (activity) => activity.status !== "REMOVED"
        ) || [];

      const vegNonVegPromises = activeActivities.map(async (activity) => {
        return await getActivityVegNonVegWithPriority(
          activity.activityId,
          editedActivities, // Use the new editedActivities we're about to save
          sessionTemplate?.editedActivities
        );
      });

      const vegNonVegValues = await Promise.all(vegNonVegPromises);
      const allVegNonVeg = vegNonVegValues.map(
        (v) => v?.toUpperCase() || "VEG"
      );

      // Apply priority: NONVEG > EGG > VEG
      const priority = { NONVEG: 3, EGG: 2, VEG: 1 };
      const maxPriority = Math.max(
        ...allVegNonVeg.map((v) => priority[v] || 1)
      );
      const finalVegNonVeg =
        Object.keys(priority).find((k) => priority[k] === maxPriority) || "VEG";

      /* 4. Patch with both editedActivities and calculated vegNonVeg */
      await fetch(
        `${API_BASE_URL}/session-instances/${details.sessionInstanceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            editedActivities,
            vegNonVeg: finalVegNonVeg, // ADD THIS LINE
          }),
        }
      );

      // Refresh the session details
      const res = await getSessionDetails(eventData);
      if (res) setDetails(res);
      setEditMode(false);
    } catch (e: any) {
      console.error(e);
      alert("Could not save changes");
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

      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl p-6 relative">
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
            <div className="mt-4 flex-grow overflow-hidden">
              {/* Meal timing section */}
              <div className="flex items-center gap-4 mb-4">
                <p className="text-xl">
                  <strong>Meal Timing:</strong>
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select Timing</option>
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

              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">Food Items</span>
                {!editMode ? (
                  <Button size="small" variant="outlined" onClick={enterEdit}>
                    Edit
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button size="small" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={saveEdit}>
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-auto">
                <table className="min-w-[720px] w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-center">Target</th>
                      <th className="px-3 py-2 text-center">Unit</th>
                      <th className="px-3 py-2 text-center">Target2</th>
                      <th className="px-3 py-2 text-center">Unit2</th>
                      <th className="px-3 py-2 text-center">Veg/Non-Veg</th>
                      <th className="px-3 py-2 text-center">Remove</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(details.activityDetails).map(
                      ([activityInstanceId, act]) => (
                        <tr
                          key={activityInstanceId}
                          className="hover:bg-gray-50"
                        >
                          {/* name */}
                          <td className="px-3 py-2 break-words font-medium">
                            {editMode ? (
                              <input
                                type="text"
                                className="w-full border rounded px-1"
                                value={
                                  draft[activityInstanceId]?.name ?? act.name
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    activityInstanceId,
                                    "name",
                                    e.target.value
                                  )
                                }
                              />
                            ) : (
                              act.name
                            )}
                          </td>

                          {/* description */}
                          <td className="px-3 py-2 break-words text-gray-600">
                            {editMode ? (
                              <textarea
                                className="border rounded px-1"
                                rows={2}
                                value={
                                  draft[activityInstanceId]?.description ??
                                  act.description
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    activityInstanceId,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            ) : (
                              act.description
                            )}
                          </td>

                          {/* target */}
                          <td className="px-3 py-2 text-center">
                            {editMode ? (
                              <input
                                type="number"
                                className="w-full border rounded px-1"
                                value={
                                  draft[activityInstanceId]?.target ??
                                  act.target ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    activityInstanceId,
                                    "target",
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null
                                  )
                                }
                              />
                            ) : (
                              act.target ?? "-"
                            )}
                          </td>

                          {/* unit */}
                          <td className="px-3 py-2 text-center">
                            {editMode ? (
                              <select
                                className="w-full border rounded px-1"
                                value={
                                  draft[activityInstanceId]?.unit ??
                                  act.unit ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    activityInstanceId,
                                    "unit",
                                    e.target.value || null
                                  )
                                }
                              >
                                <option value="">-</option>
                                <option value="weight">Kg</option>
                                <option value="distance">Km</option>
                                <option value="time">Min</option>
                                <option value="repetitions">Reps</option>
                                <option value="grams">g</option>
                                <option value="meter">m</option>
                                <option value="litre">L</option>
                                <option value="millilitre">ml</option>
                                <option value="glasses">glasses</option>
                              </select>
                            ) : act.unit === "weight" ? (
                              "Kg"
                            ) : act.unit === "distance" ? (
                              "Km"
                            ) : act.unit === "time" ? (
                              "Min"
                            ) : act.unit === "repetitions" ? (
                              "Reps"
                            ) : act.unit === "grams" ? (
                              "g"
                            ) : act.unit === "meter" ? (
                              "m"
                            ) : act.unit === "litre" ? (
                              "L"
                            ) : act.unit === "millilitre" ? (
                              "ml"
                            ) : act.unit === "glasses" ? (
                              "glasses"
                            ) : (
                              act.unit || "-"
                            )}
                          </td>

                          {/* target2 */}
                          <td className="px-3 py-2 text-center">
                            {editMode ? (
                              <input
                                type="number"
                                className="w-full border rounded px-1"
                                value={
                                  draft[activityInstanceId]?.target2 ??
                                  act.target2 ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    activityInstanceId,
                                    "target2",
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null
                                  )
                                }
                              />
                            ) : (
                              act.target2 ?? "-"
                            )}
                          </td>

                          {/* unit2 */}
                          <td className="px-3 py-2 text-center">
                            {editMode ? (
                              <select
                                className="w-full border rounded px-1"
                                value={
                                  draft[activityInstanceId]?.unit2 ??
                                  act.unit2 ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    activityInstanceId,
                                    "unit2",
                                    e.target.value || null
                                  )
                                }
                              >
                                <option value="">-</option>
                                <option value="weight">Kg</option>
                                <option value="distance">Km</option>
                                <option value="time">Min</option>
                                <option value="repetitions">Reps</option>
                                <option value="grams">g</option>
                                <option value="meter">m</option>
                                <option value="litre">L</option>
                                <option value="millilitre">ml</option>
                                <option value="glasses">glasses</option>
                              </select>
                            ) : act.unit2 === "weight" ? (
                              "Kg"
                            ) : act.unit2 === "distance" ? (
                              "Km"
                            ) : act.unit2 === "time" ? (
                              "Min"
                            ) : act.unit2 === "repetitions" ? (
                              "Reps"
                            ) : act.unit2 === "grams" ? (
                              "g"
                            ) : act.unit2 === "meter" ? (
                              "m"
                            ) : act.unit2 === "litre" ? (
                              "L"
                            ) : act.unit2 === "millilitre" ? (
                              "ml"
                            ) : act.unit2 === "glasses" ? (
                              "glasses"
                            ) : (
                              act.unit2 || "-"
                            )}
                          </td>

                          {/* vegNonVeg */}
                          <td className="px-3 py-2 text-center">
                            {editMode ? (
                              <select
                                className="w-full border rounded px-1"
                                value={
                                  draft[activityInstanceId]?.vegNonVeg ??
                                  act.vegNonVeg ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    activityInstanceId,
                                    "vegNonVeg",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="VEG">VEG</option>
                                <option value="EGG">EGG</option>
                                <option value="NONVEG">NONVEG</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  act.vegNonVeg === "VEG"
                                    ? "bg-green-100 text-green-800"
                                    : act.vegNonVeg === "EGG"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : act.vegNonVeg === "NONVEG"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {act.vegNonVeg || "VEG"}
                              </span>
                            )}
                          </td>

                          {/* remove */}
                          <td className="px-3 py-2 text-center">
                            <MinusCircle
                              className="w-5 h-5 text-red-500 hover:text-red-600 cursor-pointer mx-auto"
                              onClick={() => {
                                setactivityId(activityInstanceId);
                                setshowConfirmAct(true);
                              }}
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
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
