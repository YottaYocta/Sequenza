<script lang="ts">
  import DraggableContainer from "./components/DraggableContainer.svelte";

  type Node = string;

  let nodes: Node[] = $state(["FirstNode", "SecondNode"]);
</script>

{#each nodes as node}
  <DraggableContainer children={node}></DraggableContainer>
{/each}
