import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useOrders';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const OrderTracking = () => {
  const navigate = useNavigate();
  const { getOrderByNumber } = useOrders();
  const { t } = useLanguage();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim() || !email.trim()) {
      toast.error(t('orderTracking.enterBoth'));
      return;
    }

    setIsSearching(true);
    try {
      const data = await getOrderByNumber(orderNumber.trim(), email.trim());
      setOrderData(data);
      toast.success(t('orderTracking.orderFound'));
    } catch (error) {
      toast.error(t('orderTracking.orderNotFound'));
      setOrderData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'preparing':
        return 'bg-purple-500';
      case 'on_the_way':
        return 'bg-orange-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Package className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-2">{t('orderTracking.title')}</h1>
            <p className="text-muted-foreground">
              {t('orderTracking.description')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('orderTracking.orderLookup')}</CardTitle>
              <CardDescription>
                {t('orderTracking.lookupDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="orderNumber">{t('orderTracking.orderNumber')}</Label>
                  <Input
                    id="orderNumber"
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder={t('orderTracking.orderNumberPlaceholder')}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('orderTracking.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('orderTracking.emailPlaceholder')}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSearching}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? t('orderTracking.searching') : t('orderTracking.trackOrder')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {orderData && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('admin.orderNumber')}{orderData.order_number}</CardTitle>
                    <CardDescription>
                      {t('orderTracking.placedOn')} {new Date(orderData.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(orderData.status)}>
                    {t(`admin.orderStatuses.${orderData.status}`) || formatStatus(orderData.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">{t('orderTracking.customerDetails')}</h3>
                    <p className="text-sm text-muted-foreground">{orderData.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{orderData.customer_email}</p>
                    {orderData.customer_phone && (
                      <p className="text-sm text-muted-foreground">{orderData.customer_phone}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t('orderTracking.deliveryAddress')}</h3>
                    <p className="text-sm text-muted-foreground">{orderData.delivery_address}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('orderTracking.orderItems')}</h3>
                  <div className="space-y-2">
                    {orderData.items && orderData.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {t('orderTracking.coffeeProduct')} (£{Number(item.unit_price).toFixed(2)} {t('orderTracking.each')})
                        </span>
                        <span className="font-medium">
                          £{Number(item.total_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('orderTracking.subtotal')}</span>
                    <span>£{(Number(orderData.total_amount) - Number(orderData.delivery_fee)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('orderTracking.deliveryFee')}</span>
                    <span>£{Number(orderData.delivery_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t('orderTracking.total')}</span>
                    <span>£{Number(orderData.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {orderData.estimated_delivery_time && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium">{t('orderTracking.estimatedDelivery')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(orderData.estimated_delivery_time).toLocaleString()}
                    </p>
                  </div>
                )}

                {orderData.special_instructions && (
                  <div>
                    <h3 className="font-semibold mb-2">{t('orderTracking.specialInstructions')}</h3>
                    <p className="text-sm text-muted-foreground">{orderData.special_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTracking;
