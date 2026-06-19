"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, TrendingUp, Flame, Clock, Award, AlertCircle, RotateCcw, Dumbbell, Printer } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { getDashboardStats } from "@/lib/db"
import PostureScoreGauge from "@/components/posture-score-gauge"

interface DashboardStats {
  totalSessions: number
  overallScore: number
  streak: number
  bestTimeOfDay: string
  weeklyData: { day: string; score: number | null; count: number }[]
  issueBreakdown: { type: string; rawType: string; count: number; percentage: number }[]
  improvement: number | null
  mostCommonIssue: string | null
}

const FIX_SUGGESTIONS: Record<string, string> = {
  neck_forward: "Chin tucks: 3 sets × 10 reps daily. Keep monitor at eye level.",
  back_slouch: "Cat-cow stretches: 10 reps morning & evening. Sit on a stability cushion.",
  shoulder_imbalance: "Wall angels: 2 sets × 15 reps. Check chair armrest height.",
  spine_angle: "Thoracic extensions over a foam roller: 2 min daily.",
  forward_head: "Chin tucks and neck retraction exercises: 10 reps every hour.",
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getDashboardStats()
      .then(setStats)
      .finally(() => setFetching(false))
  }, [user])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading dashboard…</div>
      </div>
    )
  }

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "there"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <Activity className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">PosturePro</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/exercises">
              <Button variant="ghost" size="sm">
                <Dumbbell className="h-4 w-4 mr-1" />
                Exercises
              </Button>
            </a>
            <a href="/history">
              <Button variant="ghost" size="sm">History</Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.print()}
              className="hidden sm:flex"
            >
              <Printer className="h-4 w-4 mr-1" />
              Print Report
            </Button>
            <a href="/">
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" /> New Session
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <style>{`
        @media print {
          nav, button, a[href="/"] { display: none !important; }
          body { background: white !important; }
          .container { max-width: 100% !important; }
        }
      `}</style>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
          <p className="text-gray-600 mt-1">Here's your posture progress overview.</p>
        </div>

        {!stats ? (
          <div className="text-center py-20 bg-white/60 rounded-xl border border-gray-200">
            <Activity className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No sessions yet</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Complete your first posture analysis to start seeing stats here.
            </p>
            <a href="/">
              <Button size="lg">Start a Session</Button>
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="text-center p-4 bg-white/80">
                <PostureScoreGauge score={stats.overallScore} size="sm" />
                <p className="text-xs text-gray-500 mt-1 font-medium">This Week's Score</p>
              </Card>

              <Card className="flex flex-col items-center justify-center p-4 bg-white/80 gap-1">
                <Flame className="h-8 w-8 text-orange-500" />
                <div className="text-3xl font-bold text-gray-900">{stats.streak}</div>
                <div className="text-xs text-gray-500 text-center">
                  Day{stats.streak !== 1 ? "s" : ""} Streak
                </div>
              </Card>

              <Card className="flex flex-col items-center justify-center p-4 bg-white/80 gap-1">
                <Clock className="h-8 w-8 text-blue-500" />
                <div className="text-2xl font-bold text-gray-900">{stats.bestTimeOfDay}</div>
                <div className="text-xs text-gray-500 text-center">Best Time of Day</div>
              </Card>

              <Card className="flex flex-col items-center justify-center p-4 bg-white/80 gap-1">
                {stats.improvement !== null ? (
                  <>
                    <TrendingUp
                      className={`h-8 w-8 ${stats.improvement >= 0 ? "text-green-500" : "text-red-500"}`}
                    />
                    <div
                      className={`text-3xl font-bold ${stats.improvement >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {stats.improvement >= 0 ? "+" : ""}
                      {stats.improvement}%
                    </div>
                    <div className="text-xs text-gray-500 text-center">vs Last Week</div>
                  </>
                ) : (
                  <>
                    <Award className="h-8 w-8 text-purple-500" />
                    <div className="text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
                    <div className="text-xs text-gray-500 text-center">Total Sessions</div>
                  </>
                )}
              </Card>
            </div>

            {/* Weekly trend chart */}
            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Weekly Posture Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.weeklyData.every((d) => d.score === null) ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No data for the past 7 days yet. Sessions will appear here as you complete them.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.weeklyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(value: any) => [`${value}%`, "Score"]}
                        labelFormatter={(label) => `${label}`}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 5, fill: "#2563eb" }}
                        activeDot={{ r: 7 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Issue breakdown + recommendations */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Issue Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.issueBreakdown.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No issues detected yet — great posture!</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.issueBreakdown.slice(0, 5).map((issue) => (
                        <div key={issue.rawType}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{issue.type}</span>
                            <Badge variant="outline" className="text-xs">{issue.percentage}%</Badge>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${issue.percentage}%`,
                                backgroundColor:
                                  issue.percentage > 40 ? "#ef4444" : issue.percentage > 20 ? "#f59e0b" : "#22c55e",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    Top Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.mostCommonIssue ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Most frequent issue:{" "}
                        <Badge variant="secondary" className="capitalize">
                          {stats.mostCommonIssue}
                        </Badge>
                      </p>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <p className="text-sm text-blue-800 leading-relaxed">
                          {FIX_SUGGESTIONS[stats.mostCommonIssue.replace(/ /g, "_")] ||
                            "Focus on maintaining neutral spine alignment throughout the day. Take regular breaks to stretch and reset your posture."}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Based on {stats.totalSessions} session{stats.totalSessions !== 1 ? "s" : ""} recorded
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        Excellent work! No significant posture issues detected across your sessions. Keep up the great habits!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
