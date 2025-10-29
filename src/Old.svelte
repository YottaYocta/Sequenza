<script lang="ts">
  type MidPassFilter = {
    // filter value that returns true for all values in between low and high and false otherwise (low and high are clamped to 0 to 1)
    low: number;
    high: number;
  };

  interface DotsSettings {
    offsetX: number;
    offsetY: number;
    dotRadius: number;
    gapX: number; // horizontal separation
    gapY: number; // vertical separation
    borderRadius: number; // clamped to -1 to 1, with 0 being no corners (creates pixels) and 1 being equal to the dotRadius (fully rounded). -1 corresponds to a star shape (four pointed star; a circle but with edges concave, leaving 4 points)
    // controls the rotation of each Dot individually
    rotation: number;
    filter: MidPassFilter;
  }

  type EffectType = "dots" | "bands" | "particles" | "ascii";

  // Reactive state
  let canvas: HTMLCanvasElement | undefined;
  let svgElement: SVGSVGElement;
  let ctx: CanvasRenderingContext2D | null = null;

  let sourceImage: HTMLImageElement | null = null;
  let imageData: ImageData | null = null;

  // Image adjustment controls
  let hue = 0.5;
  let saturation = 0.5;
  let value = 0.5;
  let hasModifications = false;

  // Effect selection
  let selectedEffect: EffectType | null = "dots";

  // Dots settings with defaults
  let dotsSettings: DotsSettings = {
    offsetX: 0,
    offsetY: 0,
    dotRadius: 5,
    gapX: 10,
    gapY: 10,
    borderRadius: 1,
    rotation: 0,
    filter: {
      low: 0,
      high: 1,
    },
  };

  // Reactive statement to get context when canvas becomes available
  $: if (canvas && !ctx) {
    ctx = canvas.getContext("2d");
  }

  // Handle image upload
  function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        hasModifications = false;
        renderCanvas();
        generateSVG();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Render image to canvas with HSV adjustments
  function renderCanvas() {
    if (!ctx || !sourceImage || !canvas) return;

    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    ctx.drawImage(sourceImage, 0, 0);

    // Get image data and apply HSV adjustments
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      // Convert RGB to HSV
      let [h, s, v] = rgbToHsv(r, g, b);

      // Apply adjustments (hue shift, saturation and value multiply)
      h = (h + (hue - 0.5)) % 1;
      if (h < 0) h += 1;
      s = Math.max(0, Math.min(1, s * saturation * 2));
      v = Math.max(0, Math.min(1, v * value * 2));

      // Convert back to RGB
      const [nr, ng, nb] = hsvToRgb(h, s, v);
      data[i] = nr * 255;
      data[i + 1] = ng * 255;
      data[i + 2] = nb * 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // RGB to HSV conversion
  function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    const s = max === 0 ? 0 : delta / max;
    const v = max;

    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }

    return [h, s, v];
  }

  // HSV to RGB conversion
  function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    const mod = i % 6;
    const r = [v, q, p, p, t, v][mod];
    const g = [t, v, v, q, p, p][mod];
    const b = [p, p, t, v, v, q][mod];

    return [r, g, b];
  }

  // Generate SVG based on selected effect
  function generateSVG() {
    if (!imageData) return;

    if (selectedEffect === "dots") {
      generateDotsSVG();
    }
    // Add other effects here in the future
  }

  // Generate dots SVG effect
  function generateDotsSVG() {
    if (!imageData) return;

    const { width, height } = imageData;
    const data = imageData.data;
    const {
      offsetX,
      offsetY,
      dotRadius,
      gapX,
      gapY,
      borderRadius,
      rotation,
      filter,
    } = dotsSettings;

    // Clear existing SVG content
    svgElement.innerHTML = "";
    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Create dots based on grid
    for (let y = offsetY; y < height; y += gapY) {
      for (let x = offsetX; x < width; x += gapX) {
        const px = Math.floor(x);
        const py = Math.floor(y);

        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        const index = (py * width + px) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3] / 255;

        // Calculate brightness (value in HSV) for filtering only
        const brightness = (r + g + b) / (3 * 255);

        // Apply midpass filter - skip pixels outside the value range
        const clampedLow = Math.max(0, Math.min(1, filter.low));
        const clampedHigh = Math.max(0, Math.min(1, filter.high));
        if (brightness < clampedLow || brightness > clampedHigh) {
          continue;
        }

        // All dots are the same size (no scaling by brightness)
        const dotSize = dotRadius;

        // Create dot shape with sampled color
        const dot = createDotShape(x, y, dotSize, borderRadius, rotation);
        dot.setAttribute("fill", `rgba(${r}, ${g}, ${b}, ${a})`);
        svgElement.appendChild(dot);
      }
    }
  }

  // Create a dot shape (circle, square, or star depending on borderRadius)
  function createDotShape(
    x: number,
    y: number,
    size: number,
    borderRadius: number,
    rotation: number
  ): SVGElement {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute(
      "transform",
      `translate(${x}, ${y}) rotate(${rotation})`
    );

    if (borderRadius >= 0.99) {
      // Fully rounded - circle
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("r", size.toString());
      group.appendChild(circle);
    } else if (borderRadius <= -0.99) {
      // Star shape (concave circle)
      const path = createStarPath(size);
      const pathElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      pathElement.setAttribute("d", path);
      group.appendChild(pathElement);
    } else if (borderRadius > 0) {
      // Rounded rectangle
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      const rectSize = size * 2;
      rect.setAttribute("x", (-size).toString());
      rect.setAttribute("y", (-size).toString());
      rect.setAttribute("width", rectSize.toString());
      rect.setAttribute("height", rectSize.toString());
      rect.setAttribute("rx", (size * borderRadius).toString());
      group.appendChild(rect);
    } else {
      // Square (borderRadius = 0)
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      const rectSize = size * 2;
      rect.setAttribute("x", (-size).toString());
      rect.setAttribute("y", (-size).toString());
      rect.setAttribute("width", rectSize.toString());
      rect.setAttribute("height", rectSize.toString());
      group.appendChild(rect);
    }

    return group;
  }

  // Create a 4-pointed star path
  function createStarPath(size: number): string {
    const points = 4;
    const outerRadius = size;
    const innerRadius = size * 0.5;
    let path = "";

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      path += `${i === 0 ? "M" : "L"} ${x} ${y} `;
    }
    path += "Z";
    return path;
  }

  // Handle color adjustment changes
  function handleColorChange() {
    hasModifications = true;
    renderCanvas();
    generateSVG();
  }

  // Revert to original image
  function revertChanges() {
    hue = 0.5;
    saturation = 0.5;
    value = 0.5;
    hasModifications = false;
    renderCanvas();
    generateSVG();
  }

  // Handle effect selection
  function selectEffect(effect: EffectType) {
    selectedEffect = effect;
    generateSVG();
  }

  // Handle dots settings changes
  function handleDotsSettingsChange() {
    generateSVG();
  }

  // Copy SVG to clipboard
  async function copyAsSVG() {
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);

    try {
      await navigator.clipboard.writeText(svgString);
      alert("SVG copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy SVG:", err);
      alert("Failed to copy SVG to clipboard");
    }
  }

  // Copy as image (PNG) to clipboard
  async function copyAsImage() {
    if (!svgElement) return;

    try {
      // Get SVG dimensions
      const bbox = svgElement.getBBox();
      const width = bbox.width || svgElement.clientWidth;
      const height = bbox.height || svgElement.clientHeight;

      // Create a canvas to render the SVG
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) return;

      // Convert SVG to data URL
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      // Load SVG into an image
      const img = new Image();
      img.onload = async () => {
        tempCtx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        // Convert canvas to blob
        tempCanvas.toBlob(async (blob) => {
          if (!blob) return;

          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            alert("Image copied to clipboard!");
          } catch (err) {
            console.error("Failed to copy image:", err);
            alert("Failed to copy image to clipboard");
          }
        }, "image/png");
      };
      img.src = url;
    } catch (err) {
      console.error("Failed to copy image:", err);
      alert("Failed to copy image to clipboard");
    }
  }
