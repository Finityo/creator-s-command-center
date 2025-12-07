import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Repeat, CalendarDays } from "lucide-react";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly";

interface RecurrenceSettingsProps {
  recurrenceType: RecurrenceType;
  recurrenceEndDate: string;
  onRecurrenceTypeChange: (type: RecurrenceType) => void;
  onRecurrenceEndDateChange: (date: string) => void;
}

export function RecurrenceSettings({
  recurrenceType,
  recurrenceEndDate,
  onRecurrenceTypeChange,
  onRecurrenceEndDateChange,
}: RecurrenceSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(recurrenceType !== "none");

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      onRecurrenceTypeChange("none");
      onRecurrenceEndDateChange("");
    } else {
      onRecurrenceTypeChange("weekly");
    }
  };

  const getRecurrenceLabel = () => {
    switch (recurrenceType) {
      case "daily":
        return "Repeats every day";
      case "weekly":
        return "Repeats every week";
      case "monthly":
        return "Repeats every month";
      default:
        return "No repeat";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Repeat className="h-3.5 w-3.5" />
          Recurring Post
        </Label>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          className="scale-90"
        />
      </div>

      {isEnabled && (
        <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border animate-in fade-in-50 duration-200">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">
              Repeat Frequency
            </Label>
            <Select
              value={recurrenceType}
              onValueChange={(value) => onRecurrenceTypeChange(value as RecurrenceType)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              End Date (optional)
            </Label>
            <Input
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => onRecurrenceEndDateChange(e.target.value)}
              className="h-9 text-sm"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <p className="text-[10px] text-muted-foreground">
            {getRecurrenceLabel()}
            {recurrenceEndDate && ` until ${new Date(recurrenceEndDate).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
}
