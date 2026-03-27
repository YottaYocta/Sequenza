import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Home from "./Home.tsx";
import ShaderDev from "./ShaderDev.tsx";
import EditorPage from "./EditorPage.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import { InitialStateProvider } from "./context/InitialStateContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <InitialStateProvider>
        <Routes>
          <Route index element={<Home />} />
          <Route path="shader-dev" element={<ShaderDev />} />
          <Route path="editor" element={<EditorPage />} />
        </Routes>
      </InitialStateProvider>
    </BrowserRouter>
  </StrictMode>,
);
