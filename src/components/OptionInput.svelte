<script lang="ts">
  interface Props {
    label: string;
    options: string[];
    value: string;
    handleUpdate: (newValue: string) => void;
  }

  const { label, options, value, handleUpdate }: Props = $props();
</script>

<div class="flex items-center gap-2">
  <label class="w-full text-right text-nowrap" for={label}>{label}</label>

  <select
    id={label}
    name={label}
    class="w-48 min-w-36 border border-black bg-white px-2 cursor-pointer"
    {value}
    onchange={(e) => handleUpdate(e.currentTarget.value)}
  >
    {#each options as option}
      <option value={option}>{option}</option>
    {/each}
  </select>

  <span class="min-w-8 h-1"></span>
</div>
