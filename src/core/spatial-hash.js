export class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  key(x, y) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  insert(item) {
    const key = this.key(item.x, item.y);
    const bucket = this.cells.get(key) ?? [];
    bucket.push(item);
    this.cells.set(key, bucket);
  }

  query(point, radius) {
    const hits = [];
    const minGridX = Math.floor((point.x - radius) / this.cellSize);
    const maxGridX = Math.floor((point.x + radius) / this.cellSize);
    const minGridY = Math.floor((point.y - radius) / this.cellSize);
    const maxGridY = Math.floor((point.y + radius) / this.cellSize);

    for (let y = minGridY; y <= maxGridY; y++) {
      for (let x = minGridX; x <= maxGridX; x++) {
        const bucket = this.cells.get(`${x},${y}`);
        if (bucket) {
          for (const item of bucket) {
            const dx = item.x - point.x;
            const dy = item.y - point.y;
            if (dx * dx + dy * dy <= radius * radius) {
              hits.push(item);
            }
          }
        }
      }
    }
    return hits;
  }
}
