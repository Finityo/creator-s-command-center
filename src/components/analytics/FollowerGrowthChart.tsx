import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FollowerGrowthChartProps {
  data: { date: string; followers: number }[];
}

export function FollowerGrowthChart({ data }: FollowerGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
        <Area 
          type="monotone" 
          dataKey="followers" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          fill="url(#followerGradient)"
          name="Total Followers"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
