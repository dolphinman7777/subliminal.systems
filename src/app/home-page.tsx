"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Brain, Mic, Sliders, Download } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ArrowRightIcon } from "@radix-ui/react-icons"
import HyperText from "@/components/ui/hyper-text"
import DotPattern from "@/components/ui/dot-pattern"
import { SignUpButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { LucideIcon } from 'lucide-react'; // Add this import
import { useClerk } from '@clerk/nextjs';
import { PropsWithChildren } from 'react';

// Add this array of sentences at the top of your file, outside of any component
const mindSoftwareSentences = [
  "Upgrade the software running in your mind",
  "Reprogram the way your mind operates",
  "Upgrade the mental software shaping your thoughts",
  "Install a new mindset for better outcomes",
  "Rewrite the mental code that guides your thinking",
  "Refresh the system driving your thoughts",
  "Transform the inner programming that directs your life",
  "Update the mental framework that runs your thoughts",
  "Shift the mental software that influences your reality"
];

interface RetroGridProps {
  className?: string;
  angle?: number;
  opacity?: number;
}

function RetroGrid({
  className,
  angle = 65,
  opacity = 0.5,
}: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]",
        className,
      )}
      style={{ 
        "--grid-angle": `${angle}deg`,
        "--grid-opacity": opacity,
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-grid",
            "[background-repeat:repeat] [background-size:60px_60px] [height:400vh] [inset:-100%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",
            "opacity-[var(--grid-opacity)]",
            "[background-image:linear-gradient(to_right,rgba(0,0,0,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.3)_1px,transparent_0)]",
            "dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.2)_1px,transparent_0)]",
          )}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-white dark:via-black dark:to-black" />
    </div>
  );
}

interface BentoGridProps extends React.PropsWithChildren {
  className?: string;
}

const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[320px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
        className,
      )}
    >
      {children}
    </div>
  );
};

interface BentoCardProps {
  name: string;
  className: string;
  background: React.ReactNode;
  Icon: LucideIcon; // Change this line
  description: React.ReactNode;
  href: string;
  cta: string;
}

const BentoCard: React.FC<BentoCardProps> = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl p-8",
      "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      "transform-gpu dark:bg-gray-800 dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
      className,
    )}
  >
    {background}
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex-grow transition-all duration-300 group-hover:translate-y-[-1rem]">
        <Icon // This should now work correctly
          className={cn(
            "h-14 w-14 transform-gpu transition-all duration-300 ease-in-out group-hover:scale-90",
            name === "A.I Powered Affirmation Generation" && "animate-glow text-purple-600 dark:text-purple-400",
            name === "Subliminal Affirmation" && "animate-pulse-glow-blue text-blue-500 dark:text-blue-400",
            name === "Personalized Experience" && "animate-pulse-glow-green text-green-500 dark:text-green-400",
            name === "Ownership" && "animate-intense-glow-white text-white",
            "text-gray-700 dark:text-gray-300"
          )}
        />
        <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200"> {/* Reduced from text-2xl */}
          {name}
        </h3>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-400"> {/* Reduced from text-lg */}
          {name === "A.I Powered Affirmation Generation" 
            ? (
              <>
                Tailored to your unique <span className="highlight-word">goals</span>, these affirmations use advanced algorithms to align with your thoughts and support the <span className="highlight-word">manifestation</span> of your <span className="highlight-word">intentions</span>. Where science meets the mystical, AI-generated affirmations help tap into the mind&apos;s potential, guiding personal growth and transformation.
              </>
            ) 
            : description
          }
        </p>
      </div>
      {cta && (
        <div className="mt-4 transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0">
          <Button asChild>
            <Link href={href}>
              {cta}
              <ArrowRightIcon className="ml-2 h-4 w-4" /> {/* Reduced from h-5 w-5 */}
            </Link>
          </Button>
        </div>
      )}
    </div>
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
  </div>
);

interface HomePageProps {
  children: React.ReactNode;
}

