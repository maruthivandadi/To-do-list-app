import React, { useState, useCallback } from 'react';
import { Upload, FileImage, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
    setSuccess(false);
  };

  const processFile = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const result = await extractScheduleFromImage(base64Data, file.type);
          
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
        } catch (err) {
            console.error(err)
          setError("Failed to analyze. Please ensure the image is clear.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError("Error processing file.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-10">
      <div className="glass-panel rounded-3xl p-10 shadow-lg text-center">
        <div className="mb-10">
          <h2 className="text-4xl font-bold mb-3">Import Schedule</h2>
          <p className="text-xl opacity-70">Upload a photo or PDF of your timetable.</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] ${
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
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[rgba(var(--text-primary),0.1)]">
                <Upload className="w-10 h-10" />
              </div>
              <div>
                <p className="text-2xl font-bold">Drop file here</p>
                <p className="text-lg opacity-60 mt-2">or click to browse</p>
              </div>
            </div>
          )}

          {file && !isLoading && !success && (
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
               <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[rgba(var(--text-primary),0.1)]">
                {file.type.includes('pdf') ? <FileText className="w-10 h-10"/> : <FileImage className="w-10 h-10"/>}
              </div>
              <div>
                <p className="text-2xl font-bold">{file.name}</p>
                <p className="text-lg opacity-60 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={(e) => {
                    e.preventDefault(); 
                    processFile();
                }}
                className="mt-4 px-8 py-3 bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-primary))] rounded-xl font-bold text-lg hover:opacity-90 shadow-lg z-10 relative"
              >
                Analyze with AI
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="text-xl font-bold">Analyzing...</p>
            </div>
          )}

          {success && (
             <div className="flex flex-col items-center gap-4">
             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
               <CheckCircle2 className="w-10 h-10 text-green-600" />
             </div>
             <div>
               <p className="text-2xl font-bold">Success!</p>
               <p className="text-lg opacity-60 mt-2">Schedule updated.</p>
             </div>
             <button 
                onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setSuccess(false);
                }}
                className="mt-4 text-lg underline z-10 relative opacity-70 hover:opacity-100"
             >
                Upload another
             </button>
           </div>
          )}
        </div>
        
        {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="font-bold">{error}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default TimetableUploader;