export const structureStyles = `
.lava-lamp-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
  /* Prevent inner elements from overflowing the overall shape if needed, 
     but clip-paths handle the exact outlines */
}

.lava-top-section {
  flex: 7; /* Increased to accommodate taller cap while keeping glass large */
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5; /* Lower than connector so glass slides behind connector */
}

.lava-cap {
  flex: 0 0 21.5%; /* Taller cap, takes up the newly added height of top-section */
  width: 100%;
  background: linear-gradient(to right, #4c4e52 0%, #6d7075 25%, #a8aab0 40%, #cfd1d6 50%, #a8aab0 60%, #6d7075 75%, #4c4e52 100%);
  z-index: 10;
  box-shadow: inset 0 -4px 6px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.5);
  position: relative;
  border-bottom-left-radius: 50% 5px;
  border-bottom-right-radius: 50% 5px;
  margin-bottom: -10px; /* Overlaps glass by 10px to hide flat edge */
}

.lava-glass {
  flex: 1; /* Fills the rest of the top section */
  min-height: 0;
  width: 100%;
  position: relative;
  z-index: 5;
  /* Flat rectangle, edges hidden by overlapping cap and connector */
  /* Glass light transmission texture: Curved arc-lights on the edges */
  background: 
    /* Left side white arc-light (brightest in middle, fades top/bottom) */
    radial-gradient(ellipse 5% 60% at 0% 35%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 100%),
    /* Right side white arc-light (brightest in middle, fades top/bottom) */
    radial-gradient(ellipse 5% 60% at 100% 35%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 100%);
}

.lava-glass::after {
  /* 3D Glass Edge Shading (Softened) */
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  box-shadow: inset 12px 0 20px rgba(0,0,0,0.4), inset -12px 0 20px rgba(0,0,0,0.4), inset 0 5px 10px rgba(0,0,0,0.15), inset 0 -5px 10px rgba(0,0,0,0.15);
  pointer-events: none;
  z-index: 5;
}

.lava-glass::before {
  /* Glass Surface Gloss / Reflection (Soft Front Lit) */
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: 20%; width: 60%;
  background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%);
  pointer-events: none;
  z-index: 10;
}

.lava-glass canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.lava-connector {
  flex: 1.2; /* Slightly compressed to compensate for taller cap */
  min-height: 0;
  width: 100%;
  background: linear-gradient(to right, #383a3d 0%, #5b5d63 25%, #94979e 40%, #bec1c7 50%, #94979e 60%, #5b5d63 75%, #383a3d 100%);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10; /* IN FRONT of the transparent glass */
  box-shadow: inset 0 4px 6px rgba(0,0,0,0.6), inset 0 -4px 6px rgba(0,0,0,0.8);
  margin-top: -10px; /* Slides UP over the glass by 10px to ensure zero gap */
  border-bottom-left-radius: 50% 5px;
  border-bottom-right-radius: 50% 5px;
  margin-bottom: -10px; /* Pulls base up to mate with ∪ seam */
  /* Concave ∪ shape at top, exposing the glass behind it */
  -webkit-mask-image: radial-gradient(ellipse 50% 5px at 50% 0px, transparent 100%, black 101%);
  mask-image: radial-gradient(ellipse 50% 5px at 50% 0px, transparent 100%, black 101%);
}

.lava-heart-emblem {
  height: 60%;
  fill: #a0a3a7;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.6));
}

.lava-heart-emblem path {
  stroke: #e0e2e5;
  stroke-width: 1px;
}

.lava-heart-inner {
  fill: #d5d7db;
}

.lava-base {
  flex: 1.8; /* Slightly compressed to compensate for taller cap */
  min-height: 0;
  width: 100%;
  background: linear-gradient(to right, #2a2c2e 0%, #4c4e52 25%, #85878d 40%, #aab0b5 50%, #85878d 60%, #4c4e52 75%, #2a2c2e 100%);
  position: relative;
  z-index: 6;
  box-shadow: inset 0 5px 10px rgba(0,0,0,0.8);
}
`;
