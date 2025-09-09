import React, { useState, useEffect } from "react";
import { Check, Clock, AlertCircle, Utensils, ArrowLeft } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import TopBar from "../BookingCalendarComponent/Topbar";
import { getArrayOfDatesFromSundayToSaturday } from "../WeeklyDateView/date";
import WeekPlanView from "../WeeklyDateView/WeekViewPlan";

interface Activity {
  activityId: string;
  activityInstanceId: string;
  status: "COMPLETE" | "SCHEDULED" | "REMOVED";
  customReps: number | null;
  removalNote?: string;
  removedOn?: string;
}

interface NutritionSession {
  sessionInstanceId: string;
  sessionTemplateId: string;
  userId: string;
  scheduledDate: string;
  activities: Activity[];
  status: string;
  rating: number;
  postSessionComment: string | null;
  trainerId: string | null;
  gameId: string | null;
  oneOnoneId: string | null;
  SessionTemplateName?: {
    title: string;
  };
}

interface NutritionSessionTemplate {
  sessionId: string;
  title: string;
  description: string;
  category: "NUTRITION" | string;
  activityIds: string[];
  status: "ACTIVE" | "INACTIVE" | string;
}

interface UserNutritionData {
  userId: string;
  nutritionSessions: NutritionSession[];
  finalStatus: string;
}

interface ActivityTemplate {
  activityId: string;
  name: string;
  description: string;
  icon: string | null;
  target: number;
  status: string;
  unit: string;
  type: string | null;
}

interface Food {
  activityId: string;
  activityInstanceId: string;
  name: string;
  description: string;
  target: number;
  unit: string;
  status: "done" | "notdone" | "partially" | "removed" | "scheduled";
  removalNote?: string;
  sessionTemplateId: string;
  sessionTemplateName: string;
}

