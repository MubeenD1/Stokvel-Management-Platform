import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';
import "./Home.css"

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home">
      <p id = "paragraph">
        We aim to deliver a web-based stokvel management platform that enables members to track contributions, monitor payout schedules, communicate, and gain financial insights into their savings group.
      </p>
        <div className="buttons">
          <button id = "createButton" onClick={() => navigate('/create')}>Create Group</button>
          <button id = "joinButton" onClick={() => navigate('/join')}>+ Join Group</button>
        </div>
    </div>
  );
}