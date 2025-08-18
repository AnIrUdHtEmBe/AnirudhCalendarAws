import { FileText } from "lucide-react";
import React from "react";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";

const Header = ({ userData }) => {
  return (
    <div className="relative flex flex-col sm:flex-row items-center gap-3 sm:gap-5 px-4 sm:px-1 py-4">
      {/* Floating Breadcrumb absolutely positioned top-left inside header */}
      <div className="absolute -top-10 left-0 z-50 w-max">
        <Breadcrumb />
      </div>

      <FileText size={28} className="text-gray-800" />
<h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
  {userData?.name ? `${userData.name}'s` : ""} Calendar
</h1>
    </div>
  );
};

export default Header;
