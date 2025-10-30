import './App.css'
import DashboardPage from './pages/Dashboard'
import {Route, Routes } from 'react-router-dom'
import  Hero  from './pages/Hero'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import NotFound from './components/common/PageNotFound'
import { ProtectedRoute } from './components/Protected'
import { handleGetCSRF } from './utils/handleLogin'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [csrfReady, setCsrfReady] = useState(false)
  const csrfInitialized = useRef(false) 

  useEffect(() => {
    // Fetch CSRF token ONLY ONCE ever
    const initCSRF = async () => {
      if (csrfInitialized.current) return 
      
      csrfInitialized.current = true
      
      try {
        await handleGetCSRF()
        console.log('✅ CSRF token initialized')
        setCsrfReady(true)
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error)
        setCsrfReady(true) 
      }
    }
    
    initCSRF()
  }, [])

  const routes = [
    {path:"/", element:<Hero />},
    {path:'signIn', element:<SignIn />},
    {path:'signUp',element:<SignUp />},
    {path:'dashboard', element:<ProtectedRoute><DashboardPage /></ProtectedRoute>},
    {path: '*', element: <NotFound />}
  ]

  if (!csrfReady) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </>
  )
}

export default App