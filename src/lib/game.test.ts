import { describe, expect, it } from "vitest";
import {
  dueOn,
  isValidQuest,
  levelInfo,
  streak,
  validateQuest,
  type Completion,
  type Quest,
} from "./game";

const quest = (overrides: Partial<Quest> = {}): Quest => ({
  id: "q1",
  title: "Test quest",
  description: "",
  icon: "✨",
  category: "Health",
  difficulty: "Easy",
  xp: 10,
  duration: 5,
  frequency: "Daily",
  weekdays: [],
  startDate: "2026-01-01",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});
const completion = (date: string): Completion => ({
  id: date,
  questId: "q1",
  date,
  completedAt: `${date}T10:00:00.000Z`,
  xp: 10,
});

describe("progression rules", () => {
  it("calculates level boundaries deterministically", () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, current: 0, need: 100 });
    expect(levelInfo(100)).toMatchObject({ level: 2, current: 0, need: 150 });
    expect(levelInfo(250)).toMatchObject({ level: 3, current: 0, need: 200 });
  });

  it("counts one active day once and preserves the longest streak", () => {
    expect(
      streak([
        completion("2026-01-03"),
        completion("2026-01-02"),
        completion("2026-01-02"),
        completion("2026-01-01"),
      ]),
    ).toMatchObject({ longest: 3 });
  });
});

describe("scheduling rules", () => {
  it("supports weekday schedules without UTC shifting", () => {
    expect(dueOn(quest({ frequency: "Weekdays" }), "2026-01-05")).toBe(true);
    expect(dueOn(quest({ frequency: "Weekdays" }), "2026-01-04")).toBe(false);
    expect(
      dueOn(quest({ frequency: "Custom", weekdays: [0] }), "2026-01-04"),
    ).toBe(true);
  });

  it("evaluates a custom quest due on a selected weekday", () => {
    // 2026-01-05 is a Monday (day 1)
    const customQuest = quest({ frequency: "Custom", weekdays: [1] });
    expect(dueOn(customQuest, "2026-01-05")).toBe(true);
  });

  it("evaluates a custom quest not due on an unselected weekday", () => {
    // 2026-01-06 is a Tuesday (day 2), not included in weekdays: [1]
    const customQuest = quest({ frequency: "Custom", weekdays: [1] });
    expect(dueOn(customQuest, "2026-01-06")).toBe(false);
  });

  it("evaluates a custom quest with multiple selected weekdays", () => {
    // Monday (1), Wednesday (3), Friday (5)
    const mwfQuest = quest({ frequency: "Custom", weekdays: [1, 3, 5] });
    expect(dueOn(mwfQuest, "2026-01-05")).toBe(true); // Monday
    expect(dueOn(mwfQuest, "2026-01-06")).toBe(false); // Tuesday
    expect(dueOn(mwfQuest, "2026-01-07")).toBe(true); // Wednesday
    expect(dueOn(mwfQuest, "2026-01-08")).toBe(false); // Thursday
    expect(dueOn(mwfQuest, "2026-01-09")).toBe(true); // Friday
    expect(dueOn(mwfQuest, "2026-01-10")).toBe(false); // Saturday
    expect(dueOn(mwfQuest, "2026-01-11")).toBe(false); // Sunday
  });

  it("respects start-date and end-date boundaries for custom quests", () => {
    const boundedQuest = quest({
      frequency: "Custom",
      weekdays: [1, 3, 5],
      startDate: "2026-01-05", // Monday
      endDate: "2026-01-09", // Friday
    });

    // Before start date: 2026-01-02 is a Friday (day 5), but before startDate
    expect(dueOn(boundedQuest, "2026-01-02")).toBe(false);

    // On start date: 2026-01-05 is Monday (day 1), exactly startDate
    expect(dueOn(boundedQuest, "2026-01-05")).toBe(true);

    // Inside range: 2026-01-07 is Wednesday (day 3)
    expect(dueOn(boundedQuest, "2026-01-07")).toBe(true);

    // On end date: 2026-01-09 is Friday (day 5), exactly endDate
    expect(dueOn(boundedQuest, "2026-01-09")).toBe(true);

    // After end date: 2026-01-12 is Monday (day 1), but after endDate
    expect(dueOn(boundedQuest, "2026-01-12")).toBe(false);
  });
});

describe("quest validation rules", () => {
  it("prevents a custom quest with no selected weekdays from being saved", () => {
    expect(
      isValidQuest({ title: "Exercise", frequency: "Custom", weekdays: [] }),
    ).toBe(false);
    expect(
      validateQuest({ title: "Exercise", frequency: "Custom", weekdays: [] }),
    ).toEqual({
      valid: false,
      error: expect.any(String),
    });

    // Valid when at least one weekday is selected
    expect(
      isValidQuest({
        title: "Exercise",
        frequency: "Custom",
        weekdays: [1, 3, 5],
      }),
    ).toBe(true);
    expect(
      validateQuest({
        title: "Exercise",
        frequency: "Custom",
        weekdays: [1, 3, 5],
      }),
    ).toEqual({
      valid: true,
    });
  });

  it("allows standard frequencies without explicit weekdays", () => {
    expect(
      isValidQuest({ title: "Read", frequency: "Daily", weekdays: [] }),
    ).toBe(true);
    expect(
      isValidQuest({ title: "Code", frequency: "Weekdays", weekdays: [] }),
    ).toBe(true);
    expect(
      isValidQuest({ title: "Clean", frequency: "Weekly", weekdays: [] }),
    ).toBe(true);
  });

  it("rejects quests without a valid title", () => {
    expect(isValidQuest({ title: "", frequency: "Daily", weekdays: [] })).toBe(
      false,
    );
    expect(
      isValidQuest({ title: "   ", frequency: "Custom", weekdays: [1] }),
    ).toBe(false);
    expect(
      validateQuest({ title: "   ", frequency: "Daily", weekdays: [] }),
    ).toEqual({
      valid: false,
      error: expect.any(String),
    });
  });
});
