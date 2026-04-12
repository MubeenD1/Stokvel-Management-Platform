// This is a placeholder dashboard
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'

export default function Dashboard() {
  const { currentUser } = useAuth()

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = '/login'
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {currentUser?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
