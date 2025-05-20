'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RiSunLine, RiMoonLine, RiComputerLine } from 'react-icons/ri';

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();

  // Pre-fill with user data if available
  useEffect(() => {
    if (user) {
      if (user.displayName) setDisplayName(user.displayName);
      if (user.apiKey) setApiKey(user.apiKey);
      if (user.theme) setTheme(user.theme);
      
      // If user has already completed onboarding, redirect to dashboard
      if (user.hasCompletedOnboarding) {
        router.push('/board');
      }
    }
  }, [user, router]);

  // Apply theme immediately when changed
  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Only include apiKey if it's not empty
      const profileData: any = {
        displayName,
        theme,
        hasCompletedOnboarding: true
      };
      
      // Only add apiKey if it's provided
      if (apiKey.trim() !== '') {
        profileData.apiKey = apiKey;
      }
      
      await updateUserProfile(profileData);
      
      // Redirect to dashboard
      router.push('/board');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Taskflow AI</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Let's set up your account
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name
              </label>
              <div className="relative">
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  placeholder="Tanish"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Google AI API Key (Optional)
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input-field"
                  placeholder="Enter your Google AI API key (optional)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Used for AI-powered features. You can skip this and add it later.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                    theme === 'light'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <RiSunLine className={`h-6 w-6 mb-1 ${theme === 'light' ? 'text-primary' : 'text-gray-700 dark:text-white'}`} />
                  <span className={`text-sm ${theme === 'light' ? 'text-primary' : 'text-gray-700 dark:text-white'}`}>Light</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <RiMoonLine className={`h-6 w-6 mb-1 ${theme === 'dark' ? 'text-primary' : 'text-gray-700 dark:text-white'}`} />
                  <span className={`text-sm ${theme === 'dark' ? 'text-primary' : 'text-gray-700 dark:text-white'}`}>Dark</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                    theme === 'system'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <RiComputerLine className={`h-6 w-6 mb-1 ${theme === 'system' ? 'text-primary' : 'text-gray-700 dark:text-white'}`} />
                  <span className={`text-sm ${theme === 'system' ? 'text-primary' : 'text-gray-700 dark:text-white'}`}>System</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="button-primary w-full flex justify-center items-center"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
