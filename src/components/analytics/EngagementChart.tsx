import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface EngagementChartProps {
  data: { date: string; engagement: number; impressions: number; clicks: number }[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="date" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Line 
          type="monotone" 
          dataKey="engagement" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
          name="Engagement %"
        />
        <Line 
          type="monotone" 
          dataKey="impressions" 
          stroke="hsl(var(--accent))" 
          strokeWidth={2}
          dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 4 }}
          name="Impressions"
        />
        <Line 
          type="monotone" 
          dataKey="clicks" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={{ fill: "#10b981", strokeWidth: 0, r: 4 }}
          name="Clicks"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
