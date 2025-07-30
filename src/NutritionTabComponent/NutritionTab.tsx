import React, { useState } from 'react';
import { Check, Clock, AlertCircle, Utensils } from 'lucide-react';
import TopBar from '../BookingCalendarComponent/Topbar';

interface Food {
  id: number;
  name: string;
  status: 'done' | 'notdone' | 'partially';
}

const Nutrition = () => {
  const [foods, setFoods] = useState<Food[]>([
    { id: 1, name: 'Greek Yogurt with Berries', status: 'done' },
    { id: 2, name: 'Grilled Chicken Salad', status: 'notdone' },
    { id: 3, name: 'Quinoa Buddha Bowl', status: 'partially' },
    { id: 4, name: 'Avocado Toast', status: 'done' },
    { id: 5, name: 'Salmon with Vegetables', status: 'notdone' },
    { id: 6, name: 'Protein Smoothie', status: 'partially' },
    { id: 7, name: 'Oatmeal with Nuts', status: 'done' },
    { id: 8, name: 'Caesar Salad', status: 'notdone' },
    { id: 9, name: 'Turkey Wrap', status: 'partially' },
    { id: 10, name: 'Fruit Bowl', status: 'done' },
    { id: 11, name: 'Vegetable Stir Fry', status: 'notdone' },
    { id: 12, name: 'Chia Seed Pudding', status: 'partially' }
  ]);

  const getFilteredFoods = (filter: string): Food[] => {
    switch (filter) {
      case 'done':
        return foods.filter(food => food.status === 'done');
      case 'notdone':
        return foods.filter(food => food.status === 'notdone');
      case 'partially':
        return foods.filter(food => food.status === 'partially');
      default:
        return foods;
    }
  };

  const handleStatusChange = (foodId: number, newStatus: 'done' | 'notdone' | 'partially') => {
    setFoods(foods.map(food => 
      food.id === foodId ? { ...food, status: newStatus } : food
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'partially':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'notdone':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
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
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    }
  };

  const FoodItem = ({ food, showStatusSelect = false }: { food: Food; showStatusSelect?: boolean }) => (
    <div className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getStatusColor(food.status)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(food.status)}
          <span className="font-medium text-gray-800">{food.name}</span>
        </div>
        {showStatusSelect && (
          <select
            value={food.status}
            //@ts-ignore
            onChange={(e) => handleStatusChange(food.id, e.target.value)}
            className="ml-3 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="done">Done</option>
            <option value="partially">Partial</option>
            <option value="notdone">Not Done</option>
          </select>
        )}
      </div>
    </div>
  );

  const columns = [
    { 
      title: 'Done', 
      type: 'done', 
      foods: getFilteredFoods('done'),
      icon: <Check className="w-5 h-5" />
    },
    { 
      title: 'Not Done', 
      type: 'notdone', 
      foods: getFilteredFoods('notdone'),
      icon: <AlertCircle className="w-5 h-5" />
    },
    { 
      title: 'Partially Done', 
      type: 'partially', 
      foods: getFilteredFoods('partially'),
      icon: <Clock className="w-5 h-5" />
    },
    { 
      title: 'All Foods', 
      type: 'all', 
      foods: getFilteredFoods('all'),
      icon: <Utensils className="w-5 h-5" />
    }
  ];

  return (
    <>
    <TopBar />
    <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm shrink-0">
        <button
          onClick={() => {
            // setCurrentDate(
            //   (prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000)
            // );
          //   setSelected([]);
          //   setLoadingScreen(true);
          //   setTimeout(() => {
          //     setLoadingScreen(false);
          //   }, 4000);
           }}
          // className="px-3 py-1 bg-gray-300 rounded"
        >
          ← Prev
        </button>
        <span className="text-xs font-semibold">
          {/* {currentDate.toLocaleDateString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })} */}
          {/* {isLoadingBookings && (
            <span className="ml-2 text-blue-500">Loading...</span>
          )} */}
        </span>
        <div className="flex items-center gap-4">
          <input
            type="date"
            // value={formatDateForInput(currentDate)}
            onChange={(e) => {
              
            }}
            className="px-2 py-1 border border-gray-300 rounded text-xs"
          />
        </div>
        <button
          onClick={() => {
            // setCurrentDate(
            //   (prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000)
            // );
            // setSelected([]);
            // setLoadingScreen(true);
            // setTimeout(() => {
            //   setLoadingScreen(false);
            // }, 4000);
          }}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next →
        </button>
      </div>
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col">
      
      <div className="max-w-7xl mx-auto flex flex-col h-[80%]">
        {/* Header - Fixed */}
        
        <div className="flex-shrink-0">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Nutrition Tracker</h1>
            <p className="text-gray-600">Track your daily nutrition goals and meal completion</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-4">
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
          </div>
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
                    {column.foods.length}
                  </span>
                </div>
              </div>

              {/* Column Content - Scrollable */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {column.foods.length > 0 ? (
                  column.foods.map((food) => (
                    <FoodItem
                      key={food.id}
                      food={food}
                      showStatusSelect={column.type === 'all'}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Utensils className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-sm">No items in this category</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Stats - Fixed */}
        {/* <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{getFilteredFoods('done').length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{getFilteredFoods('partially').length}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{getFilteredFoods('notdone').length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{foods.length}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
    </>
  );
};

export default Nutrition;