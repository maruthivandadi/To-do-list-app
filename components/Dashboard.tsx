import React, { useEffect, useState, useRef } from 'react';
import { ClassSession, Todo } from '../types';
import { format } from 'date-fns';
import { Bell, BellRing, BookOpen, CalendarDays, Edit3, X, Save, CheckCircle, Circle } from 'lucide-react';

interface DashboardProps {
  classes: ClassSession[];
  todos: Todo[];
  onUpdateTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ classes, todos, onUpdateTodos }) => {
  const [todayClasses, setTodayClasses] = useState<ClassSession[]>([]);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editParams, setEditParams] = useState({ text: '' });
  
  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifiedClasses, setNotifiedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const today = format(new Date(), 'EEEE');
    const currentClasses = classes.filter(c => c.day.toLowerCase() === today.toLowerCase());
    currentClasses.sort((a, b) => parseInt(a.startTime.replace(':', '')) - parseInt(b.startTime.replace(':', '')));
    setTodayClasses(currentClasses);
  }, [classes]);

  // Request Notification Permissions
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationsEnabled(permission === 'granted');
        });
      }
    }
  }, []);

  // Reminder Logic: Check every minute
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      
      todayClasses.forEach(session => {
        if (notifiedClasses.has(session.id)) return;

        const [startH, startM] = session.startTime.split(':').map(Number);
        const timeDiffMinutes = (startH * 60 + startM) - (currentH * 60 + currentM);

        // Notify if class starts in 10 minutes or less (but is in the future)
        if (timeDiffMinutes > 0 && timeDiffMinutes <= 10) {
           try {
             new Notification(`Upcoming: ${session.subject}`, {
               body: `Starts in ${timeDiffMinutes} minutes at ${session.startTime}${session.room ? ` in Room ${session.room}` : ''}`,
               icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png'
             });
             setNotifiedClasses(prev => new Set(prev).add(session.id));
           } catch (e) {
             console.error("Notification failed", e);
           }
        }
      });
    };

    const interval = setInterval(checkSchedule, 60000); // Check every minute
    checkSchedule(); // Initial check

    return () => clearInterval(interval);
  }, [todayClasses, notificationsEnabled, notifiedClasses]);


  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const isClassPast = (endTime: string) => {
    const [h, m] = endTime.split(':').map(Number);
    return h < currentHour || (h === currentHour && m < currentMinute);
  };

  const handleTodoClick = (todo: Todo) => {
    setEditingTodo(todo);
    setEditParams({ text: todo.text });
  };

  const toggleTodoCompletion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdateTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const saveTodo = () => {
    if (editingTodo && editParams.text.trim()) {
      onUpdateTodos(prev => prev.map(t => t.id === editingTodo.id ? { ...t, text: editParams.text } : t));
      setEditingTodo(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Today's Overview</h1>
          <div className="flex items-center gap-2 text-sm opacity-60">
             {notificationsEnabled ? (
                 <span className="flex items-center gap-1 text-green-600 font-medium bg-green-500/10 px-2 py-1 rounded-full"><BellRing className="w-3 h-3" /> Reminders On</span>
             ) : (
                 <span className="flex items-center gap-1 cursor-pointer hover:underline" onClick={() => Notification.requestPermission()}><Bell className="w-3 h-3" /> Enable Reminders</span>
             )}
          </div>
        </div>
        <div className="text-left md:text-right mt-2 md:mt-0">
            <div className="text-3xl font-bold opacity-80">
                {format(new Date(), 'h:mm a')}
            </div>
            <div className="text-xl opacity-60">
               {format(new Date(), 'EEEE, MMMM do, yyyy')}
            </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* Left Column: Schedule Timeline */}
        <div className="glass-panel rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col overflow-hidden relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(var(--text-primary),0.1)]">
                <div className="flex items-center gap-3">
                    <CalendarDays className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Class Schedule</h2>
                </div>
                 <div className="flex flex-col items-end">
                    <span className="text-lg font-bold leading-none">{format(new Date(), 'MMM d')}</span>
                    <span className="text-sm opacity-70 leading-none mt-1">{format(new Date(), 'EEEE')}</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {todayClasses.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-60 py-10">
                        <BookOpen className="w-12 h-12 mb-4" />
                        <p className="text-xl">No classes scheduled.</p>
                        <p className="text-lg">Enjoy your day!</p>
                    </div>
                ) : (
                    <div className="space-y-6 relative pl-4 mt-2">
                        {/* Vertical line */}
                        <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-[rgba(var(--text-primary),0.2)]"></div>

                        {todayClasses.map((session) => {
                            const past = isClassPast(session.endTime);
                            const startH = parseInt(session.startTime.split(':')[0]);
                            const isCurrent = startH === currentHour && !past;
                            
                            return (
                                <div key={session.id} className={`relative flex gap-6 group ${past ? 'opacity-50' : ''}`}>
                                    {/* Time bubble */}
                                    <div className={`relative z-10 flex-shrink-0 w-14 text-right pt-2 text-lg ${isCurrent ? 'font-bold scale-110' : ''}`}>
                                        {session.startTime}
                                    </div>

                                    {/* Timeline Node */}
                                    <div className="relative pt-3">
                                        <div className={`w-4 h-4 rounded-full border-2 z-20 relative bg-[rgb(var(--bg-primary))] border-[rgb(var(--text-primary))] ${
                                            isCurrent ? 'scale-125 bg-[rgb(var(--text-primary))]' : ''
                                        }`}></div>
                                    </div>

                                    {/* Card */}
                                    <div className={`flex-1 p-4 rounded-xl border transition-all duration-300 ${
                                        isCurrent 
                                            ? 'bg-[rgba(var(--text-primary),0.1)] border-[rgb(var(--text-primary))] shadow-md transform scale-[1.02]' 
                                            : 'bg-[rgba(var(--card-bg),0.05)] border-transparent hover:border-[rgba(var(--text-primary),0.2)]'
                                    }`}>
                                        <div className="flex justify-between items-start">
                                            <div className={past ? 'line-through decoration-2' : ''}>
                                                <h3 className="font-bold text-xl leading-tight">
                                                    {session.subject}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 opacity-70">
                                                    <span className="text-sm">
                                                        {session.startTime} - {session.endTime}
                                                    </span>
                                                    {session.room && (
                                                        <span className="text-sm font-semibold">
                                                            • Room {session.room}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Tasks */}
        <div className="flex flex-col gap-6 h-full min-h-0">
             {/* Tasks Card */}
            <div className="flex-1 glass-panel rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(var(--text-primary),0.1)]">
                    <div className="flex items-center gap-3">
                        <Bell className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">Daily Tasks</h2>
                    </div>
                    <span className="text-sm font-bold px-3 py-1 rounded-full bg-[rgba(var(--text-primary),0.1)]">
                        {todos.filter(t => !t.completed).length} Pending
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    {todos.filter(t => !t.completed).length === 0 ? (
                         <div className="text-center py-10 opacity-60">
                             <p className="text-xl">All caught up!</p>
                         </div>
                    ) : (
                        todos.filter(t => !t.completed).map(todo => (
                            <div 
                                key={todo.id} 
                                onClick={() => handleTodoClick(todo)}
                                className="group flex items-center gap-4 p-4 rounded-xl bg-[rgba(var(--card-bg),0.1)] hover:bg-[rgba(var(--card-bg),0.2)] transition-all cursor-pointer border border-transparent hover:border-[rgba(var(--text-primary),0.3)]"
                            >
                                <button 
                                  onClick={(e) => toggleTodoCompletion(e, todo.id)}
                                  className="flex-shrink-0 hover:opacity-70 transition-opacity"
                                >
                                    <Circle className="w-6 h-6 opacity-60 hover:opacity-100" />
                                </button>
                                
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                    todo.category === 'urgent' ? 'bg-red-500' : 
                                    todo.category === 'study' ? 'bg-blue-500' : 'bg-green-500'
                                }`}></div>
                                
                                <span className="text-xl flex-1 truncate">{todo.text}</span>
                                <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))
                    )}
                    
                    {/* Recently Completed */}
                    {todos.filter(t => t.completed).length > 0 && (
                        <div className="pt-4 border-t border-[rgba(var(--text-primary),0.1)] opacity-60">
                            <h4 className="text-sm font-bold mb-2 uppercase tracking-widest">Completed</h4>
                            {todos.filter(t => t.completed).slice(0, 3).map(todo => (
                                <div key={todo.id} className="flex items-center gap-3 p-2 text-sm line-through">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{todo.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-[rgb(var(--bg-primary))] border border-[rgba(var(--text-primary),0.2)] p-6 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Edit Task</h3>
                    <button onClick={() => setEditingTodo(null)}><X className="w-6 h-6" /></button>
                </div>
                <input
                    type="text"
                    value={editParams.text}
                    onChange={(e) => setEditParams({ text: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[rgba(var(--card-bg),0.1)] border border-[rgba(var(--text-primary),0.2)] outline-none focus:border-[rgb(var(--text-primary))] font-[Inter] text-lg mb-4"
                    autoFocus
                />
                <button 
                    onClick={saveTodo}
                    className="w-full py-3 bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] font-bold rounded-xl hover:opacity-90 flex justify-center items-center gap-2"
                >
                    <Save className="w-5 h-5" /> Save Changes
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;