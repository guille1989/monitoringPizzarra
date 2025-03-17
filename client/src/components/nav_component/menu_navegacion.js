// BottomNav.js
import React from "react";
import "./BottomNav.css";

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <div className="nav-item">
        <i className="fas fa-home"></i>
        <span>Ventas</span>
      </div>
      <div className="nav-item">
        <i className="fas fa-search"></i>
        <span></span>
      </div>
      <div className="nav-item">
        <i className="fas fa-plus"></i>
        <span></span>
      </div>
      <div className="nav-item">
        <i className="fas fa-user"></i>
        <span></span>
      </div>
    </nav>
  );
};

export default BottomNav;
