import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Activity_Api_call,
  DataContext,
  Session_Api_call,
} from "../store/DataContext";
import { API_BASE_URL, useApiCalls } from "../store/axios";
import { Autocomplete, TextField, Button } from "@mui/material";
import { Dumbbell, MinusCircle, Plus } from "lucide-react";
import "./styles/EventModal.css";
import YouTubeVideoModal from "../Youtube/YouTubeVideoModal";

// ----------  merge helper  ----------
const pickEdited = (editedArr: any[], activityId: string) =>
  editedArr?.find((e) => e.activityId === activityId) || {};
/* ----------  tiny helper ---------- */
const prettyUnit = (u: string | null) => {
  if (!u) return "";
  return u === "weight"
    ? "Kg"
    : u === "distance"
    ? "Km"
    : u === "time"
    ? "Min"
    : u === "repetitions"
    ? "Reps"
    : u;
};

export default function EventModal({
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
  const { getActivities, patchSession } = useApiCalls(); // <— added patchSession
  const { activities_api_call } = context;

  /* ----------  local state ---------- */
  const [details, setDetails] = useState<any>({});
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({}); // keyed by activityInstanceId
  const [template, setTemplate] = useState<any>(null);
  const [youtubeModal, setYoutubeModal] = useState({
    isOpen: false,
    videoUrl: "",
    title: "",
  });
  /* ----------  initial fetch ---------- */
  useEffect(() => {
    getActivities();
    fetchSessionDetails();
  }, []);

  const fetchSessionDetails = async () => {
    const res = await getSessionDetails(eventData);
    if (res) setDetails(res);
  };

  /* ----------  enter/exit edit ---------- */
  const enterEdit = () => {
    const clone: Record<string, any> = {};
    Object.entries(details.activityDetails || {}).forEach(
      ([actInstId, act]: any) => {
        clone[actInstId] = {
          activityId: act.activityId,
          name: act.name, // Add this
          description: act.description, // Add this
          videoLink: act.videoLink, // Add this
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

  /* ----------  save ---------- */
  /* ----------  add axios import at top ---------- */

  /* ----------  inside the component ---------- */
  const saveEdit = async () => {
    /* 1. Build a delta object per activityId ----------------------------- */
    const deltaMap = new Map<string, any>();

    Object.entries(draft).forEach(([activityInstanceId, d]) => {
      const original = details.activityDetails[activityInstanceId];
      if (!original) return;

      const changes: any = { activityId: d.activityId };
      // Inside the Object.entries(draft).forEach loop, add these checks:
      if (d.name !== original.name) changes.name = d.name;
      if (d.description !== original.description)
        changes.description = d.description;
      if (d.videoLink !== original.videoLink) changes.videoLink = d.videoLink;
      if (d.target !== original.target) changes.target = d.target;
      if (d.unit !== original.unit) changes.unit = d.unit;
      if (d.target2 !== original.target2) changes.target2 = d.target2;
      if (d.unit2 !== original.unit2) changes.unit2 = d.unit2;

      if (Object.keys(changes).length > 1) {
        deltaMap.set(d.activityId, changes);
      }
    });

    /* 2. Merge deltas into existing server editedActivities -------------- */
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

    /* 3. Nothing to do? ------------------------------------------------- */
    if (!editedActivities.length) {
      setEditMode(false);
      return;
    }
    try {
      /* 4. Patch ---------------------------------------------------------- */
      await axios.patch(
        `${API_BASE_URL}/session-instances/${details.sessionInstanceId}`,
        { editedActivities }
      );

      await fetchSessionDetails();
      setEditMode(false);
    } catch (e: any) {
      console.error(e);
      alert("Could not save changes");
    }
  };

  /* ----------  field onChange ---------- */
  const updateDraft = (
    actInstId: string,
    field:
      | "name"
      | "description"
      | "videoLink"
      | "target"
      | "unit"
      | "target2"
      | "unit2", // Add the new fields
    value: any
  ) => {
    setDraft((prev) => ({
      ...prev,
      [actInstId]: { ...prev[actInstId], [field]: value },
    }));
  };

  /* ----------  rest of your code untouched ---------- */
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmAct, setshowConfirmAct] = useState(false);
  const [activityId, setactivityId] = useState("");
  const [removalNote, setRemovalNote] = useState("");

  const {
    getSessionById,
    getActivityById,
    getSessionInstanceById,
    RemoveSessionInPlanInstance,
    RemoveActivityFromSession,
    AddActivityToSession,
  } = useApiCalls();

  const getSessionDetails = async (eventData: any) => {
    if (!eventData?.extendedProps?.sessionInstanceId) return null;

    const sid = eventData.extendedProps.sessionInstanceId;

    /* 1. get the instance --------------------------------------------------- */
    const ses = await getSessionInstanceById(sid);

    /* 2. get its template --------------------------------------------------- */
    const { data: template } = await axios.get(
      `${API_BASE_URL}/session-templates/${ses.sessionTemplateId}`
    );

    /* 3. tiny helper -------------------------------------------------------- */
    const pick = (arr: any[] = [], id: string) =>
      arr.find((e) => e.activityId === id) || {};

    /* 4. build activityDetails with correct precedence ---------------------- */
    ses.activityDetails = {};
    await Promise.all(
      ses.activities.map(async (a: any) => {
        if (a.status === "REMOVED") return;

        const base = await getActivityById(a.activityId);
        if (!base) return;

        const merged = {
          ...base, // base activity
          ...pick(template.editedActivities, a.activityId), // template overrides
          ...pick(ses.editedActivities, a.activityId), // instance overrides (win)
          activityId: a.activityId,
          activityInstanceId: a.activityInstanceId,
        };

        ses.activityDetails[a.activityInstanceId] = merged;
      })
    );

    return ses;
  };
  /* ----------  remove session ---------- */
  const handleRemove = async (note: string) => {
    const ok = await RemoveSessionInPlanInstance(
      sessionId,
      planInstanceId,
      note
    );
    if (ok) {
      setShowConfirm(false);
      getData();
      await regenerate();
      onClose();
    }
  };

  /* ----------  remove activity ---------- */
  const handleRemoveAct = async (id: string, note: string) => {
    const ok = await RemoveActivityFromSession(
      id,
      sessionId,
      planInstanceId,
      note
    );
    if (ok) {
      setshowConfirmAct(false);
      getData();
      onClose();
    }
  };

  /* ----------  add activity ---------- */
  const [activityForTable, setActivityForTable] = useState<Activity_Api_call>();
  const [selectedActivities, setSelectedActivities] = useState<{
    [id: number]: string;
  }>({});

  const updateTheActivitityById = async (activityId: string, index: number) => {
    const act = await getActivityById(activityId);
    if (act) setActivityForTable(act);
  };
  const handleActivitySelectChange = (id: number, value: string) => {
    setSelectedActivities((p) => ({ ...p, [id]: value }));
    updateTheActivitityById(value, id);
  };
  const handleActivityAdd = async (e: any) => {
    e.preventDefault();
    if (!activityForTable?.activityId) return;
    const ok = await AddActivityToSession(
      activityForTable.activityId,
      sessionId,
      planInstanceId,
      ""
    );
    if (ok) {
      getData();
      onClose();
    }
  };

  /* ----------  UI ---------- */
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xs">
      {/* confirm modals … */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to remove this session?
            </h2>
            <textarea
              value={removalNote}
              onChange={(e) => setRemovalNote(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 mb-4 text-sm"
              placeholder="Reason (20-100 chars)"
            />
            <p className="text-right text-sm text-gray-500 mb-4">
              {removalNote.length}/100
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowConfirm(false);
                  setRemovalNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={removalNote.trim().length < 20}
                onClick={() => handleRemove(removalNote)}
                color="error"
                variant="contained"
              >
                Yes, Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {showConfirmAct && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur  bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Remove activity?
            </h2>
            <textarea
              value={removalNote}
              onChange={(e) => setRemovalNote(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 mb-4 text-sm"
              placeholder="Reason (10-50 chars)"
            />
            <p className="text-right text-sm text-gray-500 mb-4">
              {removalNote.length}/50
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setshowConfirmAct(false);
                  setRemovalNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={removalNote.trim().length < 10}
                onClick={() => handleRemoveAct(activityId, removalNote)}
                color="error"
                variant="contained"
              >
                Yes, Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ----------  main modal ---------- */}
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl max-h-[calc(100vh-4rem)] p-6 relative my-4 sm:my-6 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
        >
          &times;
        </button>

        <p className="text-3xl font-bold mb-2">
          {eventData.title === "DUMMY" ? "ACTIVITIES" : eventData.title}
        </p>
        <p className="text-xl">
          <strong>Plan Name:</strong>{" "}
          {eventData.title === "DUMMY"
            ? details?.activityDetails &&
              `(${Object.keys(details.activityDetails).length} activities)`
            : eventData.extendedProps.planTitle === "alacartePH"
            ? "alacarte plan"
            : eventData.extendedProps.planTitle}
        </p>

        {/* ----------  table ---------- */}
        {details?.activityDetails && (
          <div className="mt-4 flex-grow overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">Activities</span>
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

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* header */}
              <div className="grid grid-cols-12 gap-2 bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-2">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Description</div>
                <div className="col-span-1">Target</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-1">Target2</div>
                <div className="col-span-1">Unit2</div>
                <div className="col-span-2">Video</div>
                <div className="col-span-1 text-center">Remove</div>
              </div>

              {/* body */}
              <div className="max-h-[calc(100vh-28rem)] overflow-y-auto">
                {Object.entries(details.activityDetails).map(
                  ([activityInstanceId, act]: any) => {
                    const d = editMode
                      ? draft[activityInstanceId] || {}
                      : {
                          target: act.target,
                          unit: act.unit,
                          target2: act.target2,
                          unit2: act.unit2,
                        };
                    return (
                      <div
                        key={activityInstanceId}
                        className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b border-gray-100 hover:bg-gray-50 text-sm"
                      >
                        {/* Replace the existing name cell */}
                        <div className="col-span-3 font-medium">
                          {editMode ? (
                            <input
                              type="text"
                              className="w-full border rounded px-1"
                              value={d.name ?? ""}
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
                        </div>
                        {/* Replace the existing description cell */}
                        <div className="col-span-2 text-gray-600">
                          {editMode ? (
                            <textarea
                              className="w-full border rounded px-1"
                              rows={2}
                              value={d.description ?? ""}
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
                        </div>

                        {/* target */}
                        <div className="col-span-1">
                          {editMode ? (
                            <input
                              type="number"
                              className="w-full border rounded px-1"
                              value={d.target ?? ""}
                              onChange={(e) =>
                                updateDraft(
                                  activityInstanceId,
                                  "target",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          ) : (
                            d.target ?? "-"
                          )}
                        </div>

                        {/* unit */}
                        <div className="col-span-1">
                          {editMode ? (
                            <select
                              className="w-full border rounded px-1"
                              value={d.unit ?? ""}
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
                            </select>
                          ) : (
                            prettyUnit(d.unit)
                          )}
                        </div>

                        {/* target2 */}
                        <div className="col-span-1">
                          {editMode ? (
                            <input
                              type="number"
                              className="w-full border rounded px-1"
                              value={d.target2 ?? ""}
                              onChange={(e) =>
                                updateDraft(
                                  activityInstanceId,
                                  "target2",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          ) : (
                            d.target2 ?? "-"
                          )}
                        </div>

                        {/* unit2 */}
                        <div className="col-span-1">
                          {editMode ? (
                            <select
                              className="w-full border rounded px-1"
                              value={d.unit2 ?? ""}
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
                            </select>
                          ) : (
                            prettyUnit(d.unit2)
                          )}
                        </div>

                        {/* video */}
                        <div className="col-span-2">
                          {editMode ? (
                            <input
                              type="url"
                              className="w-full border rounded px-1 text-sm"
                              placeholder="YouTube URL"
                              value={d.videoLink ?? ""}
                              onChange={(e) =>
                                updateDraft(
                                  activityInstanceId,
                                  "videoLink",
                                  e.target.value
                                )
                              }
                            />
                          ) : act.videoLink ? (
                            <button
                              onClick={() =>
                                setYoutubeModal({
                                  isOpen: true,
                                  videoUrl: act.videoLink,
                                  title: act.name,
                                })
                              }
                              className="text-blue-600 hover:underline truncate block bg-transparent border-none cursor-pointer"
                            >
                              Watch
                            </button>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>

                        {/* remove */}
                        <div className="col-span-1 flex justify-center">
                          <MinusCircle
                            className="w-5 h-5 text-red-500 hover:text-red-600 cursor-pointer"
                            onClick={() => {
                              setactivityId(activityInstanceId);
                              setshowConfirmAct(true);
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------  bottom buttons ---------- */}
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          <Button
            id="remove_eventmodal"
            color="error"
            variant="contained"
            onClick={() => setShowConfirm(true)}
          >
            Remove Session
          </Button>
        </div>

        {/* ----------  add activity row ---------- */}
        <div className="mt-4 flex items-center gap-4">
          <Autocomplete
            options={activities_api_call}
            getOptionLabel={(o) => o.name || ""}
            value={
              activities_api_call.find(
                (a) => a.activityId === selectedActivities[0]
              ) || null
            }
            onChange={(_, nv) => {
              handleActivitySelectChange(0, nv ? nv.activityId : "");
              setActivityForTable(nv || undefined);
            }}
            renderInput={(p) => (
              <TextField
                {...p}
                label="Select Activity"
                size="small"
                sx={{ width: 250 }}
              />
            )}
            isOptionEqualToValue={(o, v) => o.activityId === v?.activityId}
          />
          <Button
            variant="contained"
            onClick={handleActivityAdd}
            disabled={!activityForTable?.activityId}
          >
            Add Activity
          </Button>
        </div>
        <YouTubeVideoModal
          isOpen={youtubeModal.isOpen}
          onClose={() =>
            setYoutubeModal((prev) => ({ ...prev, isOpen: false }))
          }
          videoUrl={youtubeModal.videoUrl}
          title={youtubeModal.title}
        />
      </div>
    </div>
  );
}
