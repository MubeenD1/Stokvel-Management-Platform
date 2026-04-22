import { NavLink } from "react-router-dom";
import "./GroupNavbar.css";

export default function GroupNavbar( {groupId} ) {
  return (
    <nav>
      <div className="group-nav-container">
        <div className="logo">
          <NavLink to="/home">Stokvel Management Platform</NavLink>
        </div>

        <ul id="group-navbar">
          <li>
            <NavLink  to={`/groups/${groupId}/members`} className={({ isActive }) => isActive ? "active" : ""}>
                Members
            </NavLink>
          </li>
           <li>
            <NavLink to={`/groups/${groupId}/meetings`} className={({ isActive }) => isActive ? "active" : ""}>
              Meetings
            </NavLink>
          </li>
          <li>
            <NavLink to={`/groups/${groupId}/contributions`} className={({ isActive }) => isActive ? "active" : ""}>
              Contributions
            </NavLink>
          </li>
          <li>
            <NavLink to={`/groups/${groupId}/payouts`} className={({ isActive }) => isActive ? "active" : ""}>
              Payouts
            </NavLink>
          </li>
          <li>
            <NavLink to={`/groups/${groupId}/settings`} className={({ isActive }) => isActive ? "active" : ""}>
              Settings
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}