import BrowserControlsIcon from '../icons/BrowserControlsIcon';

export default function BrowserChrome() {
  return (
    <div className="w-full border border-border rounded-t-lg overflow-hidden shadow-md">
      {/* Browser Controls Bar */}
      <div className="bg-browser-chrome px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Browser Controls */}
          <BrowserControlsIcon width={52} height={12} />
          
          {/* Tab */}
          <div className="flex items-center gap-2 bg-browser-chrome rounded-t-lg px-3 py-1 border-l border-r border-t border-border">
            <img src="/sqooli-logo.svg" alt="Sqooli" className="w-4 h-4" />
            <span className="text-browser text-xs">Sqooli</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 5L2 3h4L4 5z" fill="#bdc1c6"/>
            </svg>
          </div>
        </div>
        
        {/* New Tab Button */}
        <div className="w-3 h-3 rounded bg-[#bdc1c6] flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 2v4M2 4h4" stroke="white" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>
      
      {/* URL Bar */}
      <div className="bg-browser-chrome px-3 py-2 flex items-center gap-2 border-t border-border">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-browser-dark"></div>
          <div className="w-3 h-3 rounded-sm bg-browser-gray"></div>
          <div className="w-3 h-3 rounded-sm bg-browser-dark"></div>
          <div className="w-3 h-3 rounded-sm bg-browser-dark"></div>
        </div>
        
        {/* URL Input */}
        <div className="flex-1 bg-browser-chrome rounded-xl px-3 py-1.5 flex items-center gap-2 border border-border">
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
            <rect width="8" height="10" rx="1" fill="#86888a"/>
          </svg>
          <span className="text-browser flex-1">sqooli.com</span>
          <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
            <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0z" fill="#5f6368"/>
          </svg>
        </div>
        
        {/* Right Icons */}
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-browser-gray"></div>
          <div className="w-5 h-5 rounded-full bg-browser-gray"></div>
        </div>
      </div>
    </div>
  );
}