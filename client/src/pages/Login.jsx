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
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
      }

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

      window.location.href = '/home'

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h1 style={styles.title}>
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p style={styles.subtitle}>
          {isRegistering
            ? 'Register to start managing your stokvel'
            : 'Login to access your stokvel dashboard'}
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="you@example.com"
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? 'Please wait...' : isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={styles.toggleButton}
        >
          {isRegistering
            ? 'Already have an account? Login'
            : "Don't have an account? Register"}
        </button>
      </section>
    </main>
  )
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 24px 0',
  },
  error: {
    color: '#c62828',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#206663',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '8px',
  },
  toggleButton: {
    marginTop: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#206663',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    padding: 0,
  },
}
