import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const geminiKey = process.env.GEMINI_API_KEY
  const hasGeminiKey = !!(geminiKey && geminiKey.length > 10)
  
  // Check Ollama
  let ollamaStatus = 'offline'
  let ollamaModels: string[] = []
  try {
    const res = await fetch(
      `${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/tags`,
      { signal: AbortSignal.timeout(2000) }
    )
    if (res.ok) {
      const data = await res.json()
      ollamaModels = data.models?.map((m: any) => m.name) || []
      ollamaStatus = 'online'
    }
  } catch (e) {
    // Silently continue
  }

  return NextResponse.json({
    mode: hasGeminiKey ? 'gemini' : 'ollama',
    gemini: {
      configured: hasGeminiKey,
      model: 'gemini-1.5-flash'
    },
    ollama: {
      status: ollamaStatus,
      models: ollamaModels,
      url: process.env.OLLAMA_URL || 'http://localhost:11434'
    },
    ready: hasGeminiKey || ollamaStatus === 'online'
  })
}
