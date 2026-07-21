import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { api, ApiError } from "../services/api";

describe("API Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should export CRUD methods", () => {
    expect(api).toBeDefined();
    expect(typeof api.get).toBe("function");
    expect(typeof api.post).toBe("function");
    expect(typeof api.patch).toBe("function");
    expect(typeof api.delete).toBe("function");
  });

  it("GET should build correct URL with params", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) });
    await api.get("/orders", { project_id: "1", page: 1, page_size: 20 });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/orders?project_id=1&page=1&page_size=20",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("GET should skip undefined params", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) });
    await api.get("/projects", { page: 1, project_id: undefined });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/projects?page=1",
      expect.anything()
    );
  });

  it("POST should send JSON body and Content-Type header", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve({ id: 1 }) });
    await api.post("/projects", { name: "test" });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/projects",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      })
    );
  });

  it("GET with no body should not send Content-Type", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) });
    await api.get("/projects");
    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers).toBeUndefined();
  });

  it("PATCH should send partial update", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 1, name: "updated" }) });
    const result = await api.patch("/projects/1", { name: "updated" });
    expect(result.name).toBe("updated");
  });

  it("DELETE should return undefined on 204", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, json: () => { throw new Error("no content"); } });
    const result = await api.delete("/projects/1");
    expect(result).toBeUndefined();
  });

  it("should throw ApiError with detail message on 404", async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 404, statusText: "Not Found",
      json: () => Promise.resolve({ detail: "项目不存在" }),
    });
    await expect(api.get("/projects/99999")).rejects.toThrow("项目不存在");
    await expect(api.get("/projects/99999")).rejects.toBeInstanceOf(ApiError);
  });

  it("should throw ApiError with status code", async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 422, statusText: "Unprocessable",
      json: () => Promise.resolve({ detail: "参数校验失败" }),
    });
    try {
      await api.post("/projects", {});
    } catch (e: any) {
      expect(e.status).toBe(422);
    }
  });

  it("should handle detail as object by stringifying", async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 400,
      json: () => Promise.resolve({ detail: [{ field: "name", msg: "required" }] }),
    });
    await expect(api.post("/projects", {})).rejects.toThrow(/field.*name/);
  });

  it("should use statusText when json parse fails on error", async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("invalid json")),
    });
    await expect(api.get("/projects")).rejects.toThrow("Internal Server Error");
  });

  it("should reject on network error", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api.get("/projects")).rejects.toThrow(Error);
  });
});
