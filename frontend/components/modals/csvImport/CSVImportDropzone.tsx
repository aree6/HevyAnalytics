import React from 'react';
import { Upload } from 'lucide-react';

interface CSVImportDropzoneProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  platform: 'hevy' | 'strong' | 'lyfta' | 'other';
  hideBodyTypeAndUnit: boolean;
  canUploadCsv: boolean;
  isLoading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

const platformLabel = (platform: CSVImportDropzoneProps['platform']) => {
  if (platform === 'strong') return 'Strong';
  if (platform === 'lyfta') return 'Lyfta';
  if (platform === 'other') return 'CSV';
  return 'Hevy';
};

export const CSVImportDropzone: React.FC<CSVImportDropzoneProps> = ({
  fileInputRef,
  platform,
  hideBodyTypeAndUnit,
  canUploadCsv,
  isLoading,
  onFileChange,
  onDragOver,
  onDrop,
}) => {
  const dropLabel = canUploadCsv
    ? platform === 'other'
      ? 'Drop your CSV here'
      : `Drop your ${platformLabel(platform)} CSV here`
    : hideBodyTypeAndUnit
      ? 'Go back to choose body type + unit first'
      : 'Choose body type + unit first';

  return (
    <>
      <div
        onDragOver={canUploadCsv ? onDragOver : undefined}
        onDrop={canUploadCsv ? onDrop : undefined}
        onClick={() => canUploadCsv && fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center flex-1 min-h-0 px-6 sm:px-10 py-8 ${
          canUploadCsv
            ? 'border-slate-600 hover:border-slate-400 hover:bg-black/60 cursor-pointer'
            : 'border-slate-800 bg-black/40 cursor-not-allowed opacity-50'
        }`}
      >
        <Upload
          className={`w-12 h-12 sm:w-16 sm:h-16 mb-6 ${
            canUploadCsv ? 'text-slate-500' : 'text-slate-600'
          }`}
        />
        <p
          className={`font-medium text-center text-lg sm:text-xl lg:text-2xl ${
            canUploadCsv ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {dropLabel}
        </p>
        <p className="text-slate-500 text-sm sm:text-base lg:text-lg mt-3">
          {canUploadCsv ? 'or click to choose a file' : 'Then upload your CSV'}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={onFileChange}
        className="hidden"
        disabled={isLoading || !canUploadCsv}
      />
    </>
  );
};
