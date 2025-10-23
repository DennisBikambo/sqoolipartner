'use client';

import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import ThemeButton from '../common/ThemeButton';
import Logo from '../common/Logo';

export function HeroHeader() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border px-6 ">
      <div className="flex h-16 items-center justify-between px-6 cursor-pointer" >
        {/* Left: Logo */}
        <div className="flex items-center gap-0.5 text-2xl font-bold" onClick={()=>navigate('/')}>
          <Logo />
        </div>

        {/* Right: Auth Buttons */}
        <div className="flex items-center gap-3">
          <ThemeButton theme={theme} setTheme={setTheme} />
          <Button variant="ghost" className="text-foreground font-medium" onClick={() => navigate('/signIn')}>
            Sign In
          </Button>
          <Button variant="default" className="font-semibold" onClick={()=> navigate('/signUp')}>
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}
