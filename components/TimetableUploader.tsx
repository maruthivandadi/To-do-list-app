import React, { useState, useCallback } from 'react';
import { Upload, FileImage, FileText, Loader2, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { extractScheduleFromImage } from '../services/geminiService';
import { ClassSession } from '../types';

interface TimetableUploaderProps {
  onImport: (classes: ClassSession[]) => void;
}

const TimetableUploader: React.FC<TimetableUploaderProps> = ({ onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null); // 'missing_key' | 'invalid_key' | 'other'
  const [success, setSuccess] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload an image or PDF file.');
      return;
    }
    setFile(file);
    setError(null);
    setErrorType(null);
    setSuccess(false);
  };

  const processFile = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Handle both Data URL formats: "data:image/png;base64,..."
        const base64Data = base64String.split(',')[1];
        
        try {
          const result = await extractScheduleFromImage(base64Data, file.type);
          
          if (!result.schedule || result.schedule.length === 0) {
             throw new Error("No classes found. Please try a clearer image.");
          }

          const newClasses: ClassSession[] = result.schedule.map(c => ({
            id: crypto.randomUUID(),
            subject: c.subject,
            day: c.day,
            startTime: c.startTime,
            endTime: c.endTime,
            room: c.room,
            color: 'bg-[rgb(var(--text-primary))]'
          }));

          onImport(newClasses);
          setSuccess(true);
        } catch (err: any) {
          console.error(err);
          if (err.message === 'API_KEY_MISSING') {
              setErrorType('missing_key');
              setError("API Key is missing.");
          } else if (err.message === 'INVALID_API_KEY') {
              setErrorType('invalid_key');
              setError("API Key is invalid or expired.");
          } else {
              setErrorType('other');
              setError(err.message || "Failed to analyze. Please ensure the image is clear.");
          }
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
          setError("Failed to read file.");
          setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError("Error processing file.");
      setIsLoading(false);
    }
  };

  const handleManualEntry = () => {
    // Pass empty array to switch view to Calendar
    onImport([]);
  };

  const handleDemoImport = () => {
    setIsLoading(true);
    setError(null);
    
    // Simulate AI delay for effect
    setTimeout(() => {
        const demoClasses: ClassSession[] = [
            { id: crypto.randomUUID(), day: 'Monday', subject: 'Mathematics', startTime: '09:00', endTime: '10:00', room: '101', color: 'bg-blue-500' },
            { id: crypto.randomUUID(), day: 'Monday', subject: 'Physics', startTime: '10:00', endTime: '11:30', room: 'Lab A', color: 'bg-indigo-500' },
            { id: crypto.randomUUID(), day: 'Tuesday', subject: 'History', startTime: '09:00', endTime: '10:30', room: '204', color: 'bg-orange-500' },
            { id: crypto.randomUUID(), day: 'Tuesday', subject: 'Art', startTime: '13:00', endTime: '14:30', room: 'Studio', color: 'bg-pink-500' },
            { id: crypto.randomUUID(), day: 'Wednesday', subject: 'Biology', startTime: '11:00', endTime: '12:30', room: 'Lab B', color: 'bg-green-500' },
            { id: crypto.randomUUID(), day: 'Thursday', subject: 'Computer Science', startTime: '14:00', endTime: '15:30', room: '303', color: 'bg-purple-500' },
            { id: crypto.randomUUID(), day: 'Friday', subject: 'English Lit', startTime: '10:00', endTime: '11:00', room: '102', color: 'bg-yellow-500' },
        ];
        onImport(demoClasses);
        setSuccess(true);
        setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto pt-4 md:pt-10 h-full flex flex-col justify-center">
      <div className="glass-panel rounded-3xl p-6 md:p-10 shadow-lg text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-6 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Import Schedule</h2>
          <p className="text-lg md:text-xl opacity-70">Upload your timetable or start manually.</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 md:p-12 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] mb-8 ${
            isDragging
              ? 'border-[rgb(var(--text-primary))] bg-[rgba(var(--text-primary),0.1)]'
              : 'border-[rgba(var(--text-primary),0.3)] hover:border-[rgb(var(--text-primary))] hover:bg-[rgba(var(--card-bg),0.1)]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileInput}
            accept="image/*,application/pdf"
            disabled={isLoading}
          />

          {!file && !isLoading && !success && (
            <div className="flex flex-col items-center gap-4 md:gap-6 pointer-events-none">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-[rgba(var(--text-primary),0.1)]">
                <Upload className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">Drop file here</p>
                <p className="text-base md:text-lg opacity-60 mt-2">or click to browse</p>
              </div>
            </div>
          )}

          {file && !isLoading && !success && (
            <div className="flex flex-col items-center gap-4 md:gap-6 animate-in fade-in zoom-in duration-300">
               <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-[rgba(var(--text-primary),0.1)]">
                {file.type.includes('pdf') ? <FileText className="w-8 h-8 md:w-10 md:h-10"/> : <FileImage className="w-8 h-8 md:w-10 md:h-10"/>}
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold truncate max-w-[200px] md:max-w-xs">{file.name}</p>
                <p className="text-base md:text-lg opacity-60 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={(e) => {
                    e.preventDefault(); 
                    processFile();
                }}
                className="mt-4 px-6 md:px-8 py-3 bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] rounded-xl font-bold text-lg hover:opacity-90 shadow-lg z-10 relative pointer-events-auto"
              >
                Analyze with AI
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin" />
              <p className="text-lg md:text-xl font-bold">Analyzing...</p>
            </div>
          )}

          {success && (
             <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500/20 rounded-full flex items-center justify-center">
               <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
             </div>
             <div>
               <p className="text-xl md:text-2xl font-bold">Success!</p>
               <p className="text-base md:text-lg opacity-60 mt-2">Schedule updated.</p>
             </div>
           </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-start gap-3 text-red-600 text-left">
                <div className="flex items-center gap-3 w-full">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <p className="font-bold font-[Inter]">{error}</p>
                </div>
                
                {(errorType === 'missing_key' || errorType === 'invalid_key') && (
                    <div className="w-full mt-2 pl-9">
                        <p className="text-sm opacity-80 mb-2">
                             The AI feature requires a configured API key. You can fix this in your deployment settings, or use the manual/demo options below.
                        </p>
                    </div>
                )}
            </div>
        )}

        {/* Alternative Options */}
        {!success && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-[rgba(var(--text-primary),0.1)]">
                <button 
                    onClick={handleDemoImport}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[rgba(var(--text-primary),0.05)] hover:bg-[rgba(var(--text-primary),0.1)] transition-colors group"
                >
                    <div className="p-2 rounded-full bg-purple-500/20 text-purple-600">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold">Try Demo Schedule</p>
                        <p className="text-xs opacity-60">See how it looks instantly</p>
                    </div>
                </button>

                <button 
                    onClick={handleManualEntry}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[rgba(var(--text-primary),0.05)] hover:bg-[rgba(var(--text-primary),0.1)] transition-colors group"
                >
                    <div className="p-2 rounded-full bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))]">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold">Skip & Enter Manually</p>
                        <p className="text-xs opacity-60">Add classes yourself</p>
                    </div>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TimetableUploader;