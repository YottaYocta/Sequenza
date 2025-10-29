<script lang="ts">
  import type { ProccessingNode } from "../ProcessingNode";
  import type { Adjustment } from "../Adjustment";

  const { nodeIndex, node, onUpdateBehavior } = $props<{
    nodeIndex: number;
    node: ProccessingNode<Adjustment>;
    onUpdateBehavior: (nodeIndex: number, behavior: Adjustment) => void;
  }>();

  function updateField(field: string, value: number) {
    onUpdateBehavior(nodeIndex, {
      ...node.behavior,
      [field]: value,
    } as Adjustment);
  }

  function switchType(type: "HSL" | "RGB") {
    if (type === "HSL") {
      onUpdateBehavior(nodeIndex, {
        type: "HSL",
        hue: 0,
        saturation: 0,
        lightness: 0,
      } as Adjustment);
    } else {
      onUpdateBehavior(nodeIndex, {
        type: "RGB",
        r: 0,
        green: 0,
        blue: 0,
      } as Adjustment);
    }
  }
</script>

<div class="flex flex-col">
  <!-- Tab Header -->
  <div class="flex border-b border-black">
    <button
      class="px-4 py-2 text-sm font-medium {node.behavior.type === 'HSL'
        ? 'bg-black text-white'
        : 'bg-transparent text-black underline hover:no-underline'}"
      onclick={() => switchType("HSL")}
    >
      HSL
    </button>
    <button
      class="px-4 py-2 text-sm font-medium {node.behavior.type === 'RGB'
        ? 'bg-black text-white'
        : 'bg-transparent text-black underline hover:no-underline'}"
      onclick={() => switchType("RGB")}
    >
      RGB
    </button>
    <button
      class="px-4 py-2 text-sm font-medium bg-transparent text-black underline hover:no-underline"
      disabled
    >
      GRADIENT MAP
    </button>
  </div>

  <!-- Content Area -->
  <div class="py-4">
    {#if node.behavior.type === "HSL"}
      <div class="flex flex-col gap-4">
        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-28 text-right">HUE</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="0.01"
            value={node.behavior.hue}
            oninput={(e) => updateField("hue", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.hue}</span
          >
        </label>

        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-28 text-right">SATURATION</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={node.behavior.saturation}
            oninput={(e) =>
              updateField("saturation", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.saturation}</span
          >
        </label>

        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-28 text-right">VALUE</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={node.behavior.lightness}
            oninput={(e) =>
              updateField("lightness", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.lightness}</span
          >
        </label>
      </div>
    {:else if node.behavior.type === "RGB"}
      <div class="flex flex-col gap-4">
        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-28 text-right">RED</span>
          <input
            type="range"
            min="0"
            max="255"
            value={node.behavior.r}
            oninput={(e) => updateField("r", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.r}</span
          >
        </label>

        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-28 text-right">GREEN</span>
          <input
            type="range"
            min="0"
            max="255"
            value={node.behavior.green}
            oninput={(e) => updateField("green", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.green}</span
          >
        </label>

        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-28 text-right">BLUE</span>
          <input
            type="range"
            min="0"
            max="255"
            value={node.behavior.blue}
            oninput={(e) => updateField("blue", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.blue}</span
          >
        </label>
      </div>
    {/if}
  </div>
</div>
