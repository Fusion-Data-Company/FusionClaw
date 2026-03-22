import { subDays, format, isWeekend, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const PACIFIC_TZ = "America/Los_Angeles";

interface ShiftForAccountability {
    shiftDate: Date;
    status: string;
    completionPercent: number;
    upworkProposals: number;
    upworkCallsBooked: number;
    upworkNewJobs: number;
    emailsSent: number;
    emailReplies: number;
    coldCallsMade: number;
}

export interface AccountabilityMetrics {
    /** Weekdays with a shift / total weekdays in period */
    attendanceRate: number;
    /** Number of missed weekdays in period */
    missedWeekdays: number;
    /** List of missed weekday date strings (yyyy-MM-dd) */
    missedDaysList: string[];
    /** Average completion % of submitted shifts */
    avgCompletion: number;
    /** Consecutive submitted-shift days streak */
    streak: number;
}

export interface WeeklyTrend {
    weekLabel: string;
    shiftsWorked: number;
    avgCompletion: number;
    totalProposals: number;
    totalCalls: number;
    totalNewJobs: number;
    totalEmailsSent: number;
    totalEmailReplies: number;
    totalColdCalls: number;
}

/**
 * Compute accountability metrics for a user's shifts over the last N days.
 * Uses US Pacific timezone for weekday determination.
 */
export function computeAccountability(
    shifts: ShiftForAccountability[],
    days: number = 30
): AccountabilityMetrics {
    const now = toZonedTime(new Date(), PACIFIC_TZ);
    const start = subDays(now, days);

    // Enumerate all weekdays in the period
    const allDays = eachDayOfInterval({ start, end: now });
    const weekdays = allDays.filter((d) => !isWeekend(d));
    const weekdayStrings = new Set(weekdays.map((d) => format(d, "yyyy-MM-dd")));

    // Shift dates as strings
    const shiftDateStrings = new Set(
        shifts.map((s) => format(new Date(s.shiftDate), "yyyy-MM-dd"))
    );

    // Missed weekdays = weekdays with no shift
    const missedDaysList: string[] = [];
    for (const wd of weekdayStrings) {
        if (!shiftDateStrings.has(wd)) {
            missedDaysList.push(wd);
        }
    }
    // Don't count today as missed if it hasn't ended yet
    const todayStr = format(now, "yyyy-MM-dd");
    const missedFiltered = missedDaysList.filter((d) => d !== todayStr);

    const totalWeekdays = weekdays.length;
    // Don't count today in the denominator if it's still ongoing
    const denominatorAdjust = weekdayStrings.has(todayStr) && !shiftDateStrings.has(todayStr) ? 1 : 0;
    const adjustedTotal = totalWeekdays - denominatorAdjust;
    const attendanceRate = adjustedTotal > 0 ? Math.round(((adjustedTotal - missedFiltered.length) / adjustedTotal) * 100) : 100;

    // Average completion of submitted shifts
    const submitted = shifts.filter((s) => s.status === "SUBMITTED");
    const avgCompletion = submitted.length > 0
        ? Math.round(submitted.reduce((sum, s) => sum + s.completionPercent, 0) / submitted.length)
        : 0;

    // Streak: consecutive weekdays with submitted shifts (counting backwards)
    let streak = 0;
    const shiftDateSet = new Set(
        shifts
            .filter((s) => s.status === "SUBMITTED")
            .map((s) => format(new Date(s.shiftDate), "yyyy-MM-dd"))
    );

    // If today has a shift, count it
    if (shiftDateSet.has(todayStr)) {
        streak++;
    }

    // Walk backward from yesterday, skipping weekends
    let checkDate = subDays(now, 1);
    while (true) {
        while (isWeekend(checkDate)) {
            checkDate = subDays(checkDate, 1);
        }
        if (shiftDateSet.has(format(checkDate, "yyyy-MM-dd"))) {
            streak++;
            checkDate = subDays(checkDate, 1);
        } else {
            break;
        }
    }

    return {
        attendanceRate,
        missedWeekdays: missedFiltered.length,
        missedDaysList: missedFiltered.sort(),
        avgCompletion,
        streak,
    };
}

/**
 * Compute weekly trends for the last N weeks.
 */
export function computeWeeklyTrends(
    shifts: ShiftForAccountability[],
    weeks: number = 4
): WeeklyTrend[] {
    const now = toZonedTime(new Date(), PACIFIC_TZ);
    const trends: WeeklyTrend[] = [];

    for (let i = 0; i < weeks; i++) {
        const weekEnd = i === 0 ? now : endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });

        const weekShifts = shifts.filter((s) => {
            const d = new Date(s.shiftDate);
            return d >= weekStart && d <= weekEnd;
        });

        const submitted = weekShifts.filter((s) => s.status === "SUBMITTED");
        const avgCompletion = submitted.length > 0
            ? Math.round(submitted.reduce((sum, s) => sum + s.completionPercent, 0) / submitted.length)
            : 0;

        trends.push({
            weekLabel: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`,
            shiftsWorked: weekShifts.length,
            avgCompletion,
            totalProposals: weekShifts.reduce((sum, s) => sum + s.upworkProposals, 0),
            totalCalls: weekShifts.reduce((sum, s) => sum + s.upworkCallsBooked, 0),
            totalNewJobs: weekShifts.reduce((sum, s) => sum + s.upworkNewJobs, 0),
            totalEmailsSent: weekShifts.reduce((sum, s) => sum + s.emailsSent, 0),
            totalEmailReplies: weekShifts.reduce((sum, s) => sum + s.emailReplies, 0),
            totalColdCalls: weekShifts.reduce((sum, s) => sum + s.coldCallsMade, 0),
        });
    }

    return trends;
}
