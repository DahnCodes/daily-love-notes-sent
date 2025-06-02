
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Sparkles, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryPreference, setDeliveryPreference] = useState("email");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // If it doesn't start with a country code, assume it's a US number
    if (cleaned.length <= 10) {
      return `+1${cleaned}`;
    } else if (!cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`;
    } else {
      return `+${cleaned}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow users to type without the + prefix
    setPhoneNumber(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && !phoneNumber) {
      toast({
        title: "Contact Required",
        description: "Please enter either your email address or phone number to receive daily love letters.",
        variant: "destructive",
      });
      return;
    }

    if (email && !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Format phone number and validate
    let formattedPhone = "";
    if (phoneNumber) {
      formattedPhone = formatPhoneNumber(phoneNumber);
      const phoneRegex = /^\+\d{10,15}$/;
      if (!phoneRegex.test(formattedPhone)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number (10-15 digits).",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Call the appropriate edge function based on delivery preference
      const functionName = deliveryPreference === 'whatsapp' || (deliveryPreference === 'both' && phoneNumber) 
        ? 'send-whatsapp-confirmation' 
        : 'send-confirmation';
      
      const { error } = await supabase.functions.invoke(functionName, {
        body: { 
          email: email || null, 
          phone_number: formattedPhone || null,
          delivery_preference: deliveryPreference 
        },
      });
      
      if (error) throw error;
      
      const message = deliveryPreference === 'whatsapp' 
        ? "We've sent you a WhatsApp confirmation message!"
        : deliveryPreference === 'both'
        ? "We've sent confirmations to both your email and WhatsApp!"
        : "We've sent you a confirmation email. Check your inbox!";
      
      toast({
        title: "Welcome to Daily Love Letters! 💌",
        description: message,
      });
      setEmail("");
      setPhoneNumber("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Something went wrong",
        description: "We couldn't process your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            Receive a personalized, authentic love letter in your inbox or WhatsApp every morning. 
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
                Choose how you'd like to receive your daily love letters
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Delivery Preference */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">How would you like to receive your letters?</label>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="delivery"
                        value="email"
                        checked={deliveryPreference === "email"}
                        onChange={(e) => setDeliveryPreference(e.target.value)}
                        className="text-rose-500 focus:ring-rose-400"
                      />
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Email only</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="delivery"
                        value="whatsapp"
                        checked={deliveryPreference === "whatsapp"}
                        onChange={(e) => setDeliveryPreference(e.target.value)}
                        className="text-rose-500 focus:ring-rose-400"
                      />
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">WhatsApp only</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="delivery"
                        value="both"
                        checked={deliveryPreference === "both"}
                        onChange={(e) => setDeliveryPreference(e.target.value)}
                        className="text-rose-500 focus:ring-rose-400"
                      />
                      <div className="flex space-x-1">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <MessageCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="text-sm">Both Email & WhatsApp</span>
                    </label>
                  </div>
                </div>

                {/* Email Input */}
                {(deliveryPreference === "email" || deliveryPreference === "both") && (
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
                )}

                {/* Phone Input */}
                {(deliveryPreference === "whatsapp" || deliveryPreference === "both") && (
                  <div className="space-y-2">
                    <Input
                      type="tel"
                      placeholder="1234567890"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="h-12 text-center border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 text-center">Enter your phone number (country code will be added automatically)</p>
                  </div>
                )}
                
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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Multi-Channel</h3>
            <p className="text-gray-600">Receive your daily love letters via email, WhatsApp, or both - your choice!</p>
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
