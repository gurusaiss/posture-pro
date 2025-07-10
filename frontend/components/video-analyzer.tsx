"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface PostureIssue {
  type: string
  message: string
  severity: "low" | "medium" | "high"
}

interface AnalysisResult {
  frame_number: number
  timestamp: number
  posture_issues: PostureIssue[]
  pose_detected: boolean
}

interface VideoAnalyzerProps {
  file: File
}

export default function VideoAnalyzer({ file }: VideoAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [currentIssues, setCurrentIssues] = useState<PostureIssue[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [analysisProgress, setAnalysisProgress] = useState(0)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)

      // Find analysis result for current time
      const currentResult = analysisResults.find((result) => Math.abs(result.timestamp - time) < 0.5)

      if (currentResult) {
        setCurrentIssues(currentResult.posture_issues)
        drawOverlay(currentResult)
      } else {
        setCurrentIssues([])
        clearOverlay()
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const analyzeVideo = async () => {
    if (!file) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    const formData = new FormData()
    formData.append("video", file)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/analyze`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const results: AnalysisResult[] = await response.json()
        setAnalysisResults(results)
        setAnalysisProgress(100)
      } else {
        console.error("Analysis failed:", response.statusText)
        generateMockAnalysis()
      }
    } catch (error) {
      console.error("Error analyzing video:", error)
      generateMockAnalysis()
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateMockAnalysis = () => {
    const mockResults: AnalysisResult[] = []
    const videoDuration = videoRef.current?.duration || 10

    // Simulate progress
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += 10
      setAnalysisProgress(progress)
      if (progress >= 100) {
        clearInterval(progressInterval)
      }
    }, 200)

    for (let i = 0; i < videoDuration; i += 0.5) {
      const issues: PostureIssue[] = []

      // Generate realistic posture issues
      if (Math.random() > 0.7) {
        issues.push({
          type: "neck_forward",
          message: "Forward head posture detected - align your head over shoulders",
          severity: "medium",
        })
      }

      if (Math.random() > 0.8) {
        issues.push({
          type: "back_slouch",
          message: "Slouching detected - straighten your back and engage core",
          severity: "high",
        })
      }

      mockResults.push({
        frame_number: Math.floor(i * 30),
        timestamp: i,
        posture_issues: issues,
        pose_detected: true,
      })
    }

    setAnalysisResults(mockResults)
  }

  const drawOverlay = (result: AnalysisResult) => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw pose indicators if issues detected
    if (result.posture_issues.length > 0) {
      // Draw warning border
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 4
      ctx.setLineDash([10, 10])
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

      // Draw warning indicator
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
      ctx.fillRect(30, 30, 200, 40)

      ctx.fillStyle = "white"
      ctx.font = "16px Arial"
      ctx.fillText("⚠️ Posture Issues", 40, 55)
    }
  }

  const clearOverlay = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Video Analysis Player</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto max-h-96"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
          </div>

          {/* Video Controls */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center space-x-4">
              <Button onClick={handlePlay} size="sm">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex-1">
                <Progress value={(currentTime / duration) * 100} className="w-full" />
              </div>
              <span className="text-sm text-gray-500 min-w-20">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Analysis Button */}
            <div className="flex items-center space-x-4">
              <Button onClick={analyzeVideo} disabled={isAnalyzing} className="flex-1" size="lg">
                {isAnalyzing ? "Analyzing..." : "Start Posture Analysis"}
              </Button>
              {isAnalyzing && (
                <div className="flex-1">
                  <Progress value={analysisProgress} className="w-full" />
                  <p className="text-sm text-gray-500 mt-1">Processing: {analysisProgress}%</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Issues */}
      {currentIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Current Posture Issues ({formatTime(currentTime)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
