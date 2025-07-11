import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../libs/supabase'
import { useToast } from '../hooks/use-toast'
import { fetchChatMemory, upsertChatMemory, insertUser } from '../libs/db';

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatHistory, setChatHistory] = useState([])
  const { toast } = useToast()

  const loadChatHistory = async (userId) => {
    const { memory } = await fetchChatMemory(userId);
    setChatHistory(memory);
  };

  useEffect(() => {
    if (!user) {
      setChatHistory([]);
      return;
    }
    
    loadChatHistory(user.id);
  }, [user]);

  const forceRefreshChatHistory = async () => {
    if (user) {
      await loadChatHistory(user.id);
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          toast({
            title: "Authentication Error",
            description: "Failed to get current session",
            variant: "destructive"
          })
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        toast({
          title: "Authentication Error",
          description: "Failed to initialize authentication",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome!",
            description: "Successfully signed in to IntelliLearn",
          })
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed Out",
            description: "You have been successfully signed out",
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [toast])

  const showError = (title, message) => {
    toast({
      title,
      description: message,
      variant: "destructive"
    })
  }

  const signUp = async ({ email, password, name }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive"
        })
        return { error }
      }
      // This piece of code writes a new user into the Users table
      if (data.user) {
        const { error: insertError } = await insertUser({
          id: data.user.id,
          email: data.user.email,
          full_name: name
        });
        
        if (insertError) {
          console.error('Failed to insert user into Users table:', insertError);
          // Don't fail the signup process if user insertion fails
          // as the authentication was successful
          toast({
            title: "User Profile Warning",
            description: "Account created but profile data may be incomplete. Please contact support if you experience issues.",
            variant: "destructive"
          });
        }
      }

      if (data.user && !data.session) {
        toast({
          title: "Check Your Email",
          description: "Please check your email for a confirmation link",
        })
      }

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred during sign up",
        variant: "destructive"
      })
      return { error }
    }
  }

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        })
        return { error }
      }

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred during sign in",
        variant: "destructive"
      })
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive"
        })
        return { error }
      }
      return { error: null }
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "An unexpected error occurred during sign out",
        variant: "destructive"
      })
      return { error }
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive"
        })
        return { error }
      }

      toast({
        title: "Check Your Email",
        description: "Password reset instructions have been sent to your email",
      })

      return { error: null }
    } catch (error) {
      toast({
        title: "Password Reset Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser(updates)
      
      if (error) {
        toast({
          title: "Profile Update Failed",
          description: error.message,
          variant: "destructive"
        })
        return { error }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      })

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Profile Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
      return { error }
    }
  }

  const resetChat = async () => {
    if (!user) return { error: 'User not authenticated' };
    const { error } = await upsertChatMemory(user.id, []);
    if (!error) setChatHistory([]);
    return { error };
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    chatHistory,
    setChatHistory,
    forceRefreshChatHistory,
    saveMessagesToDatabase: (messages) => upsertChatMemory(user?.id, messages),
    resetChat,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    showError,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
} 