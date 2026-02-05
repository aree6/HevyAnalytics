import React from 'react';
import { Calendar, LayoutDashboard, Pencil, RefreshCw, Settings, X } from 'lucide-react';
import { assetPath } from '../../constants';
import { Tab } from '../../app/navigation';
import { SupportLinks } from '../layout/SupportLinks';
import { ThemeToggleButton } from '../theme/ThemeToggleButton';

interface AppHeaderProps {
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
  onOpenUpdateFlow: () => void;
  onOpenPreferences: () => void;

  calendarOpen: boolean;
  onToggleCalendarOpen: () => void;
  hasActiveCalendarFilter: boolean;
  onClearCalendarFilter: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenUpdateFlow,
  onOpenPreferences,
  calendarOpen,
  onToggleCalendarOpen,
  hasActiveCalendarFilter,
  onClearCalendarFilter,
}) => {
  return (
    <header className="bg-black/70 flex-shrink-0">
      <div className="px-2 sm:px-3 py-1 flex flex-col gap-1">
        {/* Top Row: Logo and Nav Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <img src={assetPath('/UI/logo.png')} alt="LiftShift Logo" className="w-6 h-6 sm:w-7 sm:h-7" decoding="async" />
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="font-bold text-base sm:text-lg tracking-tight inline-flex items-start whitespace-nowrap"
                style={{ color: 'var(--app-fg)' }}
              >
                <span>LiftShift</span>
                <sup className="ml-1 inline-block rounded-full border border-amber-500/30 bg-amber-500/15 px-1 py-0.5 text-[7px] sm:text-[9px] font-semibold leading-none tracking-wide text-amber-400 align-super -translate-y-0.5 -translate-x-2">
                  BETA
                </sup>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2  min-w-0">
            {/* Desktop: right-aligned support buttons, Update pinned as rightmost */}
            <div className="hidden md:block">
              <SupportLinks
                variant="primary"
                layout="header"
                primaryRightSlot={(
                  <div className="flex items-center gap-2">
                    <ThemeToggleButton />
                    <button
                      type="button"
                      onClick={onOpenPreferences}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 w-10 bg-transparent border border-black/70 text-slate-200 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-200"
                      title="User Preferences"
                      aria-label="User Preferences"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onOpenUpdateFlow}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-8 px-2.5 py-1 bg-transparent border border-black/70 text-slate-200 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-200 gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Update Data</span>
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Mobile: keep Update action */}
            <div className="md:hidden">
              <div className="flex items-center gap-2">
                <ThemeToggleButton compact={true} />
                <button
                  type="button"
                  onClick={onOpenPreferences}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 w-9 bg-transparent border border-black/70 text-slate-200 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-200"
                  title="User Preferences"
                  aria-label="User Preferences"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenUpdateFlow}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 px-3 py-1.5 bg-transparent border border-black/70 text-slate-200 hover:border-white hover:text-white hover:bg-white/5 transition-all duration-200 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Update Data</span>
                  <span className="sm:hidden">Update</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Navigation */}
        <nav className="grid grid-cols-6 gap-1 sm:grid sm:grid-cols-5 sm:gap-2">
          <button
            onClick={() => onSelectTab(Tab.DASHBOARD)}
            className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md whitespace-nowrap focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border transition-all duration-200 ${activeTab === Tab.DASHBOARD ? 'bg-white/10 border-slate-600/70 text-white shadow-sm' : 'bg-transparent border-black/70 text-slate-400 hover:border-white hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium text-[7px] sm:text-xs">Dashboard</span>
          </button>

          <button
            onClick={() => onSelectTab(Tab.MUSCLE_ANALYSIS)}
            className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md whitespace-nowrap focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border transition-all duration-200 ${activeTab === Tab.MUSCLE_ANALYSIS ? 'bg-white/10 border-slate-600/70 text-white shadow-sm' : 'bg-transparent border-black/70 text-slate-400 hover:border-white hover:text-white hover:bg-white/5'}`}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 195.989 195.989"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              paintOrder="stroke fill"
            >
              <path d="M195.935,84.745c-2.07-15.789-20.983-37.722-20.983-37.722c-4.933-12.69-17.677-8.47-17.677-8.47l-8.507,2.295 c-8.421,2.533-8.025,13.555-4.372,15.789c1.602,0.978,6.297,1.233,7.685,0c0.414-0.374,0.098-2.165,0.098-2.165 c8.933,0.487,9.584-4.688,9.584-4.688l3.039-0.606c3.044-1.665,3.72,5.395,3.72,5.395c-2.07,20.009,6.595,27.334,6.595,27.334 c-1.254,3.973-5.62,3.206-5.62,3.206c-13.853-7.197-24.131,6.403-24.131,6.403c-7.831-6.671-23.991,5.148-23.991,5.148 c-9.055,1.79-9.591-9.106-9.591-9.106s-0.42-6.941-0.713-7.578c-0.426-1.084,1.925-0.536,1.925-0.536 c7.965-14.495,0-12.559,0-12.559c1.93-25.008-19.991-19.759-19.991-19.759C76.143,51.748,82.32,68.544,82.32,68.544 c-3.702-0.904-1.927,4.616-1.927,4.616c0.956,8.473,3.985,6.552,3.985,6.552c0.393,2.968,2.058,7.054,2.058,7.054l0.256,6.808 c-1.903,11.298-13.829,1.927-13.829,1.927c-6.996-9.864-24.536-4.348-24.536-4.348c-9.061-13.479-23.333-5.785-23.333-5.785 c1.516-3.349-0.256-20.009-0.256-20.009c1.772-2.058,5.331-13.712,5.331-13.712c1.522,2.058,8.388,2.42,8.388,2.42 c0.524,3.093,2.731,4.351,2.731,4.351c4.665,1.934,2.731-13.335,2.731-13.335c1.221-4.847-6.573-6.013-6.573-6.013 c-13.594-3.739-16.742,4.847-16.742,4.847l-3.547,7.712c-5.063,5.52-14.565,24.368-14.565,24.368 C-2.977,90.999,2.26,93.705,2.26,93.705l9.864,7.667c16.736,16.203,26.85,13.877,26.85,13.877 c13.46-0.256,12.352,8.458,12.352,8.458c0.536,13.342,9.852,27.182,9.852,27.182c0.685,2.326,1.172,4.786,1.656,7.222h63.811 c1.182-2.636,2.412-5.097,3.508-6.625c5.225-7.38,12.361-16.952,14.991-23.297c5.151-12.477,7.594-12.185,7.594-12.185 c18.383,0,28.527-13.329,28.527-13.329c3.014-3.86,7.593-8.616,10.948-10.522C196.726,89.571,195.935,84.745,195.935,84.745z" />
            </svg>
            <span className="font-medium text-[7px] sm:text-xs">Muscle</span>
          </button>

          <button
            onClick={() => onSelectTab(Tab.EXERCISES)}
            className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg whitespace-nowrap focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border transition-all duration-200 ${activeTab === Tab.EXERCISES ? 'bg-white/10 border-slate-600/70 text-white shadow-sm' : 'bg-transparent border-black/70 text-slate-400 hover:border-white hover:text-white hover:bg-white/5'}`}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.43125 14.704L14.2387 16.055C14.8568 16.1322 15.3208 16.6578 15.3208 17.2805C15.3208 18.0233 14.6694 18.5985 13.9325 18.5063L3.12502 17.1554C2.50697 17.0782 2.04297 16.5526 2.04297 15.9299C2.04297 15.187 2.69401 14.6119 3.43125 14.704Z" />
              <path d="M3.70312 17.2275V21.9992" />
              <path d="M13.6602 18.4727V21.9995" />
              <path d="M2.15625 12.7135C2.15625 11.5676 3.08519 10.6387 4.23105 10.6387C5.3769 10.6387 6.30584 11.5676 6.30584 12.7135C6.30584 13.8593 5.3769 14.7883 4.23105 14.7883C3.08519 14.7883 2.15625 13.8593 2.15625 12.7135Z" />
              <path d="M11.5858 9.25226V13.2867V12.3792L18.1186 13.1958C19.3644 13.3514 20.2995 14.4108 20.2995 15.6662V20.7556C20.2995 21.4431 19.7422 22.0004 19.0547 22.0004C18.3673 22.0004 17.8099 21.4431 17.8099 20.7556V16.5024L7.64535 15.2317C6.81475 15.1278 6.19141 14.422 6.19141 13.5848C6.19141 12.5865 7.0662 11.8141 8.05707 11.938L9.09618 12.0677V9.25195" />
              <path d="M6.60547 5.73445C6.60547 3.6721 8.27757 2 10.3399 2C12.4023 2 14.0744 3.6721 14.0744 5.73445C14.0744 7.7968 12.4023 9.46889 10.3399 9.46889C8.27757 9.46889 6.60547 7.7968 6.60547 5.73445Z" />
              <path d="M9.09766 5.73407C9.09766 5.04662 9.65502 4.48926 10.3425 4.48926C11.0299 4.48926 11.5873 5.04662 11.5873 5.73407C11.5873 6.42152 11.0299 6.97889 10.3425 6.97889C9.65502 6.97889 9.09766 6.42152 9.09766 5.73407Z" />
              <path d="M2 22H22.0001" />
            </svg>
            <span className="font-medium text-[7px] sm:text-xs">Exercises</span>
          </button>

          <button
            onClick={() => onSelectTab(Tab.HISTORY)}
            className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md whitespace-nowrap focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border transition-all duration-200 ${activeTab === Tab.HISTORY ? 'bg-white/10 border-slate-600/70 text-white shadow-sm' : 'bg-transparent border-black/70 text-slate-400 hover:border-white hover:text-white hover:bg-white/5'}`}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 503.379 503.379"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              paintOrder="stroke fill"
            >
              <path d="M458.091,128.116v326.842c0,26.698-21.723,48.421-48.422,48.421h-220.92c-26.699,0-48.421-21.723-48.421-48.421V242.439
			c6.907,1.149,13.953,1.894,21.184,1.894c5.128,0,10.161-0.381,15.132-0.969v211.594c0,6.673,5.429,12.104,12.105,12.104h220.92
			c6.674,0,12.105-5.432,12.105-12.104V128.116c0-6.676-5.432-12.105-12.105-12.105H289.835c0-12.625-1.897-24.793-5.297-36.315
			h125.131C436.368,79.695,458.091,101.417,458.091,128.116z M159.49,228.401c-62.973,0-114.202-51.229-114.202-114.199
			C45.289,51.229,96.517,0,159.49,0c62.971,0,114.202,51.229,114.202,114.202C273.692,177.172,222.461,228.401,159.49,228.401z
			 M159.49,204.19c49.618,0,89.989-40.364,89.989-89.988c0-49.627-40.365-89.991-89.989-89.991
			c-49.626,0-89.991,40.364-89.991,89.991C69.499,163.826,109.87,204.19,159.49,204.19z M227.981,126.308
			c6.682,0,12.105-5.423,12.105-12.105s-5.423-12.105-12.105-12.105h-56.386v-47.52c0-6.682-5.423-12.105-12.105-12.105
			s-12.105,5.423-12.105,12.105v59.625c0,6.682,5.423,12.105,12.105,12.105H227.981z M367.697,224.456h-131.14
			c-6.682,0-12.105,5.423-12.105,12.105c0,6.683,5.423,12.105,12.105,12.105h131.14c6.685,0,12.105-5.423,12.105-12.105
			C379.803,229.879,374.382,224.456,367.697,224.456z M367.91,297.885h-131.14c-6.682,0-12.105,5.42-12.105,12.105
			s5.423,12.105,12.105,12.105h131.14c6.685,0,12.104-5.42,12.104-12.105S374.601,297.885,367.91,297.885z M367.91,374.353h-131.14
			c-6.682,0-12.105,5.426-12.105,12.105c0,6.685,5.423,12.104,12.105,12.104h131.14c6.685,0,12.104-5.42,12.104-12.104
			C380.015,379.778,374.601,374.353,367.91,374.353z" />
            </svg>
            <span className="font-medium text-[7px] sm:text-xs">History</span>
          </button>

          <button
            onClick={() => onSelectTab(Tab.FLEX)}
            className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md whitespace-nowrap focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border transition-all duration-200 ${activeTab === Tab.FLEX ? 'bg-white/10 border-slate-600/70 text-white shadow-sm' : 'bg-transparent border-black/70 text-slate-400 hover:border-white hover:text-white hover:bg-white/5'}`}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 512.001 512.001"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              paintOrder="stroke fill"
            >
              <path d="M426.667,0H85.334C73.552,0,64,9.552,64,21.334v469.333C64,502.449,73.552,512,85.334,512h341.333 c11.782,0,21.333-9.551,21.333-21.333V21.334C448,9.552,438.449,0,426.667,0z M182.326,469.334l223.007-207.078v69.398 l-157.349,137.68H182.326z M405.334,96.987L106.667,358.32v-50.35L392.378,42.667h12.956V96.987z M329.674,42.667L106.667,249.745 v-69.398l157.349-137.68H329.674z M199.223,42.667l-92.556,80.986V42.667H199.223z M106.667,415.014l298.667-261.333v50.35 L119.623,469.334h-12.956V415.014z M312.778,469.334l92.556-80.986v80.986H312.778z" />
            </svg>
            <span className="font-medium text-[7px] sm:text-xs">Flex</span>
          </button>

          <button
            onClick={onToggleCalendarOpen}
            className={`sm:hidden w-full h-full relative flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition-all duration-200 ${
              hasActiveCalendarFilter
                ? 'bg-white/10 border border-slate-700/50 text-white shadow-sm'
                : 'bg-black/30 hover:bg-black/60 text-slate-200'
            }`}
            title="Calendar"
            aria-label="Calendar"
          >
            {calendarOpen ? (
              <Pencil className="w-5 h-5" />
            ) : hasActiveCalendarFilter ? (
              <Pencil className="w-5 h-5" />
            ) : (
              <Calendar className="w-5 h-5" />
            )}

            <span className="text-[10px] font-semibold leading-none mt-1">Calendar</span>

            {hasActiveCalendarFilter && !calendarOpen ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearCalendarFilter();
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 border border-slate-700/50 grid place-items-center hover:bg-black/70"
                aria-label="Clear calendar filter"
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
          </button>
        </nav>
      </div>
    </header>
  );
};
