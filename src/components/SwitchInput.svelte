<script lang="ts">
  import type { Behavior, SwitchField, GradientField } from "../core/Behavior";
  import { cloneBehavior } from "../core/Behavior";
  import CustomInput from "./CustomInput.svelte";
  import GradientInput from "./GradientInput.svelte";
  import OptionInput from "./OptionInput.svelte";
  import SwitchInput from "./SwitchInput.svelte";

  interface Props {
    fieldName: string;
    switchField: SwitchField;
    behavior: Behavior;
    onUpdateBehavior: (behavior: Behavior) => void;
  }

  const { fieldName, switchField, behavior, onUpdateBehavior }: Props =
    $props();

  const switchOptions = $derived(Object.keys(switchField.switchFields));
  const currentOptions = $derived(
    switchField.switchFields[switchField.currentField] || {}
  );

  function updateCurrentField(newCurrentField: string) {
    const updatedBehavior = cloneBehavior(behavior);
    const field = updatedBehavior.fields[fieldName];
    if (field && field.type === "SwitchField") {
      field.currentField = newCurrentField;
    }
    onUpdateBehavior(updatedBehavior);
  }

  function updateSubField(optionKey: string, newValue: number | string) {
    const updatedBehavior = cloneBehavior(behavior);
    const field = updatedBehavior.fields[fieldName];
    if (field && field.type === "SwitchField") {
      const subField = field.switchFields[field.currentField][optionKey];
      if (subField.type === "Numerical") {
        subField.value = newValue as number;
        subField.default = newValue as number;
      } else if (subField.type === "SelectionField") {
        subField.value = newValue as string;
      }
    }
    onUpdateBehavior(updatedBehavior);
  }

  function updateGradientField(optionKey: string, updatedGradient: GradientField) {
    const updatedBehavior = cloneBehavior(behavior);
    const field = updatedBehavior.fields[fieldName];
    if (field && field.type === "SwitchField") {
      field.switchFields[field.currentField][optionKey] = updatedGradient;
    }
    onUpdateBehavior(updatedBehavior);
  }
</script>

<div class="flex flex-col gap-2 border-l-2 border-black pl-2">
  <OptionInput
    label={fieldName.toUpperCase()}
    options={switchOptions}
    value={switchField.currentField}
    handleUpdate={updateCurrentField}
  />

  {#if currentOptions}
    {#each Object.entries(currentOptions) as [optionKey, subField]}
      <div class="flex flex-col gap-1">
        {#if subField.type === "Numerical"}
          <CustomInput
            label={optionKey.toUpperCase()}
            min={subField.min}
            max={subField.max}
            step={subField.step}
            value={subField.value}
            defaultValue={subField.default}
            handleUpdate={(v) => updateSubField(optionKey, v)}
          />
        {:else if subField.type === "SelectionField"}
          <OptionInput
            label={optionKey.toUpperCase()}
            options={subField.options}
            value={subField.value}
            handleUpdate={(v) => updateSubField(optionKey, v)}
          />
        {:else if subField.type === "GradientMap"}
          <GradientInput
            gradientField={subField}
            onUpdateGradient={(newGradient) => updateGradientField(optionKey, newGradient)}
          />
        {:else if subField.type === "SwitchField"}
          <SwitchInput
            fieldName={optionKey}
            switchField={subField}
            {behavior}
            {onUpdateBehavior}
          />
        {/if}
      </div>
    {/each}
  {/if}
</div>
