'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

export default function SuccessPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        const storedAudioDetails = localStorage.getItem('pendingAudioDetails');
        if (!storedAudioDetails) {
          toast({
            description: "No audio details found. Please create an audio first.",
            variant: "destructive",
          });
          router.push('/studio');
          return;
        }

        toast({
          description: "Payment successful! Your audio is ready for download.",
          variant: "success",
        });

        // Redirect to payment success page
        router.push('/payment-success');
      } catch (error) {
        console.error('Error handling success:', error);
        toast({
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
        router.push('/studio');
      }
    };

    handleSuccess();
  }, [router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing your payment...</h1>
        <p>Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
