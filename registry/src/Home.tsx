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

import raceData from "./shaders/race.json";
import fbmBlueData from "./shaders/fbm-blue.json";
import responsiveLinesData from "./shaders/responsive-lines.json";
import hatchingData from "./shaders/hatching.json";

export default function Home() {
  const { setInitialState } = useInitialState();
  const navigate = useNavigate();

  const handleEdit = (initialState: EditorInitialState) => {
    setInitialState(initialState);
    navigate("/editor");
  };

  return (
    <div className="flex flex-col items-center gap-36 pt-3 pb-12 bg-neutral-100 antialiased font-sans min-h-screen px-10 ">
      <Nav />

      <div className="flex items-center gap-16 max-w-5xl w-full">
        <div className="flex flex-col items-start gap-20">
          <div className="flex flex-col items-start gap-8">
            <h1 className="tracking-tight capitalize text-black font-medium text-4xl leading-11 max-w-md">
              Design Interactive Shaders
              <br />
              Use them anywhere
            </h1>
            <p className="max-w-md opacity-70 text-black leading-6 ">
              An open-source compositor with modular shader effects. Export a
              self-contained component with a single click. Make fine-grained
              edits directly in the exported code.
            </p>
          </div>
          <div className="flex items-center gap-7">
            <Link
              to="/editor"
              className="flex justify-center items-center px-10 py-1.5 rounded-sm bg-black text-white font-medium "
            >
              Open Editor
            </Link>
            <a href="#showcase" className="text-black font-medium ">
              Or see Examples &#8595;
            </a>
          </div>
        </div>
        <div className="w-130 h-130 rounded-lg bg-neutral-200 shrink-0 overflow-hidden">
          <EditorPreview source={rubiks} />
        </div>
      </div>

      <div className="flex flex-col w-full max-w-5xl gap-8" id="showcase">
        <div className="lg:h-64 md:h-48 h-32 w-full">
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
        <div className="lg:h-64 md:h-48 h-32 w-full">
          <ShaderDemo
            patch={raceData.patch as unknown as Patch}
            initialUniforms={
              raceData.uniforms as unknown as Record<string, Uniforms>
            }
            width={1000}
            height={400}
            handleEdit={handleEdit}
          />
        </div>
        <div className="flex items-start gap-8 w-full h-100">
          <ShaderDemo
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
          <ShaderDemo
            patch={hatchingData.patch as unknown as Patch}
            initialUniforms={
              hatchingData.uniforms as unknown as Record<string, Uniforms>
            }
            width={200}
            height={300}
            handleEdit={handleEdit}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
