import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DateRangePicker from "./DateRangePicker";
import { API_BASE_URL2, useApiCalls } from "../store/axios";
import dayjs from "dayjs";
import EventCalendar from "./EventCalendar";
import Header from "./Header";
import { setSelectComponent, DataContext } from "../store/DataContext";
import { Eye, X } from "lucide-react";
import { Button, CircularProgress } from "@mui/material";

function SeePlan() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useApiCalls must be used within a DataProvider");
  }

  const {
    getPlansForInterval,
    getLatestPlanAssessment,
    assessments_intsnce_fetching,
  } = useApiCalls();
  const {
    setSelectComponent,
    assessmentInstance_expanded_Api_call,
    clearUserSpecificData, // ADD: Get the clear function from context
    setAssessmentInstance_expanded_Api_call, // ADD: Direct setter for assessments
  } = context;

  // Original states
  const [startDate, setStartDate] = useState(
    dayjs().year(2025).month(0).date(1)
  );
  const [endDate, setEndDate] = useState(dayjs().year(2025).month(11).date(31));
  const [planForAlacatre, setPlanForAlacatre] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.userId || "defaultUserId";
  const [data, setData] = React.useState(null);
  const [LatestPAdetails, setLatestPAdetails] = useState(null);
  const [userDate, setUserDate] = useState(null);

  // Questions sidebar states
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  // FIXED: Track current user to detect changes - initialize with null to ensure initial fetch
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [planDataLoaded, setPlanDataLoaded] = useState(false);
  // Local state for assessments
  const [localAssessments, setLocalAssessments] = useState([]); // Local state for assessments
  const [nutritionKYC, setNutritionKYC] = useState(null);

  const getData = async () => {
    const res = await getPlansForInterval(
      dayjs(startDate).format("YYYY-MM-DD"),
      dayjs(endDate).format("YYYY-MM-DD"),
      userId
    );
    const res1 = await getLatestPlanAssessment(userId);
    console.log(res1, "asoinfewufbwi");
    setLatestPAdetails(res1);
    setData(res);
    setPlanDataLoaded(true); // Mark plan data as loaded
  };

  // FIXED: Fetch assessments with proper user handling
  const fetchAssessments = async () => {
    setAssessmentsLoading(true);
    try {
      const assessmentInstanceIdArray = user.assessments;
      if (assessmentInstanceIdArray && assessmentInstanceIdArray.length > 0) {
        await assessments_intsnce_fetching(assessmentInstanceIdArray);
        // Update local state with context data
        setLocalAssessments(assessmentInstance_expanded_Api_call || []);
      } else {
        // User has no assessments, ensure both local and context are cleared
        console.log("👤 User has no assessments, clearing all assessment data");
        setLocalAssessments([]);
        if (setAssessmentInstance_expanded_Api_call) {
          setAssessmentInstance_expanded_Api_call([]);
        }
      }
    } catch (error) {
      console.error("Error fetching assessment data:", error);
      setLocalAssessments([]); // Clear on error
    } finally {
      setAssessmentsLoading(false);
    }
  };

  // MAIN FIX: Proper user change detection and initial load handling
  useEffect(() => {
    const handleUserAndData = async () => {
      // Check if this is initial load or user has changed
      if (isInitialLoad || currentUserId !== userId) {
        console.log(
          `🔄 ${
            isInitialLoad ? "Initial load" : "User changed"
          } - Loading data for user: ${userId}`
        );

        // IMMEDIATELY clear assessment data both in context and local state
        console.log("🧹 Clearing assessment data immediately");
        setLocalAssessments([]); // Clear local state immediately

        if (clearUserSpecificData) {
          clearUserSpecificData();
        }

        // Also try to clear context data directly if setter is available
        if (setAssessmentInstance_expanded_Api_call) {
          setAssessmentInstance_expanded_Api_call([]);
        }

        if (!isInitialLoad && currentUserId !== userId) {
          // Reset plan data loaded state on user change
          setPlanDataLoaded(false);
        }

        // Reset states
        setCurrentUserId(userId);
        setSelectedAssessment(null);
        setShowModal(false);
        setAssessmentsLoading(false); // Reset loading state

        // Fetch plan data first
        await getData();

        await fetchNutritionKYC();
        // Mark initial load as complete
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    };

    handleUserAndData();
  }, [userId, isInitialLoad]);

  // NEW: Separate effect to fetch assessments only after plan data is loaded
  useEffect(() => {
    if (planDataLoaded && !isInitialLoad) {
      console.log(
        "📊 Plan data loaded, now fetching assessments for user:",
        userId
      );

      // Check if user has assessments before fetching
      const assessmentInstanceIdArray = user.assessments;
      if (assessmentInstanceIdArray && assessmentInstanceIdArray.length > 0) {
        fetchAssessments();
      } else {
        console.log("👤 User has no assessments, keeping cleared state");
        setLocalAssessments([]); // Ensure local state is cleared
        setAssessmentsLoading(false); // Ensure loading state is false
      }
    }
  }, [planDataLoaded, userId]);

  // NEW: Sync local assessments with context data when context changes
  useEffect(() => {
    if (
      assessmentInstance_expanded_Api_call &&
      assessmentInstance_expanded_Api_call.length > 0
    ) {
      // Sort assessments by submittedOn in descending order (latest first)
      const sortedAssessments = [...assessmentInstance_expanded_Api_call].sort(
        (a, b) => {
          if (!a.submittedOn) return 1; // Move items without submittedOn to end
          if (!b.submittedOn) return -1; // Move items without submittedOn to end
          return new Date(b.submittedOn) - new Date(a.submittedOn);
        }
      );
      setLocalAssessments(sortedAssessments);
    }
  }, [assessmentInstance_expanded_Api_call]);

  // FIXED: Separate effect for date changes (don't refetch assessments on date change)
  useEffect(() => {
    if (startDate && endDate && !isInitialLoad) {
      getData(); // This will trigger assessment fetching via planDataLoaded effect
    }
  }, [startDate, endDate]);

  useEffect(() => {
    console.log("Data updated in parent:", data);
    if (data) {
      data.map((item: React.SetStateAction<null>) => {
        if (item.planTitle == "alacartePH") {
          setPlanForAlacatre(item);
        }
      });
    }
  }, [data]);

  const handleEventClick = (eventData: React.SetStateAction<null>) => {
    setUserDate(eventData);
  };

  const handlePreviewClick = (assessment: React.SetStateAction<null>) => {
    setSelectedAssessment(assessment);
    setShowModal(true);
  };

  const fetchNutritionKYC = async () => {
    try {
      console.log("Fetching nutrition KYC for userId:", userId);
      const response = await fetch(`${API_BASE_URL2}/human/${userId}`);
      const data = await response.json();

      if (data && data.nutritionKYC) {
        console.log("Nutrition KYC data:", data.nutritionKYC);
        setNutritionKYC(data.nutritionKYC);
      } else {
        setNutritionKYC(null);
      }
    } catch (error) {
      console.error("Error fetching nutrition KYC:", error);
      setNutritionKYC(null);
    }
  };

  const getNutritionType = (value: never) => {
    switch (value) {
      case 0:
        return { type: "VEG", color: "bg-green-500 text-white" };
      case 1:
        return { type: "EGG", color: "bg-amber-500 text-white" };
      case 2:
        return { type: "NON VEG", color: "bg-red-500 text-white" };
      default:
        return { type: "NIL", color: "bg-gray-400 text-white" };
    }
  };

  const renderNutritionKYC = () => {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    if (!nutritionKYC) {
      return <span className="text-gray-500">Not Available</span>;
    }

    return (
      <div className="flex items-center gap-0.5 whitespace-nowrap">
        {days.map((day) => {
          const value = nutritionKYC[day];
          const nutrition = getNutritionType(value);
          return (
            <div
              key={day}
              className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${nutrition.color}`}
              title={`${day}: ${nutrition.type}`}
            >
              <span className="text-xs">{day.slice(0, 3)}</span>
              {/* <span className="text-xs">{nutrition.type}</span> */}
            </div>
          );
        })}
      </div>
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAssessment(null);
  };

  if (!LatestPAdetails)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
      </div>
    );

  return (
    <div className="bg-white h-screen w-full flex overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header and User Info Section - Fixed height - MODIFIED FOR COMPACT DESIGN */}
        <div className="flex-shrink-0 p-1 border-b border-gray-100">
          {/* Header row - more compact */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <Header userData={user}></Header>
            </div>
            <div className="shrink-0">
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

          {/* Compact info section - single row with dividers */}
          <div className="w-full">
            <div className="flex items-center gap-3 text-xs text-gray-700 flex-wrap">
              {/* Plan info */}
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-800">Plan:</span>
                <span className="truncate max-w-[120px]">
                  {LatestPAdetails?.latestPlanName || "None"}
                </span>
              </div>

              <span className="text-gray-300">|</span>

              {/* Assessment info */}
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-800">Assessment:</span>
                <span
                  className="underline text-blue-600 hover:text-blue-800 cursor-pointer transition-colors truncate max-w-[140px]"
                  onClick={() => {
                    setSelectComponent("responses");
                    navigate("/response", {
                      state: {
                        assessmentInstanceId:
                          LatestPAdetails?.latestAssessmentId,
                      },
                    });
                  }}
                >
                  {LatestPAdetails?.latestAssessmentName || "None"} -{" "}
                  {LatestPAdetails?.latestAssessmentScore || 0}
                </span>
              </div>

              <span className="text-gray-300">|</span>

              {/* Height and Weight info - inline */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">H:</span>
                <span>{user?.height || "-"}cm</span>
                <span className="font-semibold text-gray-800 ml-1">W:</span>
                <span>{user?.weight || "-"}kg</span>
              </div>

              <span className="text-gray-300">|</span>

              {/* Problems info */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="font-semibold text-gray-800">Problems:</span>
                <span className="truncate">
                  {user?.healthCondition || "None"}
                </span>
                <span className="font-semibold text-gray-800">
                  Nutrition KYC:
                </span>
                {renderNutritionKYC()}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section - Scrollable container with proper overflow handling */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full w-full overflow-auto p-2 sm:p-3">
            <div className="min-w-[600px] h-full">
              <EventCalendar
                data={data}
                onEventClick={handleEventClick}
                getData={getData}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Assessments */}
      <div className="bg-white shadow-2xl border-l border-gray-200 flex flex-col w-64 lg:w-72 xl:w-80 h-full max-h-screen overflow-hidden shrink-0">
        {!showModal ? (
          <>
            {/* Sidebar Header */}
            <div className="flex justify-between items-center p-2 lg:p-3 border-b border-gray-200 bg-gray-50 shrink-0">
              <div>
                <h2 className="text-sm lg:text-base font-bold text-gray-800">
                  Assessments
                </h2>
              </div>
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 lg:p-3">
              {assessmentsLoading ? (
                <div className="flex flex-col justify-center items-center py-8">
                  <CircularProgress size={24} style={{ color: "#2563eb" }} />
                  <p className="mt-3 text-xs text-gray-600">
                    Loading assessments...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {localAssessments && localAssessments.length > 0 ? (
                    <div className="space-y-1">
                      {localAssessments.map((assessment, index) => (
                        <div
                          key={`${assessment.assessmentInstanceId}-${userId}-${index}`}
                          className="bg-white border border-gray-200 rounded-md p-2 hover:shadow-md hover:border-blue-200 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                                #{index + 1}
                              </span>
                              <span className="text-xs font-medium text-gray-800 truncate flex-1">
                                {assessment.template.name}
                              </span>
                              <span className="text-xs text-gray-500 shrink-0">
                                {assessment.answers?.length || 0} qs
                              </span>
                            </div>
                            {assessment.template.questions.length > 0 && (
                              <button
                                className="cursor-pointer text-blue-500 hover:text-blue-700 p-1 rounded transition-colors shrink-0"
                                onClick={() => handlePreviewClick(assessment)}
                              >
                                <Eye size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                        <Eye size={16} className="text-gray-400" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">
                        No Assessments
                      </h4>
                      <p className="text-gray-500 text-xs">
                        No completed assessments yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Modal for Assessment Preview */
          selectedAssessment && (
            <div className="flex flex-col h-full bg-white">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-2 lg:p-3 border-b border-gray-200 bg-gray-50 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    className="cursor-pointer text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white hover:shadow-md transition-all duration-200"
                    onClick={closeModal}
                  >
                    <X size={16} />
                  </button>
                  <h3 className="text-sm font-bold text-gray-800 break-words leading-tight">
                    Assessment Preview
                  </h3>
                </div>
              </div>

              {/* Assessment Name */}
              <div className="p-2 lg:p-3 border-b border-gray-100 bg-blue-50 shrink-0">
                <h4 className="text-xs font-semibold text-blue-800 break-words">
                  {selectedAssessment?.template?.name}
                </h4>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-2 lg:p-3 space-y-3">
                  {selectedAssessment?.answers?.map(
                    (
                      answer: {
                        questionId: React.Key | null | undefined;
                        isRequired: any;
                        mainText:
                          | string
                          | number
                          | boolean
                          | React.ReactElement<
                              any,
                              string | React.JSXElementConstructor<any>
                            >
                          | Iterable<React.ReactNode>
                          | React.ReactPortal
                          | null
                          | undefined;
                        value: any;
                      },
                      index: number
                    ) => (
                      <div
                        key={answer.questionId}
                        className="border-b border-gray-200 pb-3 last:border-b-0"
                      >
                        {/* Question with number and required indicator */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700 shrink-0">
                            {index + 1}
                            {answer.isRequired && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </span>
                          <p className="text-sm text-gray-800 break-words leading-relaxed flex-1">
                            {answer.mainText}
                          </p>
                        </div>

                        {/* Answer */}
                        <div className="ml-6">
                          <div className="bg-blue-50 rounded-md p-2 border border-blue-200">
                            <p className="text-sm text-blue-800 break-words">
                              {answer.value || "No answer provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default SeePlan;