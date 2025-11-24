<script lang="ts">
  import type { Behavior } from "../core/Behavior";
  import { createNewDotBehavior } from "../fx/dots";
  import { createNewAsciiBehavior } from "../fx/ascii";
  import DynamicForm from "./DynamicForm.svelte";
  import Line from "./Line.svelte";
  import type { Attachment } from "svelte/attachments";
  import { untrack } from "svelte";
  import Endpoint from "./Endpoint.svelte";
  import { createDitherBehavior } from "../fx/dither";
  import { createLinesBehavior } from "../fx/lines/lines";

  interface Props {
    nodeIndex: number;
    behavior: Behavior;
    onUpdateBehavior: (nodeIndex: number, behavior: Behavior) => any;
    handleDelete: (nodeIndex: number) => any;
  }

  const { nodeIndex, behavior, onUpdateBehavior, handleDelete }: Props =
    $props();

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
    if (behavior.type === element.name && body !== null) {
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
    type: string;
    label: string;
    disabled?: boolean;
  };

  const fxOptions: FXOption[] = [
    { type: "dots", label: "DOTS" },
    { type: "ascii", label: "ASCII" },
    { type: "dither", label: "DITHER" },
    { type: "lines", label: "LINES" },
    { type: "bars", label: "BARS", disabled: true },
  ];

  function switchToType(type: string) {
    if (behavior.type !== type) {
      const handleUpdate = (newBehavior: Behavior) =>
        onUpdateBehavior(nodeIndex, newBehavior);
      switch (type) {
        case "dots":
          handleUpdate(createNewDotBehavior());
          break;
        case "ascii":
          handleUpdate(createNewAsciiBehavior());
          break;
        case "dither":
          handleUpdate(createDitherBehavior());
          break;
        case "lines":
          handleUpdate(createLinesBehavior());
      }
    }
  }
</script>

<div class="flex flex-col w-84 text-sm">
  <button
    class="button-1 w-min absolute top-0 right-0 opacity-30 hover:opacity-100 z-10 translate-x-full"
    onclick={() => handleDelete(nodeIndex)}>Delete</button
  >
  <div class="flex flex-wrap gap-1 pb-8 relative w-64">
    {#each fxOptions as option}
      <button
        class="text-sm {option.disabled
          ? 'bg-transparent text-neutral-400'
          : behavior.type === option.type
            ? 'bg-black text-white'
            : 'bg-transparent text-black'} {option.disabled
          ? ''
          : 'cursor-pointer'}"
        disabled={option.disabled}
        onclick={() => option.type && switchToType(option.type)}
        name={option.type}
        {@attach buttonAttachment}
      >
        {#if behavior.type === option.type}
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

  <div class="border-b border-t py-4 relative" bind:this={body}>
    <span class="absolute top-0 left-0 -translate-1/2 w-2 h-2 bg-black"> </span>
    <span
      class="absolute bottom-0 right-0 translate-1/2 w-2 h-2 bg-black flex items-center"
    >
      <Endpoint nodeIdx={nodeIndex} type="end"></Endpoint>
    </span>
    <DynamicForm
      {behavior}
      onUpdateBehavior={(b) => onUpdateBehavior(nodeIndex, b)}
    />
  </div>
</div>