</script>

<main
  class="w-screen overflow-x-hidden h-screen overflow-y-hidden bg-neutral-200 flex flex-row gap-8 p-16 justify-center items-stretch text-neutral-600"
>
  <div
    class="w-full h-full bg-neutral-100 border border-neutral-50 rounded-sm flex flex-col p-4 gap-4"
  >
    <!-- Image upload and canvas section -->
    {#if !sourceImage}
      <label
        for="image-upload"
        class="w-full h-full bg-neutral-50 border-2 border-dashed border-neutral-300 rounded flex items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors"
      >
        <span class="text-lg">Upload Image</span>
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        on:change={handleImageUpload}
        class="hidden"
      />
    {:else}
      <canvas
        bind:this={canvas}
        class="w-full h-full bg-neutral-900 object-contain"
      ></canvas>
    {/if}

    <div class="w-full p-4 flex gap-4 h-24 items-center">
      <!-- Color adjustment controls -->
      <div class="w-36">
        <label for="hue" class="text-sm">Hue</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="hue"
          bind:value={hue}
          on:input={handleColorChange}
          step="0.01"
        />
      </div>
      <div class="w-36">
        <label for="saturation" class="text-sm">Saturation</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="saturation"
          bind:value={saturation}
          on:input={handleColorChange}
          step="0.01"
        />
      </div>
      <div class="w-36">
        <label for="value" class="text-sm">Value</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="value"
          bind:value
          on:input={handleColorChange}
          step="0.01"
        />
      </div>
      {#if hasModifications}
        <button
          on:click={revertChanges}
          class="px-4 py-2 bg-neutral-300 hover:bg-neutral-400 rounded text-sm transition-colors"
        >
          Revert
        </button>
      {/if}
    </div>
  </div>

  <div
    class="w-full h-full bg-neutral-100 border border-neutral-50 rounded-sm flex flex-col p-4 gap-4"
  >
    <!-- SVG output section -->
    <svg
      bind:this={svgElement}
      class="w-full h-full bg-neutral-900"
      preserveAspectRatio="xMidYMid meet"
    ></svg>

    <!-- Bottom control section -->
    {#if !selectedEffect}
      <!-- Effect selection -->
      <div class="w-full flex flex-col gap-4">
        <p class="text-sm font-semibold">Select Effect</p>
        <ul class="flex gap-4">
          <li>
            <button
              on:click={() => selectEffect("dots")}
              class="px-4 py-2 rounded transition-colors bg-neutral-300 hover:bg-neutral-400"
            >
              Dots
            </button>
          </li>
          <!-- Future features -->
          <li>
            <button
              disabled
              class="px-4 py-2 rounded bg-neutral-200 text-neutral-400 cursor-not-allowed"
            >
              Bands
            </button>
          </li>
          <li>
            <button
              disabled
              class="px-4 py-2 rounded bg-neutral-200 text-neutral-400 cursor-not-allowed"
            >
              Particles
            </button>
          </li>
          <li>
            <button
              disabled
              class="px-4 py-2 rounded bg-neutral-200 text-neutral-400 cursor-not-allowed"
            >
              Ascii
            </button>
          </li>
        </ul>
      </div>
    {:else if selectedEffect === "dots"}
      <!-- Dots settings -->
      <div class="w-full flex flex-col gap-2 max-h-48 overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-sm">Dots Settings</h3>
          <div class="flex gap-2">
            <button
              on:click={copyAsSVG}
              class="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded"
            >
              Copy as SVG
            </button>
            <button
              on:click={copyAsImage}
              class="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded"
            >
              Copy as Image
            </button>
            <button
              on:click={() => (selectedEffect = null)}
              class="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded"
            >
              Change Effect
            </button>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-x-4 gap-y-2">
          <div>
            <label for="dotRadius" class="text-xs block">Radius</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="1"
              max="20"
              bind:value={dotsSettings.dotRadius}
              on:input={handleDotsSettingsChange}
              step="0.5"
            />
          </div>

          <div>
            <label for="gapX" class="text-xs block">Gap X</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="5"
              max="50"
              bind:value={dotsSettings.gapX}
              on:input={handleDotsSettingsChange}
              step="1"
            />
          </div>

          <div>
            <label for="gapY" class="text-xs block">Gap Y</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="5"
              max="50"
              bind:value={dotsSettings.gapY}
              on:input={handleDotsSettingsChange}
              step="1"
            />
          </div>

          <div>
            <label for="offsetX" class="text-xs block">Offset X</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="0"
              max="50"
              bind:value={dotsSettings.offsetX}
              on:input={handleDotsSettingsChange}
              step="1"
            />
          </div>

          <div>
            <label for="offsetY" class="text-xs block">Offset Y</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="0"
              max="50"
              bind:value={dotsSettings.offsetY}
              on:input={handleDotsSettingsChange}
              step="1"
            />
          </div>

          <div>
            <label for="borderRadius" class="text-xs block">Shape</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="-1"
              max="1"
              bind:value={dotsSettings.borderRadius}
              on:input={handleDotsSettingsChange}
              step="0.01"
            />
          </div>

          <div>
            <label for="rotation" class="text-xs block">Rotation</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="0"
              max="360"
              bind:value={dotsSettings.rotation}
              on:input={handleDotsSettingsChange}
              step="1"
            />
          </div>

          <div>
            <label for="filterLow" class="text-xs block">Filter Low</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="0"
              max="1"
              bind:value={dotsSettings.filter.low}
              on:input={handleDotsSettingsChange}
              step="0.01"
            />
          </div>

          <div>
            <label for="filterHigh" class="text-xs block">Filter High</label>
            <input
              class="w-full px-2 py-1 text-xs border border-neutral-300 rounded"
              type="number"
              min="0"
              max="1"
              bind:value={dotsSettings.filter.high}
              on:input={handleDotsSettingsChange}
              step="0.01"
            />
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>