const HomePage = ({ children }: HomePageProps) => {
  const [error, setError] = useState('');
  const router = useRouter();
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const { isLoaded, userId } = useAuth();
  const { openSignIn, openSignUp } = useClerk();

  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/studio');
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSentenceIndex((prevIndex) => 
        (prevIndex + 1) % mindSoftwareSentences.length
      );
    }, 5000); // Change sentence every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoaded && userId) {
    return null; // Return null while redirecting to prevent flash of content
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <DotPattern 
        width={40} 
        height={40} 
        cx={2} 
        cy={2} 
        cr={1.5} 
        className="opacity-30 dark:opacity-20 absolute inset-0 z-0"
      />
      <RetroGrid className="absolute inset-0 z-10" angle={75} opacity={0.3} />
      <div className="relative z-20 flex flex-col min-h-screen">
        <header className="fixed top-0 left-0 right-0 px-4 lg:px-6 h-32 flex items-center justify-between bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900 z-50">
          <Link href="/" className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 opacity-50 blur-xl rounded-full transform scale-110"></div>
              <Image
                src="/head.svg"
                alt="Subliminal.Systems Logo"
                width={160}
                height={160}
                priority
                style={{ width: '160px', height: '160px' }}
                className="relative z-10 transition-all duration-300 hover:scale-105"
              />
            </div>
          </Link>
          <nav className="flex gap-4">
            <button
              className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100 transition-colors"
              onClick={() => openSignIn({ redirectUrl: '/studio' })}
            >
              Log in
            </button>
            <button
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              onClick={() => openSignUp({ redirectUrl: '/studio' })}
            >
              Sign up
            </button>
          </nav>
        </header>
        <main className="flex-1 flex flex-col items-center justify-start py-20 mt-32">
          <div className="container px-4 md:px-6 mb-16">
            <div className="flex flex-col items-center space-y-4 text-center">
              <HyperText
                text="Subliminal.Systems"
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400"
                duration={1500}
                animateOnLoad={true}
              />
              <div className="h-20 overflow-hidden">
                <HyperText
                  text={mindSoftwareSentences[currentSentenceIndex]}
                  className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400"
                  duration={1000}
                  animateOnLoad={false}
                  key={currentSentenceIndex} // Add this line
                />
              </div>
            </div>
          </div>

          <div className="container px-4 md:px-6 mb-32">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-800 dark:text-white">Features</h2>
            <div className="grid w-full auto-rows-[320px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <BentoCard
                name="A.I Powered Affirmation Generation"
                className="md:col-span-2"
                background={<div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600" />}
                Icon={Brain} // Pass the imported icon component here
                description="Tailored to your unique goals, these affirmations use advanced algorithms to align with your thoughts and support the manifestation of your intentions. Where science meets the mystical, AI-generated affirmations help tap into the mind's potential, guiding personal growth and transformation."
                href="#"
                cta=""
              />
              <BentoCard
                name="Subliminal Affirmation"
                className=""
                background={<div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />}
                Icon={Mic}
                description={
                  <>
                    Our high-<span className="highlight-word-blue">quality</span> Text to Speech delivers <span className="highlight-word-blue">natural</span>, lifelike audio, seamlessly integrating affirmations into your routine.
                  </>
                }
                href="#"
                cta="" // Empty string removes the "Learn More" text and arrow
              />
              <BentoCard
                name="Personalized Experience"
                className=""
                background={<div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-400" />}
                Icon={Sliders}
                description={
                  <>
                    With our <span className="highlight-word-green">intuitive</span> software, you can easily personalize the audio by mixing your affirmations with backing tracks, giving you full <span className="highlight-word-green">control</span> over sound levels for a perfectly <span className="highlight-word-green">tailored</span> listening experience.
                  </>
                }
                href="#"
                cta="Customize Now"
              />
              <BentoCard
                name="Ownership"
                className=""
                background={<div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-400 dark:to-gray-300" />}
                Icon={Download}
                description={
                  <>
                    Our platform lets you <span className="highlight-word-white">download</span> and <span className="highlight-word-white">own</span> your custom audio, giving you complete access to your <span className="highlight-word-white">personalized</span> affirmations anytime, anywhere.
                  </>
                }
                href="#"
                cta="" // Empty string removes the "Explore Audio Options" text and arrow
              />
              {/* Add the pricing information here */}
              <div className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl p-8">
                <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  $3 Per <span className="highlight-word-yellow">Sub</span>
                </p>
              </div>
            </div>
          </div>
        </main>
        <footer className="py-6 text-center text-gray-500 dark:text-gray-400">
          © 2023 Subliminal.Systems. All rights reserved.
        </footer>
      </div>
      <style jsx global>{`
        @keyframes intense-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 15px rgba(147, 51, 234, 0.8)) drop-shadow(0 0 30px rgba(147, 51, 234, 0.6));
            opacity: 0.9;
          }
          50% { 
            filter: drop-shadow(0 0 30px rgba(147, 51, 234, 1)) drop-shadow(0 0 50px rgba(147, 51, 234, 0.8));
            opacity: 1;
          }
        }
        .animate-glow, .highlight-word {
          animation: intense-glow 3s ease-in-out infinite;
        }
        .highlight-word {
          position: relative;
          z-index: 1;
          color: #ffffff;
          text-shadow: 0 0 15px rgba(147, 51, 234, 0.8);
        }
        .highlight-word::after {
          content: '';
          position: absolute;
          left: -5px;
          right: -5px;
          top: -3px;
          bottom: -3px;
          background: rgba(147, 51, 234, 0.2);
          border-radius: 6px;
          z-index: -1;
        }

        @keyframes intense-glow-green {
          0%, 100% { 
            filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.8)) drop-shadow(0 0 30px rgba(34, 197, 94, 0.6));
            opacity: 0.9;
          }
          50% { 
            filter: drop-shadow(0 0 30px rgba(34, 197, 94, 1)) drop-shadow(0 0 50px rgba(34, 197, 94, 0.8));
            opacity: 1;
          }
        }
        .animate-pulse-glow-green, .highlight-word-green {
          animation: intense-glow-green 3s ease-in-out infinite;
        }
        .highlight-word-green {
          position: relative;
          z-index: 1;
          color: #ffffff;
          text-shadow: 0 0 15px rgba(34, 197, 94, 0.8);
        }
        .highlight-word-green::after {
          content: '';
          position: absolute;
          left: -5px;
          right: -5px;
          top: -3px;
          bottom: -3px;
          background: rgba(34, 197, 94, 0.2);
          border-radius: 6px;
          z-index: -1;
        }

        @keyframes intense-glow-white {
          0%, 100% { 
            filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 30px rgba(255, 255, 255, 0.6));
            opacity: 0.9;
          }
          50% { 
            filter: drop-shadow(0 0 30px rgba(255, 255, 255, 1)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.8));
            opacity: 1;
          }
        }
        .animate-intense-glow-white, .highlight-word-white {
          animation: intense-glow-white 3s ease-in-out infinite;
        }
        .highlight-word-white {
          position: relative;
          z-index: 1;
          color: #ffffff;
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
        }
        .highlight-word-white::after {
          content: '';
          position: absolute;
          left: -5px;
          right: -5px;
          top: -3px;
          bottom: -3px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          z-index: -1;
        }

        @keyframes intense-glow-blue {
          0%, 100% { 
            filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 30px rgba(59, 130, 246, 0.6));
            opacity: 0.9;
          }
          50% { 
            filter: drop-shadow(0 0 30px rgba(59, 130, 246, 1)) drop-shadow(0 0 50px rgba(59, 130, 246, 0.8));
            opacity: 1;
          }
        }
        .animate-pulse-glow-blue, .highlight-word-blue {
          animation: intense-glow-blue 3s ease-in-out infinite;
        }
        .highlight-word-blue {
          position: relative;
          z-index: 1;
          color: #ffffff;
          text-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
        }
        .highlight-word-blue::after {
          content: '';
          position: absolute;
          left: -5px;
          right: -5px;
          top: -3px;
          bottom: -3px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          z-index: -1;
        }

        .highlight-word-yellow {
          position: relative;
          z-index: 1;
          color: #eab308;
          text-shadow: 0 0 8px rgba(234, 179, 8, 0.4);
        }
        .highlight-word-yellow::after {
          content: '';
          position: absolute;
          left: -2px;
          right: -2px;
          top: 0;
          bottom: 0;
          background: rgba(234, 179, 8, 0.1);
          border-radius: 4px;
          z-index: -1;
        }
      `}</style>
      {error && <p className="text-red-500">{error}</p>}
      {/* Login/Signup form that calls handleAuthentication on submit */}
    </div>
  );
}

export default HomePage;
