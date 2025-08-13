import { FileText } from 'lucide-react'
import React from 'react'

const Header = ({userData}) => {
    console.log("userData in header", userData)    
  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 px-4 sm:px-1 py-4">

        <FileText size={28} className="text-gray-800" />
        
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left">
          {userData?.name ? ` ${userData.name}'s` : ''} Calendar 
        </h1>
      </div>
    </>
  )
}

export default Header