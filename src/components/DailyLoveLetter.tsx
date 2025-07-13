import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Loader, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DailyLoveLetter = () => {
  const [loveLetter, setLoveLetter] = useState('');
  const [letterDate, setLetterDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateLetter = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-love-letter');
      
      if (error) throw error;
      
      setLoveLetter(data.loveLetter || data.fallbackLetter);
      setLetterDate(data.date);
      
      toast({
        title: "New Love Letter Generated! 💌",
        description: "Your daily dose of love is ready to read.",
      });
    } catch (error) {
      console.error('Error generating love letter:', error);
      toast({
        title: "Couldn't Generate Letter",
        description: "Something went wrong, but you're still amazing! 💕",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-rose-200 shadow-lg mb-6">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full">
            <Heart className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">
          Your Daily Love Letter
        </CardTitle>
        {letterDate && (
          <p className="text-sm text-gray-600">{letterDate}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!loveLetter ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Ready to receive your personalized love letter for today?
            </p>
            <Button
              onClick={generateLetter}
              disabled={isLoading}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating Your Letter...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Generate Today's Letter
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-lg border border-rose-100">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line italic">
                {loveLetter}
              </p>
            </div>
            <div className="text-center">
              <Button
                onClick={generateLetter}
                disabled={isLoading}
                variant="outline"
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Get Another Letter
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyLoveLetter;