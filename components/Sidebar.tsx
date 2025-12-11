import React from 'react';
import { ViewState, Theme } from '../types';
import { LayoutDashboard, Calendar, CheckSquare, Upload, Sparkles, Moon, Sun } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  theme: Theme;
  toggleTheme: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, theme, toggleTheme, isOpen, onClose }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { id: ViewState.CALENDAR, icon: Calendar, label: 'Calendar' },
    { id: ViewState.TASKS, icon: CheckSquare, label: 'Tasks' },
    { id: ViewState.UPLOAD, icon: Upload, label: 'Import' },
  ];

  return (
    <>
      {/* 
        Desktop Sidebar 
        - Vertical
        - Always visible on lg screens
        - Hidden on mobile
      */}
      <div className={`
        hidden lg:flex
        relative z-50 h-screen
        w-64 
        border-r border-[rgba(var(--text-primary),0.1)] 
        flex-col items-start py-8 
        transition-all duration-300 ease-in-out
        bg-transparent
      `}>
        <div className="mb-10 px-6 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(var(--text-primary),0.1)]">
              <Sparkles className="w-6 h-6 text-[rgb(var(--text-primary))]" />
            </div>
            <h1 className="text-2xl font-bold tracking-widest text-[rgb(var(--text-primary))]">
              AuraPlan
            </h1>
          </div>
        </div>

        <nav className="flex-1 w-full px-4 space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-[rgba(var(--text-primary),0.1)] text-[rgb(var(--text-primary))] font-bold shadow-sm'
                  : 'text-[rgb(var(--text-primary))] opacity-70 hover:opacity-100 hover:bg-[rgba(var(--text-primary),0.05)]'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-lg">
                {item.label}
              </span>
              {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[rgb(var(--text-primary))]" />
              )}
            </button>
          ))}
        </nav>

        <div className="w-full px-4 mt-auto">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--text-primary),0.05)] transition-all opacity-80 hover:opacity-100"
          >
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            <span className="font-medium">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>
        </div>
      </div>

      {/* 
        Mobile Menu (Pop-up Grid)
        - Grid Layout
        - Visible only when isOpen is true on mobile
        - Hidden on lg screens
      */}
      <div 
        className={`
          lg:hidden fixed top-16 left-4 right-4 z-50
          glass-panel rounded-2xl shadow-xl p-3
          grid grid-cols-2 gap-2
          transform transition-all duration-300 origin-top
          ${isOpen ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95 pointer-events-none'}
        `}
      >
        {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                  setView(item.id);
                  onClose();
              }}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-[rgba(var(--text-primary),0.1)] text-[rgb(var(--text-primary))] font-bold'
                  : 'text-[rgb(var(--text-primary))] opacity-70 bg-[rgba(var(--card-bg),0.05)]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">
                {item.label}
              </span>
            </button>
          ))}
          
          <button 
            onClick={toggleTheme}
            className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl text-[rgb(var(--text-primary))] bg-[rgba(var(--card-bg),0.05)] hover:bg-[rgba(var(--text-primary),0.05)]"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="text-sm font-medium">
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </span>
          </button>
      </div>
      
      {/* Backdrop to close on click outside (Mobile only) */}
      {isOpen && (
        <div 
            className="lg:hidden fixed inset-0 z-40 bg-transparent"
            onClick={onClose}
        ></div>
      )}
    </>
  );
};

export default Sidebar;