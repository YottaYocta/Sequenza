<script lang="ts">
  import { type BehaviorField, type SwitchField } from "../core/Behavior";
  import OptionInput from "./OptionInput.svelte";
  import SwitchInput from "./SwitchInput.svelte";
  import ValueInput from "./ValueInput.svelte";

  export interface Props {
    label?: string;
    switchField: SwitchField;
    handleUpdateField: (updatedField: SwitchField) => void;
  }

  const { label, switchField, handleUpdateField }: Props = $props();

  const currentField = $derived(switchField.currentField);

  const switchOptions = $derived(Object.keys(switchField.switchFields));
  const currentForm = $derived(switchField.switchFields[currentField] || {});

  const updateSelectedOption = (value: string) => {
    handleUpdateField({
      ...switchField,
      currentField: value,
    });
  };

  const updateSubfield = (
    option: string,
    fieldname: string,
    subField: BehaviorField
  ) => {
    const newFieldCollection = switchField.switchFields[option];
    if (newFieldCollection !== undefined) {
      newFieldCollection[fieldname] = subField;
      const updatedSwitchField = {
        ...switchField,
      };
      updatedSwitchField.switchFields[option] = newFieldCollection;
      handleUpdateField(updatedSwitchField);
    }
  };
</script>

<div class="flex flex-col gap-2 border-l-2 border-black pl-2">
  <OptionInput
    label={label ?? ":)"}
    options={switchOptions}
    value={switchField.currentField}
    handleSelectionUpdated={updateSelectedOption}
  />

  {#if currentForm}
    {#each Object.entries(currentForm) as [subfieldName, subField]}
      <div class="flex flex-col gap-1">
        {#if subField.type === "SwitchField"}
          <SwitchInput
            switchField={subField}
            handleUpdateField={(updatedSubfield) =>
              updateSubfield(currentField, subfieldName, updatedSubfield)}
          />
        {:else}
          <ValueInput
            field={subField}
            label={subfieldName}
            handleUpdateField={(updatedSubfield) =>
              updateSubfield(currentField, subfieldName, updatedSubfield)}
          />
        {/if}
      </div>
    {/each}
  {/if}
</div>
