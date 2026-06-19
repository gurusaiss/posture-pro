"use client"

import { useState } from "react"
import { Activity, ChevronDown, ChevronUp, Dumbbell, Leaf, Laptop, Wind } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Exercise {
  name: string
  category: "neck" | "back" | "shoulders" | "core" | "ergonomics" | "breathing"
  difficulty: "easy" | "medium"
  targetIssues: string[]
  steps: string[]
  duration: string
  frequency: string
  benefit: string
}

const EXERCISES: Exercise[] = [
  {
    name: "Chin Tucks",
    category: "neck",
    difficulty: "easy",
    targetIssues: ["Forward Head", "Neck Pain"],
    steps: [
      "Sit or stand tall, look straight ahead with a neutral spine",
      "Without tilting your head, pull your chin straight back as if making a double chin",
      "Hold 5 seconds, then release completely before repeating",
    ],
    duration: "3 sets × 10 reps",
    frequency: "Every 2 hours",
    benefit: "Retrains the deep cervical flexors that hold your head directly over your spine.",
  },
  {
    name: "Neck Retraction Stretch",
    category: "neck",
    difficulty: "easy",
    targetIssues: ["Forward Head", "Neck Stiffness"],
    steps: [
      "Place two fingers on your chin",
      "Gently push your chin straight back while keeping your head level",
      "At the end range, tilt your head back slightly and hold 2–3 seconds",
    ],
    duration: "2 sets × 8 reps",
    frequency: "2× daily",
    benefit: "Combines retraction with extension to restore full cervical mobility lost from screen time.",
  },
  {
    name: "Suboccipital Release",
    category: "neck",
    difficulty: "easy",
    targetIssues: ["Head Drop", "Phone Neck", "Headaches"],
    steps: [
      "Interlace your fingers behind your head at the base of your skull",
      "Gently nod your chin toward your chest while pressing your head lightly into your hands",
      "Breathe slowly and hold 30–60 seconds — let the muscles release gradually",
    ],
    duration: "30–60 seconds, 2–3 times",
    frequency: "After every 30 min of screen time",
    benefit: "Releases the suboccipital muscles that tighten from looking down at a phone or low screen.",
  },
  {
    name: "Upper Trapezius Stretch",
    category: "neck",
    difficulty: "easy",
    targetIssues: ["Uneven Shoulders", "Neck Tension"],
    steps: [
      "Sit tall, place one hand behind your lower back to anchor the shoulder",
      "Tilt the opposite ear toward the opposite shoulder",
      "Use the free hand to gently add light overpressure on the top of your head",
    ],
    duration: "30 sec each side, 2 sets",
    frequency: "Morning and evening",
    benefit: "Releases the tight upper trap that elevates and rotates the shoulder on the tighter side.",
  },
  {
    name: "Cat-Cow Stretch",
    category: "back",
    difficulty: "easy",
    targetIssues: ["Slouching", "Back Stiffness"],
    steps: [
      "Start on hands and knees — wrists under shoulders, knees under hips",
      "Inhale: arch back, let belly drop toward floor, lift tailbone and chest (Cow)",
      "Exhale: round spine toward ceiling, tuck chin and pelvis (Cat). Flow smoothly between both.",
    ],
    duration: "10 slow flowing reps",
    frequency: "Every morning and on desk breaks",
    benefit: "Mobilizes the full thoracic spine and activates the postural extensor muscles.",
  },
  {
    name: "Thoracic Extension",
    category: "back",
    difficulty: "easy",
    targetIssues: ["Slouching", "Rounded Back"],
    steps: [
      "Sit in a chair, interlace fingers behind your head, elbows wide",
      "Gently arch backward over the top edge of the chair back",
      "Hold 3–5 seconds, return slowly. Use a rolled towel on the chair back for comfort.",
    ],
    duration: "5–8 reps, 2 sets",
    frequency: "Every hour at your desk",
    benefit: "Directly reverses thoracic kyphosis — the rounded mid-back that hours of sitting create.",
  },
  {
    name: "Child's Pose",
    category: "back",
    difficulty: "easy",
    targetIssues: ["Back Tension", "General Stiffness"],
    steps: [
      "Kneel and sit back toward your heels, knees hip-width apart",
      "Extend arms overhead on the floor and lower your forehead to rest",
      "Breathe deeply into your lower back — hold without forcing",
    ],
    duration: "60–90 seconds",
    frequency: "Morning and evening, after long sitting sessions",
    benefit: "Decompresses the lumbar spine and provides a gentle full-back stretch.",
  },
  {
    name: "Bird-Dog",
    category: "core",
    difficulty: "medium",
    targetIssues: ["Slouching", "Back Weakness"],
    steps: [
      "Start on hands and knees in tabletop — neutral spine, no sagging or arching",
      "Simultaneously extend your right arm forward and left leg back",
      "Hold 3 seconds keeping hips level. Return with control, then switch sides.",
    ],
    duration: "3 sets × 8 reps each side",
    frequency: "3–4× per week",
    benefit: "Builds deep spinal stabilizers and glute strength that maintain upright posture all day.",
  },
  {
    name: "Dead Bug",
    category: "core",
    difficulty: "medium",
    targetIssues: ["Slouching", "Core Weakness"],
    steps: [
      "Lie on your back, arms pointing to the ceiling, hips and knees at 90°",
      "Press your low back firmly into the floor and maintain this throughout",
      "Slowly lower one arm overhead while extending the opposite leg — return and switch sides",
    ],
    duration: "3 sets × 6 reps each side",
    frequency: "3× per week",
    benefit: "Trains the deep core anti-extension stability that keeps you from slouching under load.",
  },
  {
    name: "Wall Angels",
    category: "shoulders",
    difficulty: "easy",
    targetIssues: ["Uneven Shoulders", "Rounded Shoulders"],
    steps: [
      "Stand with back, shoulders, and head pressed against a wall — feet 6 inches from the base",
      "Raise arms to a 90° goalpost position against the wall",
      "Slowly slide arms up to overhead and back down while everything stays touching the wall",
    ],
    duration: "3 sets × 10 reps",
    frequency: "Daily",
    benefit: "Activates lower trapezius and serratus anterior to pull shoulders back and level them out.",
  },
  {
    name: "Doorway Chest Stretch",
    category: "shoulders",
    difficulty: "easy",
    targetIssues: ["Rounded Shoulders", "Shoulder Hunch"],
    steps: [
      "Stand in a doorway, forearms on the frame at 90° (elbow at shoulder height)",
      "Step one foot forward and gently lean through the doorway",
      "Hold until you feel a stretch across chest and front shoulders — don't bounce",
    ],
    duration: "3 × 30 seconds",
    frequency: "Morning, midday, evening",
    benefit: "Releases tight pectorals and anterior deltoids that pull shoulders forward and up.",
  },
  {
    name: "Shoulder Blade Squeezes",
    category: "shoulders",
    difficulty: "easy",
    targetIssues: ["Shoulder Hunch", "Rounded Shoulders"],
    steps: [
      "Sit or stand with arms at your sides, spine tall",
      "Squeeze shoulder blades together AND downward simultaneously",
      "Hold 5 seconds, then release completely before the next rep",
    ],
    duration: "3 sets × 15 reps",
    frequency: "Every hour at your desk",
    benefit: "Activates mid and lower trapezius — the muscles that keep shoulders depressed and retracted.",
  },
  {
    name: "Hip Flexor Stretch (Couch Stretch)",
    category: "back",
    difficulty: "easy",
    targetIssues: ["Slouching", "Lower Back Pain"],
    steps: [
      "Kneel on one knee with back foot elevated on a chair or couch",
      "Gently push hips forward while keeping your torso perfectly upright",
      "Squeeze the glute of the back leg to intensify the stretch",
    ],
    duration: "45 sec each side, 2 sets",
    frequency: "After every hour of sitting",
    benefit: "Tight hip flexors anteriorly tilt the pelvis, forcing a downstream exaggerated slouch through the entire spine.",
  },
  {
    name: "Diaphragmatic Breathing",
    category: "breathing",
    difficulty: "easy",
    targetIssues: ["General Posture", "Tension"],
    steps: [
      "Sit tall and place one hand on your chest, one on your belly",
      "Inhale slowly through your nose — only the belly hand should rise, chest stays still",
      "Exhale slowly through pursed lips — feel your belly fall and core gently engage",
    ],
    duration: "10 slow breaths, 2–3 sessions",
    frequency: "Morning, before focus sessions, before sleep",
    benefit: "Activates the diaphragm and deep core — the biomechanical foundation all good posture is built on.",
  },
  {
    name: "Monitor & Desk Ergonomic Setup",
    category: "ergonomics",
    difficulty: "easy",
    targetIssues: ["Forward Head", "Shoulder Hunch", "All Issues"],
    steps: [
      "Screen: top edge at or just below eye level, arm's length away, no glare",
      "Chair: feet flat on floor, knees at 90°, lower back supported, elbows at 90°",
      "Keyboard/mouse: close enough that shoulders are relaxed — not reached forward",
    ],
    duration: "One-time setup (~15 minutes)",
    frequency: "Re-check monthly and after any desk change",
    benefit: "Correct ergonomics removes the environmental root causes — no exercise routine can fully compensate for a poorly set up workspace.",
  },
]

