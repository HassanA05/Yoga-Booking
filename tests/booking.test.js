// tests/booking.test.js
import { describe, expect, test } from "@jest/globals";

// Pure unit test — tests the capacity logic in isolation
const canReserveAllSessions = (sessions) =>
  sessions.every((s) => (s.bookedCount ?? 0) < (s.capacity ?? 0));

describe("canReserveAllSessions", () => {
  test("returns true when all sessions have remaining capacity", () => {
    const sessions = [
      { capacity: 10, bookedCount: 9 },
      { capacity: 20, bookedCount: 0 },
    ];
    expect(canReserveAllSessions(sessions)).toBe(true);
  });

  test("returns false when any session is exactly full", () => {
    const sessions = [
      { capacity: 10, bookedCount: 10 },
      { capacity: 20, bookedCount: 0 },
    ];
    expect(canReserveAllSessions(sessions)).toBe(false);
  });

  test("returns false when any session is overbooked", () => {
    const sessions = [
      { capacity: 10, bookedCount: 11 },
      { capacity: 20, bookedCount: 0 },
    ];
    expect(canReserveAllSessions(sessions)).toBe(false);
  });

  test("treats undefined bookedCount as 0", () => {
    const sessions = [{ capacity: 10 }, { capacity: 20, bookedCount: 5 }];
    expect(canReserveAllSessions(sessions)).toBe(true);
  });

  test("returns true for a single session with capacity remaining", () => {
    expect(canReserveAllSessions([{ capacity: 1, bookedCount: 0 }])).toBe(true);
  });

  test("returns false for a single full session", () => {
    expect(canReserveAllSessions([{ capacity: 1, bookedCount: 1 }])).toBe(false);
  });

  test("returns true for empty sessions array", () => {
    expect(canReserveAllSessions([])).toBe(true);
  });
});
