<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import type { GradientField, GradientStop } from "../core/Behavior";
  import { evalGradientAt } from "../adjustments/gradientmap/gradientmap";
  import NumericalInput from "./NumericalInput.svelte";
  import { hexToRGBA, RGBAToHex } from "../core/util";

  interface Props {
    gradientField: GradientField;
    onUpdateGradient: (newGradient: GradientField) => void;
  }

  const { gradientField, onUpdateGradient }: Props = $props();

  const gradientAttachment: Attachment<HTMLCanvasElement> = (
    element: HTMLCanvasElement
  ) => {
    const ctx = element.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, element.width, element.height);
      for (let i = 0; i < element.width; i++) {
        const currentColor = evalGradientAt(gradientField, i / element.width);
        const [r, g, b, a] = hexToRGBA(currentColor);
        ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
        ctx.fillRect(i, 0, 1, element.height);
      }
    }
  };

  const sliderAttachmentFactory = (
    stopIndex: number
  ): Attachment<HTMLButtonElement> => {
    const sliderAttachment: Attachment<HTMLButtonElement> = (
      element: HTMLButtonElement
    ) => {
      const handleMouseMove = (e: MouseEvent) => {
        const parent = element.parentElement;
        if (!parent) return;
        const parentBoundingBox = parent.getBoundingClientRect();
        const targetX = e.clientX - parentBoundingBox.x;
        const gradientRampWidth = parentBoundingBox.width;

        const clampedX = Math.max(0, Math.min(targetX, gradientRampWidth));
        element.style.left = `${clampedX}px`;

        updateStopPosition(stopIndex, clampedX / gradientRampWidth);
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
    return sliderAttachment;
  };

  function addStop() {
    const newGradient: GradientField = {
      ...gradientField,
      stops: [...gradientField.stops, { position: 1, color: "#ffffff" }],
    };
    onUpdateGradient(newGradient);
  }

  function removeStop(idx: number) {
    if (gradientField.stops.length <= 1) return;
    const newGradient: GradientField = {
      ...gradientField,
      stops: gradientField.stops.filter((_, i) => i !== idx),
    };
    onUpdateGradient(newGradient);
  }

  function updateStopPosition(idx: number, newPosition: number) {
    const newStops = [...gradientField.stops];
    newStops[idx] = { ...newStops[idx], position: newPosition };
    const newGradient: GradientField = {
      ...gradientField,
      stops: newStops,
    };
    onUpdateGradient(newGradient);
  }

  function updateStopColor(idx: number, newColor: string) {
    const newStops = [...gradientField.stops];
    const [newR, newG, newB] = hexToRGBA(newColor);

    newStops.map((stop, stopIdx) => {
      if (idx === stopIdx) {
        const [_r, _g, _b, currentA] = hexToRGBA(stop.color);
        const newColor = [newR, newG, newB, currentA];
        return { ...stop, color: newColor };
      }
      return stop;
    });

    const newGradient: GradientField = {
      ...gradientField,
      stops: newStops,
    };
    onUpdateGradient(newGradient);
  }

  const updateStopOpacity = (idx: number, opacity: number) => {
    const newStops = gradientField.stops.map((stop, stopIdx): GradientStop => {
      if (stopIdx === idx) {
        const [currentR, currentG, currentB] = hexToRGBA(stop.color);
        const newColor = RGBAToHex(currentR, currentG, currentB, opacity);
        console.log(newColor);
        return {
          ...stop,
          color: newColor,
        };
      }
      return stop;
    });

    const newGradient: GradientField = {
      ...gradientField,
      stops: newStops,
    };
    onUpdateGradient(newGradient);
  };
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
            {@attach sliderAttachmentFactory(idx)}
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
          <NumericalInput
            min={0}
            max={255}
            step={1}
            value={255}
            name={`alpha-${idx}`}
            handleValueChanged={(newOpacity: number) => {
              updateStopOpacity(idx, newOpacity);
            }}
          ></NumericalInput>
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
