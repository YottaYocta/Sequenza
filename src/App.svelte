<script lang="ts">
  import { onMount } from "svelte";
  import DraggableContainer from "./components/DraggableContainer.svelte";

  type Node = string;

  let nodes: Node[] = $state(["FirstNode", "SecondNode"]);

  onMount(() => {
    const interval = setInterval(() => {
      nodes[0] = Date.now().toString();
      nodes[1] = Date.now().toString();
    });
    return () => {
      clearInterval(interval);
    };
  });
</script>

{#each nodes as node}
  <DraggableContainer children={node}></DraggableContainer>
{/each}
