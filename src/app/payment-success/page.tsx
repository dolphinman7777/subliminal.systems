'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useClerk } from "@clerk/nextjs";
import { LogOut, Download, Loader2, CheckCircle, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentSuccess() {
  const router = useRouter()
  const { toast } = useToast()
  const { signOut } = useClerk();
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)
  const [audioDetails, setAudioDetails] = useState<any>(null)

  useEffect(() => {
    const storedAudioDetails = localStorage.getItem('pendingAudioDetails');
    if (storedAudioDetails) {
      setAudioDetails(JSON.parse(storedAudioDetails));
    } else {
      toast({
        description: "No audio details found. Please create an audio first.",
        variant: "destructive",
      });
      router.push('/studio');
    }

    localStorage.setItem('paymentCompleted', 'true')
    toast({
      description: 'Payment successful! You can now download your audio.',
    })
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [])

  async function handleDownloadAudio() {
    setIsLoading(true);
    try {
      if (!audioDetails) {
        throw new Error('Audio data is missing. Please go back to the studio and recreate your audio.');
      }

      const { 
        ttsAudioUrl, 
        selectedBackingTrack, 
        ttsVolume, 
        backingTrackVolume, 
        trackDuration, 
        ttsSpeed,
        ttsDuration
      } = audioDetails;

      if (!ttsAudioUrl || typeof ttsDuration !== 'number') {
        throw new Error('TTS audio or duration is missing. Please go back to the studio and recreate your audio.');
      }

      console.log('Sending audio details:', {
        ttsAudioUrl: ttsAudioUrl ? 'present' : 'missing',
        selectedBackingTrack: selectedBackingTrack ? 'present' : 'missing',
        ttsVolume,
        backingTrackVolume,
        trackDuration,
        ttsSpeed,
        ttsDuration
      });

      const response = await fetch('/api/combine-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ttsAudioUrl, // Ensure this is the correct parameter name
          selectedBackingTrack,
          ttsVolume,
          backingTrackVolume,
          trackDuration,
          ttsSpeed,
          ttsDuration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate final audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `affirmation_audio_${Math.floor(trackDuration / 60)}min.mp3`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);

      toast({
        description: `Audio (${Math.floor(trackDuration / 60)} minutes) downloaded successfully.`,
      });

      // Clear the stored audio details after successful download
      localStorage.removeItem('pendingAudioDetails');
    } catch (error) {
      console.error('Error in handleDownloadAudio:', error);
      toast({
        description: error instanceof Error ? error.message : 'An unknown error occurred while downloading the audio. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/'); // Redirect to home page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        description: "Logout failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4"
      >
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-500 rounded-full"
                  initial={{
                    top: '0%',
                    left: `${Math.random() * 100}%`,
                    scale: 0,
                  }}
                  animate={{
                    top: '100%',
                    scale: 1,
                    transition: {
                      duration: 5,
                      repeat: Infinity,
                      delay: Math.random() * 5,
                    },
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button 
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white"
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>

        <motion.h1 
          className="text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Payment Successful!
        </motion.h1>
        
        <motion.div
          className="text-center mb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl text-gray-800 dark:text-gray-200">Thank you for your purchase!</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0px 0px 0px 0px rgba(147, 51, 234, 0.4)',
                '0px 0px 20px 10px rgba(147, 51, 234, 0.2)',
                '0px 0px 0px 0px rgba(147, 51, 234, 0.4)'
              ]
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="rounded-full overflow-hidden"
          >
            <Button 
              onClick={handleDownloadAudio}
              disabled={isLoading || !audioDetails}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out flex items-center text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Preparing Download...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-6 w-6" />
                  Download Your Audio
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Music className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Your personalized audio is ready!</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
