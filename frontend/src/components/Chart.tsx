import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  option: any;
  style?: React.CSSProperties;
}

const ChartComponent: React.FC<ChartProps> = ({ option, style = { height: 400 } }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  useEffect(() => {
    if (chartRef.current && !instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current);
    }
    return () => { instanceRef.current?.dispose(); instanceRef.current = null; };
  }, []);
  useEffect(() => { instanceRef.current?.setOption(option, true); }, [option]);
  useEffect(() => {
    const h = () => instanceRef.current?.resize();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return <div ref={chartRef} style={style} />;
};

export default ChartComponent;
