import { describe, it, expect } from "vitest";

describe("Service functions", () => {
  it("Service functions should be importable", async () => {
    const project = await import("../services/project");
    expect(typeof project.fetchProjects).toBe("function");
    expect(typeof project.createProject).toBe("function");
    const order = await import("../services/order");
    expect(typeof order.fetchOrders).toBe("function");
    const supplier = await import("../services/supplier");
    expect(typeof supplier.fetchSuppliers).toBe("function");
    const budget = await import("../services/budget");
    expect(typeof budget.fetchBudgets).toBe("function");
  });
});
