'use client';

import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export function HeroHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border px-6 ">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-0.5 text-2xl font-bold">
          <span className="text-primary px-1.5 py-0.5 rounded">s</span>
          <span className="text-secondary px-1.5 py-0.5 rounded">q</span>
          <span className="text-chart-3 px-1.5 py-0.5 rounded">o</span>
          <span className="text-chart-3 px-1.5 py-0.5 rounded">o</span>
          <span className="text-secondary px-1.5 py-0.5 rounded">l</span>
          <span className="text-chart-5 px-1.5 py-0.5 rounded">i</span>
        </div>

        {/* Right: Auth Buttons */}
        <div className="flex items-center gap-3">
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
