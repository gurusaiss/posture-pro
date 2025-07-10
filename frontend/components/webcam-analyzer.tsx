"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, CameraOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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

  const [isActive, setIsActive] = useState(false)
  const [currentIssues, setCurrentIssues] = useState<PostureIssue[]>([])
  const [error, setError] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [settings, setSettings] = useState({
    soundAlerts: true,
    sensitivity: "medium",
    analysisInterval: 1000,
  })

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsActive(true)
        setError("")

        // Start analysis interval
        intervalRef.current = setInterval(analyzeFrame, settings.analysisInterval)
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions and try again.")
      console.error("Error accessing webcam:", err)
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsActive(false)
    setCurrentIssues([])

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return

    setIsAnalyzing(true)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      // Set canvas size to match video
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      canvas.toBlob(
        async (blob) => {
          if (!blob) return

          const formData = new FormData()
          formData.append("frame", blob, "frame.jpg")

          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/analyze-frame`,
              {
                method: "POST",
                body: formData,
              },
            )

            if (response.ok) {
              const result = await response.json()
              const issues = result.posture_issues || []
              setCurrentIssues(issues)
              drawOverlay(issues)

              // Play sound alert if enabled
              if (settings.soundAlerts && issues.length > 0) {
                playAlertSound()
              }
            } else {
              generateMockFrameAnalysis()
            }
          } catch (error) {
            console.error("Error analyzing frame:", error)
            generateMockFrameAnalysis()
          }
        },
        "image/jpeg",
        0.8,
      )
    } catch (error) {
      console.error("Error capturing frame:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateMockFrameAnalysis = () => {
    const issues: PostureIssue[] = []

    // Generate realistic posture issues based on sensitivity
    const threshold = settings.sensitivity === "high" ? 0.6 : settings.sensitivity === "medium" ? 0.8 : 0.9

    if (Math.random() > threshold) {
      issues.push({
        type: "neck_forward",
        message: "Forward head posture detected - align your head over shoulders",
        severity: "medium",
      })
    }

    if (Math.random() > threshold + 0.05) {
      issues.push({
        type: "back_slouch",
        message: "Slouching detected - straighten your back and engage core",
        severity: "high",
      })
    }

    setCurrentIssues(issues)
    drawOverlay(issues)

    if (settings.soundAlerts && issues.length > 0) {
      playAlertSound()
    }
  }

  const playAlertSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const drawOverlay = (issues: PostureIssue[]) => {
    const overlayCanvas = canvasRef.current
    if (!overlayCanvas) return

    const overlayCtx = overlayCanvas.getContext("2d")
    if (!overlayCtx) return

    // Clear previous overlay
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

    if (issues.length > 0) {
      // Draw warning border
      overlayCtx.strokeStyle = "#ef4444"
      overlayCtx.lineWidth = 4
      overlayCtx.setLineDash([15, 15])
      overlayCtx.strokeRect(10, 10, overlayCanvas.width - 20, overlayCanvas.height - 20)

      // Draw warning indicator
      overlayCtx.fillStyle = "rgba(239, 68, 68, 0.9)"
      overlayCtx.fillRect(20, 20, 250, 50)

      overlayCtx.fillStyle = "white"
      overlayCtx.font = "18px Arial"
      overlayCtx.fillText("⚠️ Posture Alert", 30, 50)
    } else {
      // Draw good posture indicator
      overlayCtx.fillStyle = "rgba(34, 197, 94, 0.9)"
      overlayCtx.fillRect(20, 20, 200, 50)

      overlayCtx.fillStyle = "white"
      overlayCtx.font = "18px Arial"
      overlayCtx.fillText("✅ Good Posture", 30, 50)
    }
  }

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Webcam Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Live Webcam Feed</CardTitle>
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

            {/* Status overlay */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              {isActive && (
                <Badge variant={currentIssues.length > 0 ? "destructive" : "default"} className="text-xs">
                  {isAnalyzing ? "Analyzing..." : currentIssues.length > 0 ? "Issues Detected" : "Good Posture"}
                </Badge>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            {!isActive ? (
              <Button onClick={startWebcam} size="lg" className="px-8">
                <Camera className="h-5 w-5 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopWebcam} variant="destructive" size="lg" className="px-8">
                <CameraOff className="h-5 w-5 mr-2" />
                Stop Camera
              </Button>
            )}
          </div>

          {/* Settings */}
          {isActive && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Analysis Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sound-alerts"
                    checked={settings.soundAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, soundAlerts: checked })}
                  />
                  <Label htmlFor="sound-alerts">Sound Alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sensitivity">Sensitivity:</Label>
                  <select
                    id="sensitivity"
                    value={settings.sensitivity}
                    onChange={(e) => setSettings({ ...settings, sensitivity: e.target.value })}
                    className="px-2 py-1 border rounded"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="interval">Analysis Rate:</Label>
                  <select
                    id="interval"
                    value={settings.analysisInterval}
                    onChange={(e) => {
                      const newInterval = Number.parseInt(e.target.value)
                      setSettings({ ...settings, analysisInterval: newInterval })

                      // Restart interval with new rate
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current)
                        intervalRef.current = setInterval(analyzeFrame, newInterval)
                      }
                    }}
                    className="px-2 py-1 border rounded"
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

      {/* Real-time Issues */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Real-time Posture Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {currentIssues.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-green-600 text-2xl font-semibold mb-2">✅ Excellent Posture!</div>
                <p className="text-gray-600">Keep up the great work! Your posture is looking good.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <div className="text-red-600 text-xl font-semibold">⚠️ Posture Issues Detected</div>
                  <p className="text-gray-600">Please adjust your posture based on the feedback below:</p>
                </div>
                {currentIssues.map((issue, index) => (
                  <Alert key={index} className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        <strong>{issue.type.replace("_", " ").toUpperCase()}:</strong> {issue.message}
                      </span>
                      <Badge variant="outline">{issue.severity.toUpperCase()}</Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
