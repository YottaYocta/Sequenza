<script lang="ts">
  type MidPassFilter = {
    // filter value that returns true for all values in between low and high and false otherwise (low and high are clamped to 0 to 1)
    low: number;
    high: number;
  };

  interface DotsSettings {
    offsetX: number;
    offsetY: number;
    dotRadius: number;
    gapX: number; // horizontal separation
    gapY: number; // vertical separation
    borderRadius: number; // clamped to -1 to 1, with 0 being no corners (creates pixels) and 1 being equal to the dotRadius (fully rounded). -1 corresponds to a star shape (four pointed star; a circle but with edges concave, leaving 4 points)
    // controls the rotation of each Dot individually
    rotation: number;
  }
</script>

<main
  class="w-screen overflow-x-hidden h-screen overflow-y-hidden bg-neutral-200 flex flex-row gap-8 p-16 justify-center items-stretch text-neutral-600"
>
  <div
    class="w-full h-full bg-neutral-100 border border-neutral-50 rounded-sm flex flex-col p-4 gap-4"
  >
    <!-- intially, this should be a div with the text 'upload image' in the middle -->
    <!-- uploading an image should display it in the canvas -->
    <canvas class="w-full h-full bg-blue-600"></canvas>
    <div class="w-full p-4 flex gap-4 h-24">
      <!-- these controls should allow the user to modify the image (source still maintained in memory). if somethign is changed, show a button with text 'revert' -->
      <div class="w-36">
        <label for="hue">Hue</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="hue"
          defaultValue="0.5"
          step="0.01"
        />
      </div>
      <div class="w-36">
        <label for="hue">Saturation</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="Saturation"
          defaultValue="0.5"
          step="0.01"
        />
      </div>
      <div class="w-36">
        <label for="hue">Value</label>
        <input
          class="w-full"
          type="range"
          min="0"
          max="1"
          name="Value"
          defaultValue="0.5"
          step="0.01"
        />
      </div>
    </div>
  </div>
  <div
    class="w-full h-full bg-neutral-100 border border-neutral-50 rounded-sm flex flex-col p-4 gap-4"
  >
    <!-- this field should use the modified image to generate a matching svg-->
    <svg class="w-full h-full bg-blue-600"></svg>
    <div class="h-24 w-full flex flex-col gap-4">
      <p>Effects</p>
      <ul class="flex gap-4">
        <!-- make selection; selecting one of these will affect what is rendered -->
        <!-- choosing dots will open up a menu in the the top right hand side of the canvas (use abs pos to overlay) that controls settings. the algorithm is as follows. use the size-->
        <li>Dots</li>
        <!-- future features; ignore for now -->
        <li>Bands</li>
        <li>Particles</li>
        <li>Ascii</li>
      </ul>
    </div>
  </div>
</main>
