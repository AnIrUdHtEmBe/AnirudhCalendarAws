import React, { useContext, useEffect, useState } from 'react';
import { useApiCalls } from '../store/axios';
import { DataContext } from '../store/DataContext';

const UserProfile = () => {
  const {setCustomers_Api_call,customers_Api_call}=useContext(DataContext)
  const {getHumanById} =useApiCalls()
  /*
    userId: 'USER_PDSN16',
    name: 'New User 21st Saturday',
    age: 2,
    gender: 'male',
    mobile: '9050610702',
    email: 'alok.mohanty@lazyidli.com',
    height: 1,
    weight: 2,
    healthCondition: 'none',
    membershipType: 'basic',
    membershipValidity: {
      startDate: '2025-06-21T00:00:00',
      endDate: '2025-09-19T00:00:00'
    },
    membershipStatus: 'active',
    plansAllocated: ['PLAU_PNRM18', 'PLAU_ZOSO55'],
    assessments: ['ASSU_KUYA88'],
    type: 'forge',
    photo: null,
    address: null,
    sessionsBooked: [],
    gamesBooked: [],
    gamesPlayed: [],
    gameLevel: null,
    userRating: null,
    faveSports: [],
    faveUsers: [],
    blockedUsers: [],
    playedWithUsers: []
  });
*/

 const user=localStorage.getItem("user")
//  console.log(user?.name,"name")
 const user_new = JSON.parse(user); // ✅ convert to object
//  console.log(user_new.name)

  return (
  
 <div style={{
      padding: '30px',
      maxWidth: '700px',
      margin: '40px auto',
      fontFamily: 'Segoe UI, sans-serif',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      boxShadow: '0 0 12px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>User Profile</h2>

      <table style={{ width: '100%', lineHeight: '1.8' }}>
        <tbody>
          <ProfileRow label="User ID" value={user_new.userId} />
          <ProfileRow label="Name" value={user_new.name} />
          <ProfileRow label="Age" value={user_new.age} />
          <ProfileRow label="Gender" value={user_new.gender} />
          <ProfileRow label="Mobile" value={user_new.mobile} />
          <ProfileRow label="Email" value={user_new.email} />
          <ProfileRow label="Height" value={`${user_new.height} cm`} />
          <ProfileRow label="Weight" value={`${user_new.weight} kg`} />
          <ProfileRow label="Health Condition" value={user_new.healthCondition} />
          <ProfileRow label="Membership Type" value={user_new.membershipType} />
          <ProfileRow label="Membership Status" value={user_new.membershipStatus} />
          <ProfileRow label="Plans Allocated" value={user_new.plansAllocated?.join(', ') || 'None'} />
          <ProfileRow label="Assessments" value={user_new.assessments?.join(', ') || 'None'} />
          <ProfileRow label="Game Level" value={user_new.gameLevel || 'N/A'} />
          <ProfileRow label="user_new Rating" value={user_new.userRating ?? 'N/A'} />
        </tbody>
      </table>
    </div>
  );
};

// Reusable row component
const ProfileRow = ({ label, value }: { label: string; value: string | number }) => (
  <tr style={{borderBottom: "1.5px solid #aaa",
  padding: "8px 0"}}>
    <td style={{ fontWeight: 'bold', paddingRight: '12px', verticalAlign: 'top' }}>{label}:</td>
    <td>{value}</td>
  </tr>
);

export default UserProfile;
