import React, { useState, useEffect } from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { TbMessage } from "react-icons/tb";
import TopBar from '../BookingCalendarComponent/Topbar';

interface User {
  userId: string;
  name: string;
  status: 'present' | 'absent' | 'completed';
  courtName?: string;
  timeSlot?: string;
}

interface Court {
  courtId: string;
  arenaId: string;
  name: string;
  capacity: number;
  allowedSports: string[];
  openingTime: string;
  closingTime: string;
  status: string;
  slotSize: number;
}

interface Booking {
  type: string;
  bookedBy: string;
  sportId: string;
  startTime: string;
  endTime: string;
  status: string;
  joinedUsers: string[];
  scheduledPlayers: string[];
  priceType: string | null;
  rackPrice: string | null;
  quotePrice: string | null;
  capacity: number | null;
  st_unix: number;
  et_unix: number;
  bookingId: string;
}

interface CourtBookingResponse {
  courtDetails: Court;
  bookings: Booking[];
}

const Attendance = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [checkedUsers, setCheckedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate]);

  // Convert UTC time to IST
  const convertToIST = (utcTimeString: string) => {
    const utcDate = new Date(utcTimeString);
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
    return istDate;
  };

  const formatTimeSlot = (startTime: string, endTime: string) => {
    const start = convertToIST(startTime);
    const end = convertToIST(endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Function to process court name and get display name
  const processCourtName = async (courtName: string): Promise<string> => {
    const lowerCourtName = courtName.toLowerCase();
    
    // Check if court name has court_ or COURT_ prefix
    if (lowerCourtName.startsWith('court_')) {
      const username = courtName.substring(6); // Remove 'court_' prefix
      try {
        const userResponse = await fetch(`https://play-os-backend.forgehub.in/human/${username}`);
        const userData = await userResponse.json();
        return userData.name || courtName; // Return user name or fallback to original court name
      } catch (error) {
        console.error(`Error fetching court user data for ${username}:`, error);
        return courtName; // Fallback to original court name
      }
    }
    
    return courtName; // Return original court name if no prefix
  };

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const dateStr = formatDateForInput(currentDate);
      
      // API 1: Get all courts
      const courtsResponse = await fetch('https://play-os-backend.forgehub.in/arena/AREN_JZSW15/courts');
      const courts: Court[] = await courtsResponse.json();
      
      // API 2: Get bookings for each court
      const allBookingData: { courtName: string; booking: Booking }[] = [];
      await Promise.all(
        courts.map(async (court) => {
          try {
            const bookingsResponse = await fetch(`https://play-os-backend.forgehub.in/court/${court.courtId}/bookings?date=${dateStr}`);
            const bookingData: CourtBookingResponse = await bookingsResponse.json();
            
            // Process court name to get display name
            const displayCourtName = await processCourtName(bookingData.courtDetails.name);
            
            bookingData.bookings.forEach(booking => {
              allBookingData.push({
                courtName: displayCourtName,
                booking: booking
              });
            });
          } catch (error) {
            console.error(`Error fetching bookings for court ${court.courtId}:`, error);
          }
        })
      );

      // API 4: Filter out cancelled bookings
      const activeBookingData: { courtName: string; booking: Booking }[] = [];
      await Promise.all(
        allBookingData.map(async ({ courtName, booking }) => {
          try {
            const bookingStatusResponse = await fetch(`https://play-os-backend.forgehub.in/booking/${booking.bookingId}`);
            const bookingDetails = await bookingStatusResponse.json();
            
            // Only include bookings that are not cancelled
            if (bookingDetails.status !== 'cancelled') {
              activeBookingData.push({ courtName, booking });
            }
          } catch (error) {
            console.error(`Error fetching booking status for ${booking.bookingId}:`, error);
            // If API fails, include the booking (fail safe)
            activeBookingData.push({ courtName, booking });
          }
        })
      );

      // Extract users and determine their status with court and time info (only from active bookings)
      const userDetailsMap = new Map<string, { userId: string; status: 'present' | 'absent'; courtName: string; timeSlot: string }>();
      
      activeBookingData.forEach(({ courtName, booking }) => {
        const { joinedUsers, scheduledPlayers, startTime, endTime } = booking;
        const timeSlot = formatTimeSlot(startTime, endTime);
        
        scheduledPlayers.forEach(userId => {
          // Create unique key for each user-court-timeslot combination
          const uniqueKey = `${userId}-${courtName}-${timeSlot}`;
          
          if (joinedUsers.includes(userId)) {
            // User is in both joined and scheduled - Present
            userDetailsMap.set(uniqueKey, { userId, status: 'present', courtName, timeSlot });
          } else {
            // User is only in scheduled, not in joined - Absent
            userDetailsMap.set(uniqueKey, { userId, status: 'absent', courtName, timeSlot });
          }
        });
      });

      // API 3: Get user names (only for active bookings)
      const usersWithNames = await Promise.all(
        Array.from(userDetailsMap.entries()).map(async ([uniqueKey, details]) => {
          try {
            const userResponse = await fetch(`https://play-os-backend.forgehub.in/human/${details.userId}`);
            const userData = await userResponse.json();
            
            return {
              userId: details.userId,
              name: userData.name || 'Unknown User',
              status: details.status,
              courtName: details.courtName,
              timeSlot: details.timeSlot
            };
          } catch (error) {
            console.error(`Error fetching user data for ${details.userId}:`, error);
            return {
              userId: details.userId,
              name: 'Unknown User',
              status: details.status,
              courtName: details.courtName,
              timeSlot: details.timeSlot
            };
          }
        })
      );
      
      setUsers(usersWithNames);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredUsers = (filter: string): User[] => {
    return users.filter(user => user.status === filter);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="w-5 h-5 text-blue-600" />;
      case 'absent':
        return <X className="w-5 h-5 text-red-600" />;
      case 'completed':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Check className="w-5 h-5 text-gray-400" />;
    }
  };

  const getColumnHeaderStyle = (type: string) => {
    switch (type) {
      case 'present':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'absent':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'completed':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const toggleCheck = (userId: string) => {
    setCheckedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const UserItem = ({ user, showCheckButton }: { user: User; showCheckButton?: boolean }) => {
    const isChecked = checkedUsers.has(user.userId);
    
    return (
      <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
        <div className="flex items-center space-x-3 flex-1">
          {user.status === 'absent' && (
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">{user.name}</span>
            <span className="text-xs text-gray-500">{user.courtName}</span>
            <span className="text-xs text-gray-500">{user.timeSlot}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3 ml-8">
          {showCheckButton && (
            <button 
              className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors ${
                isChecked 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-green-400'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleCheck(user.userId);
              }}
            >
              {isChecked && <Check className="w-4 h-4 text-green-500" />}
            </button>
          )}
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <TbMessage className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const columns = [
    { 
      title: 'Present', 
      type: 'present', 
      users: getFilteredUsers('present'),
      icon: <Check className="w-5 h-5" />,
      showCheckButton: false
    },
    { 
      title: 'Absent', 
      type: 'absent', 
      users: getFilteredUsers('absent'),
      icon: <X className="w-5 h-5" />,
      showCheckButton: true
    },
    { 
      title: 'Completed', 
      type: 'completed', 
      users: getFilteredUsers('completed'),
      icon: <Clock className="w-5 h-5" />,
      showCheckButton: false
    }
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Attendance Tracker</h1>
              <p className="text-gray-600">Track daily attendance status</p>
            </div>
          </div>

          {/* Main Grid - Flexible */}
          <div className="grid grid-cols-3 gap-6 flex-1 min-h-0 mb-6">
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
                    column.users.map((user, index) => (
                      <UserItem
                        key={`${user.userId}-${user.courtName}-${user.timeSlot}-${index}`}
                        user={user}
                        showCheckButton={column.showCheckButton}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
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

export default Attendance;