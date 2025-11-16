<script lang="ts">
  import type { Behavior, BehaviorField } from "../core/Behavior";
  import { cloneBehavior } from "../core/Behavior";
  import CustomInput from "./CustomInput.svelte";
  import GradientInput from "./GradientInput.svelte";
  import OptionInput from "./OptionInput.svelte";
  import SwitchInput from "./SwitchInput.svelte";

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

  function updateSelectionField(fieldName: string, value: string) {
    const updatedBehavior = cloneBehavior(behavior);
    if (fieldName in updatedBehavior.fields) {
      const field = updatedBehavior.fields[fieldName];
      if (field.type === "SelectionField") {
        field.value = value;
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
        value={numField.value}
        defaultValue={numField.default}
        handleUpdate={(v) =>
          updateField(fieldName, {
            ...numField,
            value: v,
          })}
      />
    {:else if field.type === "GradientMap"}
      <GradientInput
        gradientField={field}
        onUpdateGradient={(newGradient) => updateField(fieldName, newGradient)}
      ></GradientInput>
    {:else if field.type === "SelectionField"}
      {@const SelectionField = field}
      <OptionInput
        label={fieldName.toUpperCase()}
        options={SelectionField.options}
        value={SelectionField.value}
        handleUpdate={(v) => updateSelectionField(fieldName, v)}
      />
    {:else if field.type === "SwitchField"}
      {@const switchField = field}
      <SwitchInput {fieldName} {switchField} {behavior} {onUpdateBehavior} />
    {/if}
  {/each}
</div>
