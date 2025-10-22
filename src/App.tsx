import { useAuth } from './hooks/useAuth'
import './App.css'
import DashboardPage from './pages/Dashboard'

function App() {
  const { partners } = useAuth()

  if(partners){
    console.log(partners)
  }
  return (
    <>
      <DashboardPage />
    </>
  )
}

export default App
