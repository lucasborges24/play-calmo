jest.mock('@/db/client', () => ({ db: {}, schema: {} }));
jest.mock('@/db/queries/settings');

import { getPlanMarginBounds, pickVideosForPlan } from './planner';

function candidate(videoId: string, durationSeconds: number) {
  return { videoId, durationSeconds };
}

describe('getPlanMarginBounds', () => {
  it('returns correct lower/target/upper for 60-minute target', () => {
    const bounds = getPlanMarginBounds(60);
    expect(bounds.target).toBe(3600);
    expect(bounds.lower).toBe(Math.floor(3600 * 0.95));
    expect(bounds.upper).toBe(Math.ceil(3600 * 1.05));
  });

  it('clamps to 0 for non-positive input', () => {
    const bounds = getPlanMarginBounds(0);
    expect(bounds.target).toBe(0);
    expect(bounds.lower).toBe(0);
    expect(bounds.upper).toBe(0);
  });
});

describe('pickVideosForPlan', () => {
  it('returns empty plan when no candidates', () => {
    const { lower, target, upper } = getPlanMarginBounds(30);
    const { chosen, total } = pickVideosForPlan({ candidates: [], lower, target, upper });
    expect(chosen).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('picks a single candidate that fits within the target window', () => {
    const { lower, target, upper } = getPlanMarginBounds(30);
    const c = candidate('v1', target);
    const { chosen } = pickVideosForPlan({ candidates: [c], lower, target, upper });
    expect(chosen).toHaveLength(1);
    expect(chosen[0]?.videoId).toBe('v1');
  });

  it('keeps total within the ±5 % margin across many candidates', () => {
    const { lower, target, upper } = getPlanMarginBounds(60);
    const candidates = Array.from({ length: 20 }, (_, i) =>
      candidate(`v${i}`, 300 + i * 60),
    );
    const { total } = pickVideosForPlan({ candidates, lower, target, upper });
    expect(total).toBeGreaterThanOrEqual(lower);
    expect(total).toBeLessThanOrEqual(upper);
  });

  it('ignores a single candidate whose duration exceeds the upper bound', () => {
    const { lower, target, upper } = getPlanMarginBounds(10);
    const oversized = candidate('v1', upper + 1);
    const { chosen, total } = pickVideosForPlan({ candidates: [oversized], lower, target, upper });
    expect(chosen).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('selects a valid subset even when the full collection would exceed the upper bound', () => {
    const { lower, target, upper } = getPlanMarginBounds(5);
    // Each is 60 s; target ~300 s.  Fill with many to ensure the greedy
    // pass finds a subset rather than over-filling.
    const candidates = Array.from({ length: 30 }, (_, i) =>
      candidate(`v${i}`, 60),
    );
    const { total } = pickVideosForPlan({ candidates, lower, target, upper });
    expect(total).toBeLessThanOrEqual(upper);
    expect(total).toBeGreaterThan(0);
  });

  it('respects initialTotal when refilling a partial plan', () => {
    const { lower, target, upper } = getPlanMarginBounds(30);
    const alreadyFilled = 600;
    const candidates = Array.from({ length: 10 }, (_, i) =>
      candidate(`v${i}`, 300),
    );
    const { total } = pickVideosForPlan({
      candidates,
      initialTotal: alreadyFilled,
      lower,
      target,
      upper,
    });
    expect(total).toBeLessThanOrEqual(upper);
  });

  it('returns initialTotal unchanged when no candidate fits given remaining headroom', () => {
    const { upper } = getPlanMarginBounds(5);
    const initialTotal = upper - 10;
    const oversized = candidate('v1', 100);
    const { chosen, total } = pickVideosForPlan({
      candidates: [oversized],
      initialTotal,
      lower: 0,
      target: upper,
      upper,
    });
    expect(chosen).toHaveLength(0);
    expect(total).toBe(initialTotal);
  });
});
