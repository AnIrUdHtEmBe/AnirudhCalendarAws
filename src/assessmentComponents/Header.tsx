import React from 'react';
import './Header.css';
import Breadcrumb from '../Breadcrumbs/Breadcrumb';

const Header: React.FC = () => {
  return (
    <header className="header">
      {/* Floating Breadcrumb */}
      <div className="breadcrumb-floating">
        <Breadcrumb />
      </div>
      <div className="header-content">
        <h1 className="header-title">
          Customer Assessment
        </h1>
      </div>
    </header>
  );
};

export default Header;
