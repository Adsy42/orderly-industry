export function OrderlyIcon({
  className,
  width = 32,
  height = 32,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Abstract brain/circuit icon based on Orderly logo */}
      <g fill="currentColor">
        {/* Top left curved connector */}
        <path d="M25 15 Q20 15 20 20 L20 25 Q20 28 23 28 Q26 28 26 25 L26 22 Q26 20 28 20 L32 20" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Main vertical stem left */}
        <path d="M30 18 L30 82" strokeWidth="5" stroke="currentColor" strokeLinecap="round"/>
        
        {/* Top horizontal connector */}
        <path d="M30 25 L45 25 Q48 25 48 28 L48 35" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Right vertical stem */}
        <path d="M48 30 L48 70" strokeWidth="5" stroke="currentColor" strokeLinecap="round"/>
        
        {/* Top right curved element */}
        <path d="M48 20 Q48 15 53 15 L60 15 Q65 15 65 20 L65 28" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Middle connector */}
        <path d="M30 50 L48 50" strokeWidth="4" stroke="currentColor" strokeLinecap="round"/>
        
        {/* Bottom left curve */}
        <path d="M20 75 Q20 82 27 82 L30 82" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Bottom connector */}
        <path d="M30 75 L45 75 Q48 75 48 72" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Right side curves */}
        <path d="M65 35 Q65 40 60 40 L55 40 Q52 40 52 43 L52 48" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Bottom right flourish */}
        <path d="M55 80 Q60 80 60 75 L60 70" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round"/>
        <path d="M60 85 Q65 85 68 82" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Node circles */}
        <circle cx="30" cy="18" r="3" fill="currentColor"/>
        <circle cx="30" cy="50" r="3" fill="currentColor"/>
        <circle cx="30" cy="82" r="3" fill="currentColor"/>
        <circle cx="48" cy="30" r="3" fill="currentColor"/>
        <circle cx="48" cy="70" r="3" fill="currentColor"/>
        <circle cx="65" cy="28" r="2.5" fill="currentColor"/>
      </g>
    </svg>
  );
}

export function OrderlyLogo({
  className,
  width,
  height,
  iconOnly = false,
}: {
  width?: number;
  height?: number;
  className?: string;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    return <OrderlyIcon width={width || 32} height={height || 32} className={className} />;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Icon portion - scaled down */}
      <g transform="translate(0, 0) scale(0.5)" fill="currentColor">
        {/* Top left curved connector */}
        <path d="M25 15 Q20 15 20 20 L20 25 Q20 28 23 28 Q26 28 26 25 L26 22 Q26 20 28 20 L32 20" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Main vertical stem left */}
        <path d="M30 18 L30 82" strokeWidth="5" stroke="currentColor" strokeLinecap="round"/>
        
        {/* Top horizontal connector */}
        <path d="M30 25 L45 25 Q48 25 48 28 L48 35" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Right vertical stem */}
        <path d="M48 30 L48 70" strokeWidth="5" stroke="currentColor" strokeLinecap="round"/>
        
        {/* Top right curved element */}
        <path d="M48 20 Q48 15 53 15 L60 15 Q65 15 65 20 L65 28" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Middle connector */}
        <path d="M30 50 L48 50" strokeWidth="4" stroke="currentColor" strokeLinecap="round"/>
        
        {/* Bottom left curve */}
        <path d="M20 75 Q20 82 27 82 L30 82" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Bottom connector */}
        <path d="M30 75 L45 75 Q48 75 48 72" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Right side curves */}
        <path d="M65 35 Q65 40 60 40 L55 40 Q52 40 52 43 L52 48" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Bottom right flourish */}
        <path d="M55 80 Q60 80 60 75 L60 70" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round"/>
        <path d="M60 85 Q65 85 68 82" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round"/>
        
        {/* Node circles */}
        <circle cx="30" cy="18" r="3" fill="currentColor"/>
        <circle cx="30" cy="50" r="3" fill="currentColor"/>
        <circle cx="30" cy="82" r="3" fill="currentColor"/>
        <circle cx="48" cy="30" r="3" fill="currentColor"/>
        <circle cx="48" cy="70" r="3" fill="currentColor"/>
        <circle cx="65" cy="28" r="2.5" fill="currentColor"/>
      </g>
      
      {/* "Orderly" text */}
      <text
        x="55"
        y="35"
        fontFamily="Outfit, system-ui, sans-serif"
        fontSize="28"
        fontWeight="500"
        fill="currentColor"
        letterSpacing="-0.02em"
      >
        Orderly
      </text>
    </svg>
  );
}

