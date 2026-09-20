export function Wordmark() {
  return (
    <span className="inline-flex text-foreground" role="img" aria-label="alter">
      <svg viewBox="0 0 116 32" className="block h-[1.7rem] w-auto" aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M11 8a11 11 0 1 0 .01 0z M11 14a5 5 0 1 1-.01 0z M11 16.1 14 19 11 21.9 8 19z"
        />
        <rect x="16.2" y="8" width="6" height="22" fill="currentColor" />
        <rect x="28" y="2" width="6" height="28" fill="currentColor" />
        <path fill="currentColor" d="M46 2h6v9H58v6H52v13h-6V17H40v-6h6z" />
        <path fill="currentColor" d="M85.6 16.2A11 11 0 1 0 85.6 21.8H73v-5.6z" />
        <path fill="currentColor" d="M92 8h6v22h-6z" />
        <path fill="currentColor" d="M98 8h10a4 4 0 0 1 4 4v8h-6v-6H98z" />
      </svg>
    </span>
  );
}
