import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import JoinGroup from './pages/JoinGroup';
import CreateGroup from './pages/CreateGroup';
import Home from './pages/Home/Home';
import Navbar from './pages/Navbar/Navbar';
import Groups from './pages/Groups/Groups';
import Contributions from './pages/Contributions/Contributions';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function Layout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateGroup />} />
          <Route path="/join" element={<JoinGroup />} />
          <Route path="/contributions/:groupId" element={<Contributions />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}