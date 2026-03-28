import { useState } from "react";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { EditorPreview } from "./components/EditorPreview";
import daffodil from "./assets/daffodil.png";

const COPY_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#676767"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const COMMAND = "pnpx @sequenza/workbench dev";

export default function ShaderDev() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-col items-center gap-36 pt-3 pb-12 bg-neutral-100 antialiased font-sans min-h-screen px-10">
      <Nav />

      <div className="flex items-center gap-16 max-w-5xl w-full justify-between">
        <div className="flex flex-col items-start gap-20">
          <div className="flex flex-col items-start gap-8 max-w-md">
            <h1 className="tracking-tight capitalize text-black font-medium bold text-4xl leading-11">
              Works on My Machine?
              <br />
              It'll work on yours too
            </h1>
            <p className="max-w-md opacity-70 text-black  leading-6">
              Sequenza can also be run as a standalone binary on your machine.
              Install and run with a single command:
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-sm pl-4 pr-2 py-2 bg-neutral-200">
            <code className="text-neutral-900 font-mono font-medium text-sm">
              {COMMAND}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-sm bg-neutral-100 p-2 hover:bg-neutral-50 transition-colors"
            >
              {copied ? (
                <span className="text-xs text-neutral-500 px-1">Copied!</span>
              ) : (
                COPY_ICON
              )}
            </button>
          </div>
        </div>
        <div className="w-130 h-130 rounded-lg bg-cover bg-center shrink-0">
          <EditorPreview source={daffodil}></EditorPreview>
        </div>
      </div>

      {/* Features */}
      <div className="flex items-start gap-28 max-w-screen-2xl">
        <div className="flex flex-col items-start gap-8">
          <div
            className="w-105 h-84 bg-cover bg-center shrink-0"
            style={{
              backgroundImage:
                "url(https://workers.paper.design/file-assets/01KKNDX03GBEX15GS0BMQPTWJ9/01KMQ0WR42VKQB7MQ4JSXB4370.png)",
            }}
          />
          <h2 className="tracking-tight capitalize text-black font-medium bold text-3xl leading-9">
            Live Updates
          </h2>
          <p className="max-w-md opacity-70 text-black  leading-6">
            Sequenza recursively scans your repository for shader files and
            automatically indexes them. Changes are reflected real-time in the
            editor
          </p>
        </div>
        <div className="flex flex-col items-start gap-8">
          <div className="h-84 w-96 relative shrink-0">
            <div
              className="w-96 h-48 absolute -left-14 top-24 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://workers.paper.design/file-assets/01KKNDX03GBEX15GS0BMQPTWJ9/01KMQ15JW80C7RD4AE7JJEWJZB.png)",
              }}
            />
            <div
              className="w-60 h-72 absolute right-0 top-4 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://workers.paper.design/file-assets/01KKNDX03GBEX15GS0BMQPTWJ9/01KMQ135KSRVFN9NXYFJ0CPH4Q.png)",
              }}
            />
          </div>
          <h2 className="tracking-tight capitalize text-black font-medium bold text-3xl leading-9">
            Uniform Detection
          </h2>
          <p className="max-w-md opacity-70 text-black  leading-6">
            Sequenza automatically detects uniforms in your shader. Controls
            will be automatically generated in-editor for you to fiddle with.
          </p>
        </div>
        <div className="flex flex-col items-start gap-8">
          <div
            className="w-105 h-84 bg-cover bg-center shrink-0"
            style={{
              backgroundImage:
                "url(https://workers.paper.design/file-assets/01KKNDX03GBEX15GS0BMQPTWJ9/01KMQ0WR42VKQB7MQ4JSXB4370.png)",
            }}
          />
          <h2 className="tracking-tight capitalize text-black font-medium bold text-3xl leading-9">
            Local Storage
          </h2>
          <p className="max-w-md opacity-70 text-black  leading-6">
            Patches you make can be saved to localstorage with cmd-S, so you can
            work on them between sessions and even across folders.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
