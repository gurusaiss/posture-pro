"use client"

import { useEffect, useState } from "react"
import { Sparkles, ChevronDown, ChevronUp, Dumbbell, Leaf, Laptop, Wind } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { updateSessionRecommendation } from "@/lib/db"

interface Recommendation {
  name: string
  category: "stretching" | "strengthening" | "ergonomics" | "breathing"
  steps: string[]
  duration: string
  benefit: string
  frequency: string
}

interface Props {
  sessionId: string | null
  issues: string[]
  goodPosturePct: number
  sessionType: "webcam" | "video"
}

const CATEGORY_CONFIG = {
  stretching: { color: "bg-green-100 text-green-700 border-green-200", Icon: Leaf, label: "Stretching" },
  strengthening: { color: "bg-blue-100 text-blue-700 border-blue-200", Icon: Dumbbell, label: "Strengthening" },
  ergonomics: { color: "bg-purple-100 text-purple-700 border-purple-200", Icon: Laptop, label: "Ergonomics" },
  breathing: { color: "bg-sky-100 text-sky-700 border-sky-200", Icon: Wind, label: "Breathing" },
}

export default function AIRecommendationsCard({ sessionId, issues, goodPosturePct, sessionType }: Props) {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState("")
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [expanded, setExpanded] = useState<number | null>(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issues, goodPosturePct, sessionType }),
        })
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        if (cancelled) return

        setSummary(data.summary || "")
        setRecs(data.recommendations || [])

        if (sessionId && data.summary) {
          const text = [
            data.summary,
            "",
            ...data.recommendations.map(
              (r: Recommendation, i: number) =>
                `${i + 1}. ${r.name} (${r.category}): ${r.benefit} — ${r.duration}, ${r.frequency}`,
            ),
          ].join("\n")
          updateSessionRecommendation(sessionId, text)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              <span className="text-indigo-700 font-medium">Generating your personalized plan…</span>
            </div>
            <div className="flex gap-1.5 mt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-xs text-indigo-400 text-center max-w-xs mt-1">
              Analyzing your session data to prepare targeted exercises
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || recs.length === 0) return null

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-purple-50/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          Your Personalized Exercise Plan
          <span className="ml-auto text-xs font-normal text-indigo-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            AI Generated
          </span>
        </CardTitle>
        {summary && <p className="text-sm text-indigo-700 mt-1 leading-relaxed">{summary}</p>}
      </CardHeader>

      <CardContent className="space-y-3">
        {recs.map((rec, i) => {
          const cfg = CATEGORY_CONFIG[rec.category] ?? CATEGORY_CONFIG.stretching
          const { Icon } = cfg
          const isOpen = expanded === i

          return (
            <div key={i} className="bg-white rounded-xl border border-indigo-100 overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-indigo-50/40 transition-colors"
                onClick={() => setExpanded(isOpen ? null : i)}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{rec.name}</span>
                    <Badge className={`text-xs border ${cfg.color} font-normal`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {rec.duration} &middot; {rec.frequency}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-indigo-50">
                  <ol className="space-y-2 mt-3">
                    {rec.steps.map((step, j) => (
                      <li key={j} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-indigo-400 font-bold flex-shrink-0 tabular-nums">{j + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-xs text-indigo-700">
                      <span className="font-semibold">Why this helps: </span>
                      {rec.benefit}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                    <span>
                      <strong className="text-gray-700">Duration:</strong> {rec.duration}
                    </span>
                    <span>
                      <strong className="text-gray-700">Frequency:</strong> {rec.frequency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <p className="text-xs text-center text-indigo-300 pt-1">
          ✦ AI-generated · Not a substitute for professional medical advice
        </p>
      </CardContent>
    </Card>
  )
}
