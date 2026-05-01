import { Link } from "react-router";

export function Nav() {
  return (
    <nav className="flex items-center justify-between w-full max-w-3xl h-10 shrink-0">
      <Link to="/" className="flex items-center gap-1">
        <span className="font-semibold">Sequenza</span>
      </Link>
      <div className="flex items-center gap-9 text-neutral-700 ">
        <a
          href="https://github.com/YottaYocta/Sequenza"
          className="  hover:opacity-70"
          target="_blank"
          aria-label="Link to Github"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
          </svg>
        </a>
      </div>
    </nav>
  );
}
