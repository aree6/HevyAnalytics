import React, { useState, useEffect, useMemo } from 'react';
import { parseWorkoutCSV } from './utils/csvParser';
import { getDailySummaries, getExerciseStats, identifyPersonalRecords } from './utils/analytics';
import { WorkoutSet } from './types';
import { DEFAULT_CSV_DATA } from './constants';
import { Dashboard } from './components/Dashboard';
import { ExerciseView } from './components/ExerciseView';
import { HistoryView } from './components/HistoryView';
import { CSVImportModal } from './components/CSVImportModal';
import { saveCSVData, getCSVData, hasCSVData, clearCSVData } from './utils/localStorage';
import { LayoutDashboard, Dumbbell, History, Upload, BarChart3, Filter, Loader2, CheckCircle2, X, Trash2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

enum Tab {
  DASHBOARD = 'dashboard',
  EXERCISES = 'exercises',
  HISTORY = 'history'
}

const App: React.FC = () => {
  const [rawData, setRawData] = useState<string>(DEFAULT_CSV_DATA);
  const [parsedData, setParsedData] = useState<WorkoutSet[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [showCSVModal, setShowCSVModal] = useState(false);
  
  // Loading State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0: Parse, 1: Analyze, 2: Visualize
  
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Initial Load: Check local storage, otherwise show modal
  useEffect(() => {
    const storedCSV = getCSVData();
    
    if (storedCSV) {
      // Load from local storage
      const result = parseWorkoutCSV(storedCSV);
      const enriched = identifyPersonalRecords(result);
      setParsedData(enriched);
      setRawData(storedCSV);
    } else {
      // Show CSV import modal if no data in storage
      setShowCSVModal(true);
      // Still load default data for fallback
      const result = parseWorkoutCSV(DEFAULT_CSV_DATA);
      const enriched = identifyPersonalRecords(result);
      setParsedData(enriched);
    }
  }, []);

  // Derive unique months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    parsedData.forEach(d => {
      if (d.parsedDate) {
        months.add(format(d.parsedDate, 'yyyy-MM'));
      }
    });
    return Array.from(months).sort().reverse(); // Descending order
  }, [parsedData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return parsedData.filter(d => {
      // 1. Specific Day Filter (Takes priority)
      if (selectedDay && d.parsedDate) {
        return isSameDay(d.parsedDate, selectedDay);
      }

      // 2. Month Filter
      let matchMonth = true;
      if (selectedMonth !== 'all' && d.parsedDate) {
        matchMonth = format(d.parsedDate, 'yyyy-MM') === selectedMonth;
      }

      return matchMonth;
    });
  }, [parsedData, selectedMonth, selectedDay]);

  const dailySummaries = useMemo(() => getDailySummaries(filteredData), [filteredData]);
  const exerciseStats = useMemo(() => getExerciseStats(filteredData), [filteredData]);

  // Handler for heatmap click
  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    setActiveTab(Tab.HISTORY);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleModalFileSelect = (file: File) => {
    processFile(file);
    setShowCSVModal(false);
  };

  const handleClearCSV = () => {
    if (confirm('Are you sure you want to remove the CSV data? This will reset to the default data.')) {
      clearCSVData();
      // Reset to default data
      const result = parseWorkoutCSV(DEFAULT_CSV_DATA);
      const enriched = identifyPersonalRecords(result);
      setParsedData(enriched);
      setRawData(DEFAULT_CSV_DATA);
      setSelectedMonth('all');
      setSelectedDay(null);
      setShowCSVModal(true);
    }
  };

  const processFile = (file: File) => {
    // Start Loading Sequence
    setIsAnalyzing(true);
    setLoadingStep(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        // Save to local storage
        saveCSVData(text);

        setRawData(text);
        const result = parseWorkoutCSV(text);
        // Identify PRs on the full dataset before setting it
        const enriched = identifyPersonalRecords(result);
        setParsedData(enriched);
        
        // Reset filters on new upload
        setSelectedMonth('all');
        setSelectedDay(null);
        
        setIsAnalyzing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans">
      
      {/* CSV Import Modal */}
      {showCSVModal && (
        <CSVImportModal onFileSelect={handleModalFileSelect} isLoading={isAnalyzing} />
      )}
      
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
          <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Workout Data</h2>
            <p className="text-slate-400 mb-8 text-center">Please wait while we process your sets, calculate volume, and identify personal records.</p>
            
            <div className="w-full space-y-4">
               <div className="flex items-center space-x-3 text-sm">
                  {loadingStep >= 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>}
                  <span className={loadingStep >= 0 ? "text-slate-200" : "text-slate-600"}>Parsing CSV structure...</span>
               </div>
               <div className="flex items-center space-x-3 text-sm">
                  {loadingStep >= 1 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>}
                  <span className={loadingStep >= 1 ? "text-slate-200" : "text-slate-600"}>Calculating Personal Records (PRs)...</span>
               </div>
               <div className="flex items-center space-x-3 text-sm">
                  {loadingStep >= 2 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>}
                  <span className={loadingStep >= 2 ? "text-slate-200" : "text-slate-600"}>Generating visualizations...</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Top Row: Logo and Nav Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/HevyAnalytics.png" alt="HevyAnalytics Logo" className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tight text-white">HevyAnalytics</span>
            </div>
            
            <nav className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setActiveTab(Tab.DASHBOARD);
                  setSelectedDay(null); // Clear day filter when going back to Dashboard
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === Tab.DASHBOARD ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveTab(Tab.EXERCISES)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === Tab.EXERCISES ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Dumbbell className="w-5 h-5" />
                <span className="font-medium">Exercises</span>
              </button>
              <button 
                onClick={() => setActiveTab(Tab.HISTORY)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === Tab.HISTORY ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <History className="w-5 h-5" />
                <span className="font-medium">History</span>
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer group flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-600 hover:border-slate-400 hover:bg-slate-800/50 transition-all">
                <Upload className="w-4 h-4 text-slate-400 group-hover:text-white" />
                <span className="text-sm text-slate-400 group-hover:text-white">Import</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                onClick={handleClearCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-600 hover:border-red-500 hover:bg-red-950/30 transition-all group"
              >
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                <span className="text-sm text-slate-400 group-hover:text-red-400">Remove</span>
              </button>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {activeTab === Tab.DASHBOARD && 'Overview'}
                {activeTab === Tab.EXERCISES && 'Exercise Analytics'}
                {activeTab === Tab.HISTORY && 'Workout History'}
              </h1>
              <p className="text-slate-400 text-sm">
                 {filteredData.length > 0 ? `Analyzing ${filteredData.length} sets based on filters.` : 'No data available for current filters.'}
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-sm items-start sm:items-center">
               <div className="flex items-center px-2">
                  <Filter className="w-4 h-4 text-slate-500 mr-2" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filters</span>
               </div>
               
               {/* Specific Day Active Chip */}
               {selectedDay && (
                 <button 
                   onClick={() => setSelectedDay(null)}
                   className="flex items-center gap-2 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   <span>{format(selectedDay, 'MMM d, yyyy')}</span>
                   <X className="w-3 h-3" />
                 </button>
               )}

               {/* Month Filter (Disabled if Day Selected to avoid confusion, or allowed but hidden) */}
               {!selectedDay && (
                 <select 
                   value={selectedMonth} 
                   onChange={(e) => setSelectedMonth(e.target.value)}
                   className="bg-slate-900 text-slate-200 text-sm border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 hover:border-slate-600 transition-colors cursor-pointer"
                 >
                   <option value="all">All Months</option>
                   {availableMonths.map(month => (
                     <option key={month} value={month}>
                       {format(new Date(month), 'MMMM yyyy')}
                     </option>
                   ))}
                 </select>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-6 lg:p-8">

        {activeTab === Tab.DASHBOARD && (
          <Dashboard 
            dailyData={dailySummaries} 
            exerciseStats={exerciseStats} 
            fullData={filteredData} 
            onDayClick={handleDayClick} // Pass handler
          />
        )}
        {activeTab === Tab.EXERCISES && <ExerciseView stats={exerciseStats} />}
        {activeTab === Tab.HISTORY && <HistoryView data={filteredData} />}
      </main>
    </div>
  );
};

export default App;