import { useState, useEffect } from "react";
import { useAdmin, useAdminAuth, OrderStatus } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Coffee, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  Users,
  Calendar,
  LogOut,
  Loader2,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const AdminSetupForm = ({ onCreateAdmin }: { onCreateAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }> }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await onCreateAdmin(email, password);

    if (result.success) {
      toast.success(result.message || 'Admin account created successfully!');
    } else {
      toast.error(result.error || 'Failed to create admin account');
    }

    setIsLoading(false);
  };

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
                  This creates the admin account for Franklin.
                  It should only be used once during initial setup.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="setup-email">Admin Email</Label>
              <Input
                id="setup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="franklinmarceloferreiradelima@gmail.com"
                required
                disabled
              />
            </div>
            <div>
              <Label htmlFor="setup-password">Admin Password</Label>
              <Input
                id="setup-password"
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

const AdminLoginForm = ({ onLogin, needsSetup }: { onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsSetup?: boolean; diagnosticData?: any }>, needsSetup?: boolean }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("franklinmarceloferreiradelima@gmail.com");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastDiagnosticData, setLastDiagnosticData] = useState<any>(null);

  const generateManualDiagnostic = () => {
    const timestamp = new Date().toISOString();
    const diagnosticContent = `
BRAZILIAN COFFEE ACADEMY - MANUAL DIAGNOSTIC REPORT
Generated: ${timestamp}
==========================================================

MANUAL DIAGNOSTIC REQUESTED BY USER

CURRENT STATE:
- Email Field: ${email ? '[SET]' : '[EMPTY]'}
- Password Field: ${password ? '[SET]' : '[EMPTY]'}
- Loading State: ${isLoading}
- Needs Setup: ${needsSetup}

ENVIRONMENT CHECK:
- Current URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Local Storage Keys: ${Object.keys(localStorage).join(', ')}

LAST LOGIN ATTEMPT DATA:
${lastDiagnosticData ? JSON.stringify(lastDiagnosticData, null, 2) : 'No previous login attempt data available'}

BROWSER CONSOLE LOGS:
Please check the browser console (F12) for additional debugging information.

TROUBLESHOOTING STEPS:
1. Verify your admin email is correct
2. Verify your admin password is correct
3. Check browser console for errors
4. Try clearing browser cache and cookies
5. Check network connectivity

==========================================================
End of Manual Diagnostic Report
`;

    const blob = new Blob([diagnosticContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brazilian-coffee-manual-diagnostic-${timestamp.replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Diagnostic file downloaded successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await onLogin(email, password);

    if (!result.success) {
      // Store diagnostic data for manual diagnostic generation
      if (result.diagnosticData) {
        setLastDiagnosticData(result.diagnosticData);
      }

      toast.error(result.error || t('admin.messages.loginFailed'));

      // Show additional diagnostic info
      toast.info('Diagnostic file has been automatically generated and downloaded');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-primary mr-2" />
            <span className="text-2xl font-bold">{t('admin.title')}</span>
          </div>
          <CardTitle>{t('admin.subtitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {needsSetup && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">ℹ️ Admin Setup Required</h3>
                  <p className="text-sm text-blue-700">
                    No admin account found. Please create the admin account first, then try logging in.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('admin.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="franklinmarceloferreiradelima@gmail.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t('admin.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('admin.loggingIn')}
                </>
              ) : (
                t('admin.login')
              )}
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full text-sm text-muted-foreground hover:text-primary"
              disabled={isLoading}
              onClick={async () => {
                if (!email) {
                  toast.error('Informe o e-mail do administrador');
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) toast.error(error.message);
                else toast.success('Enviamos um link de recuperação para o seu e-mail');
              }}
            >
              Esqueci minha senha
            </Button>

            {/* Diagnostic Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={generateManualDiagnostic}
              disabled={isLoading}
            >
              📋 Generate Diagnostic File
            </Button>

            {lastDiagnosticData && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Last login failed. Diagnostic file was automatically generated.
                  <br />
                  <span className="font-medium">Error:</span> {lastDiagnosticData.primaryError}
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminPage = () => {
  const { isAuthenticated, isLoading, needsSetup, login, createAdmin } = useAdminAuth();
  const [showSetup, setShowSetup] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show setup form if user requested setup or setup is needed
    if (needsSetup || showSetup) {
      return (
        <div>
          <AdminSetupForm onCreateAdmin={createAdmin} />
          <div className="fixed bottom-4 right-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSetup(false);
                // Reset needsSetup when user goes back to login
                // This will be set again by login function if needed
              }}
              className="bg-white shadow-lg"
            >
              Back to Login
            </Button>
          </div>
        </div>
      );
    }

    // Show login form with setup option
    return (
      <div>
        <AdminLoginForm onLogin={login} needsSetup={needsSetup} />
        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            onClick={() => setShowSetup(true)}
            className="bg-white shadow-lg"
          >
            Create Admin Account
          </Button>
        </div>
      </div>
    );
  }

  return <AdminDashboard isAuthenticated={isAuthenticated} />;
};

export default AdminPage;
