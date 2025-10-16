import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUserEmail(session.user.email || null);
          
          // Check admin role from database using has_role function
          const { data, error } = await supabase
            .rpc('has_role', { 
              _user_id: session.user.id, 
              _role: 'admin' 
            });

          if (error) {
            console.error('Error checking admin role:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data === true);
          }
        } else {
          setIsAdmin(false);
          setUserEmail(null);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setUserEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        
        const { data, error } = await supabase
          .rpc('has_role', { 
            _user_id: session.user.id, 
            _role: 'admin' 
          });

        if (!error && data === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setUserEmail(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, isLoading, userEmail };
};
