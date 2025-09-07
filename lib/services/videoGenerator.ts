import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { createCanvas, loadImage } from 'canvas'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

interface Scene {
  imageUrl: string
  description: string
  duration: number // in seconds
}

interface VideoOptions {
  title: string
  scenes: Scene[]
  audioUrl?: string
  outputPath: string
  totalDuration: number // target duration in seconds (max 180 for 3 minutes)
}

export class VideoGenerator {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  async generateVideo(options: VideoOptions): Promise<string> {
    const { title, scenes, audioUrl, outputPath, totalDuration } = options

    try {
      // Calculate scene durations to fit total duration
      const sceneDuration = Math.floor((totalDuration - 5) / scenes.length) // 5s for title card
      const adjustedScenes = scenes.map(scene => ({
        ...scene,
        duration: sceneDuration
      }))

      // Generate title card
      const titleCardPath = await this.createTitleCard(title)

      // Process scenes and create video segments
      const videoSegments: string[] = [titleCardPath]

      // Add scene segments
      for (let i = 0; i < adjustedScenes.length; i++) {
        const scene = adjustedScenes[i]
        const segmentPath = await this.createSceneSegment(scene, i)
        videoSegments.push(segmentPath)
      }

      // Combine all segments into final video
      const finalVideoPath = await this.combineSegments(videoSegments, audioUrl, outputPath, totalDuration, sceneDuration)

      // Cleanup temp files
      this.cleanup(videoSegments)

      return finalVideoPath
    } catch (error) {
      console.error('Video generation error:', error)
      throw error
    }
  }

  private async createTitleCard(title: string): Promise<string> {
    const canvas = createCanvas(1920, 1080)
    const ctx = canvas.getContext('2d')

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1920, 1080)

    // Title text
    ctx.fillStyle = 'white'
    ctx.font = 'bold 80px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Word wrap for long titles
    const words = title.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      if (metrics.width > 1600 && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)

    // Draw title lines
    const lineHeight = 100
    const startY = 540 - ((lines.length - 1) * lineHeight) / 2

    lines.forEach((line, index) => {
      ctx.fillText(line, 960, startY + index * lineHeight)
    })

    // Subtitle
    ctx.font = '40px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText('AI StoryWeaver', 960, 800)

    // Save title card
    const titleCardPath = path.join(this.tempDir, 'title_card.png')
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(titleCardPath, buffer)

    return titleCardPath
  }

  private async createSceneSegment(scene: Scene, index: number): Promise<string> {
    const canvas = createCanvas(1920, 1080)
    const ctx = canvas.getContext('2d')

    try {
      // Load scene image
      let image
      if (scene.imageUrl.startsWith('http')) {
        // For remote images, download first
        const response = await axios.get(scene.imageUrl, { responseType: 'arraybuffer' })
        image = await loadImage(Buffer.from(response.data))
      } else {
        // For local images
        image = await loadImage(scene.imageUrl)
      }

      // Draw image (fit to canvas)
      const aspectRatio = image.width / image.height
      const canvasAspectRatio = 1920 / 1080

      let drawWidth, drawHeight, drawX, drawY

      if (aspectRatio > canvasAspectRatio) {
        drawWidth = 1920
        drawHeight = 1920 / aspectRatio
        drawX = 0
        drawY = (1080 - drawHeight) / 2
      } else {
        drawWidth = 1080 * aspectRatio
        drawHeight = 1080
        drawX = (1920 - drawWidth) / 2
        drawY = 0
      }

      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)

      // Add text overlay with scene description
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 900, 1920, 180)

      ctx.fillStyle = 'white'
      ctx.font = '36px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Word wrap description
      const words = scene.description.split(' ')
      const lines: string[] = []
      let currentLine = ''

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > 1800 && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) lines.push(currentLine)

      // Draw description lines
      const lineHeight = 45
      const startY = 990 - ((lines.length - 1) * lineHeight) / 2

      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, 960, startY + lineIndex * lineHeight)
      })

    } catch (error) {
      console.error('Error loading image for scene:', error)
      // Create fallback scene
      const gradient = ctx.createLinearGradient(0, 0, 1920, 1080)
      gradient.addColorStop(0, '#4facfe')
      gradient.addColorStop(1, '#00f2fe')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1920, 1080)

      ctx.fillStyle = 'white'
      ctx.font = 'bold 60px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`Scene ${index + 1}`, 960, 440)

      ctx.font = '40px Arial'
      ctx.fillText(scene.description, 960, 640)
    }

    // Save scene image
    const sceneImagePath = path.join(this.tempDir, `scene_${index}.png`)
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(sceneImagePath, buffer)

    return sceneImagePath
  }

  private async combineSegments(
    segments: string[],
    audioUrl: string | undefined,
    outputPath: string,
    totalDuration: number,
    sceneDuration: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg()

      // Add title card (5 seconds)
      command.input(segments[0])
        .inputOptions(['-loop 1', '-t 5'])

      // Add scene segments
      for (let i = 1; i < segments.length; i++) {
        command.input(segments[i])
          .inputOptions(['-loop 1', `-t ${sceneDuration}`])
      }

      // Add audio if provided
      const hasAudio = audioUrl && !audioUrl.includes('placeholder')
      if (hasAudio) {
        command.input(audioUrl)
      }

      const videoInputs = segments.map((_, i) => `[${i}:v]`).join('')
      const filter = `${videoInputs}concat=n=${segments.length}:v=1:a=0[outv]`

      command.complexFilter([filter])

      const outputOptions = [
        '-map [outv]',
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-r 30',
        `-t ${totalDuration}`,
        '-y'
      ]

      if (hasAudio) {
        outputOptions.push(`-map ${segments.length}:a`, '-c:a aac', '-shortest')
      }

      command
        .outputOptions(outputOptions)
        .output(outputPath)
        .on('end', () => {
          console.log('Video generation completed')
          resolve(outputPath)
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err)
          reject(err)
        })
        .on('progress', (progress) => {
          console.log('Video processing: ' + Math.round(progress.percent || 0) + '% done')
        })
        .run()
    })
  }

  private cleanup(filePaths: string[]) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    })
  }
}
