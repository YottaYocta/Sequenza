<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import type { Behavior, GradientField } from "../core/Behavior";
  import { evalGradientAt } from "../adjustments/gradientmap";
  import { cloneBehavior } from "../core/util";
  import NumericalInput from "./NumericalInput.svelte";

  interface Props {
    behavior: Behavior;
    onUpdateBehavior: (newBehavior: Behavior) => void;
  }
  const { behavior, onUpdateBehavior }: Props = $props();

  // Extract gradient field from behavior
  const gradientField = $derived(
    Object.values(behavior.fields).find(
      (field) => field.type === "GradientMap"
    ) as GradientField | undefined
  );

  const gradientAttachment: Attachment<HTMLCanvasElement> = (
    element: HTMLCanvasElement
  ) => {
    if (!gradientField) return;

    const ctx = element.getContext("2d");
    if (ctx) {
      for (let i = 0; i < element.width; i++) {
        const currentColor = evalGradientAt(gradientField, i / element.width);
        ctx.fillStyle = currentColor;
        ctx.fillRect(i, 0, 1, element.height);
      }
    }
  };

  const sliderAttachment: Attachment<HTMLButtonElement> = (
    element: HTMLButtonElement
  ) => {
    const handleMouseMove = (e: MouseEvent) => {
      const parent = element.parentElement;
      if (!parent) return;
      const parentBoundingBox = parent.getBoundingClientRect();
      const targetX = e.clientX - parentBoundingBox.x;
      const leftEdge = parentBoundingBox.width;

      const clampedX = Math.max(0, Math.min(targetX, leftEdge));

      element.style.left = `${clampedX}px`;
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseDown = (e: MouseEvent) => {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);
    };

    element.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      element.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  };

  function updateGradient(updatedGradient: GradientField) {
    // Find the gradient field name and update it
    for (const [fieldName, field] of Object.entries(behavior.fields)) {
      if (field.type === "GradientMap") {
        behavior.fields[fieldName] = updatedGradient;
        break;
      }
    }
    onUpdateBehavior(behavior);
  }

  function addStop() {
    if (!gradientField) return;
    const newGradient: GradientField = {
      ...gradientField,
      stops: [...gradientField.stops, { position: 1, color: "#ffffff" }],
    };
    updateGradient(newGradient);
  }

  function removeStop(idx: number) {
    if (!gradientField || gradientField.stops.length <= 1) return;
    const newGradient: GradientField = {
      ...gradientField,
      stops: gradientField.stops.filter((_, i) => i !== idx),
    };
    updateGradient(newGradient);
  }

  function updateStopPosition(idx: number, newPosition: number) {
    if (!gradientField) return;
    const newStops = [...gradientField.stops];
    newStops[idx] = { ...newStops[idx], position: newPosition };
    const newGradient: GradientField = {
      ...gradientField,
      stops: newStops,
    };
    updateGradient(newGradient);
  }

  function updateStopColor(idx: number, newColor: string) {
    if (!gradientField) return;
    const newStops = [...gradientField.stops];
    newStops[idx] = { ...newStops[idx], color: newColor };
    const newGradient: GradientField = {
      ...gradientField,
      stops: newStops,
    };
    updateGradient(newGradient);
  }
</script>

{#if gradientField}
  <div class="flex flex-col justify-center items-center gap-2 text-sm">
    <div class="h-8">
      <div class="w-min h-min relative">
        <canvas {@attach gradientAttachment} class="w-32 h-4 border"> </canvas>
        {#each gradientField.stops as stop, idx}
          <button
            aria-label={`handle for stop ${idx}`}
            class="w-4 h-2 -translate-x-1/2 border absolute -bottom-3"
            style={`left: ${stop.position * 100}%; background: ${stop.color}; `}
            {@attach sliderAttachment}
          >
          </button>
        {/each}
      </div>
    </div>
    <div class="w-full flex justify-between">
      <p>STOPS</p>
      <button class="button-1" onclick={addStop}>ADD +</button>
    </div>
    <div class="flex flex-col gap-0 w-full h-min">
      {#each gradientField.stops as stop, idx}
        <div class="w-full flex gap-2 items-center h-min">
          <NumericalInput
            min={0}
            max={1}
            step={0.01}
            value={stop.position}
            name={`stop-${idx}`}
            handleValueChanged={(newValue) => updateStopPosition(idx, newValue)}
          ></NumericalInput>
          <input
            type="color"
            aria-label={`open-color-picker-for-stop-${idx}`}
            class="w-4 h-4 border"
            value={stop.color}
            onchange={(inputEvent) =>
              updateStopColor(idx, inputEvent.currentTarget.value)}
          />
          <p>{stop.color}</p>
          {#if gradientField.stops.length > 1}
            <button
              class="text-xs"
              onclick={() => removeStop(idx)}
              aria-label={`remove stop ${idx}`}>×</button
            >
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
