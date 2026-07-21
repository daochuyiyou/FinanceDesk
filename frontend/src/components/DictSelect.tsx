/**
 * 通用字典下拉组件（DictSelect）
 *
 * 从后端 SysDictionary 读取选项，支持预设值 + 动态扩展。
 * 当用户选择"其他"或输入新值时，自动将新值存入字典。
 *
 * 用法:
 *   <DictSelect category="cost_type" {...formProps} />
 *   <DictSelect category="project_type" mode="create" />  ← 可输入新值
 */

import React, { useEffect, useState } from 'react';
import { Select, message } from 'antd';
import { api } from '../services/api';

interface DictItem {
  id: number;
  category: string;
  value: string;
  label: string | null;
  sort_order: number | null;
}

interface DictSelectProps {
  category: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  style?: React.CSSProperties;
  /** 是否允许输入自定义值（自动扩充字典） */
  mode?: 'select' | 'create';
}

const DictSelect: React.FC<DictSelectProps> = ({
  category,
  value,
  onChange,
  placeholder = '请选择',
  allowClear = true,
  style,
  mode = 'select',
}) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    api.get<{ items: DictItem[]; total: number }>(`/dict/${category}`)
      .then((res) => {
        setOptions(
          (res.items || []).map((item) => ({
            value: item.value,
            label: item.label || item.value,
          }))
        );
      })
      .catch(() => {
        message.error(`加载字典 "${category}" 失败`);
      })
      .finally(() => setLoading(false));
  }, [category]);

  const handleChange = (val: string) => {
    onChange?.(val);
  };

  // 可输入模式
  if (mode === 'create') {
    return (
      <Select
        showSearch
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        allowClear={allowClear}
        loading={loading}
        style={style}
        options={options}
        onSearch={(val) => {
          if (val && !options.find((o) => o.value === val)) {
            api.post(`/dict/${category}/ensure`, {
              category,
              value: val,
              label: val,
            }).catch(() => {
              message.error('保存自定义值失败');
            });
          }
        }}
      />
    );
  }

  return (
    <Select
      showSearch
      filterOption={(input, option) =>
        (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
      }
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      allowClear={allowClear}
      loading={loading}
      style={style}
      options={options}
    />
  );
};

export default DictSelect;
