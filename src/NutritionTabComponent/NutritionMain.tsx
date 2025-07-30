import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle, Utensils } from 'lucide-react';
import TopBar from '../BookingCalendarComponent/Topbar';
import { useNavigate } from 'react-router-dom';

interface User {
  userId: string;
  name: string;
  status: 'done' | 'notdone' | 'partially' | 'scheduled';
  finalStatus: string;
}

interface NutritionData {
  userId: string;
  nutritionSessions: any[];
  finalStatus: string;
}

const NutritionMain = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNutritionData();
  }, [currentDate]);

  const fetchNutritionData = async () => {
    setIsLoading(true);
    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const nutritionResponse = await fetch(`https://forge-play-backend.forgehub.in/getNutritionForAllUser/${dateStr}`);
      const nutritionData: NutritionData[] = await nutritionResponse.json();
      
      const usersWithNames = await Promise.all(
        nutritionData.map(async (item) => {
          try {
            const userResponse = await fetch(`https://play-os-backend.forgehub.in/human/${item.userId}`);
            const userData = await userResponse.json();
            
            let status: 'done' | 'notdone' | 'partially' | 'scheduled' = 'scheduled';
            
            if (item.finalStatus === 'SCHEDULED') {
              status = 'scheduled';
            } else if (item.finalStatus === 'NOT DONE') {
              status = 'notdone';
            } else if (item.finalStatus === 'PARTIALLY DONE') {
              status = 'partially';
            } else if (item.finalStatus === 'COMPLETE') {
              status = 'done';
            }
            
            return {
              userId: item.userId,
              name: userData.name || 'Unknown User',
              status,
              finalStatus: item.finalStatus
            };
          } catch (error) {
            console.error(`Error fetching user data for ${item.userId}:`, error);
            return {
              userId: item.userId,
              name: 'Unknown User',
              status: 'scheduled' as const,
              finalStatus: item.finalStatus
            };
          }
        })
      );
      
      setUsers(usersWithNames);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredUsers = (filter: string): User[] => {
    switch (filter) {
      case 'done':
        return users.filter(user => user.status === 'done');
      case 'notdone':
        return users.filter(user => user.status === 'notdone');
      case 'partially':
        return users.filter(user => user.status === 'partially');
      case 'scheduled':
        return users.filter(user => user.status === 'scheduled');
      default:
        return users;
    }
  };

  const handleStatusChange = (userId: string, newStatus: 'done' | 'notdone' | 'partially' | 'scheduled') => {
    setUsers(users.map(user => 
      user.userId === userId ? { ...user, status: newStatus } : user
    ));
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePrevDay = () => {
    setCurrentDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const handleNextDay = () => {
    setCurrentDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(e.target.value));
  };

  const handleUserClick = (userId: string) => {
  navigate(`/userNutrition/${userId}?date=${formatDateForInput(currentDate)}`);
};

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'partially':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'notdone':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'scheduled':
        return <Clock className="w-5 h-5 text-purple-600" />;
      default:
        return <Utensils className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'border-green-200 bg-green-50';
      case 'partially':
        return 'border-yellow-200 bg-yellow-50';
      case 'notdone':
        return 'border-red-200 bg-red-50';
      case 'scheduled':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getColumnHeaderStyle = (type: string) => {
    switch (type) {
      case 'done':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'notdone':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'partially':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 'scheduled':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    }
  };

  const UserItem = ({ user, showStatusSelect = false }: { user: User; showStatusSelect?: boolean }) => (
    <div 
      className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${getStatusColor(user.status)}`}
      onClick={() => handleUserClick(user.userId)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(user.status)}
          <span className="font-medium text-gray-800">{user.name}</span>
        </div>
        {/* {showStatusSelect && (
          <select
            value={user.status}
            onChange={(e) => {
              e.stopPropagation();
              handleStatusChange(user.userId, e.target.value as 'done' | 'notdone' | 'partially' | 'scheduled');
            }}
            className="ml-3 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="done">Done</option>
            <option value="partially">Partial</option>
            <option value="notdone">Not Done</option>
            <option value="scheduled">Scheduled</option>
          </select>
        )} */}
      </div>
    </div>
  );

  const columns = [
    { 
      title: 'All Users', 
      type: 'all', 
      users: getFilteredUsers('scheduled'),
      icon: <Utensils className="w-5 h-5" />
    },
    
    { 
      title: 'Not Done', 
      type: 'notdone', 
      users: getFilteredUsers('notdone'),
      icon: <AlertCircle className="w-5 h-5" />
    },
    { 
      title: 'Partially Done', 
      type: 'partially', 
      users: getFilteredUsers('partially'),
      icon: <Clock className="w-5 h-5" />
    },
    { 
      title: 'Done', 
      type: 'done', 
      users: getFilteredUsers('done'),
      icon: <Check className="w-5 h-5" />
    },
    
  ];

  return (
    <>
      <TopBar />
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm shrink-0">
        <button
          onClick={handlePrevDay}
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
        >
          ← Prev
        </button>
        <span className="text-xs font-semibold">
          {currentDate.toLocaleDateString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
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
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col">
        <div className="max-w-7xl mx-auto flex flex-col h-[70%]">
          {/* Header - Fixed */}
          <div className="flex-shrink-0">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Nutrition Tracker</h1>
              <p className="text-gray-600">Track your daily nutrition goals and meal completion</p>
            </div>

            {/* Stats Cards */}
            {/* <div className="grid grid-cols-4 gap-6 mb-4">
              {columns.map((column) => (
                <div key={column.type} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${getColumnHeaderStyle(column.type)}`}>
                      {column.icon}
                    </div>
                    <span className="text-2xl font-bold text-gray-800">{column.users.length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-700">{column.title}</h3>
                </div>
              ))}
            </div> */}
          </div>

          {/* Main Grid - Flexible */}
          <div className="grid grid-cols-4 gap-6 flex-1 min-h-0 mb-6">
            {columns.map((column) => (
              <div key={column.type} className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
                {/* Column Header */}
                <div className={`p-4 flex-shrink-0 ${getColumnHeaderStyle(column.type)}`}>
                  <div className="flex items-center space-x-2">
                    {column.icon}
                    <h2 className="text-lg font-bold">{column.title}</h2>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-medium">
                      {column.users.length}
                    </span>
                  </div>
                </div>

                {/* Column Content - Scrollable */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {column.users.length > 0 ? (
                    column.users.map((user) => (
                      <UserItem
                        key={user.userId}
                        user={user}
                        showStatusSelect={column.type === 'all'}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <Utensils className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 text-sm">No users in this category</p>
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

export default NutritionMain;