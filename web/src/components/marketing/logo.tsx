import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
      >
        <rect width="32" height="32" rx="8" fill="#4db848" />
        <path
          d="M9 9H16V16H9V9Z"
          fill="white"
        />
        <path
          d="M16 16H23V23H16V16Z"
          fill="white"
        />
      </svg>
      <span className="text-xl font-bold">P91 India</span>
    </div>
  );
}