import { supabase } from "./supabase"

export interface IssueLog {
  issueType: string
  severity: string
  frameTimestamp: number
  confidence: number
}

export interface SessionData {
  sessionType: "video" | "webcam"
  durationSeconds: number
  totalFrames: number
  framesWithIssues: number
  avgConfidenceScore: number
  dominantIssue: string | null
  goodPosturePct: number
  issues: IssueLog[]
}

export async function saveSession(data: SessionData): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: session, error } = await supabase
    .from("analysis_sessions")
    .insert({
      user_id: user.id,
      session_type: data.sessionType,
      duration_seconds: data.durationSeconds,
      total_frames: data.totalFrames,
      frames_with_issues: data.framesWithIssues,
      avg_confidence_score: data.avgConfidenceScore,
      dominant_issue: data.dominantIssue,
      good_posture_pct: data.goodPosturePct,
    })
    .select("id")
    .single()

  if (error || !session) {
    console.error("Error saving session:", error)
    return null
  }

  if (data.issues.length > 0) {
    const { error: issueError } = await supabase.from("posture_issues_log").insert(
      data.issues.map((issue) => ({
        session_id: session.id,
        issue_type: issue.issueType,
        severity: issue.severity,
        frame_timestamp: issue.frameTimestamp,
        confidence: issue.confidence,
      })),
    )
    if (issueError) console.error("Error saving issues:", issueError)
  }

  return session.id
}

export async function updateSessionRecommendation(
  sessionId: string,
  recommendation: string,
): Promise<void> {
  const { error } = await supabase
    .from("analysis_sessions")
    .update({ ai_recommendation: recommendation })
    .eq("id", sessionId)
  if (error) console.error("Error updating recommendation:", error)
}

export async function getSessions() {
  const { data, error } = await supabase
    .from("analysis_sessions")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching sessions:", error)
    return []
  }
  return data || []
}

export async function getDashboardStats() {
  const { data: sessions } = await supabase
    .from("analysis_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(400)

  if (!sessions || sessions.length === 0) return null

  const sessionIds = sessions.map((s) => s.id)
  const { data: issues } = await supabase
    .from("posture_issues_log")
    .select("issue_type")
    .in("session_id", sessionIds)

  // Weekly trend (last 7 days)
  const now = new Date()
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now)
    day.setDate(day.getDate() - (6 - i))
    const dayStart = new Date(day.setHours(0, 0, 0, 0))
    const dayEnd = new Date(new Date(dayStart).setHours(23, 59, 59, 999))
    const label = dayStart.toLocaleDateString("en-US", { weekday: "short" })
    const daySessions = sessions.filter((s) => {
      const d = new Date(s.created_at)
      return d >= dayStart && d <= dayEnd
    })
    const score =
      daySessions.length > 0
        ? Math.round(daySessions.reduce((sum, s) => sum + (s.good_posture_pct || 0), 0) / daySessions.length)
        : null
    return { day: label, score, count: daySessions.length }
  })

  // Issue frequency breakdown
  const issueCounts: Record<string, number> = {}
  issues?.forEach((i) => {
    issueCounts[i.issue_type] = (issueCounts[i.issue_type] || 0) + 1
  })
  const totalIssueCount = issues?.length || 0
  const issueBreakdown = Object.entries(issueCounts)
    .map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      rawType: type,
      count,
      percentage: totalIssueCount > 0 ? Math.round((count / totalIssueCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // Streak: consecutive days with at least one session
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(today)
    dayStart.setDate(today.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    const hasSession = sessions.some((s) => {
      const d = new Date(s.created_at)
      return d >= dayStart && d <= dayEnd
    })
    if (hasSession) streak++
    else break
  }

  // Best time of day
  const hourBuckets: Record<number, number[]> = {}
  sessions.forEach((s) => {
    const h = new Date(s.created_at).getHours()
    if (!hourBuckets[h]) hourBuckets[h] = []
    hourBuckets[h].push(s.good_posture_pct || 0)
  })
  let bestHour = -1
  let bestHourScore = -1
  Object.entries(hourBuckets).forEach(([h, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    if (avg > bestHourScore) {
      bestHourScore = avg
      bestHour = parseInt(h)
    }
  })
  const formatHour = (h: number) => {
    if (h < 0) return "N/A"
    if (h === 0) return "12 AM"
    if (h < 12) return `${h} AM`
    if (h === 12) return "12 PM"
    return `${h - 12} PM`
  }

  // This week vs last week improvement
  const msPerDay = 86400000
  const thisWeek = sessions.filter((s) => now.getTime() - new Date(s.created_at).getTime() < 7 * msPerDay)
  const lastWeek = sessions.filter((s) => {
    const age = now.getTime() - new Date(s.created_at).getTime()
    return age >= 7 * msPerDay && age < 14 * msPerDay
  })
  let improvement: number | null = null
  if (thisWeek.length > 0 && lastWeek.length > 0) {
    const thisAvg = thisWeek.reduce((s, r) => s + (r.good_posture_pct || 0), 0) / thisWeek.length
    const lastAvg = lastWeek.reduce((s, r) => s + (r.good_posture_pct || 0), 0) / lastWeek.length
    improvement = Math.round(thisAvg - lastAvg)
  }

  const overallScore =
    thisWeek.length > 0
      ? Math.round(thisWeek.reduce((s, r) => s + (r.good_posture_pct || 0), 0) / thisWeek.length)
      : Math.round(sessions.slice(0, 5).reduce((s, r) => s + (r.good_posture_pct || 0), 0) / Math.min(5, sessions.length))

  return {
    totalSessions: sessions.length,
    overallScore,
    streak,
    bestTimeOfDay: formatHour(bestHour),
    weeklyData,
    issueBreakdown,
    improvement,
    mostCommonIssue: issueBreakdown[0]?.type ?? null,
  }
}
