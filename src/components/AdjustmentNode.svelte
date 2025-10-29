<script lang="ts">
  import type { ProccessingNode } from "../ProcessingNode";
  import type { Adjustment } from "../Adjustment";
  import CustomInput from "./CustomInput.svelte";

  const { nodeIndex, node, onUpdateBehavior } = $props<{
    nodeIndex: number;
    node: ProccessingNode<Adjustment>;
    onUpdateBehavior: (nodeIndex: number, behavior: Adjustment) => void;
  }>();

  function updateField(field: string, value: number) {
    onUpdateBehavior(nodeIndex, {
      ...node.behavior,
      [field]: value,
    } as Adjustment);
  }

  function switchType(type: "HSL" | "RGB") {
    if (type === "HSL") {
      onUpdateBehavior(nodeIndex, {
        type: "HSL",
        hue: 0,
        saturation: 0,
        lightness: 0,
      } as Adjustment);
    } else {
      onUpdateBehavior(nodeIndex, {
        type: "RGB",
        red: 0,
        green: 0,
        blue: 0,
      } as Adjustment);
    }
  }
</script>

<div class="flex flex-col">
  <!-- Tab Header -->
  <div class="flex border-b border-black gap-1 pb-8">
    <button
      class=" text-sm font-medium {node.behavior.type === 'HSL'
        ? 'bg-black text-white'
        : 'bg-transparent text-black  '}"
      onclick={() => switchType("HSL")}
    >
      HSL
    </button>
    <button
      class=" text-sm font-medium {node.behavior.type === 'RGB'
        ? 'bg-black text-white'
        : 'bg-transparent text-black  '}"
      onclick={() => switchType("RGB")}
    >
      RGB
    </button>
    <button
      class=" text-sm font-medium bg-transparent text-neutral-400"
      disabled
    >
      GRADIENTMAP
    </button>
  </div>

  <!-- Content Area -->
  <div class="py-4 flex flex-col">
    {#if node.behavior.type === "HSL"}
      <CustomInput
        label="HUE"
        min={-180}
        max={180}
        step={0.01}
        value={node.behavior.hue}
        defaultValue={0}
        handleUpdate={(v) => updateField("hue", v)}
      />

      <CustomInput
        label="SATURATION"
        min={0}
        max={1}
        step={0.01}
        value={node.behavior.saturation}
        defaultValue={0}
        handleUpdate={(v) => updateField("saturation", v)}
      />

      <CustomInput
        label="LIGHTNESS"
        min={-1}
        max={1}
        step={0.01}
        value={node.behavior.lightness}
        defaultValue={0}
        handleUpdate={(v) => updateField("lightness", v)}
      />
    {:else if node.behavior.type === "RGB"}
      <CustomInput
        label="RED"
        min={0}
        max={255}
        step={1}
        value={node.behavior.red}
        defaultValue={0}
        handleUpdate={(v) => updateField("red", v)}
      />

      <CustomInput
        label="GREEN"
        min={0}
        max={255}
        step={1}
        value={node.behavior.green}
        defaultValue={0}
        handleUpdate={(v) => updateField("green", v)}
      />

      <CustomInput
        label="BLUE"
        min={0}
        max={255}
        step={1}
        value={node.behavior.blue}
        defaultValue={0}
        handleUpdate={(v) => updateField("blue", v)}
      />
    {/if}
  </div>
</div>
