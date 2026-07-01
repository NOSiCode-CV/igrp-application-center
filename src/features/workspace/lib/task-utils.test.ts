import { describe, expect, it } from "vitest";

import type { Task } from "../types";
import { computeTaskStats, getDueDateLabel, getGreeting } from "./task-utils";

function makeDate(h: number) {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(17, 0, 0, 0);
  return d;
}

describe("getGreeting", () => {
  it("returns morning for hour < 12", () => {
    expect(getGreeting(makeDate(8))).toBe("Good morning");
  });
  it("returns afternoon for 12 <= hour < 19", () => {
    expect(getGreeting(makeDate(14))).toBe("Good afternoon");
  });
  it("returns evening for hour >= 19", () => {
    expect(getGreeting(makeDate(20))).toBe("Good evening");
  });
});

describe("getDueDateLabel", () => {
  it("marks overdue when dueDate is in the past", () => {
    const result = getDueDateLabel(daysFromNow(-2));
    expect(result.color).toBe("red");
    expect(result.label).toMatch(/overdue/i);
  });
  it("marks today when dueDate is today", () => {
    const result = getDueDateLabel(daysFromNow(0));
    expect(result.color).toBe("amber");
    expect(result.label).toBe("Due today");
  });
  it("marks tomorrow", () => {
    const result = getDueDateLabel(daysFromNow(1));
    expect(result.color).toBe("normal");
    expect(result.label).toBe("Due tomorrow");
  });
  it("marks future days", () => {
    const result = getDueDateLabel(daysFromNow(5));
    expect(result.color).toBe("normal");
    expect(result.label).toBe("Due in 5 days");
  });
});

describe("computeTaskStats", () => {
  const now = new Date();

  function taskWith(overrides: Partial<Task>): Task {
    return {
      id: "1",
      ticketCode: "T-001",
      category: "Test",
      title: "Test task",
      requester: "User",
      submittedAt: new Date(),
      attachmentCount: 0,
      priority: "NORMAL",
      dueDate: daysFromNow(10),
      status: "assigned",
      ...overrides,
    };
  }

  it("counts overdue tasks (priority OVERDUE)", () => {
    const tasks = [
      taskWith({ id: "1", priority: "OVERDUE", status: "assigned" }),
      taskWith({ id: "2", priority: "HIGH", status: "assigned" }),
    ];
    expect(computeTaskStats(tasks).overdueCount).toBe(1);
  });

  it("counts due today", () => {
    const today = new Date();
    today.setHours(17, 0, 0, 0);
    const tasks = [
      taskWith({ id: "1", dueDate: today, status: "assigned" }),
      taskWith({ id: "2", dueDate: daysFromNow(3), status: "assigned" }),
    ];
    expect(computeTaskStats(tasks).dueTodayCount).toBe(1);
  });

  it("counts total pending (non-completed)", () => {
    const tasks = [
      taskWith({ id: "1", status: "assigned" }),
      taskWith({ id: "2", status: "candidate" }),
      taskWith({ id: "3", status: "completed" }),
    ];
    expect(computeTaskStats(tasks).totalPending).toBe(2);
  });

  it("counts completed", () => {
    const tasks = [
      taskWith({ id: "1", status: "completed" }),
      taskWith({ id: "2", status: "assigned" }),
    ];
    const stats = computeTaskStats(tasks);
    expect(stats.completedCount).toBe(1);
    expect(stats.total).toBe(2);
  });
});
