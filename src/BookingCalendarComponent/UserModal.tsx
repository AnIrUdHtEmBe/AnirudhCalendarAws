import React, { useState, useEffect } from 'react';

interface CellModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellData: {
    courtName: string;
    timeSlot: string;
    gameName: string;
    bookingId: string;
  };
}

interface UserAttendance {
  id: number;
  name: string;
  status: 'present' | 'absent' | 'pending' | '';
}

const CellModal: React.FC<CellModalProps> = ({ isOpen, onClose, cellData }) => {
  // Hard-coded users for now - later replace with API call
  const [modalUsers, setModalUsers] = useState<UserAttendance[]>([
    { id: 1, name: 'Anirudh Kumar', status: '' },
    { id: 2, name: 'Priya Sharma', status: '' },
    { id: 3, name: 'Rajesh Patel', status: '' },
    { id: 4, name: 'Sneha Reddy', status: '' },
    { id: 5, name: 'Vikram Singh', status: '' },
  ]);

  const [modalSubmittedData, setModalSubmittedData] = useState<UserAttendance[]>([]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle checkbox selection - only one per row
  const handleModalCheckboxChange = (userId: number, status: 'present' | 'absent' | 'pending') => {
    setModalUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === status ? '' : status }
          : user
      )
    );
  };

  // Handle modal submission
  const handleModalSubmit = () => {
    const checkedModalUsers = modalUsers.filter(user => user.status !== '');
    setModalSubmittedData(checkedModalUsers);
    console.log('Modal Submitted Data:', checkedModalUsers);
    onClose();
  };

  // Reset modal state when closed
  const handleModalClose = () => {
    setModalUsers(prev => prev.map(user => ({ ...user, status: '' })));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            User Attendance - {cellData.courtName}
          </h2>
          <button
            onClick={handleModalClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Time Slot:</strong> {cellData.timeSlot}</div>
              <div><strong>Game:</strong> {cellData.gameName}</div>
              <div><strong>Booking ID:</strong> {cellData.bookingId}</div>
            </div>
          </div>

          {/* User Attendance Table */}
          <div className="overflow-y-auto max-h-64">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">S.No</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">User Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Present</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Absent</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Pending</th>
                </tr>
              </thead>
              <tbody>
                {modalUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {user.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={user.status === 'present'}
                        onChange={() => handleModalCheckboxChange(user.id, 'present')}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={user.status === 'absent'}
                        onChange={() => handleModalCheckboxChange(user.id, 'absent')}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={user.status === 'pending'}
                        onChange={() => handleModalCheckboxChange(user.id, 'pending')}
                        className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleModalClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleModalSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CellModal;