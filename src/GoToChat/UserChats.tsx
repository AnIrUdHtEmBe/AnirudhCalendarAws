import React, { useEffect, useState } from 'react';
import { Dumbbell, Heart, Trophy, Utensils, Calendar } from 'lucide-react';
import { TbMessage } from "react-icons/tb";

const UserChats = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(""); // This is the logged-in user

  useEffect(() => {
    // Get the selected customer from localStorage (individual customer whose chat we're viewing)
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    if (user.name) {
      setSelectedUser(user);
    } else {
      // Fallback for demo
      setSelectedUser({ name: "Customer Name" });
    }

    // Get the logged-in user from sessionStorage
    const hostName = sessionStorage.getItem("hostName");
    if (hostName) {
      setLoggedInUser(hostName);
    } else {
      // Fallback for demo
      setLoggedInUser("test2");
    }
  }, []);

  const getColumnHeaderStyle = (type) => {
    switch (type) {
      case 'fitness':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'wellness':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'sports':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'nutrition':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 'events':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const columns = [
    { 
      title: 'Fitness', 
      type: 'fitness', 
      icon: <Dumbbell className="w-5 h-5" />
    },
    { 
      title: 'Wellness', 
      type: 'wellness', 
      icon: <Heart className="w-5 h-5" />
    },
    { 
      title: 'Sports', 
      type: 'sports', 
      icon: <Trophy className="w-5 h-5" />
    },
    { 
      title: 'Nutrition', 
      type: 'nutrition', 
      icon: <Utensils className="w-5 h-5" />
    },
    { 
      title: 'Events', 
      type: 'events', 
      icon: <Calendar className="w-5 h-5" />
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with customer name */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {selectedUser ? `${selectedUser.name}'s Chat` : "Customer Chat"}
          </h1>
          <p className="text-gray-600">Chat categories and conversations</p>
        </div>

        {/* Compact Grid - 5 columns */}
        <div className="grid grid-cols-5 gap-6">
          {columns.map((column) => (
            <div key={column.type} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Column Header */}
              <div className={`p-3 ${getColumnHeaderStyle(column.type)}`}>
                <div className="flex items-center justify-center space-x-2">
                  {column.icon}
                  <h2 className="text-lg font-bold">{column.title}</h2>
                </div>
              </div>

              {/* User Chat Box */}
              <div className="p-4">
                <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-pointer transition-colors border border-gray-200">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-gray-800 font-medium">
                      {loggedInUser}
                    </span>
                    <button className='cursor-pointer'>
                      <TbMessage className='size-6' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserChats;