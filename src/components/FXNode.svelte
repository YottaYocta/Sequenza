<script lang="ts">
  import type { ProccessingNode } from "../ProcessingNode";
  import type { FX } from "../FX";
  import { newFX } from "../FX";
  import CustomInput from "./CustomInput.svelte";

  const { nodeIndex, node, onUpdateBehavior } = $props<{
    nodeIndex: number;
    node: ProccessingNode<FX>;
    onUpdateBehavior: (nodeIndex: number, behavior: FX) => void;
  }>();

  function updateField(field: string, value: number) {
    onUpdateBehavior(nodeIndex, { ...node.behavior, [field]: value } as FX);
  }

  function updateFilterField(field: "low" | "high", value: number) {
    onUpdateBehavior(nodeIndex, {
      ...node.behavior,
      filter: { ...node.behavior.filter, [field]: value },
    } as FX);
  }

  function updateDirection(direction: "horizontal" | "vertical") {
    if (node.behavior.type === "bar") {
      onUpdateBehavior(nodeIndex, {
        ...node.behavior,
        direction,
      } as FX);
    }
  }

  function switchToType(type: "dot" | "bar") {
    if (node.behavior.type !== type) {
      onUpdateBehavior(nodeIndex, newFX(type));
    }
  }
</script>

<div class="flex flex-col w-96">
  <!-- Tab Header -->
  <div class="flex flex-wrap border-b border-black">
    <button
      class="px-4 py-2 text-sm font-medium {node.behavior.type === 'dot'
        ? 'bg-black text-white'
        : 'bg-transparent text-black underline hover:no-underline'}"
      onclick={() => switchToType("dot")}
    >
      DOTS
    </button>
    <button
      class="px-4 py-2 text-sm font-medium {node.behavior.type === 'bar'
        ? 'bg-black text-white'
        : 'bg-transparent text-black underline hover:no-underline'}"
      onclick={() => switchToType("bar")}
    >
      BARS
    </button>
    <button
      class="px-4 py-2 text-sm font-medium bg-transparent text-black underline hover:no-underline"
      disabled
    >
      MIX
    </button>
    <button
      class="px-4 py-2 text-sm font-medium bg-transparent text-black underline hover:no-underline"
      disabled
    >
      DITHER
    </button>
    <button
      class="px-4 py-2 text-sm font-medium bg-transparent text-black underline hover:no-underline"
      disabled
    >
      ERODE
    </button>
    <button
      class="px-4 py-2 text-sm font-medium bg-transparent text-black underline hover:no-underline"
      disabled
    >
      HALFTONE
    </button>
    <button
      class="px-4 py-2 text-sm font-medium bg-transparent text-black underline hover:no-underline"
      disabled
    >
      MITOSIS
    </button>
    <button
      class="px-4 py-2 text-sm font-medium bg-transparent text-black underline hover:no-underline"
      disabled
    >
      EDGEDETECT
    </button>
    <button
      class="px-4 py-2 text-sm font-medium bg-transparent text-black underline hover:no-underline"
      disabled
    >
      ASCII
    </button>
  </div>

  <!-- Content Area -->
  <div class="py-4">
    {#if node.behavior.type === "dot"}
      <div class="flex flex-col">
        <CustomInput
          value={node.behavior.horizontalCount}
          min={1}
          max={100}
          defaultValue={10}
          handleUpdate={(v) => updateField("horizontalCount", v)}
          label="HORI COUNT"
        />

        <CustomInput
          value={node.behavior.verticalCount}
          min={1}
          max={100}
          defaultValue={10}
          handleUpdate={(v) => updateField("verticalCount", v)}
          label="VERT COUNT"
        />

        <CustomInput
          value={node.behavior.dotRadius}
          min={1}
          max={50}
          defaultValue={5}
          handleUpdate={(v) => updateField("dotRadius", v)}
          label="DOT SIZE"
        />

        <CustomInput
          value={node.behavior.borderRadius}
          min={-1}
          max={1}
          step={0.1}
          defaultValue={1}
          handleUpdate={(v) => updateField("borderRadius", v)}
          label="ROUND"
        />

        <CustomInput
          value={node.behavior.rotation}
          min={0}
          max={360}
          defaultValue={0}
          handleUpdate={(v) => updateField("rotation", v)}
          label="ROT"
        />

        <CustomInput
          value={node.behavior.filter.low}
          min={0}
          max={1}
          step={0.01}
          defaultValue={0}
          handleUpdate={(v) => updateFilterField("low", v)}
          label="FILTER LOW"
        />

        <CustomInput
          value={node.behavior.filter.high}
          min={0}
          max={1}
          step={0.01}
          defaultValue={1}
          handleUpdate={(v) => updateFilterField("high", v)}
          label="FILTER HIGH"
        />
      </div>
    {:else if node.behavior.type === "bar"}
      <div class="flex flex-col gap-4">
        <!-- Direction Toggle -->
        <div class="flex gap-2">
          <button
            class="px-4 py-2 text-sm font-medium flex-1 {node.behavior
              .direction === 'horizontal'
              ? 'bg-black text-white'
              : 'bg-transparent text-black underline hover:no-underline'}"
            onclick={() => updateDirection("horizontal")}
          >
            HORIZONTAL
          </button>
          <button
            class="px-4 py-2 text-sm font-medium flex-1 {node.behavior
              .direction === 'vertical'
              ? 'bg-black text-white'
              : 'bg-transparent text-black underline hover:no-underline'}"
            onclick={() => updateDirection("vertical")}
          >
            VERTICAL
          </button>
        </div>

        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-36 text-right">NUMBER OF BARS</span
          >
          <input
            type="range"
            min="1"
            max="100"
            value={node.behavior.numberBars}
            oninput={(e) =>
              updateField("numberBars", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.numberBars}</span
          >
        </label>

        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-36 text-right">BAR SIZE</span>
          <input
            type="range"
            min="1"
            max="100"
            value={node.behavior.barSize}
            oninput={(e) =>
              updateField("barSize", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.barSize}</span
          >
        </label>

        <label class="flex items-center gap-3">
          <span class="text-sm font-medium w-36 text-right">BORDER RADIUS</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={node.behavior.borderRadius}
            oninput={(e) =>
              updateField("borderRadius", Number(e.currentTarget.value))}
            class="flex-1"
          />
          <span class="text-sm font-medium w-12 text-center"
            >{node.behavior.borderRadius.toFixed(1)}</span
          >
        </label>

        <div class="border-t border-black pt-4 mt-4">
          <label class="flex items-center gap-3">
            <span class="text-sm font-medium w-36 text-right">FILTER LOW</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={node.behavior.filter.low}
              oninput={(e) =>
                updateFilterField("low", Number(e.currentTarget.value))}
              class="flex-1"
            />
            <span class="text-sm font-medium w-12 text-center"
              >{node.behavior.filter.low.toFixed(2)}</span
            >
          </label>

          <label class="flex items-center gap-3 mt-4">
            <span class="text-sm font-medium w-36 text-right">FILTER HIGH</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={node.behavior.filter.high}
              oninput={(e) =>
                updateFilterField("high", Number(e.currentTarget.value))}
              class="flex-1"
            />
            <span class="text-sm font-medium w-12 text-center"
              >{node.behavior.filter.high.toFixed(2)}</span
            >
          </label>
        </div>
      </div>
    {/if}
  </div>
</div>
