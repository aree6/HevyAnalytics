import React from 'react';
import { Check, UserRound } from 'lucide-react';

import MaleFrontBodyMapGroup from '../../bodyMap/groups/MaleFrontBodyMapGroup';
import FemaleFrontBodyMapGroup from '../../bodyMap/groups/FemaleFrontBodyMapGroup';
import type { BodyMapGender } from '../../bodyMap/BodyMap';

interface CSVImportBodyTypeSelectorProps {
  selectedGender: BodyMapGender | null;
  onSelectGender: (gender: BodyMapGender) => void;
}

export const CSVImportBodyTypeSelector: React.FC<CSVImportBodyTypeSelectorProps> = ({
  selectedGender,
  onSelectGender,
}) => (
  <div className="w-full mb-6">
    <p className="text-sm font-semibold text-slate-300 mb-3 text-center inline-flex items-center justify-center gap-2 w-full">
      <UserRound className="w-4 h-4 text-slate-300" />
      <span>Choose your body type</span>
    </p>
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onSelectGender('male')}
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
        <span
          className={`mt-1 font-semibold text-xs ${
            selectedGender === 'male' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          Male
        </span>
      </button>

      <button
        onClick={() => onSelectGender('female')}
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
        <span
          className={`mt-1 font-semibold text-xs ${
            selectedGender === 'female' ? 'text-pink-400' : 'text-slate-400'
          }`}
        >
          Female
        </span>
      </button>
    </div>
  </div>
);
