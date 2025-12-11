import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Edit3, Save, X, ArrowUpDown, Calendar } from 'lucide-react';
import { Todo } from '../types';
import { format } from 'date-fns';

interface TodoListProps {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
}

const TodoList: React.FC<TodoListProps> = ({ todos, setTodos }) => {
  const [newTodo, setNewTodo] = useState('');
  const [category, setCategory] = useState<Todo['category']>('personal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'dueDate'>('default');

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const todo: Todo = {
      id: crypto.randomUUID(),
      text: newTodo,
      completed: false,
      category,
      dueDate: new Date(),
    };

    setTodos([...todos, todo]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      setTodos(todos.map(t => t.id === editingId ? { ...t, text: editText } : t));
      setEditingId(null);
    }
  };

  const getSortedTodos = () => {
    const sorted = [...todos];
    if (sortBy === 'dueDate') {
      sorted.sort((a, b) => {
        // Always prioritize pending tasks at the top when sorting
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        
        // Sort by date (oldest/soonest first)
        if (!a.completed) {
          const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return timeA - timeB;
        }
        return 0;
      });
    }
    return sorted;
  };

  const visibleTodos = getSortedTodos();

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Tasks & Goals</h2>
            <div className="flex items-center gap-4 opacity-70 text-base md:text-lg">
                <span>{todos.filter(t => !t.completed).length} pending</span>
                <span className="w-1 h-1 rounded-full bg-current"></span>
                <span>{todos.filter(t => t.completed).length} completed</span>
            </div>
        </div>
        
        <button
            onClick={() => setSortBy(prev => prev === 'default' ? 'dueDate' : 'default')}
            className={`self-start md:self-end flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all border ${
                sortBy === 'dueDate' 
                ? 'bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] border-transparent shadow-md' 
                : 'bg-[rgba(var(--card-bg),0.1)] text-[rgb(var(--text-primary))] border-[rgba(var(--text-primary),0.1)] hover:bg-[rgba(var(--text-primary),0.05)]'
            }`}
        >
            <ArrowUpDown className="w-4 h-4" />
            {sortBy === 'dueDate' ? 'Sorted by Date' : 'Sort by Date'}
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-sm">
        <form onSubmit={handleAddTodo} className="flex flex-col md:flex-row gap-3 md:gap-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full md:flex-1 bg-[rgba(var(--card-bg),0.1)] md:bg-transparent border border-[rgba(var(--text-primary),0.1)] md:border-none rounded-xl md:rounded-none p-3 md:p-0 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-primary))] placeholder:opacity-50 focus:ring-0 text-lg md:text-xl font-[Inter] outline-none"
          />
          <div className="flex items-center justify-between md:justify-start gap-2 md:border-l md:border-[rgba(var(--text-primary),0.2)] md:pl-4">
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="bg-[rgba(var(--card-bg),0.1)] md:bg-transparent border border-[rgba(var(--text-primary),0.1)] md:border-[rgba(var(--text-primary),0.2)] rounded-xl md:rounded-lg p-2.5 md:p-2 font-[Inter] text-sm flex-1 md:flex-none outline-none"
            >
                <option value="personal">Personal</option>
                <option value="study">Study</option>
                <option value="urgent">Urgent</option>
            </select>
            <button
                type="submit"
                className="bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] p-2.5 md:p-2 rounded-xl md:rounded-lg hover:opacity-90 shadow-md md:shadow-none flex-shrink-0"
            >
                <Plus className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3 md:space-y-4 flex-1 overflow-y-auto pb-20 custom-scrollbar pr-1 md:pr-2">
        {visibleTodos.length === 0 && (
            <div className="text-center py-20 opacity-50">
                <p className="text-xl">Your list is empty.</p>
            </div>
        )}
        {visibleTodos.map((todo) => (
          <div
            key={todo.id}
            className={`group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border transition-all duration-300 ${
              todo.completed
                ? 'bg-[rgba(var(--card-bg),0.05)] border-transparent opacity-50'
                : 'glass-panel hover:border-[rgba(var(--text-primary),0.3)]'
            }`}
          >
            <button onClick={() => toggleTodo(todo.id)} className="flex-shrink-0 hover:opacity-70 transition-opacity p-1">
              {todo.completed ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6 opacity-60" /> : <Circle className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`text-lg md:text-xl truncate ${todo.completed ? 'line-through' : ''}`}>
                {todo.text}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-bold opacity-70 ${
                      todo.category === 'urgent' ? 'bg-red-500/20 text-red-600' : 
                      todo.category === 'study' ? 'bg-blue-500/20 text-blue-600' : 'bg-green-500/20 text-green-600'
                  }`}>
                    {todo.category}
                  </span>
                  {todo.dueDate && (
                    <span className="flex items-center gap-1 text-[10px] md:text-xs opacity-50 font-mono">
                       <Calendar className="w-3 h-3" />
                       {format(new Date(todo.dueDate), 'MMM d, h:mm a')}
                    </span>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                onClick={() => startEdit(todo)}
                className="p-1.5 md:p-2 hover:bg-[rgba(var(--text-primary),0.1)] rounded-lg"
                >
                <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                onClick={() => deleteTodo(todo.id)}
                className="p-1.5 md:p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg"
                >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            </div>
          </div>
        ))}
      </div>

       {/* Edit Modal */}
       {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
              <div className="bg-[rgb(var(--bg-primary))] border border-[rgba(var(--text-primary),0.2)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold">Edit Task</h3>
                      <button onClick={() => setEditingId(null)}><X className="w-6 h-6" /></button>
                  </div>
                  <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[rgba(var(--card-bg),0.1)] border border-[rgba(var(--text-primary),0.2)] font-[Inter] text-lg mb-4 outline-none focus:border-[rgb(var(--text-primary))]"
                      autoFocus
                  />
                  <button 
                      onClick={saveEdit}
                      className="w-full py-3 bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] font-bold rounded-lg hover:opacity-90 flex justify-center items-center gap-2"
                  >
                      <Save className="w-5 h-5" /> Save Changes
                  </button>
              </div>
          </div>
       )}
    </div>
  );
};

export default TodoList;