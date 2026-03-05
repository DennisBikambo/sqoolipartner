import './App.css'
import DashboardPage from './pages/Dashboard'
import {Route, Routes } from 'react-router-dom'
import  Hero  from './pages/Hero'
import SignIn from './pages/SignIn'
// import SignUp from './pages/SignUp'
import NotFound from './components/common/PageNotFound'
import { ProtectedRoute } from './components/Protected'
import OnboardingPage from './pages/Onboarding'



function App() {
  const routes = [
    {path:"/", element:<Hero />},
    {path:'signIn', element:<SignIn />},
    // {path:'signUp',element:<SignUp />},
    {path:'onboarding', element:<ProtectedRoute><OnboardingPage /></ProtectedRoute>},
    {path:'dashboard', element:<ProtectedRoute><DashboardPage /></ProtectedRoute>},
    {path: '*', element: <NotFound />}
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