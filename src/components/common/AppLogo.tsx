import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  subtitle = 'Faculty of Agriculture'
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14'
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${iconSize} rounded-xl bg-[#103B2D] border border-[#176B45]/50 flex items-center justify-center shrink-0 shadow-xs overflow-hidden`}
      >
        <img
          src="/logo.svg"
          alt="Ruhuna Agri GPA Logo"
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            // Fallback inline SVG if public image path is not yet resolved
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-[#242824] text-sm tracking-tight">
              Ruhuna Agri GPA
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              UoR
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] text-[#626962] font-medium truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
