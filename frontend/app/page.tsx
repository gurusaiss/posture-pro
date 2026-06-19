"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, Camera, RotateCcw, Activity, Users, TrendingUp, BarChart2, History, LogOut, ChevronDown, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import VideoAnalyzer from "@/components/video-analyzer"
import WebcamAnalyzer from "@/components/webcam-analyzer"
import AuthModal from "@/components/auth-modal"
import { useAuth } from "@/context/auth-context"

export default function HomePage() {
  const [mode, setMode] = useState<"home" | "upload" | "webcam">("home")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, loading, signOut } = useAuth()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file)
      setMode("upload")
    }
  }

  const handleReset = () => {
    setMode("home")
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={handleReset} className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PosturePro</h1>
            </button>

            <div className="flex items-center space-x-2">
              {user && (
                <>
                  <a href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <BarChart2 className="h-4 w-4 mr-1" />
                      Dashboard
                    </Button>
                  </a>
                  <a href="/history">
                    <Button variant="ghost" size="sm">
                      <History className="h-4 w-4 mr-1" />
                      History
                    </Button>
                  </a>
                  <a href="/exercises">
                    <Button variant="ghost" size="sm">
                      <Dumbbell className="h-4 w-4 mr-1" />
                      Exercises
                    </Button>
                  </a>
                </>
              )}

              {!loading && (
                <>
                  {user ? (
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-1"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                          {displayName[0].toUpperCase()}
                        </div>
                        <span className="hidden sm:inline max-w-24 truncate">{displayName}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      {showUserMenu && (
                        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44 z-50">
                          <a href="/dashboard" className="flex items-center px-3 py-2 text-sm hover:bg-gray-50">
                            <BarChart2 className="h-4 w-4 mr-2 text-gray-500" /> Dashboard
                          </a>
                          <a href="/history" className="flex items-center px-3 py-2 text-sm hover:bg-gray-50">
                            <History className="h-4 w-4 mr-2 text-gray-500" /> History
                          </a>
                          <a href="/exercises" className="flex items-center px-3 py-2 text-sm hover:bg-gray-50">
                            <Dumbbell className="h-4 w-4 mr-2 text-gray-500" /> Exercise Library
                          </a>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => { signOut(); setShowUserMenu(false) }}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4 mr-2" /> Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button onClick={() => setShowAuthModal(true)} variant="outline" size="sm">
                      Sign In
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {mode === "home" && (
          <div className="max-w-6xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Perfect Your Posture with
                <span className="text-blue-600"> AI Technology</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Real-time posture feedback using MediaPipe computer vision. Upload a video or use your webcam for
                instant analysis, session tracking, and progress insights.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-center mb-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">33</div>
                  <div className="text-gray-600">MediaPipe Landmarks</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-center mb-3">
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">95%</div>
                  <div className="text-gray-600">Detection Accuracy</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-center mb-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-gray-600">Real-time Analysis</div>
                </div>
              </div>
            </div>

            {/* Main Options */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border-2 hover:border-blue-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Upload Video Analysis</CardTitle>
                      <CardDescription className="text-base">
                        Analyze posture in recorded workout or daily activity videos
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full h-12 text-lg" size="lg">
                    Choose Video File
                  </Button>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-500">✓ Supports MP4, WebM, AVI formats</p>
                    <p className="text-sm text-gray-500">✓ Frame-by-frame analysis</p>
                    <p className="text-sm text-gray-500">✓ Session saved to your history</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border-2 hover:border-green-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Camera className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Live Webcam Analysis</CardTitle>
                      <CardDescription className="text-base">
                        Real-time posture monitoring with live score gauge
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setMode("webcam")} className="w-full h-12 text-lg" size="lg" variant="outline">
                    Start Live Analysis
                  </Button>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-500">✓ Live posture score 0–100</p>
                    <p className="text-sm text-gray-500">✓ Color-coded visual feedback</p>
                    <p className="text-sm text-gray-500">✓ Session saved to history</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sign-in prompt if not authed */}
            {!user && !loading && (
              <div className="text-center py-8 bg-white/60 rounded-xl border border-gray-200">
                <BarChart2 className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Your Progress Over Time</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Sign in to save every session, view weekly trends, and see your posture improvement over time.
                </p>
                <Button onClick={() => setShowAuthModal(true)} size="lg">
                  Sign In Free
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === "upload" && selectedFile && (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Video Analysis</h2>
                <p className="text-gray-600 mt-1">Analyzing: {selectedFile.name}</p>
              </div>
              <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <VideoAnalyzer file={selectedFile} />
          </div>
        )}

        {mode === "webcam" && (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Live Webcam Analysis</h2>
                <p className="text-gray-600 mt-1">Real-time posture monitoring</p>
              </div>
              <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <WebcamAnalyzer />
          </div>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Close user menu on outside click */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
    </div>
  )
}
