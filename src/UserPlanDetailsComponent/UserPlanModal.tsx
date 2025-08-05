import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Modal from "@mui/material/Modal";
import axios from "axios";

// Define types for activity and session objects based on your data structure

interface Activity {
  activityInstanceId: string;
  name?: string;
  status?: string;
  unit?: string;
  description?: string;
  target?: number | string | null;
  customReps?: string | null;
}

interface SessionInstance {
  sessionInstanceId: string;
  sessionTemplateId: string;
  sessionTemplateTitle: string;
  activities: Activity[];
}

interface PlanInstance {
  sessionInstances: SessionInstance[];
}

interface UserPlanModalProps {
  open: boolean;
  handleClose: () => void;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
}

type ApiResponse = PlanInstance[];

/**
 * Fetch sessions from API
 */
// function fetchSessions(params: {
//   userId: string;
//   startDate: string;
//   endDate: string;
// }): Promise<ApiResponse> {
//   return axios.get(
//     `https://forge-play-backend.forgehub.in/humans/${params.userId}/${encodeURIComponent(
//       params.startDate,
//     )}${encodeURIComponent(params.endDate)}`,
//   ).then((res) => {

//     return res.json() as Promise<ApiResponse>;
//   });
// }

const fetchSessions = async (params: {
  userId: string;
  startDate: string;
  endDate: string;
}) => {
  const apiResponse = await axios.get(
    `https://forge-play-backend.forgehub.in/humans/${
      params.userId
    }/plan-instances-within-date?start=${encodeURIComponent(
      params.startDate
    )}&end=${encodeURIComponent(params.endDate)}`
  );

  return apiResponse.data;
};

/**
 * Props passed to ActivityModal
 */

const UserPlanModal: React.FC<UserPlanModalProps> = ({
  open,
  handleClose,
  userId,
  userName,
  startDate,
  endDate,
}) => {
  const [searchParams] = useSearchParams();

  // const userId = searchParams.get("userId") ?? "";
  // const startDate = searchParams.get("startDate") ?? "";
  // const endDate = searchParams.get("endDate") ?? "";

  const [sessions, setSessions] = useState<SessionInstance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId && startDate && endDate) {
      setLoading(true);
      setError(null);
      fetchSessions({ userId, startDate, endDate })
        .then((data) => {
          // Flatten planInstances -> sessionInstances, filtering out falsy values
          const flatSessions = data
            .flatMap(
              (plan: { sessionInstances: any }) => plan.sessionInstances ?? []
            )
            .filter(Boolean);
          setSessions(flatSessions);
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch sessions");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // If data missing or modal closed, clear sessions
      setSessions([]);
    }
  }, [open, userId, startDate, endDate]);

  return (
    <Modal open={open} onClose={handleClose}>
      <div
        className="activity-modal-container font-semibold"
        style={{
          backgroundColor: "white",
          maxWidth: "80vw",
          maxHeight: "80vh",
          overflowY: "auto",
          margin: "auto",
          padding: "1rem",
          borderRadius: "8px",
          top: "10%",
          position: "relative",
        }}
      >
        <h2 className="w-fit font-bold bg-blue-200 mb-2 p-1 rounded-sm">
          {userName}'s - Session Activities
        </h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && sessions.length === 0 && (
          <p>No sessions available for the selected dates.</p>
        )}
        {!loading &&
          !error &&
          sessions.map((session) => (
            <div
              key={session.sessionInstanceId}
              className="session-section"
              style={{ marginBottom: "1.5rem" }}
            >
              <h3 className="w-fit bg-green-300 p-1 rounded-sm">
                {session.sessionTemplateTitle} ({session.sessionTemplateId})
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "0.5rem",
                  tableLayout: "fixed", // Fix column widths
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        width: "20%",
                        border: "1px solid #ccc",
                        padding: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        width: "15%",
                        border: "1px solid #ccc",
                        padding: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        width: "15%",
                        border: "1px solid #ccc",
                        padding: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      Unit
                    </th>
                    <th
                      style={{
                        width: "30%",
                        border: "1px solid #ccc",
                        padding: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        width: "20%",
                        border: "1px solid #ccc",
                        padding: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      Target/Reps
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {session.activities.map((activity) => (
                    <tr key={activity.activityInstanceId}>
                      <td
                        style={{ border: "1px solid #ccc", padding: "0.5rem" }}
                      >
                        {activity.name ?? "-"}
                      </td>
                      <td
                        style={{ border: "1px solid #ccc", padding: "0.5rem" }}
                      >
                        {activity.status ?? "-"}
                      </td>
                      <td
                        style={{ border: "1px solid #ccc", padding: "0.5rem" }}
                      >
                        {activity.unit ?? "-"}
                      </td>
                      <td
                        style={{ border: "1px solid #ccc", padding: "0.5rem" }}
                      >
                        {activity.description ?? "-"}
                      </td>
                      <td
                        style={{ border: "1px solid #ccc", padding: "0.5rem" }}
                      >
                        {activity.target ?? activity.customReps ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        <button
          onClick={handleClose}
          className="
    border-2 border-blue-400 rounded-lg shadow-md px-3 py-1 font-semibold text-blue-700 bg-blue-200 cursor-pointer transition duration-150 w-fit hover:bg-blue-100 hover:shadow-xl hover:scale-105 hover:border-blue-600 hover:ring-2 hover:ring-blue-300 active:scale-95 select-none
  "
          style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default UserPlanModal;
