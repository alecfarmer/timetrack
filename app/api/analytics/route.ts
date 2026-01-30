import { supabaseAdmin as supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type Period = "1week" | "4weeks" | "3months";

function getDateRange(period: Period): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case "1week":
      start.setDate(start.getDate() - 7);
      break;
    case "4weeks":
      start.setDate(start.getDate() - 28);
      break;
    case "3months":
      start.setMonth(start.getMonth() - 3);
      break;
    default:
      start.setDate(start.getDate() - 28);
  }

  return { start, end };
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function generateWeekStarts(start: Date, end: Date): string[] {
  const weeks: string[] = [];
  const current = new Date(start);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);

  while (current <= end) {
    weeks.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser();

    if (authError) return authError;
    if (!org) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 }
      );
    }

    if (org.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "4weeks") as Period;

    if (!["1week", "4weeks", "3months"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Must be one of: 1week, 4weeks, 3months" },
        { status: 400 }
      );
    }

    const { start, end } = getDateRange(period);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    // Fetch org members
    const { data: members, error: membersError } = await supabase
      .from("Membership")
      .select("userId")
      .eq("orgId", org.orgId);

    if (membersError) {
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    const memberIds = members.map((m: { userId: string }) => m.userId);
    const totalMembers = memberIds.length;

    if (totalMembers === 0) {
      return NextResponse.json({
        weeklyTrends: [],
        locationBreakdown: [],
        memberSummary: [],
        overview: {
          totalMembers: 0,
          avgComplianceRate: 0,
          totalHoursTracked: 0,
          avgHoursPerDay: 0,
        },
      });
    }

    // Fetch policy config for compliance calculation
    const { data: policyConfig } = await supabase
      .from("PolicyConfig")
      .select("requiredDaysPerWeek")
      .eq("orgId", org.orgId)
      .single();

    const requiredDaysPerWeek = policyConfig?.requiredDaysPerWeek ?? 3;

    // Fetch work days within the date range for org members
    const { data: workDays, error: workDaysError } = await supabase
      .from("WorkDay")
      .select("id, userId, date, totalMinutes, firstClockIn, locationId")
      .in("userId", memberIds)
      .gte("date", startStr)
      .lte("date", endStr);

    if (workDaysError) {
      return NextResponse.json(
        { error: "Failed to fetch work days" },
        { status: 500 }
      );
    }

    const workDayRecords = workDays || [];

    // Fetch locations for the org
    const { data: locations } = await supabase
      .from("Location")
      .select("id, name, code")
      .eq("orgId", org.orgId);

    const locationMap = new Map<string, { name: string; code: string }>();
    if (locations) {
      for (const loc of locations) {
        locationMap.set(loc.id, { name: loc.name, code: loc.code });
      }
    }

    // Fetch user emails via admin API
    const { data: authUsers } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    const emailMap = new Map<string, string>();
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        emailMap.set(u.id, u.email || "");
      }
    }

    // --- Weekly Trends ---
    const weekStarts = generateWeekStarts(start, end);
    const weeklyTrends = weekStarts.map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().split("T")[0];

      const weekRecords = workDayRecords.filter((wd: { date: string }) => {
        return wd.date >= weekStart && wd.date <= weekEndStr;
      });

      const totalHours = weekRecords.reduce(
        (sum: number, wd: { totalMinutes: number | null }) =>
          sum + ((wd.totalMinutes || 0) / 60),
        0
      );

      // Count distinct days per member for compliance
      const memberDays = new Map<string, Set<string>>();
      for (const wd of weekRecords) {
        if (!memberDays.has(wd.userId)) {
          memberDays.set(wd.userId, new Set());
        }
        memberDays.get(wd.userId)!.add(wd.date);
      }

      let compliantCount = 0;
      for (const days of memberDays.values()) {
        if (days.size >= requiredDaysPerWeek) {
          compliantCount++;
        }
      }

      const activeMemberCount = memberDays.size;
      const complianceRate =
        totalMembers > 0
          ? Math.round((compliantCount / totalMembers) * 100 * 100) / 100
          : 0;

      return {
        weekStart,
        totalHours: Math.round(totalHours * 100) / 100,
        avgHoursPerMember:
          activeMemberCount > 0
            ? Math.round((totalHours / activeMemberCount) * 100) / 100
            : 0,
        complianceRate,
        memberCount: activeMemberCount,
      };
    });

    // --- Location Breakdown ---
    const locationStats = new Map<
      string,
      { totalHours: number; visitCount: number }
    >();

    for (const wd of workDayRecords) {
      if (!wd.locationId) continue;
      const existing = locationStats.get(wd.locationId) || {
        totalHours: 0,
        visitCount: 0,
      };
      existing.totalHours += (wd.totalMinutes || 0) / 60;
      existing.visitCount += 1;
      locationStats.set(wd.locationId, existing);
    }

    const locationBreakdown = Array.from(locationStats.entries()).map(
      ([locId, stats]) => {
        const loc = locationMap.get(locId);
        return {
          locationName: loc?.name || "Unknown",
          locationCode: loc?.code || "UNKNOWN",
          totalHours: Math.round(stats.totalHours * 100) / 100,
          visitCount: stats.visitCount,
        };
      }
    );

    // --- Member Summary ---
    const memberStatsMap = new Map<
      string,
      {
        totalHours: number;
        days: Set<string>;
        weekDays: Map<string, Set<string>>;
        arrivalTimes: string[];
      }
    >();

    for (const memberId of memberIds) {
      memberStatsMap.set(memberId, {
        totalHours: 0,
        days: new Set(),
        weekDays: new Map(),
        arrivalTimes: [],
      });
    }

    for (const wd of workDayRecords) {
      const stats = memberStatsMap.get(wd.userId);
      if (!stats) continue;

      stats.totalHours += (wd.totalMinutes || 0) / 60;
      stats.days.add(wd.date);

      const ws = getWeekStart(new Date(wd.date));
      if (!stats.weekDays.has(ws)) {
        stats.weekDays.set(ws, new Set());
      }
      stats.weekDays.get(ws)!.add(wd.date);

      if (wd.firstClockIn) {
        stats.arrivalTimes.push(wd.firstClockIn);
      }
    }

    const memberSummary = memberIds.map((userId: string) => {
      const stats = memberStatsMap.get(userId)!;

      let compliantWeeks = 0;
      const totalWeeksInPeriod = weekStarts.length;

      for (const days of stats.weekDays.values()) {
        if (days.size >= requiredDaysPerWeek) {
          compliantWeeks++;
        }
      }

      const complianceRate =
        totalWeeksInPeriod > 0
          ? Math.round((compliantWeeks / totalWeeksInPeriod) * 100 * 100) / 100
          : 0;

      let avgArrivalTime: string | null = null;
      if (stats.arrivalTimes.length > 0) {
        const totalMinutes = stats.arrivalTimes.reduce((sum, time) => {
          const d = new Date(time);
          return sum + d.getUTCHours() * 60 + d.getUTCMinutes();
        }, 0);
        const avgMinutes = Math.round(totalMinutes / stats.arrivalTimes.length);
        const h = Math.floor(avgMinutes / 60);
        const m = avgMinutes % 60;
        avgArrivalTime = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
      }

      return {
        userId,
        email: emailMap.get(userId) || "",
        totalHours: Math.round(stats.totalHours * 100) / 100,
        totalDays: stats.days.size,
        complianceRate,
        avgArrivalTime,
      };
    });

    // --- Overview ---
    const totalHoursTracked = workDayRecords.reduce(
      (sum: number, wd: { totalMinutes: number | null }) =>
        sum + ((wd.totalMinutes || 0) / 60),
      0
    );

    const totalDaysTracked = workDayRecords.length;
    const avgHoursPerDay =
      totalDaysTracked > 0
        ? Math.round((totalHoursTracked / totalDaysTracked) * 100) / 100
        : 0;

    const avgComplianceRate =
      memberSummary.length > 0
        ? Math.round(
            (memberSummary.reduce(
              (sum: number, m: { complianceRate: number }) =>
                sum + m.complianceRate,
              0
            ) /
              memberSummary.length) *
              100
          ) / 100
        : 0;

    const overview = {
      totalMembers,
      avgComplianceRate,
      totalHoursTracked: Math.round(totalHoursTracked * 100) / 100,
      avgHoursPerDay,
    };

    return NextResponse.json({
      weeklyTrends,
      locationBreakdown,
      memberSummary,
      overview,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
