import { useAuth } from './hooks/useAuth'
import './App.css'
import DashboardPage from './pages/Dashboard'
import {Route, Routes } from 'react-router-dom'
import  Hero  from './pages/Hero'

function App() {
  const { partners } = useAuth()

  if(partners){
    console.log(partners)
  }

  const routes =[
    {path:"/", element:<Hero />},
    {path:'dashboard', element:<DashboardPage />}
  ]
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
