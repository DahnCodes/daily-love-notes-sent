
-- Create a table for push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to insert subscriptions (for anonymous users)
CREATE POLICY "Anyone can create push subscriptions" 
  ON public.push_subscriptions 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy that allows anyone to select subscriptions (needed for sending notifications)
CREATE POLICY "Anyone can view push subscriptions" 
  ON public.push_subscriptions 
  FOR SELECT 
  USING (true);
