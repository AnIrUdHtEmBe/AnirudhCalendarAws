import { useContext, useEffect, useRef, useState } from "react";
import "./AllPlans.css";
import { DataContext } from "../store/DataContext";
import { Plus, EyeIcon } from "lucide-react";
import Header from "../planPageComponent/Header";
import { useApiCalls } from "../store/axios";
import { CircularProgress } from "@mui/material";
import SessionGridAllPlans from "./SessionGridAllPlans";
import { enqueueSnackbar } from "notistack";

function AllPlans() {
  const { setSelectComponent, plans_full_api_call, sessions_api_call } =
    useContext(DataContext)!;
  const { getPlansFull, OptimisedPatchPlan, patchPlans } = useApiCalls();

  const planCheckboxRef = useRef<HTMLInputElement>(null);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  const [plans, setPlans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // console.log(sessions);

  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const [previewPlan, setPreviewPlan] = useState<any | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const [rows, setRows] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [edit, setEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const [toggleSessions, setToggleSessions] = useState<boolean>(false);
  const [selectedSessionForPlacement, setSelectedSessionForPlacement] =
    useState<any | null>(null);

  const [updateModal, setUpdateModal] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        await getPlansFull();
      } catch (error) {
        console.error("Error in useEffect:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // console.log(plans_full_api_call);

  // plan cehckbox
  useEffect(() => {
    if (planCheckboxRef.current) {
      planCheckboxRef.current.indeterminate =
        selectedPlanIds.length > 0 && selectedPlanIds.length < plans.length;
    }
  }, [selectedPlanIds, plans.length]);

  const handlePlanStatus = async (btnValue: number) => {
    setLoading(true);
    try {
      let targetPlans = [];

      if (selectedPlanIds.length === plans_full_api_call.length) {
        targetPlans = plans_full_api_call;
      } else {
        targetPlans = plans_full_api_call.filter((p) =>
          selectedPlanIds.includes(p.templateId)
        );
      }

      const templateIds = targetPlans.map((plan) => plan.templateId);
      await OptimisedPatchPlan(templateIds, btnValue);

      // Optionally wait for updated plans to be fetched
      await getPlansFull();

      setPlans(targetPlans); // only update if needed
      setSelectedPlanIds([]);
    } catch (error) {
      console.error("Error in handlePlanDeactivate:", error);
    } finally {
      setLoading(false);
    }
  };

  //  toggeling all plans
  const toggleSelectAllPlans = () => {
    if (selectedPlanIds.length === plans_full_api_call.length) {
      // Unselect all
      setSelectedPlanIds([]);
    } else {
      // Select all
      setSelectedPlanIds(plans_full_api_call.map((p) => p.templateId));
    }
  };
  // toggling one plan
  const toggleSelectOnePlan = (id: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePlanPreviewClick = (plan: any) => {
    setSelectedPlan(plan);
    setSessions(plan.sessions);
    setTitle(plan.title);
    setRows(
      sessions?.length > 0
        ? Math.max(...sessions.map((s) => s.scheduledDay))
        : 28
    );
  };

  useEffect(() => {
    if (sessions.length > 0) {
      setRows(Math.max(...sessions.map((s) => s.scheduledDay)) + 1);
    } else {
      setRows(28);
    }
  }, [sessions]);

  console.log(rows);

  // console.log("Sessions:", sessions);

  useEffect(() => {
    if (
      showPlanModal &&
      previewPlan &&
      (!previewPlan.sessions || previewPlan.sessions.length === 0)
    ) {
      alert("No sessions found for this plan.");
      enqueueSnackbar("No Sessions found for this plan", {
        variant: "error",
        autoHideDuration: 3000,
      });
      setShowPlanModal(false);
    }
  }, [showPlanModal, previewPlan]);

  const handleAddRow = () => {
    setRows((prev) => prev + 7);
  };

  const handleEdit = () => {
    setEdit(!edit);
    setToggleSessions(!toggleSessions);
  };

  const handleSelectedSession = (session: any) => {
    console.log("Session clicked:", session);
    setSelectedSessionForPlacement(session);
  };

  const assignSessionToDay = (day: number) => {
    if (!selectedSessionForPlacement) return;
    const existingSession = sessions.find(
      (session) => session.scheduledDay === day
    );
    if (existingSession) {
      setUpdateModal(day);
    } else {
      const newSession = { ...selectedSessionForPlacement, scheduledDay: day };
      setSessions((prevSessions) => [...prevSessions, newSession]);
    }
  };
  console.log(updateModal);
  const handleUpdateExistingSession = () => {
    setSessions((prevSessions) =>
      prevSessions.filter((session) => session.scheduledDay !== updateModal)
    );

    const newSession = {
      ...selectedSessionForPlacement,
      scheduledDay: updateModal,
    };
    setSessions((prevSessions) => [...prevSessions, newSession]);
  };

  const deleteSessionFormGrid = (day: number) => {
    setSessions((prevSessions) =>
      prevSessions.filter((session) => session.scheduledDay != day)
    );
  };

  const patchNewSession = async () => {
    await patchPlans(selectedPlan.templateId, sessions);
    // console.log("Patching new session:", sessions);
  };
  console.log(sessions);
  console.log(sessions_api_call);
  return (
    <div className="all-plans-container">
      <Header />
      <div className="flex flex-col md:flex-row flex-wrap gap-5 p-5 h-[calc(100vh-350px)]">
        {toggleSessions ? (
          <div className="plan-section md">
            <div className="section-headerr">
              <h2 className="section-title">Sessions</h2>
              <h3 className="all">All</h3>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Session Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Preview</th>
                  </tr>
                </thead>
                {loading ? (
                  <tbody>
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <CircularProgress />
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {sessions_api_call.map((plan) => (
                      <tr
                        key={plan.sessionId}
                        onClick={() => handleSelectedSession(plan)}
                        className={`cursor-pointer hover:bg-gray-100 ${
                          plan.sessionId ===
                          selectedSessionForPlacement?.sessionId
                            ? "selected_session"
                            : ""
                        }`}
                      >
                        <td>{plan.title}</td>
                        <td>{plan?.category || ""}</td>
                        <td>{plan.status}</td>
                        <td>
                          <button>
                            <EyeIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        ) : (
          <div className="plan-section md">
            <div className="section-header">
              <h2 className="section-title">Plans</h2>
              <div className="section-buttons">
                <button
                  className="activate-button"
                  onClick={() => handlePlanStatus(0)}
                  disabled={selectedPlanIds.length === 0}
                >
                  Activate
                </button>
                <button
                  className="icon-button"
                  onClick={() => handlePlanStatus(1)}
                  disabled={selectedPlanIds.length === 0}
                >
                  De-activate
                </button>
                <button
                  className="primary-button"
                  onClick={() => setSelectComponent("/plans")}
                >
                  <Plus size={20} />
                  <span>New Plan</span>
                </button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          plans_full_api_call.length > 0 &&
                          selectedPlanIds.length === plans_full_api_call.length
                        }
                        onChange={toggleSelectAllPlans}
                        ref={planCheckboxRef}
                      />
                    </th>
                    <th>Plan Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>View</th>
                  </tr>
                </thead>
                {loading ? (
                  <tbody>
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <CircularProgress />
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {plans_full_api_call.map((plan) => (
                      <tr
                        key={plan.templateId}
                        className={`${
                          plan.templateId === selectedPlan?.templateId
                            ? "selected_plan"
                            : ""
                        }`}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedPlanIds.includes(plan.templateId)}
                            onChange={() =>
                              toggleSelectOnePlan(plan.templateId)
                            }
                          />
                        </td>
                        <td>{plan.title}</td>
                        <td>{plan?.category || ""}</td>
                        <td>{plan.status}</td>
                        <td>
                          <button onClick={() => handlePlanPreviewClick(plan)}>
                            <EyeIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Grid Of sessions*/}
        <div className="grid-section md">
          <div className="grid-section-header">
            <div className="grid-section-header-title">
              {title || "plan Name"}
            </div>
            <button
              className={`px-4 py-2 rounded text-white transition
    ${
      !edit || sessions.length === 0
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-green-300 hover:bg-green-400"
    }
  `}
              onClick={patchNewSession}
              disabled={!edit || sessions.length === 0}
            >
              Save
            </button>
          </div>
          <SessionGridAllPlans
            sessions={sessions}
            rows={rows}
            editMode={edit}
            selectedSession={selectedSessionForPlacement}
            onAssignSession={assignSessionToDay}
            deleteSessionFormGrid={deleteSessionFormGrid}
          />

          <div className="grid-section-footer">
            {edit ? (
              <button
                className="grid-section-footer-add-button"
                onClick={handleAddRow}
              >
                <Plus size={20} />
                <span>Add Row</span>
              </button>
            ) : (
              <button></button>
            )}

            {sessions.length > 0 && (
              <button
                className="grid-section-footer-edit-button"
                onClick={handleEdit}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {updateModal !== null && (
        <div className="update-modal-overlay">
          <div className="update-modal">
            <p className="update-modal-text">
              Are you sure you want to replace the session for day {updateModal}
              ?
            </p>
            <div className="update-modal-actions">
              <button
                className="update-modal-btn yes"
                onClick={() => {
                  handleUpdateExistingSession();
                  setUpdateModal(null);
                }}
              >
                Yes
              </button>
              <button
                className="update-modal-btn no"
                onClick={() => setUpdateModal(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllPlans;