const FILTERS = [
  { key: "all", label: "All Exercises" },
  { key: "neck", label: "Neck" },
  { key: "back", label: "Back & Hips" },
  { key: "shoulders", label: "Shoulders" },
  { key: "core", label: "Core" },
  { key: "ergonomics", label: "Ergonomics" },
  { key: "breathing", label: "Breathing" },
]

const CATEGORY_COLORS: Record<string, string> = {
  neck: "bg-blue-100 text-blue-700 border-blue-200",
  back: "bg-amber-100 text-amber-700 border-amber-200",
  shoulders: "bg-purple-100 text-purple-700 border-purple-200",
  core: "bg-green-100 text-green-700 border-green-200",
  ergonomics: "bg-indigo-100 text-indigo-700 border-indigo-200",
  breathing: "bg-sky-100 text-sky-700 border-sky-200",
}

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  neck: Leaf,
  back: Leaf,
  shoulders: Dumbbell,
  core: Dumbbell,
  ergonomics: Laptop,
  breathing: Wind,
}

export default function ExercisesPage() {
  const [filter, setFilter] = useState<string>("all")
  const [expanded, setExpanded] = useState<number | null>(null)

  const visible = filter === "all" ? EXERCISES : EXERCISES.filter((e) => e.category === filter)

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
            <a href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </a>
            <a href="/history">
              <Button variant="ghost" size="sm">History</Button>
            </a>
            <a href="/">
              <Button variant="outline" size="sm">New Session</Button>
            </a>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1 text-sm font-medium mb-4">
            <Leaf className="h-4 w-4" />
            Exercise Library
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Posture Exercise Library</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            15 evidence-based exercises targeting every common posture issue. Each one includes step-by-step instructions and the science behind it.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setExpanded(null) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-sm text-gray-500 mb-4 text-center">
          Showing {visible.length} exercise{visible.length !== 1 ? "s" : ""}
        </p>

        {/* Exercise cards */}
        <div className="space-y-3">
          {visible.map((ex, i) => {
            const isOpen = expanded === i
            const colorClass = CATEGORY_COLORS[ex.category] || "bg-gray-100 text-gray-700"
            const Icon = CATEGORY_ICONS[ex.category] || Leaf

            return (
              <Card
                key={ex.name}
                className={`overflow-hidden border transition-all ${isOpen ? "shadow-md border-blue-200" : "border-gray-200 hover:border-blue-100"}`}
              >
                <button
                  className="w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : i)}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{ex.name}</span>
                      <Badge className={`text-xs border font-normal ${colorClass}`}>
                        {ex.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${ex.difficulty === "easy" ? "border-green-200 text-green-700" : "border-orange-200 text-orange-700"}`}
                      >
                        {ex.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{ex.duration}</span>
                      <span className="text-gray-300 text-xs">·</span>
                      <div className="flex gap-1 flex-wrap">
                        {ex.targetIssues.map((issue) => (
                          <span key={issue} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </button>

                {isOpen && (
                  <CardContent className="pt-0 pb-4 px-4 border-t border-gray-100">
                    <div className="ml-13 space-y-4 mt-3" style={{ marginLeft: "52px" }}>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Instructions
                        </h4>
                        <ol className="space-y-2">
                          {ex.steps.map((step, j) => (
                            <li key={j} className="flex gap-2 text-sm text-gray-700">
                              <span className="text-blue-500 font-bold flex-shrink-0 tabular-nums">{j + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                          <span className="font-semibold">Why it works: </span>
                          {ex.benefit}
                        </p>
                      </div>

                      <div className="flex gap-6 text-xs text-gray-600 flex-wrap">
                        <div>
                          <span className="font-semibold text-gray-700">Duration:</span> {ex.duration}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Frequency:</span> {ex.frequency}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          These exercises are for general wellness. Consult a healthcare professional if you experience pain.
        </p>
      </div>
    </div>
  )
}
