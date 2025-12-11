import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TodoList from './components/TodoList';
import CalendarView from './components/CalendarView';
import TimetableUploader from './components/TimetableUploader';
import Dashboard from './components/Dashboard';
import { ViewState, Todo, ClassSession, Theme } from './types';
import { Menu, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  // Navigation History Stack
  const [history, setHistory] = useState<ViewState[]>([ViewState.DASHBOARD]);
  const currentView = history[history.length - 1];

  const [theme, setTheme] = useState<Theme>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize with some dummy data for aesthetics
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Complete Math Assignment', completed: false, category: 'study', dueDate: new Date() },
    { id: '2', text: 'Buy groceries', completed: true, category: 'personal' },
    { id: '3', text: 'Prepare for Physics Quiz', completed: false, category: 'urgent' },
  ]);

  const [classes, setClasses] = useState<ClassSession[]>([]);

  // Load classes from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('auraPlanClasses');
    if (saved) {
      setClasses(JSON.parse(saved));
    }
  }, []);

  // Save classes when updated
  useEffect(() => {
    localStorage.setItem('auraPlanClasses', JSON.stringify(classes));
  }, [classes]);

  // Apply theme to HTML tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navigate = (view: ViewState) => {
    if (view === currentView) return;
    setHistory(prev => [...prev, view]);
    setIsSidebarOpen(false);
  };

  const goBack = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const handleImportClasses = (newClasses: ClassSession[]) => {
    setClasses(prev => [...prev, ...newClasses]);
    navigate(ViewState.CALENDAR);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard classes={classes} todos={todos} onUpdateTodos={setTodos} />;
      case ViewState.CALENDAR:
        return <CalendarView classes={classes} onUpdateClasses={setClasses} />;
      case ViewState.TASKS:
        return <TodoList todos={todos} setTodos={setTodos} />;
      case ViewState.UPLOAD:
        return <TimetableUploader onImport={handleImportClasses} />;
      default:
        return <Dashboard classes={classes} todos={todos} onUpdateTodos={setTodos} />;
    }
  };

  return (
    <div className="flex h-screen bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] overflow-hidden transition-colors duration-500">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-[rgba(var(--card-bg),0.1)] backdrop-blur-md border border-[rgba(var(--text-primary),0.1)] hover:bg-[rgba(var(--text-primary),0.05)] transition-all shadow-sm"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Back Button (appears next to Menu button if history exists) */}
      {history.length > 1 && (
        <button 
          onClick={goBack}
          className="lg:hidden fixed top-4 left-16 z-40 p-2 rounded-xl bg-[rgba(var(--card-bg),0.1)] backdrop-blur-md border border-[rgba(var(--text-primary),0.1)] hover:bg-[rgba(var(--text-primary),0.05)] transition-all shadow-sm animate-in fade-in slide-in-from-left-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      <Sidebar 
        currentView={currentView} 
        setView={navigate} 
        theme={theme} 
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 relative overflow-hidden flex flex-col pt-16 lg:pt-0">
        {/* Background decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[rgb(var(--accent-color))] opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-[rgb(var(--accent-color))] opacity-5 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Desktop Back Button (inside content area) */}
        {history.length > 1 && (
          <button 
            onClick={goBack}
            className="hidden lg:flex absolute top-6 left-6 z-50 p-2 rounded-xl bg-[rgba(var(--card-bg),0.1)] backdrop-blur-md border border-[rgba(var(--text-primary),0.1)] hover:bg-[rgba(var(--text-primary),0.1)] transition-all shadow-sm group animate-in fade-in slide-in-from-left-2"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 opacity-70 group-hover:opacity-100" />
          </button>
        )}

        <div className="flex-1 p-4 lg:p-8 overflow-auto z-10 relative no-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;