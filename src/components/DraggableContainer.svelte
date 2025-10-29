<script lang="ts">
  let x = $state(0);
  let y = $state(0);
  let tracking = $state(true);

  const { children } = $props();

  const handleMouseDown = () => {
    tracking = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (tracking) {
      x = e.clientX;
      y = e.clientY;
    }
  };

  const handleMouseUp = () => {
    tracking = false;
  };
</script>

<div
  style={`position: absolute; left: ${x}px; top: ${y}px; transform: translateX(-50%) translateY(-50%);`}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  role="button"
  tabindex="0"
  class="w-32 h-32 border border-neutral-900"
>
  <p class="select-none">
    {children}
  </p>
</div>
