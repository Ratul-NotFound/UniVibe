import React from 'react';
import BottomNav from './BottomNav';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <main className="flex-1 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
