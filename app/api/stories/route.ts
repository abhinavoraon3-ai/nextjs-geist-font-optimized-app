import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { title, originalText, inputLanguage, narrationLanguage } = await request.json()

    if (!title || !originalText) {
      return NextResponse.json(
        { error: 'Title and original text are required' },
        { status: 400 }
      )
    }

    const story = await prisma.story.create({
      data: {
        title,
        originalText,
        status: 'pending',
        // Store language preferences in summary field temporarily for demo
        summary: JSON.stringify({ inputLanguage: inputLanguage || 'en', narrationLanguage: narrationLanguage || 'en' })
      },
      include: {
        scenes: true
      }
    })

    return NextResponse.json(story)
  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      include: {
        scenes: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(stories)
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}
