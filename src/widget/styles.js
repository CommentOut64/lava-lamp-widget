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
  flex: 6.5; /* Takes up most of the height */
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
  position: relative;
}

.lava-cap {
  flex: 0 0 15%; /* Top metallic cap */
  width: 100%;
  background: linear-gradient(90deg, #8a8d91 0%, #d5d7db 50%, #686b6e 100%);
  z-index: 2;
  box-shadow: inset 0 -4px 10px rgba(0,0,0,0.3);
}

.lava-glass {
  flex: 1; /* Fills the rest of the top section */
  min-height: 0;
  width: 100%;
  position: relative;
  background: rgba(255, 255, 255, 0.05); /* Slight glass tint */
  box-shadow: inset 0 0 15px rgba(255,255,255,0.1);
}

.lava-glass canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.lava-connector {
  flex: 1.5; /* Connector height ratio */
  min-height: 0;
  width: 100%;
  background: linear-gradient(90deg, #7c7f82 0%, #c4c6ca 50%, #5a5d60 100%);
  clip-path: polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3;
  margin-top: -1px; /* Overlap slightly to prevent pixel gaps */
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
  flex: 2; /* Base height ratio */
  min-height: 0;
  width: 100%;
  background: linear-gradient(90deg, #6e7174 0%, #b3b5b9 50%, #4c4f52 100%);
  clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
  margin-top: -1px; /* Overlap slightly */
}
`;
