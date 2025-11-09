<script lang="ts">
  import type { Behavior } from "../core/Behavior";
  import { cloneBehavior } from "../core/Behavior";
  import CustomInput from "./CustomInput.svelte";
  import GradientInputNode from "./GradientInputNode.svelte";

  interface Props {
    behavior: Behavior;
    onUpdateBehavior: (behavior: Behavior) => void;
  }

  const { behavior, onUpdateBehavior }: Props = $props();

  function updateField(fieldName: string, value: number) {
    const updatedBehavior = cloneBehavior(behavior);
    if (fieldName in updatedBehavior.fields) {
      const field = updatedBehavior.fields[fieldName];
      if (field.type === "Numerical") {
        field.value = value;
        field.default = value;
      }
    }
    onUpdateBehavior(updatedBehavior);
  }
</script>

<div class="flex flex-col">
  <!-- Dynamically render all fields -->
  {#each Object.entries(behavior.fields) as [fieldName, field]}
    {#if field.type === "Numerical"}
      {@const numField = field}
      <CustomInput
        label={fieldName.toUpperCase()}
        min={numField.min}
        max={numField.max}
        step={numField.step}
        value={numField.default}
        defaultValue={numField.default}
        handleUpdate={(v) => updateField(fieldName, v)}
      />
    {:else if field.type === "GradientMap"}
      <GradientInputNode {behavior} {onUpdateBehavior} />
    {/if}
  {/each}
</div>
