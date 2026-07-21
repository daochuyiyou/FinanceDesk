import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Service Layer", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("fetchProjects should call API", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ items: [], total: 0 }) });
    const { fetchProjects } = await import("../services/project");
    const result = await fetchProjects(1, 20);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/projects?page=1&page_size=20", expect.anything());
    expect(result.total).toBe(0);
  });

  it("createProject should POST", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, framework_name: "New" }) });
    const { createProject } = await import("../services/project");
    const result = await createProject({ framework_name: "New", contract_no: "CT-TEST-001", contract_type: "框架合同", owner_name: "测试业主", internal_or_external: "集团内" });
    expect(result.framework_name).toBe("New");
  });

  it("fetchOrders should call API", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ items: [], total: 0 }) });
    const { fetchOrders } = await import("../services/order");
    await fetchOrders(1, 20);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/orders?page=1&page_size=20", expect.anything());
  });

  it("fetchSuppliers should call API", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ items: [], total: 5 }) });
    const { fetchSuppliers } = await import("../services/supplier");
    const result = await fetchSuppliers(1, 20);
    expect(result.total).toBe(5);
  });

  it("fetchBudgets should call /budgets endpoint", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ items: [] }) });
    const { fetchBudgets } = await import("../services/budget");
    await fetchBudgets("1", 1, 20);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/projects/1/budgets?page=1&page_size=20", expect.anything());
  });

  it("fetchVendors should call API", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ items: [], total: 0 }) });
    const { fetchVendors } = await import("../services/vendor");
    await fetchVendors();
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/vendors?page=1&page_size=200", expect.anything());
  });

  it("should handle API errors", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: "Error", json: () => Promise.resolve({ detail: "Server error" }) });
    const { fetchProjects } = await import("../services/project");
    await expect(fetchProjects(1, 20)).rejects.toThrow("Server error");
  });
});
