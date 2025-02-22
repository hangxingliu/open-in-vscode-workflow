export class Profiler {
  private prev: bigint;
  constructor() {
    this.prev = process.hrtime.bigint();
  }

  tick(msg?: string) {
    if (!msg) {
      this.prev = process.hrtime.bigint();
      return;
    }
    const now = process.hrtime.bigint();
    const diff = Number(now - this.prev) * 0.001;
    if (diff > 1000) console.error(`profiler: +${(diff * 0.001).toFixed(2)}ms ${msg}`);
    else console.error(`profiler: +${diff.toFixed(2)}µs ${msg}`);
    this.prev = now;
  }
}