const UserNutrition = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessionDetails, setSessionDetails] = useState<
    NutritionSessionTemplate[]
  >([]);
  const [weekStartToEndDates, setWeekStartToEndDates] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    // Get date from query params or use current date
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setCurrentDate(new Date(dateParam));
    }
  }, [location.search]);

  useEffect(() => {
    if (userId) {
      fetchUserNutritionData();
      fetchUserName();
    }
  }, [userId, currentDate]);

  const fetchUserName = async () => {
    try {
      const response = await fetch(
        `https://play-os-backend.forgehub.in/human/${userId}`
      );
      const userData = await response.json();
      setUserName(userData.name || "Unknown User");
    } catch (error) {
      console.error("Error fetching user name:", error);
      setUserName("Unknown User");
    }
  };

  const fetchUserNutritionData = async () => {
    setIsLoading(true);
    try {
      const dateStr = currentDate.toISOString().split("T")[0];
      const nutritionResponse = await fetch(
        `https://forge-play-backend.forgehub.in/getNutritionForAllUser/${dateStr}`
      );
      const nutritionData: UserNutritionData[] = await nutritionResponse.json();

      // Filter for the specific user
      const userNutrition = nutritionData.find(
        (item) => item.userId === userId
      );

      if (userNutrition) {
        // Extract all activities from all sessions with session template info
        const allActivitiesWithSession: (Activity & {
          sessionTemplateId: string;
          sessionTemplateName: string;
        })[] = [];

        userNutrition.nutritionSessions.forEach((session) => {
          const sessionTitle =
            session.SessionTemplateName?.title || "Unknown Session";
          session.activities.forEach((activity) => {
            allActivitiesWithSession.push({
              ...activity,
              sessionTemplateId: session.sessionTemplateId,
              sessionTemplateName: sessionTitle,
            });
          });
        });

        // Fetch activity templates for each activity
        const foodsWithDetails = await Promise.all(
          allActivitiesWithSession.map(async (activity) => {
            try {
              const activityResponse = await fetch(
                `https://forge-play-backend.forgehub.in/activity-templates/${activity.activityId}`
              );
              const activityTemplate: ActivityTemplate =
                await activityResponse.json();

              let status:
                | "done"
                | "notdone"
                | "scheduled"
                | "partially"
                | "removed" = "notdone";

              if (activity.status === "COMPLETE") {
                status = "done";
              } else if (activity.status === "SCHEDULED") {
                status = "scheduled";
              } else if (activity.status === "REMOVED") {
                status = "removed";
              }

              console.log(
                "activities",
                activity.activityId,
                "instance",
                activity.activityInstanceId,
                "temp name",
                activityTemplate.name,
                "status",
                status
              );

              return {
                activityId: activity.activityId,
                activityInstanceId: activity.activityInstanceId,
                name: activityTemplate.name,
                description: activityTemplate.description,
                target: activityTemplate.target,
                unit: activityTemplate.unit,
                status,
                removalNote: activity.removalNote,
                sessionTemplateId: activity.sessionTemplateId,
                sessionTemplateName: activity.sessionTemplateName,
              };
            } catch (error) {
              console.error(
                `Error fetching activity template for ${activity.activityId}:`,
                error
              );
              return {
                activityId: activity.activityId,
                activityInstanceId: activity.activityInstanceId,
                name: "Unknown Food",
                description: "Unable to load details",
                target: 0,
                unit: "units",
                status: "notdone" as const,
                removalNote: activity.removalNote,
                sessionTemplateId: activity.sessionTemplateId,
                sessionTemplateName: activity.sessionTemplateName,
              };
            }
          })
        );

        setFoods(foodsWithDetails);
      } else {
        setFoods([]);
      }
    } catch (error) {
      console.error("Error fetching user nutrition data:", error);
      setFoods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredFoods = (filter: string): Food[] => {
    switch (filter) {
      case "done":
        return foods.filter((food) => food.status === "done");
      case "notdone":
        return foods.filter((food) => food.status === "notdone");
      case "partially":
        return foods.filter((food) => food.status === "partially");
      case "removed":
        return foods.filter((food) => food.status === "removed");
      case "scheduled":
        return foods.filter((food) => food.status === "scheduled");
      default:
        return foods;
    }
  };

  // const handleStatusChange = (
  //   activityInstanceId: string,
  //   newStatus: "done" | "notdone" | "partially" | "removed"
  // ) => {
  //   setFoods(
  //     foods.map((food) =>
  //       food.activityInstanceId === activityInstanceId
  //         ? { ...food, status: newStatus }
  //         : food
  //     )
  //   );
  // };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handlePrevDay = () => {
    setCurrentDate(
      (prev) => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
  };

  const handleNextDay = () => {
    setCurrentDate(
      (prev) => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(e.target.value));
  };

  const handleBackToNutrition = () => {
    navigate(`/nutrition?date=${formatDateForInput(currentDate)}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <Check className="w-5 h-5 text-green-600" />;
      case "partially":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "notdone":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "removed":
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      case "scheduled":
        return <Clock className="w-5 h-5 text-purple-600" />;
      default:
        return <Utensils className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "border-green-200 bg-green-50";
      case "partially":
        return "border-yellow-200 bg-yellow-50";
      case "notdone":
        return "border-red-200 bg-red-50";
      case "removed":
        return "border-gray-200 bg-gray-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const getColumnHeaderStyle = (type: string) => {
    switch (type) {
      case "done":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "notdone":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "partially":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "removed":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      case "scheduled":
        return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
    }
  };

  const FoodItem = ({
    food,
    showStatusSelect = false,
  }: {
    food: Food;
    showStatusSelect?: boolean;
  }) => (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getStatusColor(
        food.status
      )}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(food.status)}
          <div>
            <span className="font-medium text-gray-800 block">{food.name}</span>
            <span className="text-xs text-gray-500">{food.description}</span>
            <div className="text-xs text-gray-400 mt-1">
              Target: {food.target} {food.unit}
            </div>
            {food.status === "removed" && food.removalNote && (
              <div className="text-xs text-red-500 mt-1">
                Removed: {food.removalNote}
              </div>
            )}
          </div>
        </div>
        {/* {showStatusSelect && (
          <select
            value={food.status}
            onChange={(e) => handleStatusChange(food.activityInstanceId, e.target.value as 'done' | 'notdone' | 'partially' | 'removed')}
            className="py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="done">Done</option>
            <option value="partially">Partial</option>
            <option value="notdone">Not Done</option>
            <option value="removed">Removed</option>
          </select>
        )} */}
      </div>
    </div>
  );

  const columns = [
    {
      title: "All Foods",
      type: "all",
      foods: getFilteredFoods("all"),
      icon: <Utensils className="w-5 h-5" />,
    },

    // {
    //   title: "Not Done",
    //   type: "notdone",
    //   foods: getFilteredFoods("notdone"),
    //   icon: <AlertCircle className="w-5 h-5" />,
    // },
    // {
    //   title: "Partially Done",
    //   type: "partially",
    //   foods: getFilteredFoods("partially"),
    //   icon: <Clock className="w-5 h-5" />,
    // },
    // {
    //   title: "Done",
    //   type: "done",
    //   foods: getFilteredFoods("done"),
    //   icon: <Check className="w-5 h-5" />,
    // },
  ];

  useEffect(() => {
    let referenceDate = new Date(currentDate);

    if (isNaN(referenceDate.getTime())) {
      referenceDate = new Date();
    }

    const weekDates = getArrayOfDatesFromSundayToSaturday(referenceDate);

    setWeekStartToEndDates(weekDates);

    const currentDateStr = referenceDate.toISOString().split("T")[0];

    const newActiveIndex = weekDates.findIndex(
      (dateStr) => dateStr === currentDateStr
    );

    setActiveIndex(newActiveIndex !== -1 ? newActiveIndex : 0);
  }, [currentDate]);

  return (
    <>
      <TopBar />
      <div className="flex items-center justify-between py-2 bg-white shadow-sm shrink-0 px-6">
        {/* Left side - Back button */}
        <button
          onClick={handleBackToNutrition}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Back</span>
        </button>

        {/* Center - Date navigation */}
        <div className="flex items-center gap-10">
          <button
            onClick={handlePrevDay}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
          >
            ← Prev
          </button>
          <WeekPlanView
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            weekStartToEndDates={weekStartToEndDates}
            onDateChange={(newDate) => {
              setCurrentDate(newDate);
            }}
          />
          <span className="text-xs font-semibold">
            {isLoading && (
              <span className="ml-2 text-blue-500">Loading...</span>
            )}
          </span>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={formatDateForInput(currentDate)}
              onChange={handleDateChange}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
          <button
            onClick={handleNextDay}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Right side - Empty for balance */}
        <div className="w-16"></div>
      </div>

      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col">
        <div className="max-w-7xl mx-auto flex flex-col h-[70%]">
          {/* Header - Fixed */}
          <div className="flex-shrink-0">
            <div className="flex items-center mb-6">
              {/* <button
                onClick={handleBackToNutrition}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Nutrition Overview</span>
              </button> */}
            </div>

            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {userName}'s Nutrition Tracker
              </h1>
              <p className="text-gray-600">
                Track daily nutrition goals and meal completion for {userName}
              </p>
            </div>

            {/* Stats Cards */}
            {/* <div className="grid grid-cols-4 gap-6 mb-4">
              {columns.map((column) => (
                <div key={column.type} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${getColumnHeaderStyle(column.type)}`}>
                      {column.icon}
                    </div>
                    <span className="text-2xl font-bold text-gray-800">{column.foods.length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-700">{column.title}</h3>
                </div>
              ))}
            </div> */}
          </div>

          {/* Main Grid - Flexible */}
          <div className="flex-1 min-h-0 mb-6">
            {columns.map((column) => (
              <div
                key={column.type}
                className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-full"
              >
                {/* Column Header */}
                <div
                  className={`p-4 flex-shrink-0 ${getColumnHeaderStyle(
                    column.type
                  )}`}
                >
                  <div className="flex items-center space-x-2">
                    {column.icon}
                    <h2 className="text-lg font-bold">{column.title}</h2>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-medium">
                      {column.foods.length}
                    </span>
                  </div>
                </div>

                {/* Column Content - Scrollable */}
                {/* Column Content - Scrollable */}
                <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                  {column.foods.length > 0 ? (
                    (() => {
                      // Group foods by session template
                      const groupedBySession = column.foods.reduce(
                        (acc, food) => {
                          const sessionKey = food.sessionTemplateId;
                          if (!acc[sessionKey]) {
                            acc[sessionKey] = {
                              sessionName: food.sessionTemplateName,
                              foods: [],
                            };
                          }
                          acc[sessionKey].foods.push(food);
                          return acc;
                        },
                        {} as Record<
                          string,
                          { sessionName: string; foods: Food[] }
                        >
                      );

                      return Object.entries(groupedBySession).map(
                        ([sessionId, sessionGroup]) => (
                          <div
                            key={sessionId}
                            className="border-l-4 border-blue-400 pl-4"
                          >
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">
                              {sessionGroup.sessionName}
                            </h3>
                            <div className="space-y-3">
                              {sessionGroup.foods.map((food) => (
                                <FoodItem
                                  key={food.activityInstanceId}
                                  food={food}
                                  showStatusSelect={column.type === "all"}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      );
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <Utensils className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        No items in this category
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserNutrition;
