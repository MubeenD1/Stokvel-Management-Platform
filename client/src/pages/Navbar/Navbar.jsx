import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav>
      <div className="nav-container">
        <div className="logo">
          <NavLink to="/home">Stokvel Management Platform</NavLink>
        </div>

        <ul id="navbar">
          <li>
            <NavLink to="/home" className={({ isActive }) => isActive ? "active" : ""}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/groups" className={({ isActive }) => isActive ? "active" : ""}>
              Groups
            </NavLink>
          </li>
          <li>
            <NavLink to="/notifications" className={({ isActive }) => isActive ? "active" : ""}>
              Notifications
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
              Dashboard
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}