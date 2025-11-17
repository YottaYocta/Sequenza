<script lang="ts">
  import type { ValueField } from "../core/Behavior";
  import CustomInput from "./CustomInput.svelte";
  import GradientInput from "./GradientInput.svelte";
  import OptionInput from "./OptionInput.svelte";

  interface Props {
    field: ValueField;
    label?: string;
    handleUpdateField: (updatedField: ValueField) => any;
  }

  const { field, label = ": )", handleUpdateField }: Props = $props();
</script>

{#if field.type === "Numerical"}
  {@const numField = field}
  <CustomInput
    {label}
    min={numField.min}
    max={numField.max}
    step={numField.step}
    value={numField.value}
    defaultValue={numField.default}
    handleUpdate={(v) =>
      handleUpdateField({
        ...numField,
        value: v,
      })}
  />
{:else if field.type === "GradientMap"}
  <GradientInput gradientField={field} onUpdateGradient={handleUpdateField}
  ></GradientInput>
{:else if field.type === "SelectionField"}
  {@const SelectionField = field}
  <OptionInput
    {label}
    options={SelectionField.options}
    value={SelectionField.value}
    handleSelectionUpdated={(newSelection) => {
      handleUpdateField({
        ...field,
        value: newSelection,
      });
    }}
  />
{/if}
