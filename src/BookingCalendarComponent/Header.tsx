import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="header-title">Admin Dashboard</h1>
      </div>
    </header>
  );
};

export default Header;
