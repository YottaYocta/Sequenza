import { EditorPreview } from "./components/EditorPreview";
import { ShaderDemo } from "./components/ShaderDemo";
import rubiks from "./assets/rubiks.png";
import type { EditorInitialState } from "@sequenza/workbench";
import "@xyflow/react/dist/style.css";
import "@sequenza/workbench/style.css";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { useInitialState } from "./context/InitialStateContext";
import { useNavigate, Link } from "react-router";
import type { Patch, Uniforms } from "@sequenza/lib";

import fireDitherData from "./shaders/fire-dither.json";
import fbmBlueData from "./shaders/fbm-blue.json";
import responsiveLinesData from "./shaders/responsive-lines.json";
import anthropicData from "./shaders/anthropic.json";

export default function Home() {
  const { setInitialState } = useInitialState();
  const navigate = useNavigate();

  const handleEdit = (initialState: EditorInitialState) => {
    setInitialState(initialState);
    navigate("/editor");
  };

  return (
    <div className="flex flex-col items-center gap-24 pt-3 pb-12 bg-neutral-50 antialiased font-sans min-h-screen px-10 max-sm:px-6">
      <Nav />

      <div className="flex flex-col items-start gap-16 max-w-3xl w-full">
        <div className="flex flex-col items-start gap-6">
          <h1 className=" capitalize text-black font-medium text-3xl max-w-md flex flex-col leading-10 max-sm:text-2xl">
            Design Interactive Shaders
            <br />
            Use them anywhere
          </h1>

          <p className="w-full opacity-70 text-black leading-7 max-w-xl max-sm:text-sm max-sm:leading-6">
            Sequenza is an open-source compositor with modular shader effects.
            Export a self-contained component with a single click. Make
            fine-grained edits directly in the exported code.
          </p>
        </div>

        <div className="w-full flex flex-col gap-8">
          <div className="h-100 max-w-3xl w-full rounded-lg bg-neutral-200 shrink-0 overflow-hidden">
            <EditorPreview source={rubiks} />
          </div>

          <div className="flex items-center gap-7 max-sm:flex-col max-sm:items-start">
            <Link
              to="/editor"
              className="flex justify-center items-center px-10 py-1.5 rounded-sm bg-black text-white font-medium text-nowrap max-sm:w-full"
            >
              Open Editor
            </Link>
            <a
              href="#showcase"
              className="text-black font-medium max-sm:w-full text-center"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("showcase")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Or see Examples &#8595;
            </a>
          </div>
        </div>
      </div>
      <div
        className="flex flex-col w-full max-w-3xl gap-8 items-start pt-8"
        id="showcase"
      >
        <div className="h-full max-h-64 aspect-2/1">
          <ShaderDemo
            patch={anthropicData.patch as unknown as Patch}
            initialUniforms={
              anthropicData.uniforms as unknown as Record<string, Uniforms>
            }
            animate={true}
            width={1000}
            height={500}
            handleEdit={handleEdit}
          />
        </div>

        <div className="h-full max-h-64 aspect-4/1">
          <ShaderDemo
            patch={fbmBlueData.patch as unknown as Patch}
            initialUniforms={
              fbmBlueData.uniforms as unknown as Record<string, Uniforms>
            }
            width={2000}
            height={500}
            handleEdit={handleEdit}
          />
        </div>

        <div className="h-full max-h-64 aspect-5/2">
          <ShaderDemo
            patch={fireDitherData.patch as unknown as Patch}
            initialUniforms={
              fireDitherData.uniforms as unknown as Record<string, Uniforms>
            }
            width={1000}
            height={400}
            handleEdit={handleEdit}
          />
        </div>
        <div className="h-full max-h-64 aspect-5/4">
          <ShaderDemo
            animate={true}
            patch={responsiveLinesData.patch as unknown as Patch}
            initialUniforms={
              responsiveLinesData.uniforms as unknown as Record<
                string,
                Uniforms
              >
            }
            width={500}
            height={400}
            handleEdit={handleEdit}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
