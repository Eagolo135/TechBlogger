/**
 * The TechBlogger (TB) chibi mascot component.
 * 
 * This is the official TB mascot that represents the friendly AI companion for the site.
 */
export function AiMascot() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TechBlogger mascot"
      role="img"
    >
      <circle cx="32" cy="32" r="30" fill="#2563EB" />
      <circle cx="32" cy="32" r="28" fill="white" />
      <circle cx="22" cy="28" r="4" fill="#2563EB" />
      <circle cx="42" cy="28" r="4" fill="#2563EB" />
      <path
        d="M22 44c0-6 20-6 20 0"
        stroke="#2563EB"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
