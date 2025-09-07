import { createCanvas, loadImage } from 'canvas'
import fs from 'fs'
import path from 'path'

export class ImageGenerator {
  private outputDir: string

  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'generated')
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async generateSceneImage(description: string, sceneNumber: number, language: string): Promise<string> {
    try {
      // For now, create beautiful AI-style placeholder images
      // In production, this would call DALL-E or other image generation APIs
      const canvas = createCanvas(1024, 1024)
      const ctx = canvas.getContext('2d')

      // Create gradient backgrounds based on scene content
      const gradients = this.getGradientForScene(description, sceneNumber)
      const gradient = ctx.createLinearGradient(0, 0, 1024, 1024)
      gradient.addColorStop(0, gradients.start)
      gradient.addColorStop(0.5, gradients.middle)
      gradient.addColorStop(1, gradients.end)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1024, 1024)

      // Add artistic elements based on description
      this.addArtisticElements(ctx, description, sceneNumber)

      // Add scene text overlay
      this.addTextOverlay(ctx, description, sceneNumber, language)

      // Save image
      const filename = `scene_${sceneNumber}_${Date.now()}.png`
      const filepath = path.join(this.outputDir, filename)
      const buffer = canvas.toBuffer('image/png')
      fs.writeFileSync(filepath, buffer)

      return `/generated/${filename}`
    } catch (error) {
      console.error('Image generation error:', error)
      return this.createFallbackImage(description, sceneNumber)
    }
  }

  private getGradientForScene(description: string, sceneNumber: number): { start: string, middle: string, end: string } {
    const desc = description.toLowerCase()

    // Scene-based color schemes
    if (desc.includes('village') || desc.includes('home') || desc.includes('house')) {
      return { start: '#ff9a9e', middle: '#fecfef', end: '#fecfef' }
    } else if (desc.includes('forest') || desc.includes('tree') || desc.includes('nature')) {
      return { start: '#a8edea', middle: '#fed6e3', end: '#d299c2' }
    } else if (desc.includes('mountain') || desc.includes('hill') || desc.includes('peak')) {
      return { start: '#667eea', middle: '#764ba2', end: '#f093fb' }
    } else if (desc.includes('water') || desc.includes('river') || desc.includes('ocean')) {
      return { start: '#4facfe', middle: '#00f2fe', end: '#43e97b' }
    } else if (desc.includes('sunset') || desc.includes('sunrise') || desc.includes('golden')) {
      return { start: '#fa709a', middle: '#fee140', end: '#fa709a' }
    } else if (desc.includes('night') || desc.includes('dark') || desc.includes('moon')) {
      return { start: '#2c3e50', middle: '#4a6741', end: '#2c5364' }
    } else {
      // Default gradients based on scene number
      const gradients = [
        { start: '#667eea', middle: '#764ba2', end: '#f093fb' },
        { start: '#f093fb', middle: '#f5576c', end: '#4facfe' },
        { start: '#43e97b', middle: '#38f9d7', end: '#667eea' },
        { start: '#fa709a', middle: '#fee140', end: '#43e97b' }
      ]
      return gradients[sceneNumber % gradients.length]
    }
  }

  private addArtisticElements(ctx: CanvasRenderingContext2D, description: string, sceneNumber: number) {
    const desc = description.toLowerCase()

    // Add geometric shapes and patterns
    ctx.globalAlpha = 0.3

    // Add circles for organic/nature scenes
    if (desc.includes('nature') || desc.includes('organic') || desc.includes('life')) {
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.arc(
          Math.random() * 1024,
          Math.random() * 1024,
          Math.random() * 100 + 50,
          0,
          2 * Math.PI
        )
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`
        ctx.fill()
      }
    }

    // Add rectangles for architectural/structured scenes
    if (desc.includes('building') || desc.includes('house') || desc.includes('structure')) {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`
        ctx.fillRect(
          Math.random() * 800,
          Math.random() * 800,
          Math.random() * 200 + 100,
          Math.random() * 200 + 100
        )
      }
    }

    // Add triangular elements for dynamic/action scenes
    if (desc.includes('action') || desc.includes('movement') || desc.includes('journey')) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        const x = Math.random() * 1024
        const y = Math.random() * 1024
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.random() * 100, y + Math.random() * 100)
        ctx.lineTo(x - Math.random() * 100, y + Math.random() * 100)
        ctx.closePath()
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`
        ctx.fill()
      }
    }

    ctx.globalAlpha = 1
  }

  private addTextOverlay(ctx: CanvasRenderingContext2D, description: string, sceneNumber: number, language: string) {
    // Add scene number indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(50, 50, 150, 80)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Scene ${sceneNumber}`, 125, 90)

    // Add description at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 850, 1024, 174)

    ctx.fillStyle = 'white'
    ctx.font = '28px Arial'
    ctx.textAlign = 'center'

    // Word wrap description
    const words = description.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      if (metrics.width > 950 && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)

    // Draw description lines
    const lineHeight = 35
    const startY = 937 - ((lines.length - 1) * lineHeight) / 2

    lines.forEach((line, index) => {
      ctx.fillText(line, 512, startY + index * lineHeight)
    })

    // Add language indicator
    ctx.font = '20px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.textAlign = 'right'
    ctx.fillText(`Generated for ${language}`, 974, 1000)
  }

  private createFallbackImage(description: string, sceneNumber: number): string {
    // Return a placeholder image URL as fallback
    const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57', 'ff9ff3']
    const color = colors[sceneNumber % colors.length]
    return `https://via.placeholder.com/1024x1024/${color}/ffffff?text=Scene+${sceneNumber}`
  }
}
