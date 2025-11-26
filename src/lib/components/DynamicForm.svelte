<script lang="ts">
  import type { Behavior, BehaviorField } from "../processing/Behavior";
  import { cloneBehavior } from "../processing/Behavior";
  import SwitchInput from "./SwitchInput.svelte";
  import ValueInput from "./ValueInput.svelte";

  interface Props {
    behavior: Behavior;
    onUpdateBehavior: (behavior: Behavior) => void;
  }

  const { behavior, onUpdateBehavior }: Props = $props();

  function updateField(fieldName: string, value: BehaviorField) {
    const updatedBehavior = cloneBehavior(behavior);
    if (fieldName in updatedBehavior.fields) {
      updatedBehavior.fields[fieldName] = value;
    }
    onUpdateBehavior(updatedBehavior);
  }
</script>

<div class="flex flex-col">
  {#each Object.entries(behavior.fields) as [fieldName, field]}
    {#if field.type === "SwitchField"}
      {@const switchField = field}
      <SwitchInput
        label={fieldName}
        {switchField}
        handleUpdateField={(updatedSwitchField) =>
          updateField(fieldName, updatedSwitchField)}
      ></SwitchInput>
    {:else}
      <ValueInput
        {field}
        label={fieldName}
        handleUpdateField={(newField) => {
          updateField(fieldName, newField);
        }}
      ></ValueInput>
    {/if}
  {/each}
</div>
