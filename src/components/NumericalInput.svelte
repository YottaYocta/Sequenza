<script lang="ts">
  interface Props {
    name: string;
    value: number;
    step?: number;
    min?: number;
    max?: number;
    handleValueChanged: (newValue: number) => void;
  }

  let { value, name, step, min, max, handleValueChanged } = $props();

  let displayValue: string = $derived(value);
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
      const numericalRegexString = /^\s*-?(\d+|\d*\.\d+|\d+\.\d*)\s*$/;
      const isValidNumber = numericalRegexString.test(displayValue);

      if (isValidNumber) {
        const parsedValue = parseFloat(displayValue);
        if (!Number.isNaN(parsedValue)) handleValueChanged(parsedValue);
      } else {
        displayValue = value;
      }
    }
  }}
/>
