import React, { useState } from 'react';
import Sidebar from './Sidebar';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import LoginPage from '../Pages/LoginPage';
import Breadcrumb from '../Breadcrumbs/Breadcrumb';
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f3f4f6', // Tailwind's gray-100
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
  };

  return (
    <div style={layoutStyle}>
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main style={mainStyle}>
        <Breadcrumb />
        {children}
      </main>
    </div>
  );
};

export default Layout;
