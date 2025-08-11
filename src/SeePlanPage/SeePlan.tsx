import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DateRangePicker from "./DateRangePicker";
import { useApiCalls } from "../store/axios";
import dayjs from "dayjs";
import EventCalendar from "./EventCalendar";
import Header from "./Header";
import { setSelectComponent, DataContext } from '../store/DataContext'
import { Eye, X } from "lucide-react";
import { Button, CircularProgress } from "@mui/material";

function SeePlan() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useApiCalls must be used within a DataProvider");
  }
  
  const { getPlansForInterval, getLatestPlanAssessment, assessments_intsnce_fetching } = useApiCalls();
  const { 
    setSelectComponent, 
    assessmentInstance_expanded_Api_call,
    clearUserSpecificData,  // ADD: Get the clear function from context
    setAssessmentInstance_expanded_Api_call // ADD: Direct setter for assessments
  } = context;
  
  // Original states
  const [startDate, setStartDate] = useState(dayjs().year(2025).month(0).date(1));
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
  const [localAssessments, setLocalAssessments] = useState([]); // Local state for assessments

  const getData = async () => {
    const res = await getPlansForInterval(dayjs(startDate).format("YYYY-MM-DD"), dayjs(endDate).format("YYYY-MM-DD"), userId);
    const res1 = await getLatestPlanAssessment(userId)
    console.log(res1, "asoinfewufbwi")
    setLatestPAdetails(res1)
    setData(res);
    setPlanDataLoaded(true); // Mark plan data as loaded
  }

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
        console.log('👤 User has no assessments, clearing all assessment data');
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
        console.log(`🔄 ${isInitialLoad ? 'Initial load' : 'User changed'} - Loading data for user: ${userId}`);
        
        // IMMEDIATELY clear assessment data both in context and local state
        console.log('🧹 Clearing assessment data immediately');
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
      console.log('📊 Plan data loaded, now fetching assessments for user:', userId);
      
      // Check if user has assessments before fetching
      const assessmentInstanceIdArray = user.assessments;
      if (assessmentInstanceIdArray && assessmentInstanceIdArray.length > 0) {
        fetchAssessments();
      } else {
        console.log('👤 User has no assessments, keeping cleared state');
        setLocalAssessments([]); // Ensure local state is cleared
        setAssessmentsLoading(false); // Ensure loading state is false
      }
    }
  }, [planDataLoaded, userId]);

  // NEW: Sync local assessments with context data when context changes
  useEffect(() => {
    if (assessmentInstance_expanded_Api_call && assessmentInstance_expanded_Api_call.length > 0) {
      setLocalAssessments(assessmentInstance_expanded_Api_call);
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
      data.map((item) => {
        if (item.planTitle == "alacartePH") {
          setPlanForAlacatre(item);
        }
      })
    }
  }, [data]);

  const handleEventClick = (eventData) => {
    setUserDate(eventData);
  };

  const handlePreviewClick = (assessment) => {
    setSelectedAssessment(assessment);
    setShowModal(true);
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
    <div className='bg-white h-screen w-full flex overflow-hidden'>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header and User Info Section */}
        <div className="flex-shrink-0 p-2 sm:p-3">
          <div className="flex flex-col lg:flex-row justify-between gap-2 lg:gap-4">
            {/* Left side - User Info */}
            <div className="flex-1 min-w-0">
              <Header userData={user}></Header>
              <div className="p-1 sm:p-2">
                <div className="space-y-2">
                  {/* Latest Plan Instance */}
                  <div className="w-full">
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Latest Plan:</span>
                      <span className="text-xs sm:text-sm text-gray-700 break-words flex-1 min-w-0">{LatestPAdetails?.latestPlanName || "No plans available"}</span>
                    </div>
                  </div>
                  
                  {/* Latest Assessment */}
                  <div className="w-full">
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Latest Assessment:</span>
                      <span 
                        className="text-xs sm:text-sm underline text-blue-600 hover:text-blue-800 cursor-pointer break-words flex-1 min-w-0 transition-colors" 
                        onClick={() => {
                          setSelectComponent("responses")
                          navigate('/response', {
                            state: {
                              assessmentInstanceId: LatestPAdetails?.latestAssessmentId
                            }
                          })
                        }}
                      >
                        {LatestPAdetails?.latestAssessmentName || "no assessment available"} - {LatestPAdetails?.latestAssessmentScore || 0}
                      </span>
                    </div>
                  </div>

                  {/* Height, Weight, Problems */}
                  <div className="w-full">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <div className="whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-semibold">Height:</span>
                        <span className="text-xs sm:text-sm text-gray-700 ml-1">{user?.height || "-"} cm</span>
                      </div>
                      <div className="whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-semibold">Weight:</span>
                        <span className="text-xs sm:text-sm text-gray-700 ml-1">{user?.weight || "-"} kg</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold">Problems:</span>
                        <span className="text-xs sm:text-sm text-gray-700 ml-1 break-words">{user?.healthCondition || "Not found"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Controls */}
            <div className="flex flex-col items-stretch lg:items-end gap-2 w-full lg:w-auto lg:min-w-[240px] xl:min-w-[280px]">
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
        </div>

        {/* Calendar Section */}
        <div className="flex-1 px-2 sm:px-3 pb-2 sm:pb-3 min-h-0 max-h-full overflow-hidden">
          <div className="h-full w-full overflow-hidden">
            <EventCalendar data={data} onEventClick={handleEventClick} getData={getData} />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Assessments */}
      <div className="bg-white shadow-2xl border-l border-gray-200 flex flex-col w-80 h-screen max-h-screen overflow-hidden">
        {!showModal ? (
          <>
            {/* Sidebar Header */}
            <div className="flex justify-between items-center p-3 lg:p-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div>
                <h2 className="text-base lg:text-lg font-bold text-gray-800">Assessments</h2>
              </div>
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
              {assessmentsLoading ? (
                <div className="flex flex-col justify-center items-center py-12 lg:py-16">
                  <CircularProgress size={30} style={{ color: "#2563eb" }} />
                  <p className="mt-4 text-xs lg:text-sm text-gray-600">Loading assessments...</p>
                </div>
              ) : (
                <div className="space-y-3 lg:space-y-4">              
                  {localAssessments && localAssessments.length > 0 ? (
                    <div className="space-y-2 lg:space-y-3">
                      {localAssessments.map((assessment, index) => (
                        <div 
                          key={`${assessment.assessmentInstanceId}-${userId}-${index}`} // More unique key
                          className="bg-white border border-gray-200 rounded-lg p-2 lg:p-3 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
                        >
                          <div className="flex items-center mb-2 gap-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                              #{index + 1}
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs lg:text-sm text-gray-800 mb-2 lg:mb-3 break-words leading-tight">
                            {assessment.template.name}
                          </h4>
                          {assessment.template.questions.length > 0 && (
                            <button
                              className="cursor-pointer w-full bg-blue-500 text-white py-1.5 lg:py-2 px-2 lg:px-3 rounded-md hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs lg:text-sm"
                              onClick={() => handlePreviewClick(assessment)}
                            >
                              <Eye size={14} className="lg:hidden" />
                              <Eye size={16} className="hidden lg:block" />
                              Preview
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 lg:py-16">
                      <div className="bg-gray-100 rounded-full w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-4">
                        <Eye size={20} className="lg:hidden text-gray-400" />
                        <Eye size={24} className="hidden lg:block text-gray-400" />
                      </div>
                      <h4 className="text-sm lg:text-md font-medium text-gray-600 mb-2">No Assessments</h4>
                      <p className="text-gray-500 text-xs lg:text-sm">This user has no completed assessments yet.</p>
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
              <div className="flex justify-between items-center p-3 lg:p-4 border-b border-gray-200 bg-gray-50 shrink-0">
                <div className="flex items-center gap-2 lg:gap-3">
                  <button
                    className="cursor-pointer text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white hover:shadow-md transition-all duration-200"
                    onClick={closeModal}
                  >
                    <X size={16} className="lg:hidden" />
                    <X size={18} className="hidden lg:block" />
                  </button>
                  <h3 className="text-sm lg:text-base font-bold text-gray-800 break-words leading-tight">
                    Assessment Preview
                  </h3>
                </div>
              </div>

              {/* Assessment Name */}
              <div className="p-3 lg:p-4 border-b border-gray-100 bg-blue-50 shrink-0">
                <h4 className="text-xs lg:text-sm font-semibold text-blue-800 break-words">
                  {selectedAssessment?.template?.name}
                </h4>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-2 lg:p-3 space-y-2 lg:space-y-3">
                  {selectedAssessment?.answers?.map((answer, index) => (
                    <div key={answer.questionId} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Question Header */}
                      <div className="bg-gray-50 px-2 lg:px-3 py-1.5 lg:py-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-600 text-white text-xs font-bold px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full min-w-[20px] lg:min-w-[24px] h-5 lg:h-6 flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className={`text-xs px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full font-medium ${
                            answer.isRequired 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {answer.isRequired ? "Required" : "Optional"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Question Content */}
                      <div className="p-2 lg:p-3 space-y-1.5 lg:space-y-2">
                        <p className="text-xs font-medium text-gray-800 break-words leading-relaxed">
                          {answer.mainText}
                        </p>
                        <div className="bg-blue-50 rounded-md p-1.5 lg:p-2 border border-blue-200">
                          <p className="text-xs text-blue-800 break-words font-medium">
                            <span className="text-blue-600">Answer:</span> {answer.value || "No answer provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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