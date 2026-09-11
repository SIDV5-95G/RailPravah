import React from "react";
import { CalendarBlock } from "../types";
import { UnifiedDailyScheduleCalendar } from "./UnifiedDailyScheduleCalendar";

export interface ScheduledWorkItem {
  id: string;
  timeSlot: string;
  durationHours: number;
  durationLabel: string;
  title: string;
  category: "P-Way" | "TRD / OHE" | "S&T" | "Civil / USFD";
  location: string;
  trackSection: string;
  kilometerPost: string;
  workDescription: string;
  machineryGangs: string;
  priority: "High" | "Medium" | "Critical";
  authorizedPersonnel: string;
}

export interface DaySchedule {
  dateString: string;
  dayOfWeek: number;
  dayName: string;
  dayNumber: number;
  monthName: string;
  year: number;
  isSunday: boolean;
  totalHours: number;
  workItems: ScheduledWorkItem[];
}

export interface ZonalDailyScheduleCalendarProps {
  calendarBlocks?: CalendarBlock[];
}

export const ZonalDailyScheduleCalendar: React.FC<ZonalDailyScheduleCalendarProps> = ({
  calendarBlocks,
}) => {
  return (
    <UnifiedDailyScheduleCalendar
      role="zonal"
      roleTitle="Zonal Chief Operations Authority"
      calendarBlocks={calendarBlocks}
      defaultYear={2026}
      defaultMonth={8} // September 2026
      defaultDay={8}
    />
  );
};

export default ZonalDailyScheduleCalendar;
