import { useState } from 'react'
import { auth } from '../firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let userCredential

      if (isRegistering) {
        // create new firebase account
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
      } else {
        // log into existing firebase account
        userCredential = await signInWithEmailAndPassword(auth, email, password)
      }

      // get token and send to backend to create/fetch user in postgresql
      const token = await userCredential.user.getIdToken()

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Backend authentication failed')

      const data = await response.json()
      console.log('Authenticated user:', data.user)

      // redirect to dashboard
      window.location.href = '/dashboard'

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>{isRegistering ? 'Register' : 'Login'}</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : isRegistering ? 'Register' : 'Login'}
        </button>
      </form>

      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering
          ? 'Already have an account? Login'
          : "Don't have an account? Register"}
      </button>
    </div>
  )
}
