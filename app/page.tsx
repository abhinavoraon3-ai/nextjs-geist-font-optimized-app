'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Play, Download, Sparkles, FileText, Mic, Image, Video, Globe, Volume2, Languages } from 'lucide-react'

interface Story {
  id: string
  title: string
  originalText: string
  summary?: string
  audioUrl?: string
  videoUrl?: string
  status: string
  scenes: Scene[]
  inputLanguage?: string
  narrationLanguage?: string
}

interface Scene {
  id: string
  sceneNumber: number
  description: string
  imageUrl?: string
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
  { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
  { code: 'my', name: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' }
]

export default function Home() {
  const [title, setTitle] = useState('')
  const [storyText, setStoryText] = useState('')
  const [inputLanguage, setInputLanguage] = useState('en')
  const [narrationLanguage, setNarrationLanguage] = useState('en')
  const [currentStory, setCurrentStory] = useState<Story | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  const handleSubmit = async () => {
    if (!title.trim() || !storyText.trim()) return

    setIsProcessing(true)
    setProgress(0)
    setCurrentStep('Creating story...')

    try {
      // Create story
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          originalText: storyText,
          inputLanguage,
          narrationLanguage
        })
      })

      if (!response.ok) throw new Error('Failed to create story')

      const story = await response.json()
      setCurrentStory(story)
      setProgress(25)
      setCurrentStep('Generating summary...')

