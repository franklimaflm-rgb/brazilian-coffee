import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const AdminSetupPage = () => {
  const [email, setEmail] = useState("franklinmarceloderreiradelima@gmail.com");
  const [password, setPassword] = useState("BrazilianCoffee2024!");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email);

      if (existingUsers && existingUsers.length > 0) {
        toast.error('Admin user already exists!');
        setIsLoading(false);
        return;
      }

      // Create the admin user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Franklin Marcelo Ferreira de Lima',
            role: 'admin',
            business: 'Brazilian Coffee Academy'
          }
        }
      });

      if (error) {
        toast.error(`Error creating admin: ${error.message}`);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        toast.success('Admin user created successfully!');
        setIsCreated(true);
        
        // Sign out immediately after creation
        await supabase.auth.signOut();
      }

    } catch (error: any) {
      toast.error(`Failed to create admin: ${error.message}`);
    }

    setIsLoading(false);
  };

  const handleTestLogin = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Login test failed: ${error.message}`);
      } else {
        toast.success('Admin login test successful!');
        // Sign out after test
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      toast.error(`Login test error: ${error.message}`);
    }

    setIsLoading(false);
  };

  if (isCreated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500 mr-2" />
              <span className="text-2xl font-bold">Admin Created!</span>
            </div>
            <CardTitle>Brazilian Coffee Academy Admin Setup Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Admin Account Created</h3>
              <p className="text-sm text-green-700">
                Email: {email}<br/>
                The admin account has been successfully created and is ready to use.
              </p>
            </div>
            
            <Button 
              onClick={handleTestLogin} 
              className="w-full" 
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Login...
                </>
              ) : (
                'Test Admin Login'
              )}
            </Button>

            <div className="text-center">
              <a 
                href="/admin" 
                className="text-primary hover:underline font-medium"
              >
                Go to Admin Panel →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-primary mr-2" />
            <span className="text-2xl font-bold">Admin Setup</span>
          </div>
          <CardTitle>Create Brazilian Coffee Academy Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">⚠️ One-Time Setup</h3>
                <p className="text-sm text-yellow-700">
                  This page creates the admin account for Franklin. 
                  It should only be used once during initial setup.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="franklinmarceloderreiradelima@gmail.com"
                required
                disabled
              />
            </div>
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Strong password for admin access
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                'Create Admin Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>This will create the admin account with:</p>
            <ul className="mt-2 space-y-1">
              <li>• Full access to admin panel</li>
              <li>• Order management capabilities</li>
              <li>• Customer data access</li>
              <li>• Business settings control</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetupPage;
