import React, { useState } from 'react';
import { ClassSession } from '../types';
import { format } from 'date-fns';
import { Clock, Plus, X, Trash2, Save, MapPin, ZoomIn, ZoomOut } from 'lucide-react';

interface CalendarViewProps {
  classes: ClassSession[];
  onUpdateClasses: (classes: ClassSession[]) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ classes, onUpdateClasses }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8 to 18
  const currentDayName = format(new Date(), 'EEEE');
  const currentHour = new Date().getHours();

  // Zoom State - Default to smaller on mobile/desktop for overview
  const [zoomLevel, setZoomLevel] = useState(0.8);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<ClassSession>>({
    subject: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    color: 'bg-[rgb(var(--text-primary))]'
  });

  const getClassesForDayAndTime = (dayName: string, hour: number) => {
    return classes.filter(c => {
      if (!c.startTime) return false;
      const startHour = parseInt(c.startTime.split(':')[0]);
      return c.day.toLowerCase() === dayName.toLowerCase() && startHour === hour;
    });
  };

  const handleSlotClick = (day: string, hour: number) => {
    setEditingId(null);
    setFormData({
      subject: '',
      day: day,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      room: '',
      color: 'bg-[rgb(var(--text-primary))]'
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, session: ClassSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setFormData({ ...session });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.subject || !formData.day || !formData.startTime || !formData.endTime) return;

    if (editingId) {
      const updatedClasses = classes.map(c => 
        c.id === editingId ? { ...c, ...formData } as ClassSession : c
      );
      onUpdateClasses(updatedClasses);
    } else {
      const newClass: ClassSession = {
        id: crypto.randomUUID(),
        ...formData as any
      };
      onUpdateClasses([...classes, newClass]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingId) {
      onUpdateClasses(classes.filter(c => c.id !== editingId));
      setIsModalOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-2">
        <div>
            <h2 className="text-3xl font-bold mb-1">Weekly Schedule</h2>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(var(--card-bg),0.1)] px-3 py-2 rounded-xl border border-[rgba(var(--text-primary),0.2)] w-full md:w-auto">
            <ZoomOut className="w-4 h-4 opacity-70" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))} />
            <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.1" 
                value={zoomLevel} 
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="flex-1 md:w-24 accent-[rgb(var(--text-primary))]"
            />
            <ZoomIn className="w-4 h-4 opacity-70" onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} />
            <span className="text-sm font-mono opacity-70 min-w-[3ch]">{Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto glass-panel rounded-2xl shadow-sm custom-scrollbar relative bg-[rgba(var(--bg-primary),0.5)]">
        <div 
            className="p-4 transition-transform origin-top-left"
            style={{ 
                minWidth: '1000px', 
                transform: `scale(${zoomLevel})`,
                width: `${100 / zoomLevel}%`
            }}
        >
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-2 mb-2 border-b border-[rgba(var(--text-primary),0.1)] pb-2 sticky top-0 bg-[rgb(var(--bg-primary))] z-20">
                <div className="text-sm font-bold pt-2 opacity-60">Time</div>
                {days.map(day => (
                    <div key={day} className={`text-center pb-1 ${
                        day === currentDayName ? 'border-b-2 border-[rgb(var(--text-primary))] font-bold text-[rgb(var(--text-primary))]' : 'opacity-60'
                    }`}>
                        <span className="text-lg block">{day.substring(0, 3)}</span>
                    </div>
                ))}
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
                {timeSlots.map(hour => (
                    <div key={hour} className="grid grid-cols-8 gap-2 min-h-[100px]">
                        {/* Time Label */}
                        <div className="text-right text-sm font-mono pt-2 relative border-r border-[rgba(var(--text-primary),0.1)] pr-2 opacity-70">
                             {hour}:00
                             {hour === currentHour && (
                                <div className="absolute top-3 right-0 w-2 h-2 rounded-full bg-[rgb(var(--text-primary))] translate-x-1/2"></div>
                             )}
                        </div>

                        {/* Days */}
                        {days.map(day => {
                            const session = getClassesForDayAndTime(day, hour)[0];
                            return (
                                <div 
                                    key={`${day}-${hour}`} 
                                    className="relative group cursor-pointer"
                                    onClick={() => handleSlotClick(day, hour)}
                                >
                                    <div className={`h-full w-full rounded-lg border border-dashed border-[rgba(var(--text-primary),0.1)] hover:bg-[rgba(var(--text-primary),0.05)] transition-all ${
                                        day === currentDayName ? 'bg-[rgba(var(--card-bg),0.03)]' : ''
                                    } flex items-center justify-center`}>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="w-5 h-5 opacity-50" />
                                        </div>

                                        {session && (
                                            <div 
                                                onClick={(e) => handleEventClick(e, session)}
                                                className="absolute inset-0 m-0.5 p-1.5 rounded-md bg-[rgba(var(--card-bg),0.15)] border border-[rgba(var(--text-primary),0.1)] hover:scale-[1.02] transition-transform cursor-pointer shadow-sm z-10 overflow-hidden backdrop-blur-sm"
                                                style={{backgroundColor: session.color ? undefined : 'rgba(var(--text-primary), 0.1)'}}
                                            >
                                                {session.color && session.color.startsWith('bg-') && (
                                                     <div className={`absolute inset-0 opacity-20 ${session.color}`}></div>
                                                )}
                                                
                                                <div className="relative h-full flex flex-col min-w-0">
                                                    <h4 className="text-sm font-bold leading-tight truncate">{session.subject}</h4>
                                                    <div className="flex items-center gap-0.5 text-xs mt-0.5 opacity-80">
                                                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                                        <span className="truncate">{session.startTime}-{session.endTime}</span>
                                                    </div>
                                                    {session.room && (
                                                        <div className="mt-auto flex items-center gap-0.5 text-[10px] font-mono opacity-60 truncate">
                                                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                                            {session.room}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[rgb(var(--bg-primary))] border border-[rgba(var(--text-primary),0.2)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="p-5 border-b border-[rgba(var(--text-primary),0.1)] flex justify-between items-center sticky top-0 bg-[rgb(var(--bg-primary))] z-10">
                      <h3 className="text-2xl font-bold">
                          {editingId ? 'Edit Class' : 'Add Class'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[rgba(var(--text-primary),0.1)] rounded-full"><X className="w-6 h-6" /></button>
                  </div>
                  
                  <div className="p-6 space-y-4 font-[Inter]">
                      <div>
                          <label className="block text-sm font-bold opacity-70 mb-1">Subject</label>
                          <input 
                              type="text" 
                              value={formData.subject}
                              onChange={e => setFormData({...formData, subject: e.target.value})}
                              className="w-full bg-[rgba(var(--card-bg),0.1)] border border-[rgba(var(--text-primary),0.2)] rounded-xl p-3 outline-none focus:border-[rgb(var(--text-primary))] transition-colors"
                              autoFocus
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold opacity-70 mb-1">Day</label>
                            <select 
                                value={formData.day}
                                onChange={e => setFormData({...formData, day: e.target.value})}
                                className="w-full bg-[rgba(var(--card-bg),0.1)] border border-[rgba(var(--text-primary),0.2)] rounded-xl p-3 outline-none appearance-none"
                            >
                                {days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold opacity-70 mb-1">Room</label>
                            <input 
                                type="text" 
                                value={formData.room}
                                onChange={e => setFormData({...formData, room: e.target.value})}
                                className="w-full bg-[rgba(var(--card-bg),0.1)] border border-[rgba(var(--text-primary),0.2)] rounded-xl p-3 outline-none"
                            />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold opacity-70 mb-1">Start Time</label>
                              <input 
                                  type="time" 
                                  value={formData.startTime}
                                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                                  className="w-full bg-[rgba(var(--card-bg),0.1)] border border-[rgba(var(--text-primary),0.2)] rounded-xl p-3 outline-none"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold opacity-70 mb-1">End Time</label>
                              <input 
                                  type="time" 
                                  value={formData.endTime}
                                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                                  className="w-full bg-[rgba(var(--card-bg),0.1)] border border-[rgba(var(--text-primary),0.2)] rounded-xl p-3 outline-none"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-[rgba(var(--card-bg),0.05)] flex justify-between">
                      {editingId ? (
                          <button 
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 font-bold transition-colors"
                          >
                              <Trash2 className="w-5 h-5" />
                          </button>
                      ) : <div></div>}
                      
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-8 py-3 bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] rounded-xl hover:opacity-90 font-bold shadow-lg transition-transform active:scale-95"
                      >
                          <Save className="w-5 h-5" /> Save
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;