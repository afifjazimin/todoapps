# Supabase Auth Setup — Tooду App

A complete guide to integrating Supabase authentication (Email/Password + Google OAuth) with per-user todo data.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Dependencies](#dependencies)
3. [Environment Variables](#environment-variables)
4. [Supabase Dashboard Setup](#supabase-dashboard-setup)
5. [Database Schema](#database-schema)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [Google OAuth Setup](#google-oauth-setup)
8. [File Reference](#file-reference)
9. [Auth Flow](#auth-flow)
10. [Todo CRUD with Auth](#todo-crud-with-auth)

---

## Project Structure

```
src/
├── supabaseClient.js          # Supabase instance (shared across app)
├── context/
│   └── AuthContext.jsx        # Global auth state via React Context
├── pages/
│   ├── Login.jsx              # Login page (email + Google)
│   ├── Signup.jsx             # Signup page (email + Google)
│   └── Home.jsx               # Todo app (protected)
├── components/
│   └── ProtectedRoute.jsx     # Redirects to /login if not authenticated
└── App.jsx                    # Router + AuthProvider setup
```

---

## Dependencies

Install these before starting:

```bash
npm install @supabase/supabase-js react-router-dom
```

---

## Environment Variables

Create a `.env` file in your **project root** (same level as `package.json`):

```env
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_KEY=your_anon_public_key_here
```

> ⚠️ **Important:** Add `.env` to your `.gitignore` to avoid exposing your keys on GitHub.

```gitignore
# .gitignore
.env
.env.local
```

---

## Supabase Dashboard Setup

### 1. Create a Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in project name, database password, and region (pick **Singapore** for Malaysia)
4. Wait ~2 minutes for the project to be ready

### 2. Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public key** → `REACT_APP_SUPABASE_KEY`

---

## Database Schema

Run this in **Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

```sql
-- Create todos table
CREATE TABLE todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  is_completed boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### Columns Explained

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Auto-generated unique ID |
| `created_at` | timestamptz | Auto timestamp on insert |
| `title` | text | The todo task text |
| `is_completed` | boolean | Done status (default: false) |
| `user_id` | uuid | Links todo to a specific user |

---

## Row Level Security (RLS)

RLS ensures each user can **only access their own todos**. Run this in the SQL Editor:

```sql
-- Enable RLS on todos table
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read their own todos
CREATE POLICY "Users can view own todos"
ON todos FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: users can only create todos for themselves
CREATE POLICY "Users can insert own todos"
ON todos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own todos
CREATE POLICY "Users can update own todos"
ON todos FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: users can only delete their own todos
CREATE POLICY "Users can delete own todos"
ON todos FOR DELETE
USING (auth.uid() = user_id);
```

> ✅ With RLS enabled, you **do not** need to filter by `user_id` in your queries — Supabase handles it automatically.

---

## Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Set application type to **Web application**
6. Add this to **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   *(Replace `YOUR_PROJECT_REF` with your Supabase project reference ID)*
7. Copy the **Client ID** and **Client Secret**

### Step 2: Add to Supabase

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** → toggle **ON**
3. Paste your **Client ID** and **Client Secret**
4. Save

---

## File Reference

### `src/supabaseClient.js`

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

### `src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

---

### `src/components/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <p>Loading...</p>
  if (!user) return <Navigate to="/login" />

  return children
}
```

---

### `src/pages/Login.jsx`

```jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate('/')
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <button onClick={handleGoogleLogin}>Continue with Google</button>
      <p>No account? <Link to="/signup">Sign up</Link></p>
    </div>
  )
}
```

---

### `src/pages/Signup.jsx`

```jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setMessage('Check your email to confirm your account!')
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Sign Up</button>
      </form>
      <button onClick={handleGoogleLogin}>Continue with Google</button>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}
```

---

### `src/pages/Home.jsx`

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetchTodos()
  }, [])

  async function fetchTodos() {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setTodos(data)
  }

  async function addTodo(e) {
    e.preventDefault()
    if (!title.trim()) return
    await supabase.from('todos').insert([{ title, user_id: user.id }])
    setTitle('')
    fetchTodos()
  }

  async function toggleTodo(id, status) {
    await supabase.from('todos').update({ is_completed: !status }).eq('id', id)
    fetchTodos()
  }

  async function deleteTodo(id) {
    await supabase.from('todos').delete().eq('id', id)
    fetchTodos()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div>
      <h2>My Todos</h2>
      <p>{user.email}</p>
      <button onClick={handleLogout}>Logout</button>

      <form onSubmit={addTodo}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Add a new task..."
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.is_completed}
              onChange={() => toggleTodo(todo.id, todo.is_completed)}
            />
            <span style={{ textDecoration: todo.is_completed ? 'line-through' : 'none' }}>
              {todo.title}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

### `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

---

## Auth Flow

```
User visits /
  └── ProtectedRoute checks if logged in
        ├── Not logged in → redirect to /login
        └── Logged in → show Home (todo app)

User on /login
  ├── Email/password → signInWithPassword()
  └── Google button → signInWithOAuth()
        └── Redirects to Google → back to app → logged in

User on /signup
  ├── Email/password → signUp() → confirm email
  └── Google button → signInWithOAuth()
```

---

## Todo CRUD with Auth

Since RLS is enabled, Supabase automatically filters todos by the logged-in user. You just query normally:

```js
// Fetch — only returns current user's todos (RLS handles filtering)
const { data } = await supabase.from('todos').select('*')

// Insert — always include user_id
await supabase.from('todos').insert([{ title, user_id: user.id }])

// Update
await supabase.from('todos').update({ is_completed: true }).eq('id', id)

// Delete
await supabase.from('todos').delete().eq('id', id)
```

---

## Checklist

- [ ] Created Supabase project
- [ ] Added `.env` with URL and anon key
- [ ] Ran SQL to create `todos` table
- [ ] Ran SQL to enable RLS and add policies
- [ ] Set up Google OAuth credentials
- [ ] Installed `@supabase/supabase-js` and `react-router-dom`
- [ ] Created all files per the structure above
- [ ] Added `.env` to `.gitignore`
- [ ] Tested login, signup, add todo, delete todo, logout
