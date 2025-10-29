<script lang="ts">
  import type { ProccessingNode } from "../ProcessingNode";
  import type { Adjustment } from "../Adjustment";

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
</script>

<div class="flex flex-col gap-2">
  <h3 class="font-bold mb-4">Adjustment - {node.behavior.type}</h3>

  {#if node.behavior.type === "HSL"}
    <div class="flex flex-col gap-1">
      <label class="flex text-nowrap items-center">
        <span class="text-sm">Hue</span>
        <input
          type="range"
          min="-180"
          max="180"
          value={node.behavior.hue}
          oninput={(e) => updateField("hue", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.hue}</span>
      </label>

      <label class="flex text-nowrap items-center">
        <span class="text-sm">Saturation</span>
        <input
          type="range"
          min="-100"
          max="100"
          value={node.behavior.saturation}
          oninput={(e) =>
            updateField("saturation", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.saturation}</span>
      </label>

      <label class="flex text-nowrap items-center">
        <span class="text-sm">Lightness</span>
        <input
          type="range"
          min="-100"
          max="100"
          value={node.behavior.lightness}
          oninput={(e) =>
            updateField("lightness", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.lightness}</span>
      </label>
    </div>
  {:else if node.behavior.type === "RGB"}
    <div class="space-y-3">
      <label class="flex text-nowrap items-center">
        <span class="text-sm">Red</span>
        <input
          type="range"
          min="0"
          max="255"
          value={node.behavior.r}
          oninput={(e) => updateField("r", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.r}</span>
      </label>

      <label class="flex text-nowrap items-center">
        <span class="text-sm">Green</span>
        <input
          type="range"
          min="0"
          max="255"
          value={node.behavior.green}
          oninput={(e) => updateField("green", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.green}</span>
      </label>

      <label class="flex text-nowrap items-center">
        <span class="text-sm">Blue</span>
        <input
          type="range"
          min="0"
          max="255"
          value={node.behavior.blue}
          oninput={(e) => updateField("blue", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.blue}</span>
      </label>
    </div>
  {/if}

  <div class="mt-4 text-xs text-neutral-500">
    Progress: {Math.round(node.progress * 100)}%
  </div>
</div>
