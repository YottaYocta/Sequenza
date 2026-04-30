import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="flex items-center justify-between w-full max-w-6xl ">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-1.5 opacity-60  ">
          <span>2025-2026</span>
          <span>YottaYocta</span>
        </div>
        <span className="opacity-60  ">GPL3 License</span>
      </div>
      <div className="flex items-center gap-9">
        <Link to="/editor" className="opacity-60 hover:opacity-80 transition">
          Editor
        </Link>
        <a
          href="https://github.com/YottaYocta/Sequenza"
          className="opacity-60   hover:opacity-80 "
        >
          Github
        </a>
        <Link
          to="/shader-dev"
          className="opacity-60 hover:opacity-80 transition"
        >
          Local Dev
        </Link>
      </div>
    </footer>
  );
}
