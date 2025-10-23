import { Button } from "../ui/button"
import {Moon, Sun } from "lucide-react"
import type {Theme} from "../../context/ThemeContext"

interface ThemeButtonProps {
    theme: string
    setTheme: (theme: Theme) => void
}

export default function ThemeButton({theme, setTheme}: ThemeButtonProps) {


    return (
        <Button variant="ghost" size="icon" className="round-full" onClick={()=>setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
    )
}