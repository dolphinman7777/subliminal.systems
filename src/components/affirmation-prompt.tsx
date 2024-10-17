'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const inspirationPrompts = [
  "Radiant charisma",
  "Limitless abundance",
  "Magnetic energy",
  "Compassionate healing",
  "Unshakable confidence",
  "Manifesting miracles",
  "Creative genius",
  "Inner clarity",
  "Boundless vitality",
  "Graceful flow"
]

export function AffirmationPrompt() {
  const [prompt, setPrompt] = useState('')
  const [tags, setTags] = useState<string[]>(["Success", "Maths", "Divinity"])

  const handleAddPrompt = (newPrompt: string) => {
    if (newPrompt.trim() && !tags.includes(newPrompt.trim())) {
      setTags([...tags, newPrompt.trim()])
      setPrompt('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={() => handleAddPrompt(prompt)}>Add</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="relative overflow-hidden group"
            >
              <Sparkles className="h-4 w-4 relative z-10 text-purple-600" />
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <div className="absolute inset-0 bg-purple-300 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse animation-delay-150"></div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {inspirationPrompts.map((item, index) => (
              <DropdownMenuItem key={index} onSelect={() => handleAddPrompt(item)}>
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <div key={index} className="flex items-center bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 text-purple-600 hover:text-purple-800 focus:outline-none"
              aria-label={`Remove ${tag} tag`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}