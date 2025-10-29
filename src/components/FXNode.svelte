<script lang="ts">
  import type { ProccessingNode } from "../ProcessingNode";
  import type { FX } from "../FX";

  const { nodeIndex, node, onUpdateBehavior } = $props<{
    nodeIndex: number;
    node: ProccessingNode<FX>;
    onUpdateBehavior: (nodeIndex: number, behavior: FX) => void;
  }>();

  function updateField(field: string, value: number) {
    onUpdateBehavior(nodeIndex, { ...node.behavior, [field]: value } as FX);
  }

  function updateFilterField(field: "low" | "high", value: number) {
    onUpdateBehavior(nodeIndex, {
      ...node.behavior,
      filter: { ...node.behavior.filter, [field]: value },
    } as FX);
  }
</script>

<div class="flex flex-col gap-4 w-56">
  <h3 class="font-bold text-nowrap">FX - {node.behavior.type}</h3>

  <p>
    Progress: {Math.round(node.progress * 100)}%
  </p>
  {#if node.behavior.type === "dot"}
    <div class="flex flex-col gap-1">
      <label class="flex gap-2 items-center">
        <span class="text-sm w-32 text-nowrap">Horizontal Count</span>
        <input
          type="range"
          min="1"
          max="100"
          value={node.behavior.horizontalCount}
          oninput={(e) =>
            updateField("horizontalCount", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.horizontalCount}</span>
      </label>

      <label class="flex gap-2 items-center">
        <span class="text-sm w-32 text-nowrap">Vertical Count</span>
        <input
          type="range"
          min="1"
          max="100"
          value={node.behavior.verticalCount}
          oninput={(e) =>
            updateField("verticalCount", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.verticalCount}</span>
      </label>

      <label class="flex gap-2 items-center">
        <span class="text-sm w-32 text-nowrap">Dot Radius</span>
        <input
          type="range"
          min="1"
          max="50"
          value={node.behavior.dotRadius}
          oninput={(e) =>
            updateField("dotRadius", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.dotRadius}</span>
      </label>

      <label class="flex gap-2 items-center">
        <span class="text-sm w-32 text-nowrap">Border Radius</span>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          value={node.behavior.borderRadius}
          oninput={(e) =>
            updateField("borderRadius", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.borderRadius.toFixed(1)}</span>
      </label>

      <label class="flex gap-2 items-center">
        <span class="text-sm w-32 text-nowrap">Rotation</span>
        <input
          type="range"
          min="0"
          max="360"
          value={node.behavior.rotation}
          oninput={(e) =>
            updateField("rotation", Number(e.currentTarget.value))}
          class="w-full"
        />
        <span class="text-xs">{node.behavior.rotation}°</span>
      </label>

      <div class="border-t pt-3 mt-3">
        <h4 class="text-sm text-nowrap font-semibold mb-2">Filter</h4>

        <label class="flex gap-2 items-center">
          <span class="text-sm w-32 text-nowrap">Low</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={node.behavior.filter.low}
            oninput={(e) =>
              updateFilterField("low", Number(e.currentTarget.value))}
            class="w-full"
          />
          <span class="text-xs">{node.behavior.filter.low.toFixed(2)}</span>
        </label>

        <label class="flex gap-2 items-center">
          <span class="text-sm w-32 text-nowrap">High</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={node.behavior.filter.high}
            oninput={(e) =>
              updateFilterField("high", Number(e.currentTarget.value))}
            class="w-full"
          />
          <span class="text-xs">{node.behavior.filter.high.toFixed(2)}</span>
        </label>
      </div>
    </div>
  {/if}
</div>
