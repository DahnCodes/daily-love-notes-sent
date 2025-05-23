
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive daily love letters.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Email submitted:", email);

    // Simulate API call - replace with Supabase integration
    setTimeout(() => {
      toast({
        title: "Welcome to Daily Love Letters! 💌",
        description: "You're all set! Expect your first personalized love letter tomorrow morning.",
      });
      setEmail("");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-2 mb-6">
            <Heart className="w-8 h-8 text-rose-400 animate-pulse" />
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Daily Love Letters
            </h1>
            <Heart className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Receive a personalized, authentic love letter in your inbox every morning. 
            Start your day with words that warm your heart and remind you that you are cherished.
          </p>
        </div>

        {/* Main Sign-up Card */}
        <div className="max-w-md mx-auto mb-16">
          <Card className="backdrop-blur-sm bg-white/80 border-rose-200 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full">
                  <Mail className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Begin Your Journey
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter your email to receive daily love letters crafted just for you
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-center border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Subscribing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Start Receiving Love Letters
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-rose-100">
            <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Personalized</h3>
            <p className="text-gray-600">Every letter is uniquely crafted with authentic emotions and personal touches.</p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-rose-100">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Daily Delivery</h3>
            <p className="text-gray-600">Wake up to a beautiful love letter in your inbox every single morning.</p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-rose-100">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Authentic</h3>
            <p className="text-gray-600">Real emotions, genuine words, and heartfelt messages that speak to your soul.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            Made with 💖 for those who believe in the power of love letters
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
