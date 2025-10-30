import { BookOpen, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center animate-fadeIn">
        <div className="relative mb-8">
          <div className="flex items-center justify-center gap-4">
            <BookOpen className="w-16 h-16 text-primary animate-pulse" />
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <BookOpen className="w-16 h-16 text-secondary animate-pulse" />
          </div>
        </div>

        {/* Main message */}
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Oops! Page Not Found
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Looks like this page took a study break! The content you're looking for might have moved or doesn't exist.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          
          <button
            onClick={handleGoHome}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>

        {/* Helpful links for partners */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Need help? Try these links:
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <button
              onClick={() => handleNavigate('/dashboard')}
              className="text-primary hover:underline"
            >
              Partner Dashboard
            </button>
            <button
              onClick={() => handleNavigate('/signIn')}
              className="text-primary hover:underline"
            >
              Sign In
            </button>
            <button
              onClick={() => handleNavigate('/signUp')}
              className="text-primary hover:underline"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}