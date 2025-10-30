<script lang="ts">
  import type { ProccessingNode } from "../ProcessingNode";
  import type { Adjustment } from "../Adjustment";
  import CustomInput from "./CustomInput.svelte";
  import Line from "./Line.svelte";
  import type { Attachment } from "svelte/attachments";
  import Endpoint from "./Endpoint.svelte";

  const { nodeIndex, node, onUpdateBehavior } = $props<{
    nodeIndex: number;
    node: ProccessingNode<Adjustment>;
    onUpdateBehavior: (nodeIndex: number, behavior: Adjustment) => void;
  }>();

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
    if (node.behavior.type === element.name && body) {
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

      // Top left corner of body
      const endX = bodyRect.left - parentRect.left;
      const endY = bodyRect.top - parentRect.top;

      // Update the line parameters
      lineParams = { startX, startY, endX, endY };
    }
  };

  type AdjustmentOption = {
    type: "HSL" | "RGB" | null;
    label: string;
    disabled?: boolean;
  };

  const adjustmentOptions: AdjustmentOption[] = [
    { type: "HSL", label: "HSL" },
    { type: "RGB", label: "RGB" },
    { type: null, label: "GRADIENTMAP", disabled: true },
  ];

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
        red: 0,
        green: 0,
        blue: 0,
      } as Adjustment);
    }
  }
</script>

<div class="flex flex-col">
  <!-- Tab Header -->
  <div class="flex gap-1 pb-8 relative">
    {#each adjustmentOptions as option}
      <button
        class="text-sm font-medium {option.disabled
          ? 'bg-transparent text-neutral-400'
          : node.behavior.type === option.type
            ? 'bg-black text-white'
            : 'bg-transparent text-black'} {option.disabled
          ? ''
          : 'cursor-pointer'}"
        disabled={option.disabled}
        onclick={() => option.type && switchType(option.type)}
        name={option.type}
        {@attach buttonAttachment}
      >
        {#if node.behavior.type === option.type}
          <div class="absolute top-0 left-0">
            <Endpoint nodeIdx={nodeIndex} type="start"></Endpoint>
          </div>
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
  <div class="py-4 flex flex-col border-b border-t relative" bind:this={body}>
    <span class="absolute top-0 left-0 -translate-1/2 w-2 h-2 bg-black"> </span>
    <span
      class="absolute bottom-0 right-0 translate-1/2 w-2 h-2 bg-black flex items-center"
    >
      <Endpoint nodeIdx={nodeIndex} type="end"></Endpoint>
    </span>
    {#if node.behavior.type === "HSL"}
      <CustomInput
        label="HUE"
        min={-180}
        max={180}
        step={0.01}
        value={node.behavior.hue}
        defaultValue={0}
        handleUpdate={(v) => updateField("hue", v)}
      />

      <CustomInput
        label="SATURATION"
        min={0}
        max={1}
        step={0.01}
        value={node.behavior.saturation}
        defaultValue={0}
        handleUpdate={(v) => updateField("saturation", v)}
      />

      <CustomInput
        label="LIGHTNESS"
        min={-1}
        max={1}
        step={0.01}
        value={node.behavior.lightness}
        defaultValue={0}
        handleUpdate={(v) => updateField("lightness", v)}
      />
    {:else if node.behavior.type === "RGB"}
      <CustomInput
        label="RED"
        min={0}
        max={255}
        step={1}
        value={node.behavior.red}
        defaultValue={0}
        handleUpdate={(v) => updateField("red", v)}
      />

      <CustomInput
        label="GREEN"
        min={0}
        max={255}
        step={1}
        value={node.behavior.green}
        defaultValue={0}
        handleUpdate={(v) => updateField("green", v)}
      />

      <CustomInput
        label="BLUE"
        min={0}
        max={255}
        step={1}
        value={node.behavior.blue}
        defaultValue={0}
        handleUpdate={(v) => updateField("blue", v)}
      />
    {/if}
  </div>
</div>
