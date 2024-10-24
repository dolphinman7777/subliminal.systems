"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, Clock, SlidersHorizontal, RepeatIcon, Volume2, X, Sparkles, ChevronDown, Loader2, Download, CreditCard, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { loadStripe } from '@stripe/stripe-js'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useClerk, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ReactNode } from 'react';
import { setClientCache, getClientCache } from '@/utils/clientCache';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import type { NextPage } from 'next';
import type { AudioContextType } from '../types/audio';
import type { TTSResponse, APIError } from '../types/api';
import { CircularProgress } from "@/components/ui/circular-progress"; // We'll create this component

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

// Add this interface for AnimatedBentoBox props
interface AnimatedBentoBoxProps {
  children: ReactNode;
  className: string;
  gradient: string;
}

const AnimatedBentoBox: React.FC<AnimatedBentoBoxProps> = ({ children, className, gradient }) => {
  return (
    <motion.div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ${className}`}
      whileHover={{ 
        scale: 1.01,
        boxShadow: "0 10px 15px -5px rgba(0, 0, 0, 0.1), 0 5px 5px -5px rgba(0, 0, 0, 0.04)",
        zIndex: 10
      }}
      transition={{ duration: 0.2 }}
    >
      <div className={`absolute inset-0 ${gradient} transition-opacity duration-300`} />
      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};

// Define speedOptions
const speedOptions = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: 'Normal' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

const Notepad: React.FC = () => {
  const [script, setScript] = useState<string>('');

  useEffect(() => {
    const savedScript = localStorage.getItem('affirmationScript');
    if (savedScript) {
      setScript(savedScript);
    }
  }, []);

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newScript = e.target.value;
    setScript(newScript);
    localStorage.setItem('affirmationScript', newScript);
  };

  return (
    <div className="flex flex-col h-full scale-98 relative">
      <h3 className="text-sm font-semibold mb-2">Script</h3>
      <textarea
        className="w-full h-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 overflow-y-auto"
        value={script}
        onChange={handleScriptChange}
        placeholder="Write your script here..."
      />
    </div>
  );
};

interface AudioTrack {
  url: string;
  name: string;
}

const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

interface AffirmationSearchProps {
  onAffirmationGenerated: (affirmations: string[], audioUrl: string) => void;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  setGeneratedAffirmations: React.Dispatch<React.SetStateAction<string[]>>;
  setAffirmationAudioUrl: React.Dispatch<React.SetStateAction<string | null>>;
  tokenBalance: number;
  setTokenBalance: React.Dispatch<React.SetStateAction<number>>;
  ttsVolume: number;
}

// Add this after your imports and before AnimatedBentoBox
const PreviewCountdown: React.FC<{ startTime: number }> = ({ startTime }) => {
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(60 - elapsed, 0);
      const progressValue = (remaining / 60) * 100;
      
      setTimeLeft(remaining);
      setProgress(progressValue);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center space-x-2 bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-md">
      <CircularProgress value={progress} size={20} />
      <span className="text-sm font-medium">{timeLeft}s</span>
    </div>
  );
};

function AffirmationSearch({ 
  onAffirmationGenerated, 
  isGenerating, 
  setIsGenerating,
  setGeneratedAffirmations,
  setAffirmationAudioUrl,
  tokenBalance,
  setTokenBalance,
  ttsVolume
}: AffirmationSearchProps) {
  const { user } = useUser();
  const [prompt, setPrompt] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTtsLoading, setIsTtsLoading] = useState(false)
  const { toast } = useToast();

  const inspirationalWords = [
    "Confidence", "Strength", "Success", "Love", "Potential", "Growth", "Peace",
    "Creativity", "Gratitude", "Resilience", "Joy", "Abundance", "Wisdom",
    "Courage", "Balance", "Harmony", "Focus", "Passion", "Determination", "Kindness"
  ];

  const skillsets = [
    "Leadership", "Communication", "Problem-solving", "Adaptability", "Teamwork",
    "Time management", "Critical thinking", "Emotional intelligence", "Networking",
    "Negotiation", "Public speaking", "Decision-making", "Creativity", "Innovation",
    "Analytical skills", "Strategic planning", "Conflict resolution", "Empathy",
    "Active listening", "Project management"
  ];

  const goals = [
    "Lose weight", "Run a marathon", "Learn a new language", "Start a business",
    "Write a book", "Travel to 10 countries", "Get a promotion", "Save for retirement",
    "Volunteer regularly", "Improve relationships", "Quit smoking", "Learn to code",
    "Reduce stress", "Eat healthier", "Meditate daily", "Read 50 books a year",
    "Pay off debt", "Learn to play an instrument", "Get organized", "Improve public speaking"
  ];

  const carouselRef1 = useRef<HTMLDivElement>(null);
  const carouselRef2 = useRef<HTMLDivElement>(null);
  const carouselRef3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      // Reset token balance to 6000 when user logs in
      setTokenBalance(6000);
    }
  }, [user, setTokenBalance]);

  useEffect(() => {
    [carouselRef1, carouselRef2, carouselRef3].forEach((ref, index) => {
      const carousel = ref.current;
      if (carousel) {
        const scrollWidth = carousel.scrollWidth;
        const animationDuration = scrollWidth / (40 + index * 10); // Slightly different speeds
        carousel.style.animationDuration = `${animationDuration}s`;
      }
    });
  }, []);

  const handleAddPrompt = (newPrompt: string) => {
    if (newPrompt.trim() && !tags.includes(newPrompt.trim())) {
      setTags([...tags, newPrompt.trim()])
      setPrompt('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleGenerateAffirmations = async () => {
    if (prompt.trim() || tags.length > 0) {
      const promptsToGenerate = prompt.trim() ? [prompt.trim(), ...tags] : tags;
      await generateAffirmation(promptsToGenerate);
      setPrompt(''); // Clear the prompt after generating
    } else {
      toast({
        description: "Please enter a prompt or add tags before generating affirmations.",
        variant: "destructive",
      });
    }
  }

  const fallbackTTS = (text: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        const blob = new Blob([text], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };
      utterance.onerror = (event) => reject(event.error);
      window.speechSynthesis.speak(utterance);
    });
  };

  const pollTTSJob = async (jobId: string): Promise<string | null> => {
    const maxAttempts = 120; // Increase to 2 minutes (120 * 1000ms)
    const interval = 1000; // Check every second

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Polling TTS job, attempt ${attempt}/${maxAttempts}`);
        const response = await fetch(`/api/tts-status?jobId=${jobId}`);
        
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`TTS job status:`, data);

        if (data.status === 'completed' && data.audioUrl) {
          console.log('TTS job completed, audio URL:', data.audioUrl);
          return data.audioUrl;
        } else if (data.status === 'failed') {
          console.error('TTS job failed');
          return null;
        } else if (data.status === 'processing') {
          console.log(`TTS conversion in progress... (Attempt ${attempt}/${maxAttempts})`);
          if (attempt % 10 === 0) { // Update toast every 10 seconds
            toast({
              description: `TTS conversion in progress... (${attempt} seconds)`,
            });
          }
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error(`Error during polling TTS job on attempt ${attempt}:`, error);
        if (attempt === maxAttempts) {
          return null;
        }
      }
    }

    console.error('TTS conversion timed out');
    return null;
  };

  const generateAffirmation = async (prompts: string[]) => {
    if (prompts.length === 0) return;
    const tokensPerPrompt = 1000; // Reduced from 2000 to 1000
    const totalTokensNeeded = prompts.length * tokensPerPrompt;

    if (tokenBalance < totalTokensNeeded) {
      toast({
        description: `Not enough tokens. You need ${totalTokensNeeded} tokens, but have ${tokenBalance}.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedAffirmations([]);

    try {
      const newAffirmations: string[] = [];
      let totalTokensUsed = 0;

      for (const prompt of prompts) {
        let promptTokensUsed = 0;
        while (promptTokensUsed < tokensPerPrompt) {
          const response = await fetch('/api/generate-affirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              prompt, 
              maxTokens: tokensPerPrompt - promptTokensUsed
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data.affirmations && Array.isArray(data.affirmations)) {
            newAffirmations.push(...data.affirmations);
            promptTokensUsed += data.tokenCount;
            totalTokensUsed += data.tokenCount;
            setGeneratedAffirmations(prev => [...prev, ...data.affirmations]);
          }

          // Break the loop if we've used all tokens or if the API returns less than requested
          if (promptTokensUsed >= tokensPerPrompt || data.tokenCount < tokensPerPrompt - promptTokensUsed) {
            break;
          }
        }
      }

      setTokenBalance(prevBalance => prevBalance - totalTokensUsed);
      setClientCache(`affirmation:${prompts.join(',')}`, newAffirmations, 60);

      // TTS conversion
      setIsTtsLoading(true);
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: newAffirmations.join(' '),
            volume: ttsVolume
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate TTS: ${response.statusText}`);
        }

        const { audioUrl } = await response.json();
        setAffirmationAudioUrl(audioUrl);
        onAffirmationGenerated(newAffirmations, audioUrl);
        toast({
          description: "TTS conversion completed. You can now play the audio.",
        });
      } catch (error) {
        console.error('TTS conversion failed:', error);
        toast({
          description: "TTS conversion failed. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsTtsLoading(false);
      }

    } catch (error) {
      console.error('Error generating affirmations:', error);
      toast({
        description: error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800 dark:text-gray-200 subtle-glow">Affirmation Creator</h2>
      <p className="text-sm text-gray-600 mb-2">Token Balance: {tokenBalance}</p>
      <div className="flex items-center space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-grow rounded-full border-2 border-gray-400 dark:border-gray-600" // Updated border class
        />
        <Button 
          onClick={() => handleAddPrompt(prompt)}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold transition-all duration-300 ease-in-out rounded-full"
        >
          Add
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="relative overflow-hidden group rounded-full"
            >
              <Sparkles className="h-4 w-4 relative z-10 text-purple-600" />
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <div className="absolute inset-0 bg-purple-300 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse animation-delay-150"></div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-2">
            {inspirationPrompts.map((item, index) => (
              <DropdownMenuItem 
                key={index} 
                onSelect={() => handleAddPrompt(item)}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
              >
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Tags and generate button */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-4">
        <div className="flex flex-wrap gap-1 mb-4">
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
        <Button 
          onClick={handleGenerateAffirmations} 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg subtle-glow rounded-full"
          disabled={isGenerating || (prompt.trim() === '' && tags.length === 0)}
        >
          {isGenerating ? 'Generating...' : 'Generate Affirmations'}
        </Button>
      </div>
      
      {/* Inspirational Words Carousel */}
      <div className="mt-4 overflow-hidden">
        <div className="relative">
          <div
            ref={carouselRef1}
            className="flex animate-scroll whitespace-nowrap"
            style={{
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          >
            {inspirationalWords.concat(inspirationalWords).map((word, index) => (
              <button
                key={index}
                onClick={() => handleAddPrompt(word)}
                className="inline-block px-3 py-1 mr-2 text-sm bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors duration-300"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skillsets Carousel */}
      <div className="mt-4 overflow-hidden">
        <div className="relative">
          <div
            ref={carouselRef2}
            className="flex animate-scroll whitespace-nowrap"
            style={{
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDirection: 'reverse', // Scrolling in opposite direction
            }}
          >
            {skillsets.concat(skillsets).map((skill, index) => (
              <button
                key={index}
                onClick={() => handleAddPrompt(skill)}
                className="inline-block px-3 py-1 mr-2 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors duration-300"
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Carousel */}
      <div className="mt-4 overflow-hidden">
        <div className="relative">
          <div
            ref={carouselRef3}
            className="flex animate-scroll whitespace-nowrap"
            style={{
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          >
            {goals.concat(goals).map((goal, index) => (
              <button
                key={index}
                onClick={() => handleAddPrompt(goal)}
                className="inline-block px-3 py-1 mr-2 text-sm bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors duration-300"
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {isTtsLoading && (
        <p className="text-sm text-gray-500 mt-2">Converting to speech...</p>
      )}

      {/* Wrap the Notepad in a div that will grow to fill remaining space */}
      <div className="flex-grow mt-4 overflow-hidden">
        <Notepad />
      </div>
    </div>
  )
}

// Add this utility function at the top of the file, before any components
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Update the SubliminalAudioPlayer component
function SubliminalAudioPlayer({ 
  audioUrl, 
  isLoading, 
  trackDuration, 
  ttsDuration, 
  audioRef, 
  isPlaying, 
  onPlayPause, 
  currentTime, 
  volume,
  onVolumeChange,
  playbackRate 
}: { 
  audioUrl: string | null;
  isLoading: boolean;
  trackDuration: number;
  ttsDuration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  volume: number;
  onVolumeChange: (newVolume: number) => void;
  playbackRate: number;
}) {
  const { toast } = useToast();

  // Move useState outside of render to fix the React warning
  const [localVolume, setLocalVolume] = useState<number>(volume * 100);

  // Update local volume when prop changes
  useEffect(() => {
    setLocalVolume(volume * 100);
  }, [volume]);

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setLocalVolume(newVolume);
    onVolumeChange(newVolume / 100); // Convert back to 0-1 range for audio
  };

  return (
    <div className="subliminal-audio-player">
      <div className="bg-white p-4 rounded-xl shadow-md mb-4 flex flex-col justify-between h-[200px]">
        <div className="flex justify-between text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
        
        <div className="flex justify-center items-center">
          <Button
            onClick={onPlayPause}
            disabled={isLoading || !audioUrl}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-green-500" />
          <Slider
            value={[localVolume]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-full"
            trackClassName="h-1 bg-gray-200"
            rangeClassName="h-1 bg-green-500"
            thumbClassName="h-4 w-4 bg-white border-2 border-green-500"
          />
        </div>
      </div>
      
      <audio ref={audioRef} src={audioUrl || undefined} loop={false} className="hidden" />
    </div>
  );
}

function AudioLayerPlayer({ onTrackSelect, audioRef }: { 
  onTrackSelect: (trackUrl: string | null) => void, 
  audioRef: React.RefObject<HTMLAudioElement>
}) {
  const [tracks, setTracks] = useState<{ name: string; url: string }[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchBackingTracks();
  }, []);

  const fetchBackingTracks = async () => {
    try {
      const response = await fetch('/api/backing-tracks');
      if (!response.ok) {
        throw new Error('Failed to fetch backing tracks');
      }
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error('Error fetching backing tracks:', error);
      toast({
        description: 'Failed to load backing tracks. Please try again.',
        variant: "destructive",
      });
    }
  };

  const handleTrackChange = (trackUrl: string) => {
    setSelectedTrack(trackUrl);
    onTrackSelect(trackUrl);
    if (audioRef.current) {
      audioRef.current.src = trackUrl;
      audioRef.current.load();
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);
    if (audioRef.current) {
      audioRef.current.volume = volumeValue;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white p-4 rounded-xl shadow-md mb-4 flex flex-col justify-between h-[200px]">
        <Select value={selectedTrack || undefined} onValueChange={handleTrackChange}>
          <SelectTrigger className="w-full bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200 transition-colors duration-300 rounded-full">
            <SelectValue placeholder="Select Backing Track" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-purple-200 rounded-md shadow-lg">
            {tracks.length > 0 ? (
              tracks.map((track) => (
                <SelectItem 
                  key={track.url} 
                  value={track.url}
                  className="hover:bg-purple-100 transition-colors duration-200"
                >
                  {track.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-tracks" disabled>No tracks available</SelectItem>
            )}
          </SelectContent>
        </Select>
        
        <div className="flex justify-center items-center">
          <Button
            onClick={togglePlayPause}
            disabled={!selectedTrack}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white"
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-green-500" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-full"
            trackClassName="h-1 bg-gray-200"
            rangeClassName="h-1 bg-green-500"
            thumbClassName="h-4 w-4 bg-white border-2 border-green-500"
          />
        </div>
        
        <audio ref={audioRef} src={selectedTrack || undefined} className="hidden" />
      </div>
    </div>
  );
}

function AffirmationList({ affirmations, isGenerating, onConvertToSpeech }: { 
  affirmations: string[], 
  isGenerating: boolean,
  onConvertToSpeech: () => void
}) {
  // Split affirmations into separate sentences
  const separateAffirmations = affirmations.flatMap(affirmation => 
    affirmation.split('.').filter(sentence => sentence.trim().length > 0)
  );

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-black drop-shadow-glow">Generated Affirmations</h2>
      <div className="bg-white p-4 rounded-xl shadow-md flex-grow overflow-hidden">
        <ScrollArea className="h-[500px] pr-4">
          <AnimatePresence>
            {separateAffirmations.map((affirmation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="mb-6 last:mb-0"
              >
                <motion.p
                  whileHover={{ scale: 1.02 }}
                  className="text-lg text-gray-700 p-5 bg-gray-50 border border-gray-200 rounded-lg affirmation-hover hover:bg-purple-100 hover:text-purple-800 transition-colors duration-300"
                >
                  {affirmation.trim()}.
                </motion.p>
              </motion.div>
            ))}
          </AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 last:mb-0"
            >
              <p className="text-lg text-gray-700 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  Generating...
                </motion.span>
              </p>
            </motion.div>
          )}
        </ScrollArea>
      </div>
      <Button 
        onClick={onConvertToSpeech} 
        disabled={isGenerating || affirmations.length === 0}
        className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 text-lg transition-all duration-300 ease-in-out rounded-full" // Added rounded-full and adjusted classes
      >
        Convert to Speech
      </Button>
    </div>
  )
}

// Fix for 'Unexpected any' errors
interface SketchEvent {
  type: string;
  target: unknown;
  // Add other properties as needed
}

// Define LayoutSketchProps if it's not imported from elsewhere
interface LayoutSketchProps {
  initialLayout?: any; // Make this optional and replace 'any' with the correct type
}

export const Studio: React.FC = () => {
  const router = useRouter();
  const { signOut, openUserProfile } = useClerk();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [trackDuration, setTrackDuration] = useState(900); // Default to 15 minutes in seconds
  const [ttsDuration, setTtsDuration] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [generatedAffirmations, setGeneratedAffirmations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [generationCount, setGenerationCount] = useState(0);
  const [lastGenerationTime, setLastGenerationTime] = useState<number | null>(null);
  const [isPaidCustomer, setIsPaidCustomer] = useState(false);

  const { toast } = useToast();
  const [isTtsConverted, setIsTtsConverted] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);

  const [isSplit, setIsSplit] = useState(false);
  const [ttsVoice, setTtsVoice] = useState('Joanna');
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);

  const [selectedBackingTrack, setSelectedBackingTrack] = useState<string | null>(null);

  // Add these state variables at the beginning of the Studio component
  const [ttsVolume, setTtsVolume] = useState(1.0);
  const [backingTrackVolume, setBackingTrackVolume] = useState(1);
  const [combinedAudioUrl, setCombinedAudioUrl] = useState<string | null>(null);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);

  const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement>(null);
  const backingTrackRef = useRef<HTMLAudioElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [affirmationAudioUrl, setAffirmationAudioUrl] = useState<string | null>(null);

  const [volume, setVolume] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);

  const [playbackRate, setPlaybackRate] = useState(1);

  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isBackingTrackPlaying, setIsBackingTrackPlaying] = useState(false);

  const [tokenBalance, setTokenBalance] = useState(6000);

  // Add these state variables at the top of your Studio component
  const [selectedDuration, setSelectedDuration] = useState(15); // Default to 15 minutes
  const [ttsAudioDuration, setTtsAudioDuration] = useState(30); // Default to 30 seconds

  const [isWarningOpen, setIsWarningOpen] = useState(false);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewStartTime, setPreviewStartTime] = useState(0);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const setupAudioContext = async (audioUrl: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
      // Check if the audioUrl is valid
      if (!audioUrl) {
        throw new Error('Invalid audio URL');
      }

      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;

      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error('Error setting up audio context:', error);
      toast({
        description: "Failed to load audio. Please try again.",
        variant: "destructive",
      });
      // Reset audio-related state here if necessary
      setIsPlaying(false);
      setAffirmationAudioUrl(null);
    }
  };

  const playAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    sourceNodeRef.current = audioContextRef.current.createBufferSource();
    sourceNodeRef.current.buffer = audioBufferRef.current;
    sourceNodeRef.current.connect(gainNodeRef.current!);
    sourceNodeRef.current.loop = true;
    sourceNodeRef.current.loopEnd = ttsDuration;

    startTimeRef.current = audioContextRef.current.currentTime;
    sourceNodeRef.current.start(0, currentTime % ttsDuration);
    setIsPlaying(true);
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      setIsPlaying(false);
      if (audioContextRef.current) {
        setCurrentTime((audioContextRef.current.currentTime - startTimeRef.current) % trackDuration);
      }
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error('Error playing audio:', error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setTtsVolume(newVolume); // Now this will work
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    if (ttsAudioUrl) {
      setupAudioContext(ttsAudioUrl);
    }
  }, [ttsAudioUrl]);

  useEffect(() => {
    let animationFrameId: number;

    const updateTime = () => {
      if (isPlaying && audioContextRef.current) {
        const newTime = (audioContextRef.current.currentTime - startTimeRef.current) % trackDuration;
        setCurrentTime(newTime);
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateTime);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, trackDuration]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCount = localStorage.getItem('generationCount');
      const storedTime = localStorage.getItem('lastGenerationTime');
      const storedPaidStatus = localStorage.getItem('isPaidCustomer');

      if (storedCount) setGenerationCount(parseInt(storedCount, 10));
      if (storedTime) setLastGenerationTime(parseInt(storedTime, 10));
      if (storedPaidStatus) setIsPaidCustomer(storedPaidStatus === 'true');
    }
  }, []);

  const checkAndResetDailyLimit = () => {
    const now = Date.now();
    if (lastGenerationTime && now - lastGenerationTime > 24 * 60 * 60 * 1000) {
      // Reset count if it's been more than 24 hours
      setGenerationCount(0);
      localStorage.setItem('generationCount', '0');
    }
    setLastGenerationTime(now);
    localStorage.setItem('lastGenerationTime', now.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPrompt(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPrompt(prompt);
    }
  };

  const handleAddPrompt = (newPrompt: string) => {
    if (newPrompt.trim() && !tags.includes(newPrompt.trim())) {
      setTags([...tags, newPrompt.trim()]);
      setPrompt('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAffirmationGenerated = (affirmations: string[], audioUrl: string) => {
    setGeneratedAffirmations(affirmations);
    setTtsAudioUrl(audioUrl);
    console.log('TTS Audio URL set:', audioUrl);
  };

  const handleConvertToSpeech = () => {
    // Implement the logic for converting to speech
    console.log("Converting to speech...");
  };

  const handleTrackDurationChange = (newValue: number[]) => {
    const newDuration = newValue[0];
    setTrackDuration(newDuration); // Update the track duration state

    // Ensure ttsDuration doesn't exceed the new track duration
    const newTtsDuration = Math.min(ttsDuration, newDuration);
    setTtsDuration(newTtsDuration);

    // Calculate and set the new playback rate
    const newPlaybackRate = newDuration / newTtsDuration;
    const clampedPlaybackRate = Math.min(Math.max(newPlaybackRate, 0.25), 4);
    setPlaybackRate(clampedPlaybackRate);

    // If audio is playing, apply the new rate immediately
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.playbackRate = clampedPlaybackRate;
    }
  };

  const handleTtsDurationChange = (value: number[]) => {
    const newTtsDuration = Math.min(Math.max(value[0], 1), trackDuration);
    setTtsDuration(newTtsDuration);
    
    // Calculate and set the new playback rate based on the ratio of track length to TTS duration
    const newPlaybackRate = trackDuration / newTtsDuration;
    const clampedPlaybackRate = Math.min(Math.max(newPlaybackRate, 0.25), 4);
    setPlaybackRate(clampedPlaybackRate);

    // If audio is playing, apply the new rate immediately
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.playbackRate = clampedPlaybackRate;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      console.log('Playback rate set to:', playbackRate);
    }
  }, [playbackRate]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderLoopVisualization = () => {
    const loopCount = Math.ceil(trackDuration / ttsDuration);
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: loopCount }).map((_, index) => (
          <div 
            key={index} 
            className={`h-2 rounded ${
              index === Math.floor(currentTime / ttsDuration) % loopCount 
                ? 'bg-blue-500' 
                : 'bg-blue-200'
            }`}
            style={{ flexGrow: 1, flexBasis: 0 }}
          ></div>
        ))}
      </div>
    );
  };

  const handleSkip = (direction: 'back' | 'forward') => {
    // Implement skip logic
    console.log(`Skipping ${direction}`);
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLogout = async () => {
    try {
      // First sign out from Clerk
      await signOut();
      
      // Clear any local storage or state
      localStorage.clear();
      
      // Force a hard redirect to the home page
      window.location.href = '/';
      
      // Show success toast
      toast({
        description: "Successfully logged out",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInitialClick = () => {
    setIsSplit(true);
  };

  // Update the handleCombineAudio function
  const handleCombineAudio = async () => {
    if (!ttsAudioUrl || !selectedBackingTrack) {
      toast({
        description: 'Please generate TTS audio and select a backing track first',
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/combine-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ttsAudioUrl,
          backingTrackUrl: selectedBackingTrack,
          ttsVolume,
          backingTrackVolume,
          trackDuration: 900, // 15 minutes in seconds
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to combine audio');
      }

      const data = await response.json();
      setCombinedAudioUrl(data.combinedAudioUrl);
      toast({
        description: 'Audio combined successfully',
      });
    } catch (error) {
      console.error('Error combining audio:', error);
      toast({
        description: 'Failed to combine audio',
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    try {
      console.log('Starting payment process...');
      const stripe = await stripePromise;
      if (!stripe) {
        console.error('Stripe failed to initialize');
        throw new Error('Stripe failed to initialize');
      }

      // Check if required audio is generated
      if (!ttsAudioUrl) {
        console.warn('TTS audio URL is missing');
        toast({
          description: "Please generate affirmations before proceeding to payment",
          variant: "destructive",
        });
        return;
      }

      // Gather audio details
      const audioDetails = {
        ttsAudioUrl,
        selectedBackingTrack,
        ttsVolume,
        backingTrackVolume,
        trackDuration,
        ttsDuration,
        playbackRate
      };

      console.log('Audio details:', audioDetails);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioDetails,
          email: user?.emailAddresses?.[0]?.emailAddress
        }),
      });

      console.log('Checkout session response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout session creation failed:', errorData);
        throw new Error(errorData.details || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      console.log('Received session ID:', sessionId);
      
      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        console.error('Stripe redirect error:', result.error);
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: "destructive",
      });
    }
  };

  const handleDownloadAudio = async () => {
    if (!ttsAudioUrl) {
        toast({
            description: 'TTS audio is missing. Please generate affirmations first.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    try {
        console.log('Starting audio download process...');
        console.log('TTS Audio URL:', ttsAudioUrl);
        console.log('Selected Backing Track:', selectedBackingTrack);
        console.log('TTS Volume:', ttsVolume);
        console.log('Backing Track Volume:', backingTrackVolume);
        console.log('Track Duration:', 900); // 15 minutes
        console.log('TTS Speed:', playbackRate);
        console.log('TTS Duration:', ttsDuration);

        const response = await fetch('/api/combine-audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: ttsAudioUrl,
                selectedBackingTrack: selectedBackingTrack || 'missing', // Ensure this is a string
                ttsVolume,
                backingTrackVolume,
                trackDuration: 900, // Set to 15 minutes (900 seconds)
                ttsSpeed: playbackRate,
                ttsDuration
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(errorData.error || 'Failed to combine audio');
        }

        // ... existing code ...
    } catch (error) {
        console.error('Error downloading audio:', error);
        toast({
            description: error instanceof Error ? error.message : 'An unknown error occurred while downloading the audio. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
};

  const handleTTSConversion = async () => {
    setIsTtsLoading(true);
    toast({
      description: "Starting TTS conversion...",
    });

    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: generatedAffirmations.join('. '),
          voice: ttsVoice,
          volume: ttsVolume // Now ttsVolume is defined and can be used here
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert text to speech');
      }

      const data = await response.json();
      setTtsAudioUrl(data.audioUrl);
      setIsTtsConverted(true);
      toast({
        description: "TTS conversion completed successfully!",
      });
    } catch (error) {
      console.error("TTS conversion failed:", error);
      toast({
        description: "TTS conversion failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTtsLoading(false);
    }
  };

  // Update the handleGlobalPlayPause function
  const handleGlobalPlayPause = () => {
    if (audioRef.current && backingTrackRef.current) {
      if (isGlobalPlaying) {
        // Pause both TTS and backing track
        audioRef.current.pause();
        backingTrackRef.current.pause();
        setIsTtsPlaying(false);
        setIsBackingTrackPlaying(false);
        setIsPreviewMode(false); // Stop preview mode when pausing
      } else {
        // Start preview mode when playing
        setIsPreviewMode(true);
        setPreviewStartTime(Date.now());
        
        // Play both TTS and backing track
        audioRef.current.play().catch(error => console.error('Error playing TTS audio:', error));
        backingTrackRef.current.play().catch(error => console.error('Error playing backing track:', error));
        setIsTtsPlaying(true);
        setIsBackingTrackPlaying(true);
      }
      setIsGlobalPlaying(!isGlobalPlaying);
    }
  };

  // Add this useEffect to handle the preview time limit
  useEffect(() => {
    if (isPreviewMode) {
      const timeoutId = setTimeout(() => {
        setIsPreviewMode(false);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (backingTrackRef.current) {
          backingTrackRef.current.pause();
        }
        setIsGlobalPlaying(false);
        setIsTtsPlaying(false);
        setIsBackingTrackPlaying(false);
        
        toast({
          description: "Preview time limit reached (1 minute)",
        });
      }, 60000); // 60 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [isPreviewMode]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnded);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, [ttsDuration, trackDuration]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.currentTime >= ttsDuration) {
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleAudioEnded = () => {
    if (audioRef.current) {
      if (currentTime < trackDuration) {
        audioRef.current.play();
      } else {
        setIsPlaying(false);
        audioRef.current.currentTime = 0;
      }
    }
  };

  // Add this useEffect to check for payment completion on component mount or URL change
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    if (paymentStatus === 'success') {
      setIsPaymentCompleted(true);
      toast({
        description: 'Payment successful! Your subliminal is ready for download.',
      });
      // Remove the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Add these console logs to check the values
  useEffect(() => {
    console.log('affirmationAudioUrl:', affirmationAudioUrl);
    console.log('selectedBackingTrack:', selectedBackingTrack);
  }, [affirmationAudioUrl, selectedBackingTrack]);

  const handleCreateFinalAudio = async () => {
    if (!generatedAffirmations.length || !selectedBackingTrack) {
      toast({
            description: 'Affirmations or backing track is missing. Please generate affirmations and select a backing track first.',
            variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
        const text = generatedAffirmations.join(' ');
        console.log('Sending request with:', {
            text: text.substring(0, 50) + '...', // Log the first 50 characters of the text
            selectedBackingTrack: selectedBackingTrack || '', // Ensure this is a string
            ttsVolume,
            backingTrackVolume,
            trackDuration: 900, // Set to 15 minutes (900 seconds)
            ttsSpeed: playbackRate,
            ttsDuration
        });

      const response = await fetch('/api/combine-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
                text,
                selectedBackingTrack: selectedBackingTrack || '', // Ensure this is a string
          ttsVolume,
          backingTrackVolume,
                trackDuration: 900, // Set to 15 minutes (900 seconds)
                ttsSpeed: playbackRate,
                ttsDuration
        }),
      });

      if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to combine audio');
      }

      const data = await response.json();
        setAffirmationAudioUrl(data.audioUrl);

      toast({
            description: `Final audio (${Math.floor(900 / 60)} minutes) created and ready for playback.`,
      });
    } catch (error) {
        console.error('Error creating final audio:', error);
      toast({
            description: error instanceof Error ? error.message : 'An unknown error occurred while creating the final audio. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
};

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  const saveAudioDetailsToLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const audioDetails = {
        ttsAudioUrl,
        selectedBackingTrack,
        ttsVolume,
        backingTrackVolume,
        trackDuration: selectedDuration * 60, // Convert minutes to seconds
        ttsDuration: ttsAudioDuration,
        ttsSpeed: playbackRate,
        loopDuration: selectedDuration * 60 // This should be the same as trackDuration for now
      };
      localStorage.setItem('pendingAudioDetails', JSON.stringify(audioDetails));
    }
  };

  // Call this function before redirecting to payment
  useEffect(() => {
    saveAudioDetailsToLocalStorage();
  }, [ttsAudioUrl, selectedBackingTrack, ttsVolume, backingTrackVolume, selectedDuration, ttsAudioDuration, playbackRate]);

  // Helper function to save blob to IndexedDB
  const saveBlobToStorage = async (key: string, blob: Blob) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AudioStorage', 1);

      request.onerror = () => reject('IndexedDB error');

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['blobs'], 'readwrite');
        const store = transaction.objectStore('blobs');
        const putRequest = store.put(blob, key);

        putRequest.onerror = () => reject('Error saving blob');
        putRequest.onsuccess = () => resolve(null);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore('blobs');
      };
    });
  };
  const handleDownloadClick = async () => {
    if (!combinedAudioUrl) {
          toast({
        description: "No combined audio available. Please create the final audio first.",
            variant: "destructive",
          });
      return;
    }

    try {
      const response = await fetch(combinedAudioUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch the combined audio');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'combined_affirmation_audio.mp3';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        description: "Combined audio downloaded successfully",
      });
      } catch (error) {
      console.error('Error downloading audio:', error);
        toast({
        description: "Failed to download combined audio",
          variant: "destructive",
        });
    }
  };

  const handleTtsVolumeChange = (value: number) => {
    setTtsVolume(value);
  };

  const handleBgVolumeChange = (value: number) => {
    setBackingTrackVolume(value);
  };

  const handleDownload = async () => {
    if (!ttsAudioUrl || !selectedBackingTrack) {
        toast({
        description: "Please generate affirmations and select a background track before downloading.",
        variant: "destructive",
        });
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/combine-audio", {
        method: "POST",
            headers: {
          "Content-Type": "application/json",
            },
            body: JSON.stringify({
          ttsAudioUrl,
          backgroundTrack: selectedBackingTrack,
          ttsVolume: parseFloat(ttsVolume.toFixed(3)),
          bgVolume: parseFloat(backingTrackVolume.toFixed(3)),
          trackDuration: selectedDuration * 60,
                ttsSpeed: playbackRate,
                ttsDuration
            }),
        });

        if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "affirmation.mp3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    toast({
        description: "Your affirmation audio has been downloaded.",
      });
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast({
        description: "There was an error downloading your affirmation audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-2 min-h-screen relative font-sans bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <style jsx global>{`
        @keyframes subtle-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 2px rgba(147, 51, 234, 0.2));
          }
          50% {
            filter: drop-shadow(0 0 3px rgba(147, 51, 234, 0.3));
          }
        }
        .subtle-glow {
          animation: subtle-glow 3s ease-in-out infinite;
        }
        .bento-container:hover .animated-bento:not(:hover) {
          opacity: 0.7;
          filter: brightness(0.7);
          transition: opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease;
        }
        .animated-bento {
          transition: opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease;
        }
        .animated-bento:hover {
          transform: translateY(-2px) scale(1.005);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .glow-effect {
          text-shadow: 0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(34, 197, 94, 0.3);
        }
        @keyframes scroll {
          0%, 100% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-scroll {
          animation: scroll linear infinite;
        }

        .drop-shadow-glow {
          filter: drop-shadow(0 0 2px rgba(147, 51, 234, 0.3));
        }

        .drop-shadow-green-glow {
          filter: drop-shadow(0 0 3px rgba(34, 197, 94, 0.5));
        }

        @media (max-width: 640px) {
          .bento-container {
            grid-template-columns: 1fr;
          }
          .bento-container > div {
            grid-column: span 1 !important;
          }
        }
      `}</style>
      <div className="bento-grid gap-2 auto-rows-auto flex-grow">
        <AnimatedBentoBox 
          className="bento-affirmation-creator"
          gradient="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
        >
          <Card className="h-full bg-transparent border-none shadow-none">
            <CardContent className="p-2 sm:p-4 flex flex-col h-full">
              <AffirmationSearch 
                onAffirmationGenerated={handleAffirmationGenerated}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                setGeneratedAffirmations={setGeneratedAffirmations}
                setAffirmationAudioUrl={setAffirmationAudioUrl}
                tokenBalance={tokenBalance}
                setTokenBalance={setTokenBalance}
                ttsVolume={ttsVolume} // Pass the ttsVolume prop
              />
            </CardContent>
          </Card>
        </AnimatedBentoBox>

        <AnimatedBentoBox 
          className="bento-generated-affirmations"
          gradient="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
        >
          <Card className="h-full bg-transparent border-none shadow-none">
            <CardContent className="p-2 sm:p-4 h-full flex flex-col">
              <AffirmationList 
                affirmations={generatedAffirmations} 
                isGenerating={isGenerating}
                onConvertToSpeech={handleTTSConversion}
              />
            </CardContent>
          </Card>
        </AnimatedBentoBox>

        <AnimatedBentoBox 
          className="bento-subliminal-player"
          gradient="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
        >
          <Card className="h-full bg-transparent border-none shadow-none">
            <CardContent className="p-2 sm:p-4 h-full flex flex-col">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800 dark:text-gray-100 drop-shadow-green-glow">Subliminal Player</h2>
              <SubliminalAudioPlayer 
                audioUrl={ttsAudioUrl} 
                isLoading={isTtsLoading}
                trackDuration={trackDuration}
                ttsDuration={ttsDuration}
                audioRef={audioRef}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                currentTime={currentTime}
                volume={ttsVolume}
                onVolumeChange={handleVolumeChange}
                playbackRate={playbackRate}
              />
            </CardContent>
          </Card>
        </AnimatedBentoBox>

        <AnimatedBentoBox 
          className="bento-audio-layer"
          gradient="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
        >
          <Card className="h-full bg-transparent border-none shadow-none">
            <CardContent className="p-2 sm:p-4 h-full flex flex-col">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800 dark:text-gray-100 drop-shadow-green-glow">Audio Layer</h2>
              <AudioLayerPlayer 
                onTrackSelect={setSelectedBackingTrack} 
                audioRef={backingTrackRef}
              />
            </CardContent>
          </Card>
        </AnimatedBentoBox>

        <AnimatedBentoBox 
          className="bento-audio-controls"
          gradient="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
        >
          <Card className="h-full overflow-hidden bg-transparent border-none shadow-none">
            <CardContent className="p-2 sm:p-4 flex flex-col h-full">
              <h2 className="text-2xl font-bold mb-4 text-blue-600 drop-shadow-[0_4px_4px_rgba(0,0,255,0.25)]">
                Audio Controls
              </h2>
              
              <div className="space-y-4 flex flex-col flex-grow overflow-y-auto text-xs sm:text-sm">
                <div className="bg-white p-4 rounded-xl shadow-md">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                        <h3 className="text-sm font-semibold text-black">Track Length</h3>
                      </div>
                      <Slider
                        id="track-length-slider"
                        min={60} // Minimum 1 minute
                        max={900} // Maximum 15 minutes (900 seconds)
                        step={60} // Step by 1 minute
                        value={[trackDuration]} // Bind the slider value to trackDuration
                        onValueChange={(newValue) => {
                            setTrackDuration(newValue[0]); // Update the track duration state
                            console.log('Track Duration set to:', newValue[0]); // Debugging line
                        }}
                        className="w-full"
                        trackClassName="h-1 bg-gray-200"
                        rangeClassName="h-1 bg-blue-500"
                        thumbClassName="h-4 w-4 bg-white border-2 border-blue-500"
                      />
                      <p className="text-xs text-black mt-1">
                        Track Length: {Math.floor(trackDuration / 60)} minutes
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <RepeatIcon className="w-4 h-4 text-blue-500" />
                        <h3 className="text-sm font-semibold text-black">TTS Loop Duration</h3>
                      </div>
                      <Slider
                        id="tts-loop-slider"
                        min={1}
                        max={trackDuration}
                        step={1}
                        value={[ttsDuration]}
                        onValueChange={handleTtsDurationChange}
                        className="w-full"
                        trackClassName="h-1 bg-gray-200"
                        rangeClassName="h-1 bg-blue-500"
                        thumbClassName="h-4 w-4 bg-white border-2 border-blue-500"
                      />
                      <p className="text-xs text-black mt-1">
                        TTS Loop: {formatTime(ttsDuration)} (Speed: {playbackRate.toFixed(2)}x)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-md">
                  <h3 className="text-sm font-semibold mb-2 text-black">Loop Visualization</h3>
                  {renderLoopVisualization()}
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center">
                  <Clock className="w-6 h-6 mb-1 text-black" />
                  <p className="text-lg font-bold text-black">{formatTime(currentTime)} / {formatTime(trackDuration)}</p>
                  <p className="text-xs text-black/80">current / total</p>
                </div>

                {/* Global Play/Pause button */}
                <div className="bg-white p-2 rounded-xl shadow-md flex justify-center items-center flex-grow mt-auto">
                  <div className="flex flex-col items-center space-y-3"> {/* Changed to flex-col and space-y-3 */}
                    <Button
                      onClick={handleGlobalPlayPause}
                      className="w-28 h-28 rounded-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isGlobalPlaying ? (
                        <PauseIcon className="h-14 w-14" />
                      ) : (
                        <PlayIcon className="h-14 w-14" />
                      )}
                    </Button>
                    {isPreviewMode && <PreviewCountdown startTime={previewStartTime} />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedBentoBox>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleLogout}
            className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 text-gray-800 dark:text-white font-bold rounded-full transition-all duration-300 ease-in-out flex items-center justify-center text-sm hover:from-gray-400 hover:to-gray-500 dark:hover:from-gray-500 dark:hover:to-gray-400 hover:shadow-blue-300/50 dark:hover:shadow-blue-500/30"
            size="sm"
          >
            <LogOut className="mr-1 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Download button moved to bottom right */}
        <div className="bg-white p-2 rounded-xl shadow-md">
          {!isSplit ? (
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold transition-all duration-300 ease-in-out"
              onClick={() => setIsSplit(true)}
            >
              <Download className="mr-2 h-5 w-5" />
              Download (€3.00)
            </Button>
          ) : (
            <div className="flex flex-col w-full space-y-2">
              <Button 
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all duration-300 ease-in-out"
                onClick={handlePayment}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pay with Card
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isPaidCustomer && (
        <div className="text-sm text-gray-600 mt-2">
          Generations remaining today: {10 - generationCount}
        </div>
      )}

      {/* Add this near the bottom of your JSX, adjust the positioning as needed */}
      {isPaymentCompleted && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            onClick={handleDownloadAudio}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Sub
          </Button>
        </div>
      )}

      {/* Warning Dialog */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backing Track Required</DialogTitle>
            <DialogDescription>
              Please select a backing track before proceeding with payment or download.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setIsWarningOpen(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to check authentication status
function checkAuthStatus(): boolean {
  return true; // Replace with actual auth check logic
}

export default Studio;


