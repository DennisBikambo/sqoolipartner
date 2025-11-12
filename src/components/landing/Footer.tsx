import { Twitter, Linkedin, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-background">
      {/* Contact Section */}
      <div className="py-12 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <img 
            src="/sqooli-footer-logo.svg" 
            alt="Sqooli" 
            className="h-14"
          />
          
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-medium text-[#101828] dark:text-foreground capitalize" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Reach Us
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-4">
                <span className="text-sm font-normal text-[#475467] dark:text-muted-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Tel: 0723 770365
                </span>
              </div>
              <span className="text-sm font-normal text-[#475467] dark:text-muted-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Email: info@sqooli.com
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-border dark:border-border py-6 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-base text-[#475467] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
            Copyright © 2025 Sqooli . All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="text-base font-normal text-[#3498db] dark:text-primary hover:opacity-80 transition-opacity underline"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Terms & Condition
            </a>
            <a 
              href="#" 
              className="text-base font-normal text-[#3498db] dark:text-primary hover:opacity-80 transition-opacity underline"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              Privacy
            </a>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="w-6 h-6 rounded bg-[#1da1f2] flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4 text-white" />
            </a>
            <a 
              href="#" 
              className="w-6 h-6 rounded bg-[#0a66c2] flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4 text-white" />
            </a>
            <a 
              href="#" 
              className="w-6 h-6 rounded bg-[#1877f2] flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}