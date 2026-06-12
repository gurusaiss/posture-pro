"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Camera, Upload, Clock, BarChart2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { getSessions } from "@/lib/db"

interface Session {
  id: string
  session_type: "video" | "webcam"
  duration_seconds: number
  total_frames: number
  frames_with_issues: number
  good_posture_pct: number
  dominant_issue: string | null
  created_at: string
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-100 text-green-700 border-green-200" :
    score >= 40 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    "bg-red-100 text-red-700 border-red-200"
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {score}%
    </span>
  )
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [fetching, setFetching] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "video" | "webcam">("all")

  useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getSessions()
      .then((data) => setSessions(data as Session[]))
      .finally(() => setFetching(false))
  }, [user])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading history…</div>
      </div>
    )
  }

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.session_type === filter)
  const avgScore =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.good_posture_pct || 0), 0) / sessions.length)
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <Activity className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">PosturePro</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/dashboard">
              <Button variant="ghost" size="sm">
                <BarChart2 className="h-4 w-4 mr-1" /> Dashboard
              </Button>
            </a>
            <a href="/">
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" /> New Session
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session History</h1>
            <p className="text-gray-600 mt-1">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
              {sessions.length > 0 && ` · avg score ${avgScore}%`}
            </p>
          </div>
          {/* Filter */}
          <div className="flex gap-2">
            {(["all", "webcam", "video"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f === "all" ? "All" : f === "webcam" ? "Webcam" : "Video"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/60 rounded-xl border border-gray-200">
            <Activity className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {sessions.length === 0 ? "No sessions yet" : `No ${filter} sessions`}
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {sessions.length === 0
                ? "Complete your first posture analysis to see it here."
                : `Switch the filter to see your other sessions.`}
            </p>
            {sessions.length === 0 && (
              <a href="/">
                <Button size="lg">Start a Session</Button>
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session) => {
              const isOpen = expanded === session.id
              return (
                <Card key={session.id} className="bg-white/80 hover:shadow-md transition-shadow">
                  <div
                    className="p-4 cursor-pointer select-none"
                    onClick={() => setExpanded(isOpen ? null : session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${session.session_type === "webcam" ? "bg-green-100" : "bg-blue-100"}`}
                        >
                          {session.session_type === "webcam" ? (
                            <Camera className="h-5 w-5 text-green-600" />
                          ) : (
                            <Upload className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{session.session_type} Session</span>
                            <ScorePill score={Math.round(session.good_posture_pct || 0)} />
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(session.duration_seconds)}
                            </span>
                            <span>{formatDate(session.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.dominant_issue && (
                          <Badge variant="secondary" className="text-xs capitalize hidden sm:inline-flex">
                            {session.dominant_issue}
                          </Badge>
                        )}
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <CardContent className="pt-0 pb-4 px-4 border-t border-gray-100 mt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-gray-900">{session.total_frames}</div>
                          <div className="text-xs text-gray-500">Frames Analyzed</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-orange-600">{session.frames_with_issues}</div>
                          <div className="text-xs text-gray-500">Frames w/ Issues</div>
                        </div>
                        <div
                          className={`rounded-lg p-3 text-center ${
                            (session.good_posture_pct || 0) >= 70
                              ? "bg-green-50"
                              : (session.good_posture_pct || 0) >= 40
                              ? "bg-yellow-50"
                              : "bg-red-50"
                          }`}
                        >
                          <div
                            className={`text-xl font-bold ${
                              (session.good_posture_pct || 0) >= 70
                                ? "text-green-700"
                                : (session.good_posture_pct || 0) >= 40
                                ? "text-yellow-700"
                                : "text-red-700"
                            }`}
                          >
                            {Math.round(session.good_posture_pct || 0)}%
                          </div>
                          <div className="text-xs text-gray-500">Good Posture</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {formatDuration(session.duration_seconds)}
                          </div>
                          <div className="text-xs text-gray-500">Duration</div>
                        </div>
                      </div>
                      {session.dominant_issue && (
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <p className="text-xs text-blue-700">
                            <strong>Main issue:</strong> {session.dominant_issue} —{" "}
                            {session.dominant_issue.includes("neck") || session.dominant_issue.includes("forward")
                              ? "Try chin tucks every hour to counteract forward head posture."
                              : session.dominant_issue.includes("slouch") || session.dominant_issue.includes("back")
                              ? "Cat-cow stretches and core engagement can help reduce slouching."
                              : "Focus on neutral spine alignment and regular posture checks."}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
