import { useAuth } from './hooks/useAuth'
import './App.css'
import DashboardPage from './pages/Dashboard'
import {Route, Routes } from 'react-router-dom'
import  Hero  from './pages/Hero'
import SignIn from './pages/SIgnIn'
import SignUp from './pages/SignUp'

function App() {
  const { partners } = useAuth()

  if(partners){
    console.log(partners)
  }

  const routes =[
    {path:"/", element:<Hero />},
    {path:'signIn', element:<SignIn />},
    {path:'signUp',element:<SignUp />},
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
