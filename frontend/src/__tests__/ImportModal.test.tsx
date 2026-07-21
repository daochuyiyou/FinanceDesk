import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ImportModal from "../components/ImportModal";

describe("ImportModal Component", () => {
  it("should render without crashing when visible with columns", () => {
    const columns = [
      { title: "名称", dataIndex: "name", valueType: "text" },
    ];
    const { container } = render(
      <ImportModal
        open={true}
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        title="供应商导入"
        uploadUrl="/api/v1/overview/batch-import"
        columns={columns}
      />
    );
    expect(container).toBeDefined();
  });

  it("should pass onCancel callback", () => {
    const onCancel = vi.fn();
    render(
      <ImportModal
        open={true}
        onCancel={onCancel}
        onSuccess={vi.fn()}
        title="Cancel Test"
        uploadUrl="/api/v1/test"
        columns={[]}
      />
    );
    expect(onCancel).not.toHaveBeenCalled();
  });
});