      // Process story
      const processResponse = await fetch(`/api/stories/${story.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputLanguage, narrationLanguage })
      })

      if (!processResponse.ok) throw new Error('Failed to process story')

      // Poll for updates
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/stories/${story.id}`)
        if (statusResponse.ok) {
          const updatedStory = await statusResponse.json()
          setCurrentStory(updatedStory)

          switch (updatedStory.status) {
            case 'summarizing':
              setProgress(25)
              setCurrentStep('Generating summary...')
              break
            case 'generating_audio':
              setProgress(50)
              setCurrentStep('Creating narration...')
              break
            case 'generating_images':
              setProgress(75)
              setCurrentStep('Generating visuals...')
              break
            case 'creating_video':
              setProgress(90)
              setCurrentStep('Creating video...')
              break
            case 'completed':
              setProgress(100)
              setCurrentStep('Complete!')
              setIsProcessing(false)
              clearInterval(pollInterval)
              break
            case 'failed':
              setCurrentStep('Processing failed')
              setIsProcessing(false)
              clearInterval(pollInterval)
              break
          }
        }
      }, 2000)

    } catch (error) {
      console.error('Error:', error)
      setIsProcessing(false)
      setCurrentStep('Error occurred')
    }
  }

  const resetForm = () => {
    setTitle('')
    setStoryText('')
    setCurrentStory(null)
    setIsProcessing(false)
    setProgress(0)
    setCurrentStep('')
  }

  const getLanguageName = (code: string) => {
    const lang = languages.find(l => l.code === code)
    return lang ? `${lang.flag} ${lang.name}` : code
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Sparkles className="h-10 w-10 text-blue-600 animate-pulse" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI StoryWeaver
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Transform cultural and folk stories into engaging video content using AI.
            <span className="block mt-2 text-lg text-blue-600 font-medium">
              🌍 Support for 35+ languages • 🎭 Cultural storytelling • 🎬 AI-powered videos
            </span>
          </p>

          {/* Language Stats */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>35+ Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span>AI Narration</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>Video Generation</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {!currentStory ? (
            /* Enhanced Story Input Form */
            <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  Share Your Story
                </CardTitle>
                <CardDescription className="text-base">
                  Enter a cultural or folk story in any language to transform it into an engaging video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Language Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Story Language (Input)
                    </label>
                    <Select value={inputLanguage} onValueChange={setInputLanguage}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Narration Language (Output)
                    </label>
                    <Select value={narrationLanguage} onValueChange={setNarrationLanguage}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">
                    Story Title
                  </label>
                  <Input
                    placeholder="Enter the title of your story..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-12 text-base bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">
                    Story Content
                  </label>
                  <Textarea
                    placeholder="Paste or type your cultural/folk story here..."
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    className="min-h-[250px] w-full text-base bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-between items-center mt-2 text-sm text-slate-500">
                    <span>Selected: {getLanguageName(inputLanguage)}</span>
                    <span>{storyText.length} characters</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !storyText.trim() || isProcessing}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Upload className="h-5 w-5 mr-3" />
                  Create Video Story
                  <div className="ml-3 flex items-center gap-1">
                    <span className="text-xs opacity-75">→</span>
                    <span className="text-xs">{getLanguageName(narrationLanguage)}</span>
                  </div>
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Enhanced Story Processing/Results */
            <div className="space-y-8">
              {/* Enhanced Progress Card */}
              {isProcessing && (
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="relative">
                        <Sparkles className="h-6 w-6 text-blue-600 animate-spin" />
                        <div className="absolute inset-0 h-6 w-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      Processing Your Story
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Input: {getLanguageName(inputLanguage)}</span>
                      <span>→</span>
                      <span>Output: {getLanguageName(narrationLanguage)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="relative">
                        <Progress value={progress} className="w-full h-3" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-20 animate-pulse"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-slate-700">{currentStep}</p>
                        <p className="text-sm text-slate-500 mt-1">{progress}% complete</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Story Details */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{currentStory.title}</CardTitle>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant={currentStory.status === 'completed' ? 'default' : 'secondary'} className="text-sm">
                          {currentStory.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {getLanguageName(inputLanguage)} → {getLanguageName(narrationLanguage)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Enhanced Summary */}
                  {currentStory.summary && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-3 text-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        AI Summary
                      </h3>
                      <p className="text-slate-700 leading-relaxed text-base">
                        {currentStory.summary}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Audio */}
                  {currentStory.audioUrl && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-3 text-lg">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Mic className="h-5 w-5 text-green-600" />
                        </div>
                        Narration ({getLanguageName(narrationLanguage)})
                      </h3>
                      <audio controls className="w-full">
                        <source src={currentStory.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Enhanced Scenes */}
                  {currentStory.scenes && currentStory.scenes.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-lg">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Image className="h-5 w-5 text-purple-600" />
                        </div>
                        Generated Scenes
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentStory.scenes.map((scene) => (
                          <Card key={scene.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
                            {scene.imageUrl && (
                              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                                <img
                                  src={scene.imageUrl}
                                  alt={`Scene ${scene.sceneNumber}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                                  Scene {scene.sceneNumber}
                                </div>
                              </div>
                            )}
                            <CardContent className="p-5">
                              <p className="text-slate-600 leading-relaxed">{scene.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Final Video */}
                  {currentStory.videoUrl && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-100">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-3 text-lg">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Video className="h-5 w-5 text-red-600" />
                        </div>
                        Final Video
                      </h3>
                      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                        <video controls className="w-full">
                          <source src={currentStory.videoUrl} type="video/mp4" />
                          Your browser does not support the video element.
                        </video>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button asChild className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <a href={currentStory.videoUrl} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download Video
                          </a>
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Play className="h-4 w-4 mr-2" />
                          Share Video
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator className="my-8" />

                  <Button onClick={resetForm} variant="outline" className="w-full h-12 text-base hover:bg-slate-50">
                    Create Another Story
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Enhanced Features Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How AI StoryWeaver Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our AI-powered pipeline transforms your stories through multiple stages of intelligent processing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-blue-100 rounded-2xl mx-auto mb-4 w-fit group-hover:scale-110 transition-transform duration-200">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold mb-3 text-lg">AI Summarization</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Transform long stories into concise, engaging summaries while preserving cultural essence
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-green-100 rounded-2xl mx-auto mb-4 w-fit group-hover:scale-110 transition-transform duration-200">
                  <Mic className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold mb-3 text-lg">Voice Narration</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Generate natural-sounding voice narration in 35+ languages with cultural authenticity
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-purple-100 rounded-2xl mx-auto mb-4 w-fit group-hover:scale-110 transition-transform duration-200">
                  <Image className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-bold mb-3 text-lg">AI Visuals</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Create stunning, culturally appropriate visuals for key story scenes using advanced AI
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group hover:-translate-y-1">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-red-100 rounded-2xl mx-auto mb-4 w-fit group-hover:scale-110 transition-transform duration-200">
                  <Video className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-bold mb-3 text-lg">Video Creation</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Seamlessly combine all elements into a complete, engaging video story ready to share
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Language Support Showcase */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Supported Languages</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {languages.slice(0, 12).map((lang) => (
              <Badge key={lang.code} variant="outline" className="px-3 py-2 text-sm bg-white/80 backdrop-blur-sm">
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </Badge>
            ))}
            <Badge variant="outline" className="px-3 py-2 text-sm bg-gradient-to-r from-blue-50 to-indigo-50">
              +{languages.length - 12} more languages
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
