export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        width="28"
        height="28"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M24 6L14 16H34L24 6Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M14 16L24 42L34 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M6 16H42" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="font-headline text-xl font-bold text-primary">
        Saambh Jewellers
      </span>
    </div>
  );
}
