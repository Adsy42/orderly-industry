import Image from "next/image";

interface LogoProps {
  className?: string;
}

// General AI Tools

export function ChatGPTLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4091-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
        fill="#10A37F"
      />
    </svg>
  );
}

export function ClaudeLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16.592 18.0713L13.5109 8.36078C13.3812 7.93597 12.999 7.9152 12.8285 8.36078L9.32174 17.7823C9.22609 18.0402 9.04239 18.4755 8.99478 18.5274H11.0196C11.0561 18.4929 11.0928 18.4135 11.1087 18.3582L11.6348 16.7921H14.5087L15.0174 18.3065C15.0348 18.3581 15.0693 18.5101 15.0693 18.5101L17.1196 18.5274C17.067 18.431 16.6535 18.2259 16.592 18.0713ZM12.0761 15.1374L13.0696 11.6538L14.0804 15.1374H12.0761ZM15.4892 4.91309H18.0196V5.32609C17.0304 5.82613 16.0804 6.43043 15.2109 7.06522L15.4892 4.91309ZM18.7761 18.5274V10.4065H16.6022V18.5274H18.7761Z"
        fill="#D97757"
      />
      <path
        d="M5.99567 12.9783C5.99567 9.93044 7.52786 7.82609 10.3326 7.82609C10.8239 7.82609 11.3022 7.90653 11.7457 8.04348L11.2457 5.95652C10.9978 5.87826 10.6261 5.84348 10.3283 5.84348C5.93699 5.84348 3.62002 8.97174 3.62002 12.9761C3.62002 16.9804 5.92046 20.1087 10.3326 20.1087C10.6391 20.1087 10.967 20.0848 11.2761 20.0239L11.7652 17.937C11.3217 18.0739 10.837 18.1304 10.3326 18.1304C7.52786 18.1348 5.99567 16.0304 5.99567 12.9783Z"
        fill="#D97757"
      />
    </svg>
  );
}

export function GeminiLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 24C12 20.0218 14.1164 16.2545 17.5636 14.0073C16.2109 12.9382 15.2836 11.4036 15.0109 9.72C14.7382 8.03636 15.1418 6.30182 16.1455 4.89818C17.1491 3.49455 18.6764 2.54182 20.4 2.24727C22.1236 1.95273 23.8909 2.33455 25.3418 3.31636C24.1745 1.25818 22.2764 0 20.1818 0C16.2655 0 12.6764 2.21455 12 6C11.3236 2.21455 7.73455 0 3.81818 0C1.72364 0 -0.174545 1.25818 -1.34182 3.31636C0.109091 2.33455 1.87636 1.95273 3.6 2.24727C5.32364 2.54182 6.85091 3.49455 7.85455 4.89818C8.85818 6.30182 9.26182 8.03636 8.98909 9.72C8.71636 11.4036 7.78909 12.9382 6.43636 14.0073C9.88364 16.2545 12 20.0218 12 24Z"
        fill="#4285F4"
      />
    </svg>
  );
}

// Global Legal AI Platforms

export function HarveyLogo({ className }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logos/companies/harvey.svg"
        alt="Harvey AI"
        width={60}
        height={18}
        className="h-5 w-auto object-contain"
      />
    </div>
  );
}

export function LexisNexisLogo({ className }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/logos/companies/lexisnexis.png"
        alt="LexisNexis"
        width={200}
        height={48}
        className="h-10 w-auto scale-125 object-contain"
      />
    </div>
  );
}

export function LegoraLogo({ className }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/logos/companies/legora.avif"
        alt="Legora"
        width={150}
        height={48}
        className="h-10 w-auto scale-125 object-contain"
      />
    </div>
  );
}

// Contract Drafting Assistants

export function SpellbookLogo({ className }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logos/companies/spellbook.webp"
        alt="Spellbook"
        width={90}
        height={22}
        className="h-5 w-auto object-contain"
      />
    </div>
  );
}

export function LuminanceLogo({ className }: LogoProps) {
  return (
    <span
      className={`font-semibold tracking-tight ${className}`}
      style={{ fontSize: "14px" }}
    >
      Luminance
    </span>
  );
}

export function IvoLogo({ className }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/logos/companies/ivo.png"
        alt="Ivo"
        width={150}
        height={75}
        className="h-10 w-auto scale-125 object-contain"
      />
    </div>
  );
}
