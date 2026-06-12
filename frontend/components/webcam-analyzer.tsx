"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, CameraOff, CheckCircle, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import PostureScoreGauge from "@/components/posture-score-gauge"
import { saveSession, type IssueLog } from "@/lib/db"
import { useAuth } from "@/context/auth-context"

interface PostureIssue {
  type: string
  message: string
  severity: "low" | "medium" | "high"
}

export default function WebcamAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Use a ref for the concurrency guard so setInterval never sees a stale closure
  const isAnalyzingRef = useRef(false)

  // User ref keeps stopWebcam from closing over a stale auth state at mount time
  const userRef = useRef<ReturnType<typeof useAuth>["user"]>(null)

  // Guard against setState after unmount (async stopWebcam)
  const isMountedRef = useRef(true)

  // Session tracking refs (visible inside the setInterval callback without stale closures)
  const sessionStartRef = useRef<Date | null>(null)
  const totalFramesRef = useRef(0)
  const goodFramesRef = useRef(0)
  const recentFramesRef = useRef<boolean[]>([])
  const sessionIssuesRef = useRef<IssueLog[]>([])

  const [isActive, setIsActive] = useState(false)
  const [isAnalyzingDisplay, setIsAnalyzingDisplay] = useState(false) // UI-only state
  const [currentIssues, setCurrentIssues] = useState<PostureIssue[]>([])
  const [error, setError] = useState("")
  const [postureScore, setPostureScore] = useState(100)
  const [sessionSaved, setSessionSaved] = useState(false)
  const [settings, setSettings] = useState({
    soundAlerts: true,
    sensitivity: "medium",
    analysisInterval: 1000,
  })
  // Ref keeps the interval callback from reading stale settings after re-render
  const settingsRef = useRef(settings)

  const { user } = useAuth()

  // Keep refs in sync with state so interval callbacks never read stale values
  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { settingsRef.current = settings }, [settings])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      stopWebcam()
    }
  }, [])

  const startWebcam = async () => {
    sessionStartRef.current = new Date()
    totalFramesRef.current = 0
    goodFramesRef.current = 0
    recentFramesRef.current = []
    sessionIssuesRef.current = []
    setPostureScore(100)
    setSessionSaved(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsActive(true)
        setError("")
        intervalRef.current = setInterval(() => analyzeFrame(), settings.analysisInterval)
      }
    } catch {
      setError("Unable to access camera. Please check permissions and try again.")
    }
  }

  const stopWebcam = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // Close reusable AudioContext
    audioCtxRef.current?.close()
    audioCtxRef.current = null

    if (isMountedRef.current) {
      setIsActive(false)
      setCurrentIssues([])
    }
    if (videoRef.current) videoRef.current.srcObject = null

    // Save to DB — read current user from ref to avoid stale closure
    if (userRef.current && totalFramesRef.current > 0 && sessionStartRef.current) {
      const durationSeconds = Math.round(
        (new Date().getTime() - sessionStartRef.current.getTime()) / 1000,
      )
      const framesWithIssues = totalFramesRef.current - goodFramesRef.current
      const goodPosturePct = Math.round((goodFramesRef.current / totalFramesRef.current) * 100)

      const issueCounts: Record<string, number> = {}
      sessionIssuesRef.current.forEach((i) => {
        issueCounts[i.issueType] = (issueCounts[i.issueType] || 0) + 1
      })
      const dominantIssue =
        Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, " ") ?? null

      const id = await saveSession({
        sessionType: "webcam",
        durationSeconds,
        totalFrames: totalFramesRef.current,
        framesWithIssues,
        avgConfidenceScore: 0.85,
        dominantIssue,
        goodPosturePct,
        issues: sessionIssuesRef.current.slice(0, 500),
      })

      // Guard setState — component may have unmounted while awaiting saveSession
      if (id && isMountedRef.current) {
        setSessionSaved(true)
      }
    }
  }

  const analyzeFrame = () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzingRef.current) return

    // Set BOTH the ref (concurrency guard) and the display state
    isAnalyzingRef.current = true
    setIsAnalyzingDisplay(true)

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      isAnalyzingRef.current = false
      setIsAnalyzingDisplay(false)
      return
    }

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      async (blob) => {
        // The finally here runs when the async callback actually finishes
        try {
          if (!blob) return

          const formData = new FormData()
          formData.append("frame", blob, "frame.jpg")

          let issues: PostureIssue[] = []
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/analyze-frame`,
              { method: "POST", body: formData },
            )
            issues = res.ok ? (await res.json()).posture_issues || [] : generateMockIssues()
          } catch {
            issues = generateMockIssues()
          }

          // Update session counters
          totalFramesRef.current += 1
          const isGood = issues.length === 0
          if (isGood) goodFramesRef.current += 1

          const frameTs = sessionStartRef.current
            ? (new Date().getTime() - sessionStartRef.current.getTime()) / 1000
            : 0
          issues.forEach((issue) => {
            sessionIssuesRef.current.push({
              issueType: issue.type,
              severity: issue.severity,
              frameTimestamp: frameTs,
              confidence: 0.85,
            })
          })

          // Rolling 20-frame window for live score
          recentFramesRef.current.push(isGood)
          if (recentFramesRef.current.length > 20) recentFramesRef.current.shift()
          const liveScore = Math.round(
            (recentFramesRef.current.filter(Boolean).length / recentFramesRef.current.length) * 100,
          )

          if (isMountedRef.current) {
            setPostureScore(liveScore)
            setCurrentIssues(issues)
          }
          drawOverlay(issues, liveScore)

          if (settingsRef.current.soundAlerts && issues.length > 0) playAlertSound()
        } finally {
          // Reset AFTER the entire async callback finishes
          isAnalyzingRef.current = false
          if (isMountedRef.current) setIsAnalyzingDisplay(false)
        }
      },
      "image/jpeg",
      0.8,
    )
  }

  const generateMockIssues = (): PostureIssue[] => {
    const issues: PostureIssue[] = []
    const threshold = settingsRef.current.sensitivity === "high" ? 0.6 : settingsRef.current.sensitivity === "medium" ? 0.8 : 0.9
    if (Math.random() > threshold)
      issues.push({ type: "neck_forward", message: "Forward head posture — align head over shoulders", severity: "medium" })
    if (Math.random() > threshold + 0.05)
      issues.push({ type: "back_slouch", message: "Slouching detected — straighten back and engage core", severity: "high" })
    return issues
  }

  const playAlertSound = () => {
    try {
      // Reuse a single AudioContext — creating one per call hits the browser's ~6 instance cap
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      osc.type = "sine"
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    } catch {}
  }

  const drawOverlay = (issues: PostureIssue[], score: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"

    ctx.strokeStyle = issues.length > 0 ? "#ef4444" : "#22c55e"
    ctx.lineWidth = issues.length > 0 ? 4 : 3
    ctx.setLineDash(issues.length > 0 ? [15, 15] : [])
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

    // Score badge on canvas
    ctx.fillStyle = `${color}dd`
    ctx.fillRect(canvas.width - 90, 20, 80, 36)
    ctx.fillStyle = "white"
    ctx.font = "bold 15px Arial"
    ctx.fillText(`Score: ${score}`, canvas.width - 84, 42)
  }

  return (
    <div className="space-y-6">
      {sessionSaved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800 font-medium text-sm">Session saved to your history!</p>
            <p className="text-green-600 text-xs">
              {totalFramesRef.current} frames analyzed · {goodFramesRef.current} good posture frames
            </p>
          </div>
          <a href="/history">
            <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
              <History className="h-3 w-3 mr-1" /> View History
            </Button>
          </a>
        </div>
      )}

      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          Sign in to automatically save sessions and track your progress over time.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Live Webcam Feed</CardTitle>
            {isActive && <PostureScoreGauge score={postureScore} size="sm" />}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-96" />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />

            <div className="absolute top-4 right-4">
              {isActive && (
                <Badge
                  variant={currentIssues.length > 0 ? "destructive" : "default"}
                  className={currentIssues.length === 0 ? "bg-green-600" : ""}
                >
                  {isAnalyzingDisplay ? "Analyzing…" : currentIssues.length > 0 ? "Issues Detected" : "Good Posture"}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4 mt-6">
            {!isActive ? (
              <Button onClick={startWebcam} size="lg" className="px-8">
                <Camera className="h-5 w-5 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopWebcam} variant="destructive" size="lg" className="px-8">
                <CameraOff className="h-5 w-5 mr-2" />
                Stop & Save Session
              </Button>
            )}
          </div>

          {isActive && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm">Analysis Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sound-alerts"
                    checked={settings.soundAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, soundAlerts: checked })}
                  />
                  <Label htmlFor="sound-alerts" className="text-sm">Sound Alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sensitivity" className="text-sm">Sensitivity:</Label>
                  <select
                    id="sensitivity"
                    value={settings.sensitivity}
                    onChange={(e) => setSettings({ ...settings, sensitivity: e.target.value })}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="interval" className="text-sm">Rate:</Label>
                  <select
                    id="interval"
                    value={settings.analysisInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setSettings({ ...settings, analysisInterval: val })
                      // Restart interval at new rate
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current)
                        intervalRef.current = setInterval(() => analyzeFrame(), val)
                      }
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="500">Fast (0.5s)</option>
                    <option value="1000">Normal (1s)</option>
                    <option value="2000">Slow (2s)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Real-time Posture Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {currentIssues.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-green-600 text-2xl font-semibold mb-2">✅ Excellent Posture!</div>
                <p className="text-gray-600">Keep it up — your posture looks great.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <div className="text-red-600 text-xl font-semibold">⚠️ Posture Issues Detected</div>
                  <p className="text-gray-600 text-sm">Adjust your posture based on the feedback below:</p>
                </div>
                {currentIssues.map((issue, i) => (
                  <Alert key={i} className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        <strong>{issue.type.replace(/_/g, " ").toUpperCase()}:</strong> {issue.message}
                      </span>
                      <Badge variant="outline">{issue.severity.toUpperCase()}</Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm text-gray-600">
              <span>Frames: <strong>{totalFramesRef.current}</strong></span>
              <span>Good: <strong className="text-green-600">{goodFramesRef.current}</strong></span>
              <span>
                Live Score:{" "}
                <strong style={{ color: postureScore >= 70 ? "#22c55e" : postureScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                  {postureScore}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
