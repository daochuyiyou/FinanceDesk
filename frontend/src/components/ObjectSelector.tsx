/**
 * ObjectSelector — 从 /dashboard/objects 获取真实业务对象列表
 */
import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { api } from '../services/api';

interface ObjectOption {
  value: string;
  label: string;
}

interface ObjectSelectorProps {
  dimension: string;
  value: string | null;
  onChange: (id: string | null) => void;
}

export function ObjectSelector({ dimension, value, onChange }: ObjectSelectorProps) {
  const [options, setOptions] = useState<ObjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const disabled = dimension === 'company';

  useEffect(() => {
    if (dimension === 'company') {
      setOptions([]);
      return;
    }
    setLoading(true);
    api.get<ObjectOption[]>(`/dashboard/objects?dimension=${dimension}`)
      .then(data => setOptions(data || []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [dimension]);

  return (
    <Select
      showSearch
      filterOption={(input, option) =>
        (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
      }
      value={value || undefined}
      onChange={(val) => onChange(val || null)}
      disabled={disabled || loading}
      loading={loading}
      placeholder={dimension === 'company' ? '全部' : '请选择...'}
      style={{
        minWidth: 200,
      }}
      options={[
        { value: '', label: dimension === 'company' ? '全部' : '请选择...' },
        ...options,
      ]}
    />
  );
}
