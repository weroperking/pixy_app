-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  subscription TEXT NOT NULL DEFAULT 'free' CHECK (subscription IN ('free', 'premium')),
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Purchases table for tracking subscription payments
CREATE TABLE public.purchases (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Logs table for mood tracking data
CREATE TABLE public.logs (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Actions table for tracking user behavior
CREATE TABLE public.actions (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_logs_user_id ON public.logs(user_id);
CREATE INDEX idx_logs_created_at ON public.logs(created_at);
CREATE INDEX idx_actions_user_id ON public.actions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Users table RLS policies
-- Users can only read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR auth.uid() IS NULL
  );

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Purchases table RLS policies
-- Users can only see their own purchases
CREATE POLICY "Users can read own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Logs table RLS policies
-- Users can only access their own logs
CREATE POLICY "Users can read own logs" ON public.logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create logs
CREATE POLICY "Users can create logs" ON public.logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own logs
CREATE POLICY "Users can update own logs" ON public.logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own logs
CREATE POLICY "Users can delete own logs" ON public.logs
  FOR DELETE USING (auth.uid() = user_id);

-- Actions table RLS policies
-- Users can only see their own actions
CREATE POLICY "Users can read own actions" ON public.actions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create actions
CREATE POLICY "Users can create actions" ON public.actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
