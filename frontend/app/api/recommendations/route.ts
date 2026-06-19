import { NextRequest, NextResponse } from "next/server"

export interface Recommendation {
  name: string
  category: "stretching" | "strengthening" | "ergonomics" | "breathing"
  steps: string[]
  duration: string
  benefit: string
  frequency: string
}

interface RecommendationsResponse {
  summary: string
  recommendations: Recommendation[]
}

const ISSUE_RECS: Record<string, Recommendation[]> = {
  neck_forward: [
    {
      name: "Chin Tucks",
      category: "stretching",
      steps: [
        "Sit or stand tall, look straight ahead",
        "Without tilting your head, pull your chin straight back as if making a double chin",
        "Hold 5 seconds, fully release — don't just reduce the movement",
      ],
      duration: "3 sets × 10 reps",
      benefit: "Directly retrains the deep cervical flexors that hold your head over your spine, reversing forward head posture.",
      frequency: "Every 2 hours while at a desk",
    },
    {
      name: "Upper Trapezius Stretch",
      category: "stretching",
      steps: [
        "Sit tall, place your right hand behind your lower back",
        "Tilt your left ear toward your left shoulder",
        "Use your left hand to very gently add downward pressure on the right side of your head",
      ],
      duration: "30 seconds each side, 2 sets",
      benefit: "Releases the neck and upper trap tightness that accumulates from forward head posture.",
      frequency: "Morning and evening daily",
    },
    {
      name: "Monitor Height Adjustment",
      category: "ergonomics",
      steps: [
        "Sit in your normal working posture with eyes level",
        "The top edge of your monitor should be at or just below eye level",
        "Use a monitor riser, laptop stand, or stack of books to achieve this",
      ],
      duration: "One-time adjustment",
      benefit: "Removes the ergonomic root cause — a low screen forces the head forward every time you look at it.",
      frequency: "Re-check every 2 weeks",
    },
  ],
  forward_head: [
    {
      name: "Chin Tucks",
      category: "stretching",
      steps: [
        "Sit or stand tall, look straight ahead",
        "Pull chin straight back without tilting your head up or down",
        "Hold 5 seconds, release completely before the next rep",
      ],
      duration: "3 sets × 10 reps",
      benefit: "Retrains deep cervical flexors to hold your head directly over your spine.",
      frequency: "Every 2 hours at your desk",
    },
  ],
  back_slouch: [
    {
      name: "Cat-Cow Stretch",
      category: "stretching",
      steps: [
        "Start on hands and knees, wrists under shoulders, knees under hips",
        "Inhale: arch back, let belly drop toward floor, lift tailbone and chest (Cow)",
        "Exhale: round spine toward ceiling, tuck chin and pelvis (Cat) — move smoothly between both",
      ],
      duration: "10 slow flowing repetitions",
      benefit: "Mobilizes the full thoracic spine and activates postural extensor muscles that keep you upright.",
      frequency: "Every morning and on desk breaks",
    },
    {
      name: "Thoracic Extension",
      category: "stretching",
      steps: [
        "Sit in a chair, interlace fingers behind your head, elbows wide",
        "Gently arch backward over the top edge of the chair's back",
        "Hold 3–5 seconds, return slowly — place a towel roll on the chair if it's uncomfortable",
      ],
      duration: "5–8 reps, 2 sets",
      benefit: "Directly reverses thoracic kyphosis (the rounded mid-back slouch) that hours of sitting cause.",
      frequency: "Every hour at your desk",
    },
    {
      name: "Bird-Dog",
      category: "strengthening",
      steps: [
        "Start on hands and knees in a tabletop position, neutral spine",
        "Simultaneously extend your right arm forward and left leg back — hold for 3 seconds",
        "Return to start with control, then repeat on the opposite side",
      ],
      duration: "3 sets × 8 reps each side",
      benefit: "Builds the deep spinal stabilizers and glute strength that maintain upright posture throughout the day.",
      frequency: "3–4 times per week",
    },
  ],
  uneven_shoulders: [
    {
      name: "Levator Scapulae Stretch",
      category: "stretching",
      steps: [
        "Rotate your head 45° toward the tight side (the higher shoulder)",
        "Tilt your nose toward your armpit on that side",
        "Gently pull down with the same-side hand on the back of your head for overpressure",
      ],
      duration: "30 seconds each side, 2 sets",
      benefit: "Releases the levator scapulae, which is chronically tighter on the side with the elevated shoulder.",
      frequency: "2–3 times daily",
    },
    {
      name: "Wall Angels",
      category: "strengthening",
      steps: [
        "Stand with your back, shoulders, and head pressed firmly against a wall, feet 6 inches out",
        "Raise arms to a goal-post position against the wall (elbows at 90°)",
        "Slowly slide arms up to overhead and back down — keep everything touching the wall",
      ],
      duration: "3 sets × 10 reps",
      benefit: "Activates the lower trapezius and serratus anterior to balance shoulder height and retract rounded shoulders.",
      frequency: "Daily",
    },
    {
      name: "Armrest Height Check",
      category: "ergonomics",
      steps: [
        "Sit at your desk and let arms hang completely relaxed at your sides",
        "Adjust armrests so elbows rest at 90° without any shoulder shrugging",
        "If armrests push arms inward or force a shrug on either side, lower or remove them",
      ],
      duration: "One-time setup",
      benefit: "Misaligned armrests are a leading cause of one chronically elevated shoulder — fixing this stops the issue at the source.",
      frequency: "Re-check monthly",
    },
  ],
  shoulder_hunch: [
    {
      name: "Shoulder Blade Squeezes",
      category: "strengthening",
      steps: [
        "Sit or stand with arms at your sides, spine tall",
        "Squeeze your shoulder blades together and downward (not just together)",
        "Hold for 5 seconds, then release completely and repeat",
      ],
      duration: "3 sets × 15 reps",
      benefit: "Activates the mid and lower trapezius muscles that keep shoulders depressed and retracted throughout the day.",
      frequency: "Every hour at your desk",
    },
    {
      name: "Doorway Chest Stretch",
      category: "stretching",
      steps: [
        "Stand in a doorway, place both forearms on the door frame at 90°",
        "Step one foot forward and gently lean through the doorway",
        "Hold until you feel a stretch across your chest and front shoulders — don't force it",
      ],
      duration: "3 × 30 seconds",
      benefit: "Releases the pectorals and anterior deltoids that pull shoulders forward and up into a hunched position.",
      frequency: "Morning, afternoon, and before bed",
    },
  ],
  head_drop: [
    {
      name: "Suboccipital Release",
      category: "stretching",
      steps: [
        "Interlace fingers behind your head at the base of your skull",
        "Gently nod your chin toward your chest while pressing your head lightly into your hands",
        "Hold 30–60 seconds — breathe slowly and let the muscles release",
      ],
      duration: "2–3 times, 30–60 seconds each",
      benefit: "Releases the suboccipital muscles that become chronically tight from looking down at a phone or low screen.",
      frequency: "After every 30 minutes of screen time",
    },
    {
      name: "Device at Eye Level Habit",
      category: "ergonomics",
      steps: [
        "When checking your phone, raise it to eye level — rest your elbow on a surface if needed",
        "For laptops, use an external keyboard and raise the screen with a stand",
        "For tablets, use a stand angled at 45–70°",
      ],
      duration: "Habit to build — no time limit",
      benefit: "Eliminates 40–60 lbs of extra neck load caused by looking down. Even a 15° tilt doubles the effective neck strain.",
      frequency: "Every time you use a device",
    },
  ],
  general: [
    {
      name: "Diaphragmatic Breathing",
      category: "breathing",
      steps: [
        "Sit tall and place one hand on your chest, one on your belly",
        "Inhale slowly through your nose — only the belly hand should rise, chest stays still",
        "Exhale slowly through pursed lips — feel your belly fall",
      ],
      duration: "10 slow breaths, 2–3 times daily",
      benefit: "Activates the diaphragm and deep core, providing the biomechanical foundation that all good posture is built on.",
      frequency: "Morning, before work sessions, and before sleep",
    },
    {
      name: "20-20-20 Rule",
      category: "ergonomics",
      steps: [
        "Set a recurring timer for every 20 minutes of screen work",
        "Look at something at least 20 feet away for 20 seconds",
        "Stand, roll your shoulders back, and reset your posture before sitting again",
      ],
      duration: "20 seconds every 20 minutes",
      benefit: "Prevents postural fatigue and the cumulative slouch that builds over hours of uninterrupted sitting.",
      frequency: "Throughout every work day",
    },
    {
      name: "Hip Flexor Stretch (Couch Stretch)",
      category: "stretching",
      steps: [
        "Kneel on one knee in a lunge, place the back foot elevated on a chair or couch",
        "Gently drive hips forward while keeping torso upright",
        "Squeeze the glute of the back leg to deepen the stretch",
      ],
      duration: "45 seconds each side, 2 sets",
      benefit: "Tight hip flexors tilt the pelvis forward, forcing exaggerated lumbar curve and a downstream slouch through the whole spine.",
      frequency: "After every hour of sitting",
    },
  ],
}

