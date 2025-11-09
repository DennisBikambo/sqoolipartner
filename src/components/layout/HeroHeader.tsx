'use client';

import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import ThemeButton from '../common/ThemeButton';
import Logo from '../common/Logo';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function HeroHeader() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  console.log(user)

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <div
          className="flex items-center gap-0.5 text-2xl font-bold cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Logo />
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeButton theme={theme} setTheme={setTheme} />

          {!loading && user ? (
            <Button
              variant="default"
              className="font-semibold"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-foreground font-medium"
                onClick={() => navigate('/signIn')}
              >
                Sign In
              </Button>
              <Button
                variant="default"
                className="font-semibold"
                onClick={() => navigate('/signUp')}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg border border-border"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="flex flex-col items-start gap-3 px-6 pb-4 md:hidden bg-background border-t border-border">
          {!loading && user ? (
            <Button
              variant="default"
              className="w-full font-semibold"
              onClick={() => {
                navigate('/dashboard');
                setMenuOpen(false);
              }}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="w-full text-left font-medium"
                onClick={() => {
                  navigate('/signIn');
                  setMenuOpen(false);
                }}
              >
                Sign In
              </Button>
              <Button
                variant="default"
                className="w-full font-semibold"
                onClick={() => {
                  navigate('/signUp');
                  setMenuOpen(false);
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
