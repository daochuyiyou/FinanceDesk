/**
 * 通用长文本渲染器
 *
 * 用法:
 *   { title: '摘要', dataIndex: 'summary', render: renderLongText },
 *   // 或指定最大宽度
 *   { title: '备注', dataIndex: 'remark', render: (v) => renderLongText(v, 200) },
 */

import React from 'react';
import { Tooltip, Typography } from 'antd';

const { Paragraph } = Typography;

/**
 * 渲染可省略的长文本，悬浮时展示完整内容。
 * @param text    原始文本
 * @param maxWidth 最大宽度 px（默认 200）
 * @param maxRows  最多行数（默认 2）
 */
export function renderLongText(
  text: string | null | undefined,
  maxWidth: number = 200,
  maxRows: number = 2,
): React.ReactNode {
  if (!text) return '-';
  const str = String(text);
  if (str.length <= 20) return str; // 短文本直接返回

  return (
    <Tooltip title={str} mouseEnterDelay={0.3}>
      <Paragraph
        ellipsis={{ rows: maxRows, expandable: false }}
        style={{
          margin: 0,
          maxWidth,
          color: 'inherit',
        }}
      >
        {str}
      </Paragraph>
    </Tooltip>
  );
}