function buildFallback(issues: string[]): RecommendationsResponse {
  const recs: Recommendation[] = []
  const seen = new Set<string>()

  for (const issue of issues) {
    const key = issue.replace(/ /g, "_").toLowerCase()
    for (const r of ISSUE_RECS[key] || []) {
      if (!seen.has(r.name) && recs.length < 3) {
        seen.add(r.name)
        recs.push(r)
      }
    }
    if (recs.length >= 3) break
  }

  for (const r of ISSUE_RECS.general) {
    if (!seen.has(r.name) && recs.length < 3) {
      seen.add(r.name)
      recs.push(r)
    }
  }

  const issueLabel =
    issues.length > 0
      ? `detected issues including ${issues.slice(0, 2).join(" and ")}`
      : "your posture analysis"

  return {
    summary: `Based on ${issueLabel}, here are 3 targeted exercises to improve your posture and reduce discomfort.`,
    recommendations: recs.slice(0, 3),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { issues, goodPosturePct, sessionType } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(buildFallback(issues || []))
    }

    const issueList = (issues as string[]).join(", ") || "no specific issues"
    const prompt = `You are a certified physical therapist and ergonomics specialist.

A user completed a ${sessionType || "posture"} analysis session with ${goodPosturePct ?? 0}% good posture frames.
Issues detected: ${issueList}.

Generate exactly 3 specific, actionable exercise recommendations targeting their detected issues.
Respond ONLY with valid JSON — no markdown fences, no extra text:
{
  "summary": "One sentence personalized summary mentioning their specific issues and an improvement path",
  "recommendations": [
    {
      "name": "Exercise Name",
      "category": "stretching",
      "steps": ["Specific step 1", "Specific step 2", "Specific step 3"],
      "duration": "X sets × Y reps or X seconds",
      "benefit": "Exactly why this addresses their specific detected issue — be specific",
      "frequency": "How often per day or week"
    }
  ]
}

Categories must be one of: stretching, strengthening, ergonomics, breathing.
Steps must be very specific and actionable. Benefit must reference their exact issues.`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      },
    )

    if (!geminiRes.ok) {
      return NextResponse.json(buildFallback(issues || []))
    }

    const geminiData = await geminiRes.json()
    const text: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json(buildFallback(issues || []))

    const parsed = JSON.parse(jsonMatch[0]) as RecommendationsResponse
    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Recommendations error:", err)
    return NextResponse.json(buildFallback([]))
  }
}
