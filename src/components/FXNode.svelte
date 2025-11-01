<script lang="ts">
  import type { ProccessingNode } from "../ProcessingNode";
  import type { FX } from "../FX";
  import { newFX } from "../FX";
  import CustomInput from "./CustomInput.svelte";
  import Line from "./Line.svelte";
  import type { Attachment } from "svelte/attachments";
  import { untrack } from "svelte";
  import Endpoint from "./Endpoint.svelte";

  interface Props {
    nodeIndex: number;
    node: ProccessingNode<FX>;
    onUpdateBehavior: (nodeIndex: number, behavior: FX) => void;
  }

  const { nodeIndex, node, onUpdateBehavior }: Props = $props();

  let body = $state<HTMLDivElement | null>(null);
  let lineParams: {
    startX: number;
    endX: number;
    startY: number;
    endY: number;
  } | null = $state(null);

  const buttonAttachment: Attachment<HTMLButtonElement> = (
    element: HTMLButtonElement
  ) => {
    if (node.behavior.type === element.name && body !== null) {
      // Get bounding rects relative to the viewport
      const buttonRect = element.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();

      // Get the closest positioned parent (assuming it's the shared parent)
      const parent = element.offsetParent;
      const parentRect = parent
        ? parent.getBoundingClientRect()
        : { left: 0, top: 0 };

      // Calculate positions relative to the closest positioned parent
      // Bottom right corner of button
      const startX = buttonRect.right - parentRect.left;
      const startY = buttonRect.bottom - parentRect.top;

      // Top right corner of body
      const endX = bodyRect.left - parentRect.left;
      const endY = bodyRect.top - parentRect.top;

      // Update the line parameters

      untrack(() => {
        lineParams = { startX, startY, endX, endY };
      });
    }
  };

  type FXOption = {
    type: "dot" | "bar" | "ascii" | null;
    label: string;
    disabled?: boolean;
  };

  const fxOptions: FXOption[] = [
    { type: "dot", label: "DOTS" },
    { type: "bar", label: "BARS" },
    { type: null, label: "MIX", disabled: true },
    { type: null, label: "DITHER", disabled: true },
    { type: null, label: "ERODE", disabled: true },
    { type: null, label: "HALFTONE", disabled: true },
    { type: null, label: "MITOSIS", disabled: true },
    { type: null, label: "EDGEDETECT", disabled: true },
    { type: "ascii", label: "ASCII" },
  ];

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

  function switchToType(type: "dot" | "bar" | "ascii") {
    if (node.behavior.type !== type) {
      onUpdateBehavior(nodeIndex, newFX(type));
    }
  }
</script>

<div class="flex flex-col min-w-64 w-min text-sm">
  <!-- Tab Header -->
  <div class="flex flex-wrap gap-1 pb-8 relative">
    {#each fxOptions as option}
      <button
        class="text-sm {option.disabled
          ? 'bg-transparent text-neutral-400'
          : node.behavior.type === option.type
            ? 'bg-black text-white'
            : 'bg-transparent text-black'} {option.disabled
          ? ''
          : 'cursor-pointer'}"
        disabled={option.disabled}
        onclick={() => option.type && switchToType(option.type)}
        name={option.type}
        {@attach buttonAttachment}
      >
        {#if node.behavior.type === option.type}
          <Endpoint nodeIdx={nodeIndex} type="start"></Endpoint>
        {/if}
        {option.label}
      </button>
    {/each}

    {#if lineParams}
      <Line
        startX={lineParams.startX}
        startY={lineParams.startY}
        endX={lineParams.endX}
        endY={lineParams.endY}
      />
    {/if}
  </div>

  <!-- Content Area -->
  <div class="border-b border-t py-4 relative" bind:this={body}>
    <span class="absolute top-0 left-0 -translate-1/2 w-2 h-2 bg-black"> </span>
    <span
      class="absolute bottom-0 right-0 translate-1/2 w-2 h-2 bg-black flex items-center"
    >
      <Endpoint nodeIdx={nodeIndex} type="end"></Endpoint>
    </span>
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
    {:else if node.behavior.type === "ascii"}
      <div class="flex flex-col">
        <CustomInput
          value={node.behavior.charSize}
          min={4}
          max={50}
          defaultValue={10}
          handleUpdate={(v) => updateField("charSize", v)}
          label="CHAR SIZE"
        />

        <CustomInput
          value={node.behavior.resolutionMultiplier}
          min={1}
          max={4}
          defaultValue={2}
          handleUpdate={(v) => updateField("resolutionMultiplier", v)}
          label="RESOLUTION"
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
    {/if}
  </div>
</div>
