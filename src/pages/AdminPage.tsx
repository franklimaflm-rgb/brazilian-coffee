import { useState } from "react";
import { useAdmin, useAdminAuth, OrderStatus } from "@/hooks/useAdmin";
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

const AdminSetupForm = ({ onCreateAdmin }: { onCreateAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }> }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("franklinmarceloferreiradelima@gmail.com");
  const [password, setPassword] = useState("BrazilianCoffee2024!");
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
- Email Field: ${email}
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
1. Verify email: franklinmarceloferreiradelima@gmail.com
2. Verify password: 4sR#viwqtUMHUym
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
                disabled
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

const OrderStatusBadge = ({ status }: { status: string }) => {
  const { t } = useLanguage();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: t('admin.orderStatuses.pending') };
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: t('admin.orderStatuses.confirmed') };
      case 'preparing':
        return { color: 'bg-orange-100 text-orange-800', icon: Coffee, label: t('admin.orderStatuses.preparing') };
      case 'out_for_delivery':
        return { color: 'bg-purple-100 text-purple-800', icon: Truck, label: t('admin.orderStatuses.out_for_delivery') };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: t('admin.orderStatuses.delivered') };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: t('admin.orderStatuses.cancelled') };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, label: t('admin.orderStatuses.unknown') };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

const AdminDashboard = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { language, t } = useLanguage();
  const { orders, loading, updateOrderStatus, getOrderStats, getTodaysOrders } = useAdmin(isAuthenticated);
  const { logout } = useAdminAuth();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const stats = getOrderStats();
  const todaysOrders = getTodaysOrders();

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      toast.success(t('admin.messages.statusUpdated'));
    } else {
      toast.error(result.error || t('admin.messages.statusUpdateFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{t('admin.messages.loadingOrders')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">{t('admin.title')}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('admin.subtitle')}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" size="sm" className="h-9 sm:h-10 text-sm touch-manipulation">
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('admin.logout')}</span>
              <span className="sm:hidden">{t('admin.logout')}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('admin.totalOrders')}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.todaysOrders')}</p>
                  <p className="text-2xl font-bold">{todaysOrders.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.pendingOrders')}</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.totalRevenue')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('admin.recentOrders')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('admin.noOrders')}</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{t('admin.orderNumber')}{order.order_number}</h3>
                          <OrderStatusBadge status={order.status || 'pending'} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('admin.delivery')} {formatCurrency(order.delivery_fee)}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    {order.customers && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded">
                        <div>
                          <h4 className="font-medium mb-2">{t('admin.customerDetails')}</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {order.customers.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {order.customers.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {order.customers.phone}
                            </div>
                          </div>
                        </div>
                        
                        {order.addresses && (
                          <div>
                            <h4 className="font-medium mb-2">{t('admin.deliveryAddress')}</h4>
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="w-4 h-4 mt-0.5" />
                              <div>
                                <p>{order.addresses.address_line_1}</p>
                                {order.addresses.address_line_2 && (
                                  <p>{order.addresses.address_line_2}</p>
                                )}
                                <p>{order.addresses.city}, {order.addresses.postcode}</p>
                                {order.addresses.distance_from_business && (
                                  <p className="text-muted-foreground">
                                    {t('admin.distance')} {order.addresses.distance_from_business}km
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">{t('admin.orderItems')}</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Coffee className="w-4 h-4" />
                              <span>
                                {item.coffee_products 
                                  ? (language === 'pt-BR' ? item.coffee_products.name_pt : item.coffee_products.name_en)
                                  : 'Unknown Coffee'
                                } x {item.quantity}
                              </span>
                            </div>
                            <span>{formatCurrency(item.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`status-${order.id}`} className="text-sm">{t('admin.updateStatus')}</Label>
                      <Select
                        value={order.status || 'pending'}
                        onValueChange={(value: OrderStatus) => handleStatusUpdate(order.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t('admin.orderStatuses.pending')}</SelectItem>
                          <SelectItem value="confirmed">{t('admin.orderStatuses.confirmed')}</SelectItem>
                          <SelectItem value="preparing">{t('admin.orderStatuses.preparing')}</SelectItem>
                          <SelectItem value="out_for_delivery">{t('admin.orderStatuses.out_for_delivery')}</SelectItem>
                          <SelectItem value="delivered">{t('admin.orderStatuses.delivered')}</SelectItem>
                          <SelectItem value="cancelled">{t('admin.orderStatuses.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {order.special_instructions && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm">
                          <strong>{t('admin.specialInstructions')}</strong> {order.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
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
