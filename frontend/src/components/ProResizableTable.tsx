/**
 * ProResizableTable —— 全局可复用拖拽表格组件。
 *
 * 基于 Ant Design Table + react-resizable。
 *
 * 特性:
 *   1. 表头边界可拖拽调整列宽
 *   2. 默认注入 scroll={{ x: 'max-content' }} 杜绝列挤压
 *   3. 保持 Ant Design ProTable 风格 API
 *
 * 用法:
 *   import ProResizableTable from '../components/ProResizableTable';
 *
 *   <ProResizableTable
 *     rowKey="id"
 *     columns={columns}
 *     dataSource={data}
 *     loading={loading}
 *     pagination={{ pageSize: 20 }}
 *   />
 *
 *   // 列定义中可通过 onHeaderCell 自定义宽度
 *   const columns = [
 *     { title: '摘要', dataIndex: 'summary', width: 200, ... },
 *   ];
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Table } from 'antd';
import type { ColumnType, TableProps } from 'antd/es/table';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';

// ── Resizable Title（表头拖拽手柄） ──────────────────────────

interface ResizableTitleProps {
  onResize: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
  width: number;
  [key: string]: any;
}

const ResizableTitle: React.FC<ResizableTitleProps> = (props) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} style={{ ...restProps.style, position: 'relative' }} />
    </Resizable>
  );
};

// ── ProResizableTable ────────────────────────────────────────

interface ProResizableTableProps<T extends object> extends Omit<TableProps<T>, 'columns'> {
  columns: ColumnType<T>[];
  /** 默认列宽（未指定 width 的列使用此值） */
  defaultColumnWidth?: number;
}

function ProResizableTable<T extends object = any>({
  columns,
  defaultColumnWidth = 150,
  scroll,
  ...restProps
}: ProResizableTableProps<T>) {
  // 维护列宽状态
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  // 生成带拖拽的列配置
  const resizableColumns = columns.map((col, index) => {
    const dataIndex = String(col.dataIndex ?? col.key ?? index);
    const currentWidth = colWidths[dataIndex] ?? (col.width as number) ?? defaultColumnWidth;

    return {
      ...col,
      width: currentWidth,
      onHeaderCell: (): React.HTMLAttributes<HTMLElement> => ({
        width: currentWidth,
        onResize: (e: React.SyntheticEvent, { size }: ResizeCallbackData) => {
          setColWidths((prev) => ({ ...prev, [dataIndex]: size.width }));
        },
      }) as any,
    };
  });

  // 自定义表头组件
  const components = {
    header: {
      cell: ResizableTitle,
    },
  };

  return (
    <Table<T>
      {...restProps}
      columns={resizableColumns as any}
      components={components}
      scroll={scroll ?? { x: 'max-content' }}
      size="small"
    />
  );
}

export default ProResizableTable;
