import { EditorPreview } from "./components/EditorPreview";
import { ShaderDemo } from "./components/ShaderDemo";
import rubiks from "./assets/rubiks.png";
import usageGif1 from "./assets/usage_guide/1.gif";
import usageGif2 from "./assets/usage_guide/2.gif";
import usageGif3 from "./assets/usage_guide/3.gif";
import usageImg4 from "./assets/usage_guide/4.png";
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
import planetStampData from "./shaders/planet-stamp.json";
import crystalcube from "./shaders/crystalcube.json";
import ferro from "./shaders/ferro.json";

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
              href="#starter-examples"
              className="text-black font-medium max-sm:w-full text-center"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("starter-examples")
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
        id="starter-examples"
      >
        <div className="flex flex-col items-start gap-6">
          <h2 className=" capitalize text-black font-medium text-3xl max-w-md flex flex-col leading-10 max-sm:text-2xl">
            Starter Examples
          </h2>

          <p className="w-full opacity-70 text-black leading-7 max-w-xl max-sm:text-sm max-sm:leading-6 mb-8">
            Hover over the following examples to interact with them. Click{" "}
            <span className="px-2 py-1 bg-neutral-200 text-black rounded-sm">
              Edit
            </span>{" "}
            to open each example in the editor.
          </p>
        </div>
        <div className="h-full max-h-64 aspect-2/1">
          <ShaderDemo
            patch={anthropicData.patch as unknown as Patch}
            initialUniforms={
              anthropicData.uniforms as unknown as Record<string, Uniforms>
            }
            width={1000}
            height={500}
            handleEdit={handleEdit}
            animate={true}
          />
        </div>
        <div className="h-full max-h-96 aspect-square">
          <ShaderDemo
            patch={crystalcube.patch as unknown as Patch}
            initialUniforms={
              crystalcube.uniforms as unknown as Record<string, Uniforms>
            }
            width={500}
            height={500}
            handleEdit={handleEdit}
            animate={true}
          />
        </div>
        <div className="h-full max-h-64 aspect-square">
          <ShaderDemo
            patch={ferro.patch as unknown as Patch}
            initialUniforms={
              ferro.uniforms as unknown as Record<string, Uniforms>
            }
            initialUniformExpressions={ferro.uniformExpressions}
            width={500}
            height={500}
            handleEdit={handleEdit}
            animate={true}
          />
        </div>

        <div className="h-full max-h-64 aspect-5/2">
          <ShaderDemo
            patch={planetStampData.patch as unknown as Patch}
            initialUniforms={
              planetStampData.uniforms as unknown as Record<string, Uniforms>
            }
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
            animate={true}
          />
        </div>
      </div>
      <div
        className="flex flex-col w-full max-w-3xl gap-8 items-start pt-8"
        id="usage-guide"
      >
        <div className="flex flex-col items-start gap-6">
          <h2 className="capitalize text-black font-medium text-3xl max-w-md flex flex-col leading-10 max-sm:text-2xl">
            Usage Guide
          </h2>

          <div className="flex flex-col gap-6 w-full opacity-70 text-black leading-7 max-sm:text-sm max-sm:leading-6">
            <p>
              Each node can take inputs in the form of settings and images and
              create some image with an effect applied to it. All editing is
              done in the Sequenza editor, which can be accessed above.
            </p>

            <p>
              To create a node, click on the &lsquo;new node&rsquo; button, or
              right click on the canvas. This opens a large menu of nodes, each
              with a unique behavior. Let&rsquo;s add a{" "}
              <code className="px-2 py-0.5 bg-neutral-200 text-black rounded-sm opacity-100">
                cube
              </code>{" "}
              node as an example:
            </p>

            <img src={usageGif1} className="w-full rounded-md" />

            <p>
              The time and animation can be controlled with the panel at the
              bottom-center of the screen.
            </p>

            <img src={usageGif2} className="w-full rounded-md" />

            <p>
              You can chain effects by connecting one node&rsquo;s output to
              another&rsquo;s input. Think of this as a factory, where each node
              takes its input, reads its settings, and produces a modified
              version of that input.
            </p>

            <p>
              To create a new connection, drag from the bottom handle of a node;
              this will open the menu again and prompt you to attach a node.
              Let&rsquo;s add a dither to the cube to create a retro-looking
              effect.
            </p>

            <img src={usageGif3} className="w-full rounded-md" />

            <p>
              Note that this only works for nodes that accept an input, such as
              color adjustments, dither, etc. You can&rsquo;t feed a cube image
              into another cube node, for instance, since it doesn&rsquo;t
              accept any input.
            </p>

            <p>
              Nodes can be exported to various format via the export menu. If
              you want to save your work, you can download the JSON of your
              node, or export it to a react snippet, where it can be embedded
              into any project. If you use AI coding tools, you can also copy
              the export prompt directly for the agent to implement.
            </p>

            <img src={usageImg4} className="w-full rounded-md" />

            <p>
              This is only a partial guide; there are many more powerful
              effects, and you can see them in action by tinkering with the
              examples above. Note that this library is still in early stages of
              development, and might have breaking changes.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
