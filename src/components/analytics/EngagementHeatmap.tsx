import { useMemo } from "react";
import { Flame } from "lucide-react";

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
}

interface EngagementHeatmapProps {
  posts?: { scheduled_at: string; status: string }[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Generate mock engagement data for demo
const generateMockData = (): HeatmapData[] => {
  const data: HeatmapData[] = [];
  DAYS.forEach((day, dayIndex) => {
    HOURS.forEach((hour) => {
      // Simulate higher engagement during work hours and evenings
      let baseValue = 0;
      if (hour >= 9 && hour <= 11) baseValue = 60;
      else if (hour >= 12 && hour <= 14) baseValue = 40;
      else if (hour >= 17 && hour <= 21) baseValue = 80;
      else if (hour >= 6 && hour <= 8) baseValue = 30;
      else baseValue = 10;

      // Weekends have different patterns
      if (dayIndex === 0 || dayIndex === 6) {
        if (hour >= 10 && hour <= 14) baseValue = 70;
        else if (hour >= 19 && hour <= 22) baseValue = 60;
        else baseValue = Math.max(baseValue - 20, 5);
      }

      // Add some randomness
      const value = Math.min(100, Math.max(0, baseValue + (Math.random() * 30 - 15)));
      data.push({ day, hour, value: Math.round(value) });
    });
  });
  return data;
};

const getColor = (value: number): string => {
  if (value >= 80) return "bg-green-500";
  if (value >= 60) return "bg-green-400/80";
  if (value >= 40) return "bg-yellow-400/70";
  if (value >= 20) return "bg-orange-400/50";
  return "bg-muted/30";
};

const getTextColor = (value: number): string => {
  if (value >= 60) return "text-white";
  return "text-muted-foreground";
};

export function EngagementHeatmap({ posts }: EngagementHeatmapProps) {
  const heatmapData = useMemo(() => {
    // In production, calculate from real post engagement data
    // For now, use mock data
    return generateMockData();
  }, [posts]);

  const getValueForCell = (day: string, hour: number): number => {
    const cell = heatmapData.find((d) => d.day === day && d.hour === hour);
    return cell?.value || 0;
  };

  // Find peak times
  const peakTimes = useMemo(() => {
    return heatmapData
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((d) => `${d.day} ${d.hour}:00`);
  }, [heatmapData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Engagement Heatmap
        </h3>
        <span className="text-xs text-muted-foreground">Best times to post</span>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs">
        <span className="text-muted-foreground">Low</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-4 rounded bg-muted/30" />
          <div className="w-4 h-4 rounded bg-orange-400/50" />
          <div className="w-4 h-4 rounded bg-yellow-400/70" />
          <div className="w-4 h-4 rounded bg-green-400/80" />
          <div className="w-4 h-4 rounded bg-green-500" />
        </div>
        <span className="text-muted-foreground">High</span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-10" />
            {HOURS.filter((h) => h % 3 === 0).map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-[10px] text-muted-foreground"
                style={{ marginLeft: hour === 0 ? 0 : undefined }}
              >
                {hour.toString().padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-0.5 mb-0.5">
              <div className="w-10 text-xs text-muted-foreground">{day}</div>
              {HOURS.map((hour) => {
                const value = getValueForCell(day, hour);
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`flex-1 h-6 rounded-sm transition-all hover:scale-110 cursor-pointer ${getColor(value)}`}
                    title={`${day} ${hour}:00 - ${value}% engagement`}
                  >
                    <div className={`w-full h-full flex items-center justify-center text-[8px] font-medium opacity-0 hover:opacity-100 ${getTextColor(value)}`}>
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Peak Times */}
      <div className="bg-muted/30 rounded-xl p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">🔥 Peak Engagement Times</p>
        <div className="flex flex-wrap gap-2">
          {peakTimes.map((time, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs rounded-lg bg-green-500/20 text-green-400"
            >
              {time}
            </span>
          ))}
        </div>
      </div>

      {/* Content Type Performance */}
      <div className="bg-muted/30 rounded-xl p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">📊 Content Type Performance</p>
        <div className="space-y-2">
          {[
            { type: "Photos", engagement: 85, color: "bg-blue-500" },
            { type: "Videos", engagement: 78, color: "bg-purple-500" },
            { type: "Text Only", engagement: 45, color: "bg-orange-500" },
            { type: "Polls", engagement: 92, color: "bg-green-500" },
            { type: "Links", engagement: 38, color: "bg-red-500" },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <span className="text-xs w-20 text-muted-foreground">{item.type}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all`}
                  style={{ width: `${item.engagement}%` }}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">{item.engagement}%</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        * Data is simulated. Connect social APIs for real engagement metrics.
      </p>
    </div>
  );
}
