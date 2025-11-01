<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    name: string;
    value: number;
    step?: number;
    min?: number;
    max?: number;
    handleValueChanged: (newValue: number) => void;
  }

  let { value, name, step, min, max, handleValueChanged }: Props = $props();

  let displayValue: string = $derived(String(value));

  const handleSubmit = () => {
    const numericalRegexString = /^\s*-?(\d+|\d*\.\d+|\d+\.\d*)\s*$/;
    const isValidNumber = numericalRegexString.test(displayValue);

    if (isValidNumber) {
      const parsedValue = parseFloat(displayValue);
      if (!Number.isNaN(parsedValue)) {
        if (min !== undefined && parsedValue <= min) {
          handleValueChanged(min);
        } else if (max !== undefined && parsedValue >= max) {
          handleValueChanged(max);
        } else {
          handleValueChanged(parsedValue);
        }
      } else {
        handleValueChanged(value);
      }
    } else {
      displayValue = String(value);
    }
  };
</script>

<input
  class="w-10 custom-number-input outline-none focus:bg-black focus:text-white text-end no-spin-buttons"
  {step}
  {min}
  {max}
  {name}
  type="number"
  bind:value={displayValue}
  onkeypress={(key) => {
    if (key.key === "Enter") {
      handleSubmit();
    } else if (key.key === "ArrowUp") {
      displayValue = String(value + (step ?? 1));
    } else if (key.key === "ArrowDown") {
      displayValue = String(value - (step ?? 1));
    }
  }}
/>
