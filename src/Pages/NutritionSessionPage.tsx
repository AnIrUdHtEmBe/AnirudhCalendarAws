import React from 'react'
import NutrtionHeader from '../NutritionSessionComponents/NutritionHeader'
import './SessionPage.css'
import NutritionActivityTable from '../NutritionSessionComponents/NutritionActivityTable'

function NutritionSessionsPage() {
  return (
    <div className="session-creation-container h-screen flex flex-col bg-gray-200">
    <NutrtionHeader />
    <div className="bg-gray-200 flex-1 flex p-5 activity-box" >
      <NutritionActivityTable></NutritionActivityTable>
      
    </div>
  </div>
  )
}

export default NutritionSessionsPage