import React from 'react'
import AllNutrition from '../AllNutritionSessionPage/AllNutrition'
import NutrtionHeader from '../NutritionSessionComponents/NutritionHeader'

function AllNutritionSessionsPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-200">
    <NutrtionHeader />
    <div className=" bg-gray-200 flex-1 flex" >
     <AllNutrition />
    </div>
  </div>
  )
}

export default AllNutritionSessionsPage