# IGRPPieChart, IGRPRadarChart, IGRPRadialBarChart

## IGRPPieChart

```tsx
<IGRPPieChart
  data={data}
  categoryKey="name"
  nameKey="name"
  pies={[{ dataKey: 'value', name: 'Sales', showLabels: true }]}
  title="Distribution"
/>
```

## Props for Pie, Radar, Radial

| Prop | Type | Chart Type | Description |
|------|------|------------|-------------|
| `data` | `any[]` | All | Data array |
| `categoryKey` | `string` | All | **Required.** Base category key for mapping data. |
| `nameKey` | `string` | Pie | **Required.** Key for data labels/legend items. |
| `pies` | `PieConfig[]` | Pie | Configuration for pie series |
| `radars` | `RadarConfig[]` | Radar | Configuration for radar series |
| `radials` | `RadialConfig[]` | Radial | Configuration for radial series |
| `centerLabel` | `{ show: boolean; text?: string }` | Pie | Show total/text in center |
| `interactive` | `boolean` | Pie | Enable hover effects |

## IGRPRadarChart

```tsx
<IGRPRadarChart
  data={data}
  categoryKey="subject"
  radars={[{ dataKey: 'value', name: 'Score' }]}
/>
```

## IGRPRadialBarChart

```tsx
<IGRPRadialBarChart
  data={data}
  categoryKey="name"
  radials={[{ dataKey: 'value', name: 'Progress' }]}
/>
```
