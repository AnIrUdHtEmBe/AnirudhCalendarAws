import React from 'react';
import './Header.css'; // Import the CSS file

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="cust-header-title">Customer Dashboard</h1>
      </div>
    </header>
  );
};

export default Header;
