<script lang="ts">
  import { hexToRGBA, RGBAToHex } from "../processing/util";
  import CustomInput from "./CustomInput.svelte";

  interface Props {
    color: string;
    handleColorChange: (newColor: string) => void;
    label?: string;
  }

  const { color, handleColorChange, label }: Props = $props();
  const [r, g, b, a] = $derived(hexToRGBA(color));
</script>

{#if label !== undefined}
  <label for={label}>{label}</label>
{/if}
<div class="flex gap-1">
  <input
    type="color"
    aria-label={label}
    name={label}
    class="min-w-6 h-4 border"
    value={color}
    onchange={(inputEvent) => handleColorChange(inputEvent.currentTarget.value)}
  />
  <CustomInput
    min={0}
    max={255}
    step={1}
    value={a}
    label={`A:`}
    labelWidth={24}
    defaultValue={255}
    handleUpdate={(newOpacity: number) => {
      handleColorChange(RGBAToHex(r, g, b, newOpacity));
    }}
  ></CustomInput>
</div>
