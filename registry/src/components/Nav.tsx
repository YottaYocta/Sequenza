import { Link } from "react-router";

export function Nav() {
  return (
    <nav className="flex items-center justify-between w-full max-w-screen-2xl h-10 border-b border-neutral-200 shrink-0">
      <Link to="/" className="flex items-center gap-1">
        <span className="font-semibold">Sequenza</span>
      </Link>
      <div className="flex items-center gap-9 text-neutral-700 ">
        <Link to="/editor" className="  hover:opacity-70">
          Editor
        </Link>
        <Link to="/shader-dev" className="  hover:opacity-70">
          Shader Development
        </Link>
        <a
          href="https://github.com/YottaYocta/Sequenza"
          className="  hover:opacity-70"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}
