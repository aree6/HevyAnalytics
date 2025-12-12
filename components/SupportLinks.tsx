import React from 'react';
import StarOnGithubButton from './StarOnGithubButton';
import { Coffee, HeartHandshake, Mail, UserRound } from 'lucide-react';

export const SupportLinks: React.FC = () => {
  const uniformButtonClass =
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 group bg-gray-900 hover:bg-gray-950 transition-all duration-200 ease-in-out hover:ring-2 hover:ring-offset-2 hover:ring-gray-900';

  return (
    <div className="mt-10 pt-6 border-t border-slate-800/70">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center justify-center gap-3">
          <StarOnGithubButton />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.open('https://www.buymeacoffee.com/aree6', '_blank', 'noopener,noreferrer')}
              className={`${uniformButtonClass} gap-2`}
            >
              <Coffee className="w-4 h-4 text-white" />
              <span className="text-white">Buy Me a Coffee</span>
            </button>

            <button
              type="button"
              onClick={() => window.open('https://ko-fi.com/aree6', '_blank', 'noopener,noreferrer')}
              className={`${uniformButtonClass} gap-2`}
            >
              <HeartHandshake className="w-4 h-4 text-white" />
              <span className="text-white">Ko-fi</span>
            </button>

            <button
              type="button"
              onClick={() => window.open('mailto:mohammadar336@gmail.com')}
              className={`${uniformButtonClass} gap-2`}
            >
              <Mail className="w-4 h-4 text-white" />
              <span className="text-white">Email</span>
            </button>

            <button
              type="button"
              onClick={() => window.open('https://github.com/aree6', '_blank', 'noopener,noreferrer')}
              className={`${uniformButtonClass} gap-2`}
            >
              <UserRound className="w-4 h-4 text-white" />
              <span className="text-white">GitHub Profile</span>
            </button>
          </div>
        </div>

        
      </div>
    </div>
  );
};
