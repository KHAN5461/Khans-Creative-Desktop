import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const IconArrowLeft = ({ size = 15, ...props }: IconProps) => (
  <svg width={size} height={typeof size === 'number' ? Number(size) * (19 / 15) : size} viewBox="0 0 15 19" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M7.27273 7.27273C9.28104 7.27273 10.9091 5.64467 10.9091 3.63636C10.9091 1.62806 9.28104 0 7.27273 0C5.26442 0 3.63636 1.62806 3.63636 3.63636C3.63636 5.64467 5.26442 7.27273 7.27273 7.27273Z" stroke="currentColor" strokeWidth="1.36364" />
    <path d="M14.5436 14.5455C14.5448 14.3964 14.5455 14.2448 14.5455 14.0909C14.5455 11.8318 11.2891 10 7.27273 10C3.25636 10 0 11.8318 0 14.0909C0 16.35 0 18.1818 7.27273 18.1818C9.30091 18.1818 10.7636 18.0391 11.8182 17.7845" stroke="currentColor" strokeWidth="1.36364" strokeLinecap="round" />
  </svg>
);

export const IconBack = ({ size = 18, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCodeBracket = ({ size = 20, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M8 7L3 12L8 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 7L21 12L16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 4L10 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconEraser = ({ size = 22, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18 13L12 19L3 19L3 13L13.5 2.5C14.3284 1.67157 15.6716 1.67157 16.5 2.5L21.5 7.5C22.3284 8.32843 22.3284 9.67157 21.5 10.5L18 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L16 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconFolder = ({ size = 22, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M3 6C3 4.89543 3.89543 4 5 4H9.17157C9.70201 4 10.2107 4.21071 10.5858 4.58579L12 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconLinkedIn = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={typeof size === 'number' ? Number(size) * (14 / 13) : size} viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2.38096 2.36157C2.64013 2.09441 2.7838 1.73602 2.7809 1.36381C2.76741 1.00275 2.6165 0.66048 2.35904 0.40698C2.10158 0.153479 1.75701 0.00789779 1.39578 0C1.03349 0.00775305 0.687709 0.152974 0.428519 0.406224C0.169334 0.659474 0.016142 1.0018 0 1.36381C0.005214 1.73538 0.152974 2.09073 0.412742 2.35645C0.672509 2.62217 1.02443 2.77793 1.39578 2.79156C1.7679 2.78317 2.12178 2.62872 2.38096 2.36157ZM1.13639 4.631C0.549889 4.61771 0.149167 4.60864 0.149167 5.3274V13.3185C0.149167 14.0224 0.531289 14.0078 1.08194 13.9869C1.18147 13.9831 1.2865 13.9791 1.39578 13.9791C1.50526 13.9791 1.61022 13.9831 1.70949 13.9869C2.2575 14.0078 2.63174 14.0221 2.63174 13.3185V5.3274C2.63174 4.60879 2.23936 4.61771 1.65509 4.63099C1.57232 4.63287 1.48569 4.63484 1.39578 4.63484C1.30601 4.63484 1.21934 4.63288 1.13639 4.631ZM5.22084 4.64551C4.95447 4.69878 4.784 4.86926 4.784 5.32741V13.3185C4.784 14.0217 5.15018 14.0079 5.7018 13.9869C5.80209 13.9831 5.9085 13.9791 6.01995 13.9791C6.13121 13.9791 6.23769 13.9831 6.33824 13.9869C6.89251 14.0079 7.26657 14.022 7.26657 13.3185V9.05659C7.24537 8.83881 7.27067 8.61901 7.34081 8.41174C7.41094 8.20448 7.5243 8.01447 7.67339 7.85431C7.82247 7.69414 8.00387 7.56747 8.20559 7.48268C8.40731 7.3979 8.62473 7.35692 8.84348 7.36248C9.06324 7.34945 9.28323 7.38387 9.48853 7.46339C9.69383 7.54291 9.87953 7.66568 10.0332 7.82335C10.1868 7.98103 10.3047 8.16992 10.3789 8.3772C10.453 8.58447 10.4817 8.80528 10.463 9.02463V13.2865C10.463 13.9898 10.8292 13.9759 11.3808 13.955C11.4811 13.9512 11.5875 13.9471 11.6989 13.9471C11.8104 13.9471 11.9168 13.9512 12.0171 13.955C12.5687 13.9759 12.9349 13.9898 12.9349 13.2865V7.83129C12.9552 7.38339 12.881 6.93623 12.7171 6.51887C12.5533 6.1015 12.3035 5.72328 11.984 5.40876C11.6644 5.09424 11.2823 4.85046 10.8624 4.69327C10.4425 4.53608 9.99423 4.46898 9.54673 4.49634C9.09095 4.4549 8.6322 4.5311 8.21433 4.71765C7.79645 4.9042 7.43344 5.19486 7.16002 5.56182C7.17067 5.16759 7.04281 4.64551 6.72317 4.64551C6.63152 4.64551 6.4908 4.64113 6.33042 4.63613C5.93148 4.62371 5.41083 4.60751 5.22084 4.64551Z" fill="currentColor" />
  </svg>
);

export const IconGithub = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M7.99994 0.353516C6.13834 0.353582 4.33747 1.01612 2.91967 2.22245C1.50181 3.42878 0.559474 5.10032 0.261274 6.93792C-0.0369257 8.77545 0.328474 10.6592 1.29207 12.252C2.25561 13.8448 3.75454 15.0428 5.52061 15.6316C5.91261 15.7002 6.05961 15.465 6.05961 15.2592C6.05961 15.073 6.04981 14.4556 6.04981 13.799C4.08001 14.1616 3.57041 13.3188 3.41361 12.8778C3.23961 12.449 2.96381 12.0689 2.61001 11.7704C2.33561 11.6234 1.94361 11.2608 2.60021 11.251C2.85094 11.2782 3.09134 11.3655 3.30121 11.5054C3.51101 11.6452 3.68407 11.8337 3.80561 12.0546C3.91281 12.2472 4.05701 12.4168 4.22987 12.5536C4.40274 12.6904 4.60094 12.7918 4.81307 12.8518C5.02521 12.9119 5.24707 12.9296 5.46601 12.9038C5.68494 12.878 5.89667 12.8092 6.08894 12.7014C6.12287 12.3028 6.30054 11.9302 6.58881 11.6528C4.84441 11.4568 3.02161 10.7806 3.02161 7.78185C3.01061 7.00272 3.29807 6.24885 3.82521 5.67492C3.58554 4.99772 3.61354 4.25452 3.90361 3.59732C3.90361 3.59732 4.56014 3.39152 6.05961 4.40092C7.34241 4.04812 8.69667 4.04812 9.97954 4.40092C11.4789 3.38172 12.1355 3.59732 12.1355 3.59732C12.4256 4.25452 12.4537 4.99772 12.2139 5.67492C12.7425 6.24785 13.0304 7.00245 13.0175 7.78185C13.0175 10.7904 11.1849 11.4568 9.44054 11.6528C9.62761 11.8424 9.77167 12.0702 9.86301 12.3204C9.95434 12.5707 9.99074 12.8377 9.96974 13.1032C9.96974 14.1519 9.95994 14.9946 9.95994 15.2592C9.95994 15.465 10.1069 15.71 10.4989 15.6316C12.2619 15.038 13.7565 13.8372 14.7159 12.2436C15.6755 10.65 16.0373 8.76718 15.7371 6.93138C15.4368 5.09565 14.4939 3.42632 13.0767 2.22145C11.6595 1.01652 9.86014 0.354516 7.99994 0.353516Z" fill="currentColor" />
  </svg>
);

export const IconApps = ({ size = 22, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.9" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.9" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.9" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.9" />
  </svg>
);

export const IconPixelGrid = ({ size = 21, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <rect x="15" y="15" width="6" height="6" rx="1" fill="currentColor" />
  </svg>
);

export const IconScribble = ({ size = 21, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4 17C6.5 11 9.5 11 11 15C12.5 19 15.5 16 19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="19" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

export const IconTerminal = ({ size = 22, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M7 9L11 12L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconRefresh = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 5.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconPlus = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconPalette = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="13.5" cy="6.5" r="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="17.5" cy="10.5" r="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8.5" cy="7.5" r="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6.5" cy="12.5" r="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.25 0 4.35-.74 6.04-2 .55-.41.51-1.28-.1-1.62-1.37-.77-1.89-2.5-1.12-3.95.34-.64 1.1-1.02 1.83-1.02h.85c1.38 0 2.5-1.12 2.5-2.5v-.5C22 6.48 17.52 2 12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconMonitor = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);