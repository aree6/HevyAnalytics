import React, { useRef, useState } from 'react';
import { Upload, Check } from 'lucide-react';
import MaleFrontBodyMapGroup from './MaleFrontBodyMapGroup';
import FemaleFrontBodyMapGroup from './FemaleFrontBodyMapGroup';
import type { BodyMapGender } from './BodyMap';

interface CSVImportModalProps {
  onFileSelect: (file: File, gender: BodyMapGender) => void;
  isLoading?: boolean;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ onFileSelect, isLoading = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGender, setSelectedGender] = useState<BodyMapGender | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!selectedGender) {
      alert('Please select your body type first');
      return;
    }
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      onFileSelect(file, selectedGender);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedGender) {
      alert('Please select your body type first');
      return;
    }
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      onFileSelect(file, selectedGender);
    } else {
      alert('Please drop a valid CSV file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-2xl bg-black/70 border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mb-4">
          <Upload className="w-6 h-6 text-blue-500" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Welcome to HevyAnalytics</h2>
        <p className="text-slate-400 mb-6 text-center text-xs sm:text-sm">
          Let's get started! First, select your body type for accurate muscle visualization.
        </p>

        {/* Gender Selection with Body Map Preview */}
        <div className="w-full mb-6">
          <p className="text-sm font-semibold text-slate-300 mb-3 text-center">Select Your Body Type</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Male Option */}
            <button
              onClick={() => setSelectedGender('male')}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center ${
                selectedGender === 'male'
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700/50 hover:border-slate-500/70 hover:bg-black/60'
              }`}
            >
              {selectedGender === 'male' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="h-28 sm:h-32 flex items-center justify-center overflow-hidden">
                <MaleFrontBodyMapGroup className="h-full w-auto opacity-70" />
              </div>
              <span className={`mt-1 font-semibold text-xs ${
                selectedGender === 'male' ? 'text-blue-400' : 'text-slate-400'
              }`}>
                Male
              </span>
            </button>

            {/* Female Option */}
            <button
              onClick={() => setSelectedGender('female')}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center ${
                selectedGender === 'female'
                  ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                  : 'border-slate-700/50 hover:border-slate-500/70 hover:bg-black/60'
              }`}
            >
              {selectedGender === 'female' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="h-28 sm:h-32 flex items-center justify-center overflow-hidden">
                <FemaleFrontBodyMapGroup className="h-full w-auto opacity-70" />
              </div>
              <span className={`mt-1 font-semibold text-xs ${
                selectedGender === 'female' ? 'text-pink-400' : 'text-slate-400'
              }`}>
                Female
              </span>
            </button>
          </div>
        </div>

        {/* Drag and Drop Area - Only enabled after gender selection */}
        <div
          onDragOver={selectedGender ? handleDragOver : undefined}
          onDrop={selectedGender ? handleDrop : undefined}
          onClick={() => selectedGender && fileInputRef.current?.click()}
          className={`w-full p-6 mb-6 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center ${
            selectedGender
              ? 'border-slate-600 hover:border-slate-400 hover:bg-black/60 cursor-pointer'
              : 'border-slate-800 bg-black/40 cursor-not-allowed opacity-50'
          }`}
        >
          <Upload className={`w-6 h-6 sm:w-8 sm:h-8 mb-3 ${selectedGender ? 'text-slate-500' : 'text-slate-600'}`} />
          <p className={`font-medium text-center text-sm sm:text-base ${selectedGender ? 'text-slate-300' : 'text-slate-500'}`}>
            {selectedGender ? 'Drag and drop your CSV here' : 'Select body type first'}
          </p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {selectedGender ? 'or click to browse' : 'Then you can upload your CSV'}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading || !selectedGender}
        />

        {/* Welcome Steps */}
        <div className="w-full mb-4">
          <p className="text-xs text-slate-500 mb-2 text-center">How to export from Hevy:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex flex-col items-center">
              <img src="/Step1.png" className="w-full h-auto rounded-lg border border-slate-700" alt="Step 1" loading="lazy" decoding="async" />
            </div>
            <div className="flex flex-col items-center">
              <img src="/Step2.png" className="w-full h-auto rounded-lg border border-slate-700" alt="Step 2" loading="lazy" decoding="async" />
            </div>
            <div className="flex flex-col items-center">
              <img src="/Step3.png" className="w-full h-auto rounded-lg border border-slate-700" alt="Step 3" loading="lazy" decoding="async" />
            </div>
            <div className="flex flex-col items-center">
              <img src="/Step4.png" className="w-full h-auto rounded-lg border border-slate-700" alt="Step 4" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>

        {isLoading && (
          <p className="text-slate-400 text-xs sm:text-sm">
            Loading your data...
          </p>
        )}
        </div>
      </div>
    </div>
  );
};