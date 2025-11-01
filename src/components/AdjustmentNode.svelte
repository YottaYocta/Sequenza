<script lang="ts">
  import type { ProccessingNode } from "../ProcessingNode";
  import type { Adjustment, Gradient } from "../Adjustment";
  import CustomInput from "./CustomInput.svelte";
  import Line from "./Line.svelte";
  import type { Attachment } from "svelte/attachments";
  import Endpoint from "./Endpoint.svelte";
  import GradientInputNode from "./GradientInputNode.svelte";

  interface Props {
    nodeIndex: number;
    node: ProccessingNode<Adjustment>;
    onUpdateBehavior: (nodeIndex: number, behavior: Adjustment) => void;
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
    type: "HSL" | "RGB" | "GRADMAP";
    label: string;
    disabled?: boolean;
  };

  const adjustmentOptions: AdjustmentOption[] = [
    { type: "HSL", label: "HSL" },
    { type: "RGB", label: "RGB" },
    { type: "GRADMAP", label: "GRADIENTMAP" },
  ];

  function updateField(field: string, value: number) {
    onUpdateBehavior(nodeIndex, {
      ...node.behavior,
      [field]: value,
    } as Adjustment);
  }

  function switchType(type: "HSL" | "RGB" | "GRADMAP") {
    switch (type) {
      case "HSL":
        onUpdateBehavior(nodeIndex, {
          type: "HSL",
          hue: 0,
          saturation: 0,
          lightness: 0,
        } as Adjustment);

        break;

      case "RGB":
        onUpdateBehavior(nodeIndex, {
          type: "RGB",
          red: 0,
          green: 0,
          blue: 0,
        } as Adjustment);
        break;
      case "GRADMAP":
        onUpdateBehavior(nodeIndex, {
          type: "GRADMAP",
          stops: [
            { position: 0, color: "#000000" },
            { position: 0, color: "#ffffff" },
          ],
          interpolation: "linear",
        } as Gradient);
        break;
    }
  }
</script>

<div class="flex flex-col">
  <!-- Tab Header -->
  <div class="flex gap-1 pb-8 relative">
    {#each adjustmentOptions as option}
      <button
        class="text-sm {option.disabled
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

  <!-- form switch handling -->
  <div
    class="py-4 flex flex-col border-b border-t relative text-sm"
    bind:this={body}
  >
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
        handleUpdate={(v) => {
          updateField("hue", v);
        }}
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
    {:else if node.behavior.type === "GRADMAP"}
      <GradientInputNode
        gradient={node.behavior}
        handleUpdateGradient={(g) => onUpdateBehavior(nodeIndex, g)}
      ></GradientInputNode>
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
