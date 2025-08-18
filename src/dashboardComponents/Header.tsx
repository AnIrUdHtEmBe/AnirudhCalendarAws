import React from 'react';
import './Header.css'; 
import Breadcrumb from '../Breadcrumbs/Breadcrumb';

const Header: React.FC = () => {
  return (
    <header className="header">
      {/* Floating breadcrumb pinned to top-left */}
      <div className="breadcrumb-floating">
        <Breadcrumb />
      </div>

      {/* Centered title, unaffected by breadcrumb */}
      <div className="header-container">
        <h1 className="cust-header-title">Customer Dashboard</h1>
      </div>
    </header>
  );
};

export default Header;
