import React from "react";
import CustomerTable from "../dashboardComponents/CustomerTable";
import Header from "../dashboardComponents/Header";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <Header />
      {/* Table Section */}
      <div className="table-section">
        <CustomerTable />
      </div>
    </div>
  );
};

export default Dashboard;
