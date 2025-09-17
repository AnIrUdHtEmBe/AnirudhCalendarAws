import React from 'react'
import Header from '../sessionsPageComponets/Header'
import ActivityTable from '../sessionsPageComponets/ActivityTable'
import './SessionPage.css'

function SessionsPage() {
  return (
    <div className="session-creation-container h-screen flex flex-col bg-gray-200">
    {/* <Header /> */}
    <div className="bg-gray-200 flex-1 flex p-5 activity-box" >
      <ActivityTable></ActivityTable>
      
    </div>
  </div>
  )
}

export default SessionsPage