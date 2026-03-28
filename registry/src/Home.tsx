import Dither1 from "./components/Dither1";
import Hatching from "./components/Hatching";
import HeatMap from "./components/HeatMap";
import Dots1 from "./components/Dots1";
import { EditorPreview } from "./components/EditorPreview";
import daffodil from "./assets/daffodil.png";
import rubiks from "./assets/rubiks.png";
import type { EditorInitialState } from "@sequenza/workbench";
import "@xyflow/react/dist/style.css";
import "@sequenza/workbench/style.css";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { useInitialState } from "./context/InitialStateContext";
import { useNavigate, Link } from "react-router";
import Race from "./components/Race";

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

      <div
        className="flex flex-col w-full max-w-screen-2xl gap-32"
        id="showcase"
      >
        <div className="w-full max-w-screen-2xl h-96 rounded-lg overflow-clip">
          <Race enableHoverActivation={false} handleEdit={handleEdit}></Race>
        </div>
        <div className="flex items-start gap-5 max-w-screen-2xl">
          <div className="h-134 rounded-lg overflow-clip flex-1">
            <Dither1 source={daffodil} handleEdit={handleEdit} />
          </div>
          <div className="flex flex-col items-start gap-3.5">
            <div className="w-96 h-58 rounded-lg overflow-clip shrink-0">
              <Hatching source={daffodil} handleEdit={handleEdit} />
            </div>
            <div className="w-96 h-68 rounded-lg overflow-clip shrink-0">
              <HeatMap source={daffodil} handleEdit={handleEdit} />
            </div>
          </div>
          <div className="h-134 rounded-lg overflow-clip flex-1">
            <Dots1 source={daffodil} handleEdit={handleEdit} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
