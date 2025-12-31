export function Footer() {
  return (
    <footer className="dark:bg-midnight border-t border-zinc-100 bg-white px-6 py-12 transition-colors dark:border-slate-800/30">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 stroke-zinc-900 stroke-2 dark:stroke-white"
          >
            <path
              d="M12 10C12 10 16 8 18 12C20 16 16 20 16 24C16 28 20 30 22 30"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M10 14C10 14 8 12 8 10"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M24 26C24 26 26 28 26 30"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M18 12C18 12 22 10 22 14C22 18 18 20 18 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-50"
            ></path>
          </svg>
          <span className="font-sans text-xl font-medium text-zinc-900 dark:text-white">
            Orderly
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-slate-500">
          © 2024 Orderly AI Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
