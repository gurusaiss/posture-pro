"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, Camera, RotateCcw, Activity, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import VideoAnalyzer from "@/components/video-analyzer"
import WebcamAnalyzer from "@/components/webcam-analyzer"

export default function HomePage() {
  const [mode, setMode] = useState<"home" | "upload" | "webcam">("home")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PosturePro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                About
              </Button>
              <Button variant="ghost" size="sm">
                Features
              </Button>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {mode === "home" && (
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Perfect Your Posture with
                <span className="text-blue-600"> AI Technology</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Get real-time feedback on your posture during exercises and daily activities. Upload videos or use your
                webcam for instant analysis and improvement tips.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-center mb-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">10K+</div>
                  <div className="text-gray-600">Users Improved</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-center mb-3">
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">95%</div>
                  <div className="text-gray-600">Accuracy Rate</div>
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
                        Analyze posture in your recorded workout or daily activity videos
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full h-12 text-lg" size="lg">
                    Choose Video File
                  </Button>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-500">✓ Supports MP4, WebM, AVI formats</p>
                    <p className="text-sm text-gray-500">✓ Frame-by-frame analysis</p>
                    <p className="text-sm text-gray-500">✓ Detailed posture report</p>
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
                        Real-time posture monitoring using your camera
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setMode("webcam")} className="w-full h-12 text-lg" size="lg" variant="outline">
                    Start Live Analysis
                  </Button>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-500">✓ Instant feedback alerts</p>
                    <p className="text-sm text-gray-500">✓ Privacy-focused (no recording)</p>
                    <p className="text-sm text-gray-500">✓ Real-time corrections</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Advanced Posture Detection Features</CardTitle>
                <CardDescription className="text-lg">
                  Our AI analyzes multiple aspects of your posture for comprehensive feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                    <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">S</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Squat Analysis</h3>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li>• Knee-over-toe detection</li>
                      <li>• Back angle monitoring</li>
                      <li>• Depth assessment</li>
                      <li>• Form corrections</li>
                    </ul>
                  </div>
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                    <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-green-600">N</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Neck & Head</h3>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li>• Forward head posture</li>
                      <li>• Neck strain detection</li>
                      <li>• Head alignment</li>
                      <li>• Tech neck prevention</li>
                    </ul>
                  </div>
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                    <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-purple-600">B</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Spine & Back</h3>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li>• Spinal alignment</li>
                      <li>• Slouching detection</li>
                      <li>• Shoulder positioning</li>
                      <li>• Core engagement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-6 w-6" />
                <span className="text-xl font-bold">PosturePro</span>
              </div>
              <p className="text-gray-400">AI-powered posture analysis for better health and performance.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Video Analysis</li>
                <li>Live Webcam</li>
                <li>Posture Reports</li>
                <li>Exercise Tips</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Contact Us</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Blog</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PosturePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
