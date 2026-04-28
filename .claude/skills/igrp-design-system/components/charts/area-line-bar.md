# IGRPAreaChart, IGRPLineChart, IGRPBarChart

## Common Props (IGRPChartProps)

| Prop | Type | Description |
|------|------|-------------|
| `data` | `IGRPChartDataItem[]` | Chart data |
| `categoryKey` | `string` | Key for x-axis (e.g. 'month') |
| `title` | `string` | Chart title |
| `description` | `string` | Chart description |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'auto'` | Chart size |
| `legendPosition` | `'top' \| 'right' \| 'bottom' \| 'left' \| 'none'` | Legend position |
| `showGrid` | `boolean` | Show grid lines |
| `showTooltip` | `boolean` | Show tooltip |
| `stacked` | `boolean` | Stacked charts |
| `valueFormatter` | `(value: number) => string` | Format values |

## IGRPAreaChart

```tsx
<IGRPAreaChart
  data={data}
  categoryKey="month"
  areas={[{ dataKey: 'value', name: 'Sales', color: '#000' }]}
  stacked
  expanded
/>
```

## IGRPLineChart

```tsx
<IGRPLineChart
  data={data}
  categoryKey="month"
  lines={[{ dataKey: 'value', name: 'Sales', color: '#000' }]}
/>
```

## IGRPBarChart (Vertical / Horizontal)

```tsx
<IGRPVerticalBarChart 
  data={data} 
  categoryKey="month" 
  bars={[{ dataKey: 'value', color: '#000' }]} 
/>
```

## Important Note on Colors

**ALWAYS** use the `color` prop inside the `areas`, `lines`, or `bars` configuration objects to define the chart series color. Do **NOT** use the `stroke` prop.
