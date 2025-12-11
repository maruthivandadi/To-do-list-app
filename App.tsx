import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TodoList from './components/TodoList';
import CalendarView from './components/CalendarView';
import TimetableUploader from './components/TimetableUploader';
import Dashboard from './components/Dashboard';
import { ViewState, Todo, ClassSession, Theme } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);
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

  const handleImportClasses = (newClasses: ClassSession[]) => {
    setClasses(prev => [...prev, ...newClasses]);
    setView(ViewState.CALENDAR);
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
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-[rgba(var(--card-bg),0.1)] backdrop-blur-md border border-[rgba(var(--text-primary),0.1)]"
      >
        <Menu className="w-6 h-6" />
      </button>

      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setView(view);
          setIsSidebarOpen(false);
        }} 
        theme={theme} 
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 relative overflow-hidden flex flex-col pt-16 lg:pt-0">
        {/* Background decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[rgb(var(--accent-color))] opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-[rgb(var(--accent-color))] opacity-5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex-1 p-4 lg:p-8 overflow-auto z-10 relative no-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;