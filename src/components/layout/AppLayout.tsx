import React from 'react';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import PwaInstallPrompt from './PwaInstallPrompt';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#020202]">
      {/* Universal Responsive Shell */}
      <DesktopSidebar />
      
      <div className="flex-1 flex flex-col lg:pl-80 transition-all duration-500">
        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,16px))] lg:pb-0">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
        
        <PwaInstallPrompt />
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
