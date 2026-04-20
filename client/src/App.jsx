import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import JoinGroup from './pages/Groups/JoinGroup';
import CreateGroup from './pages/Groups/CreateGroup';
import Home from './pages/Home/Home';
import Navbar from './pages/Navbar/Navbar';
import Groups from './pages/Groups/Groups';
import GroupPage from './pages/Groups/GroupPage';
import GroupNavbar from './pages/Navbar/GroupNavbar';
import MeetingsPage from './pages/Meetings/MeetingsPage';
import GroupSettingsModal from './components/GroupSettingsModal';


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
function GroupLayout() {
  const { id } = useParams();
  return (
    <div className="group-layout">
      <GroupNavbar groupId={id}/>
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
        </Route>
        <Route element={<ProtectedRoute><GroupLayout /></ProtectedRoute>}>
          <Route path="/groups/:id/members" element={<GroupPage />} />
          <Route path ="/groups/:id/meetings" element = {<MeetingsPage />}/>
          <Route path ="/groups/:id/settings" element = {<GroupSettingsModal />}/>
          
        </Route>
          <Route path="/create" element={<CreateGroup />} />
          <Route path="/join" element={<JoinGroup />} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}