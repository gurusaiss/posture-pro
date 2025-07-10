// Automated testing script for PosturePro
// Run with: node automated-tests.js

const axios = require("axios")
const fs = require("fs")
const FormData = require("form-data")

class PostureProTester {
  constructor(frontendUrl, backendUrl) {
    this.frontendUrl = frontendUrl
    this.backendUrl = backendUrl
    this.results = []
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString()
    const logEntry = { timestamp, message, type }
    this.results.push(logEntry)

    const colors = {
      success: "\x1b[32m",
      error: "\x1b[31m",
      warning: "\x1b[33m",
      info: "\x1b[36m",
      reset: "\x1b[0m",
    }

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
  }

  async testBackendHealth() {
    try {
      const response = await axios.get(`${this.backendUrl}/health`)
      if (response.status === 200) {
        this.log("✅ Backend health check passed", "success")
        this.log(`Backend status: ${response.data.status}`, "info")
        return true
      }
    } catch (error) {
      this.log(`❌ Backend health check failed: ${error.message}`, "error")
      return false
    }
  }

  async testAPIEndpoints() {
    const endpoints = ["/", "/health", "/stats"]
    let passedCount = 0

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.backendUrl}${endpoint}`)
        if (response.status === 200) {
          this.log(`✅ Endpoint ${endpoint} working`, "success")
          passedCount++
        } else {
          this.log(`❌ Endpoint ${endpoint} returned ${response.status}`, "error")
        }
      } catch (error) {
        this.log(`❌ Endpoint ${endpoint} failed: ${error.message}`, "error")
      }
    }

    this.log(
      `API Endpoints: ${passedCount}/${endpoints.length} passed`,
      passedCount === endpoints.length ? "success" : "warning",
    )
    return passedCount === endpoints.length
  }

  async testFrameAnalysis() {
    try {
      // Create a simple test image
      const testImageBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        "base64",
      )

      const formData = new FormData()
      formData.append("frame", testImageBuffer, {
        filename: "test.png",
        contentType: "image/png",
      })

      const response = await axios.post(`${this.backendUrl}/analyze-frame`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000,
      })

      if (response.status === 200) {
        this.log("✅ Frame analysis endpoint working", "success")
        this.log(`Pose detected: ${response.data.pose_detected}`, "info")
        this.log(`Confidence: ${(response.data.confidence_score * 100).toFixed(1)}%`, "info")
        return true
      }
    } catch (error) {
      this.log(`❌ Frame analysis failed: ${error.message}`, "error")
      return false
    }
  }

  async testVideoAnalysis(videoPath) {
    if (!fs.existsSync(videoPath)) {
      this.log(`⚠️ Test video not found: ${videoPath}`, "warning")
      return false
    }

    try {
      const formData = new FormData()
      formData.append("video", fs.createReadStream(videoPath))

      this.log("🔄 Starting video analysis test...", "info")
      const startTime = Date.now()

      const response = await axios.post(`${this.backendUrl}/analyze`, formData, {
        headers: formData.getHeaders(),
        timeout: 120000, // 2 minutes timeout
      })

      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000

      if (response.status === 200) {
        const results = response.data
        this.log(`✅ Video analysis completed in ${duration}s`, "success")
        this.log(`Processed ${results.length} frames`, "info")

        const framesWithIssues = results.filter((r) => r.posture_issues.length > 0).length
        this.log(`Found issues in ${framesWithIssues}/${results.length} frames`, "info")

        return true
      }
    } catch (error) {
      this.log(`❌ Video analysis failed: ${error.message}`, "error")
      return false
    }
  }

  async testFrontendAccess() {
    try {
      const response = await axios.get(this.frontendUrl, { timeout: 10000 })
      if (response.status === 200) {
        this.log("✅ Frontend is accessible", "success")
        return true
      }
    } catch (error) {
      this.log(`❌ Frontend access failed: ${error.message}`, "error")
      return false
    }
  }

  async runAllTests(videoPath = null) {
    this.log("🚀 Starting PosturePro automated tests", "info")
    this.log(`Frontend: ${this.frontendUrl}`, "info")
    this.log(`Backend: ${this.backendUrl}`, "info")

    const tests = [
      { name: "Frontend Access", test: () => this.testFrontendAccess() },
      { name: "Backend Health", test: () => this.testBackendHealth() },
      { name: "API Endpoints", test: () => this.testAPIEndpoints() },
      { name: "Frame Analysis", test: () => this.testFrameAnalysis() },
    ]

    if (videoPath) {
      tests.push({ name: "Video Analysis", test: () => this.testVideoAnalysis(videoPath) })
    }

    let passedTests = 0
    const totalTests = tests.length

    for (const { name, test } of tests) {
      this.log(`\n🧪 Running ${name} test...`, "info")
      const passed = await test()
      if (passed) passedTests++
    }

    this.log(
      `\n📊 Test Summary: ${passedTests}/${totalTests} tests passed`,
      passedTests === totalTests ? "success" : "warning",
    )

    // Save results to file
    fs.writeFileSync("test-results.json", JSON.stringify(this.results, null, 2))
    this.log("📄 Test results saved to test-results.json", "info")

    return passedTests === totalTests
  }
}

// Usage example
async function main() {
  const frontendUrl = process.env.FRONTEND_URL || "https://your-app.vercel.app"
  const backendUrl = process.env.BACKEND_URL || "https://your-app.railway.app"
  const videoPath = process.argv[2] // Optional video file path

  const tester = new PostureProTester(frontendUrl, backendUrl)
  const allTestsPassed = await tester.runAllTests(videoPath)

  process.exit(allTestsPassed ? 0 : 1)
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = PostureProTester
