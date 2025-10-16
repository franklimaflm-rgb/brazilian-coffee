import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Loader2 } from 'lucide-react';

const SimpleAdminPage = () => {
  const { isAdmin, isLoading, userEmail } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Coffee className="w-8 h-8 text-primary mr-2" />
              <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              {userEmail ? `Signed in as: ${userEmail}` : 'Please sign in with an admin account.'}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-6 h-6" />
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Welcome, {userEmail}!</p>
              <p className="text-muted-foreground">
                You have admin access. The full admin panel is available in the original AdminPage component.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleAdminPage;
