import React from 'react';
import { Area, Line } from 'recharts';
import { formatNumber } from '../format/formatters';
import type { WeightUnit } from '../storage/localStorage';

export {
  RECHARTS_XAXIS_PADDING,
  getRechartsCategoricalTicks,
  getRechartsTickIndexMap,
  getRechartsTickIndices,
  getRechartsXAxisInterval,
} from './rechartsAxis';


export const IndexFilteredDot = (props: any) => {
  const {
    cx,
    cy,
    index,
    showAtIndexMap,
    r = 3,
    fill = 'var(--text-muted)',
    stroke = fill,
    strokeWidth = 1,
  } = props;

  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

  const hasIndexMap = showAtIndexMap && typeof showAtIndexMap === 'object';
  if (hasIndexMap && !showAtIndexMap[index]) return null;

  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
};


// Custom dot component to show values above data points
export const ValueDot = (props: any) => {
  const {
    cx,
    cy,
    payload,
    index,
    data,
    valueKey,
    unit,
    showAtIndexMap,
    showEveryOther = true,
    everyNth,
    showDotWhenHidden = true,
    color = "var(--text-muted)",
  } = props;
  
  if (!payload) return null;
  
  const value = payload[valueKey];
  if (typeof value !== 'number') return null;
  
  const n = Array.isArray(data) ? data.length : 0;
  const step = Number.isFinite(everyNth) && everyNth > 0 ? everyNth : showEveryOther ? 2 : 1;
  const shouldShowByIndexMap = showAtIndexMap && typeof showAtIndexMap === 'object' ? !!showAtIndexMap[index] : null;
  const shouldShowLabel =
    shouldShowByIndexMap !== null
      ? (shouldShowByIndexMap || index === n - 1 || index === 0)
      : (step <= 1 || index % step === 0 || index === n - 1 || index === 0);
  
  if (!shouldShowLabel) {
    if (!showDotWhenHidden) return null;
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={3} 
        fill={color} 
        stroke={color} 
        strokeWidth={1}
      />
    );
  }
  
  const displayValue = unit 
    ? `${formatNumber(value, { maxDecimals: 1 })}${unit}`
    : (Number.isInteger(value) ? value.toString() : formatNumber(value, { maxDecimals: 1 }));
  
  return (
    <g>
      <circle 
        cx={cx} 
        cy={cy} 
        r={3} 
        fill={color} 
        stroke={color} 
        strokeWidth={1}
      />
      <text
        x={cx}
        y={cy - 10}
        fill={color}
        fontSize={9}
        fontWeight="bold"
        textAnchor="middle"
      >
        {displayValue}
      </text>
    </g>
  );
};

// Enhanced Area chart component with value dots
export const EnhancedAreaChart = ({ 
  dataKey, 
  valueKey, 
  unit, 
  showEveryOther = true,
  ...props 
}: any) => {
  return (
    <>
      {/* Main area without dots */}
      <Area
        {...props}
        dataKey={dataKey}
        dot={false}
      />
      
      {/* Separate line with value dots */}
      <Line
        type="monotone"
        dataKey={valueKey}
        stroke="transparent"
        strokeWidth={0}
        dot={<ValueDot valueKey={valueKey} unit={unit} showEveryOther={showEveryOther} data={props.data} />}
        activeDot={{ r: 5, strokeWidth: 0 }}
        isAnimationActive={true}
        animationDuration={1000}
      />
    </>
  );
};

// Enhanced Line chart component with value dots
export const EnhancedLineChart = ({ 
  valueKey, 
  unit, 
  showEveryOther = true,
  ...props 
}: any) => {
  return (
    <Line
      {...props}
      dot={<ValueDot valueKey={valueKey} unit={unit} showEveryOther={showEveryOther} data={props.data} />}
      activeDot={{ r: 5, strokeWidth: 0 }}
    />
  );
};
