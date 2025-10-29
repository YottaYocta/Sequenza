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

<div class="flex flex-col min-w-64 w-min text-sm">
  <!-- Tab Header -->
  <div class="flex flex-wrap gap-1 pb-8 relative">
    <button
      class=" text-sm font-medium {node.behavior.type === 'dot'
        ? 'bg-black text-white'
        : 'bg-transparent text-black  '} cursor-pointer"
      onclick={() => switchToType("dot")}
    >
      DOTS
    </button>
    <button
      class=" text-sm font-medium {node.behavior.type === 'bar'
        ? 'bg-black text-white'
        : 'bg-transparent text-black  '} cursor-pointer"
      onclick={() => switchToType("bar")}
    >
      BARS
    </button>
    <button
      class=" text-sm font-medium bg-transparent text-neutral-400"
      disabled
    >
      MIX
    </button>
    <button
      class=" text-sm font-medium bg-transparent text-neutral-400"
      disabled
    >
      DITHER
    </button>
    <button
      class=" text-sm font-medium bg-transparent text-neutral-400"
      disabled
    >
      ERODE
    </button>
    <button
      class=" text-sm font-medium bg-transparent text-neutral-400"
      disabled
    >
      HALFTONE
    </button>
    <button
      class=" text-sm font-medium bg-transparent text-neutral-400"
      disabled
    >
      MITOSIS
    </button>
    <button
      class=" text-sm font-medium bg-transparent text-neutral-400"
      disabled
    >
      EDGEDETECT
    </button>
    <button
      class=" text-sm font-medium bg-transparent text-neutral-400"
      disabled
    >
      ASCII
    </button>
  </div>

  <!-- Content Area -->
  <div class="border-b border-t py-4 relative">
    <span class="absolute top-0 left-0 -translate-1/2 w-2 h-2 bg-black"></span>
    <span class="absolute bottom-0 right-0 translate-1/2 w-2 h-2 bg-black"
    ></span>
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
            class="p-0 text-sm font-medium flex-1 {node.behavior.direction ===
            'horizontal'
              ? 'bg-black text-white'
              : 'bg-transparent text-black  '}"
            onclick={() => updateDirection("horizontal")}
          >
            HORIZONTAL
          </button>
          <button
            class="p-0 text-sm font-medium flex-1 {node.behavior.direction ===
            'vertical'
              ? 'bg-black text-white'
              : 'bg-transparent text-black  '}"
            onclick={() => updateDirection("vertical")}
          >
            VERTICAL
          </button>
        </div>

        <div class="flex flex-col">
          <CustomInput
            value={node.behavior.numberBars}
            min={1}
            max={100}
            handleUpdate={(v) => updateField("numberBars", v)}
            label="NUMBER OF BARS"
          />

          <CustomInput
            value={node.behavior.barSize}
            min={1}
            max={100}
            handleUpdate={(v) => updateField("barSize", v)}
            label="BAR SIZE"
          />

          <CustomInput
            value={node.behavior.borderRadius}
            min={0}
            max={1}
            step={0.1}
            handleUpdate={(v) => updateField("borderRadius", v)}
            label="BORDER RADIUS"
          />

          <CustomInput
            value={node.behavior.filter.low}
            min={0}
            max={1}
            step={0.01}
            handleUpdate={(v) => updateFilterField("low", v)}
            label="FILTER LOW"
          />

          <CustomInput
            value={node.behavior.filter.high}
            min={0}
            max={1}
            step={0.01}
            handleUpdate={(v) => updateFilterField("high", v)}
            label="FILTER HIGH"
          />
        </div>
      </div>
    {/if}
  </div>
</div>
