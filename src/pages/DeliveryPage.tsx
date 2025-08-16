import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { DeliveryMap } from "@/components/DeliveryMap";
import { coffeesI18n } from "@/data/coffees-i18n";
import { useOrders, useDeliveryValidation, useCoffeeProducts } from "@/hooks/useOrders";
import { toast } from "sonner";

interface OrderForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  coffee: string;
  quantity: number;
  specialInstructions: string;
}

interface AddressValidation {
  isValid: boolean;
  isWithinRange: boolean;
  distance?: number;
  message: string;
  coordinates?: [number, number];
  deliveryFee?: number;
  estimatedTime?: number;
}

const DeliveryPage = () => {
  const { language, t } = useLanguage();
  const { submitOrder, isSubmitting } = useOrders();
  const { validateAddress, isValidating } = useDeliveryValidation();
  const { products, loading: productsLoading, fetchProducts } = useCoffeeProducts();
  const [searchParams] = useSearchParams();

  const [orderForm, setOrderForm] = useState<OrderForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    coffee: "",
    quantity: 1,
    specialInstructions: ""
  });

  const [addressValidation, setAddressValidation] = useState<AddressValidation | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Pre-populate coffee selection from URL parameters
  useEffect(() => {
    const coffeeParam = searchParams.get('coffee');
    if (coffeeParam && coffeeParam !== orderForm.coffee) {
      setOrderForm(prev => ({
        ...prev,
        coffee: coffeeParam
      }));
    }
  }, [searchParams, orderForm.coffee]);

  // Business location coordinates (Main Street, 68 - Lubenham - Market Harborough)
  const businessLocation: [number, number] = [-0.9533, 52.4673]; // Precise coordinates for Main Street, 68, Lubenham

  const handleAddressValidation = async () => {
    if (!orderForm.address.trim()) {
      setAddressValidation({
        isValid: false,
        isWithinRange: false,
        message: t('delivery.validation.addressRequired')
      });
      return;
    }

    const result = await validateAddress(orderForm.address);
    setAddressValidation({
      isValid: result.isValid,
      isWithinRange: result.isWithinRange,
      distance: result.distance,
      message: result.message,
      deliveryFee: result.deliveryFee,
      estimatedTime: result.estimatedTime,
      coordinates: result.isWithinRange
        ? [businessLocation[0] + (Math.random() - 0.5) * 0.1, businessLocation[1] + (Math.random() - 0.5) * 0.1]
        : undefined
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressValidation?.isWithinRange) {
      toast.error(t('delivery.validation.addressRequired'));
      return;
    }

    const selectedProduct = products.find(p => p.id === orderForm.coffee);
    if (!selectedProduct) {
      toast.error(t('delivery.validation.coffeeRequired'));
      return;
    }

    const orderData = {
      customer: {
        name: orderForm.name,
        email: orderForm.email,
        phone: orderForm.phone,
      },
      address: {
        address_line_1: orderForm.address,
        city: "Market Harborough", // Default for the area
        postcode: "LE16", // Default postcode area
        country: "United Kingdom",
      },
      items: [{
        coffee_product_id: orderForm.coffee,
        quantity: orderForm.quantity,
        unit_price: selectedProduct.price,
      }],
      special_instructions: orderForm.specialInstructions,
      delivery_fee: addressValidation.deliveryFee || 0,
      estimated_delivery_time: addressValidation.estimatedTime || 30,
    };

    const result = await submitOrder(orderData);

    if (result.success) {
      toast.success(`Order ${result.order_number} placed successfully! We'll contact you soon.`);
      // Reset form
      setOrderForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        coffee: "",
        quantity: 1,
        specialInstructions: ""
      });
      setAddressValidation(null);
    } else {
      toast.error(result.error || 'Failed to place order. Please try again.');
    }
  };

  const selectedCoffee = coffeesI18n.find(coffee => coffee.id === orderForm.coffee);
  const selectedProduct = products.find(p => p.id === orderForm.coffee);
  const coffeePrice = selectedProduct?.price || 8.50;
  const deliveryFee = addressValidation?.deliveryFee || 0;
  const totalPrice = (coffeePrice * orderForm.quantity) + deliveryFee;
  const estimatedTimeDisplay = addressValidation?.estimatedTime
    ? `${addressValidation.estimatedTime}-${addressValidation.estimatedTime + 10} ${language === 'pt-BR' ? 'minutos' : 'minutes'}`
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('delivery.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            {t('delivery.description')}
          </p>
          
          {/* Business Info */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('delivery.businessPhone')}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t('delivery.businessEmail')}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lubenham, Market Harborough
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('delivery.orderForm.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('delivery.orderForm.customerInfo')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">{t('delivery.orderForm.name')}</Label>
                      <Input
                        id="name"
                        value={orderForm.name}
                        onChange={(e) => setOrderForm({...orderForm, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">{t('delivery.orderForm.phone')}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={orderForm.phone}
                        onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">{t('delivery.orderForm.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Address Validation */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">{t('delivery.orderForm.address')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="address"
                        value={orderForm.address}
                        onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
                        placeholder={t('delivery.orderForm.addressPlaceholder')}
                        required
                      />
                      <Button
                        type="button"
                        onClick={handleAddressValidation}
                        disabled={isValidating}
                        variant="outline"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('delivery.orderForm.calculating')}
                          </>
                        ) : (
                          t('delivery.orderForm.checkAddress')
                        )}
                      </Button>
                    </div>
                    
                    {addressValidation && (
                      <div className={`mt-2 p-3 rounded-lg flex items-center gap-2 ${
                        addressValidation.isWithinRange 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {addressValidation.isWithinRange ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{addressValidation.message}</span>
                        {addressValidation.distance && (
                          <Badge variant="secondary" className="ml-auto">
                            {addressValidation.distance.toFixed(1)}km
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Coffee Selection */}
                {addressValidation?.isWithinRange && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="coffee">{t('delivery.orderForm.selectCoffee')}</Label>
                      <Select value={orderForm.coffee} onValueChange={(value) => setOrderForm({...orderForm, coffee: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('delivery.orderForm.selectCoffee')} />
                        </SelectTrigger>
                        <SelectContent>
                          {productsLoading ? (
                            <SelectItem value="" disabled>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading coffees...
                            </SelectItem>
                          ) : (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {language === 'pt-BR' ? product.name_pt : product.name_en} - £{product.price.toFixed(2)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="quantity">{t('delivery.orderForm.quantity')}</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="10"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({...orderForm, quantity: parseInt(e.target.value) || 1})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instructions">{t('delivery.orderForm.specialInstructions')}</Label>
                      <Textarea
                        id="instructions"
                        value={orderForm.specialInstructions}
                        onChange={(e) => setOrderForm({...orderForm, specialInstructions: e.target.value})}
                        placeholder={t('delivery.orderForm.specialInstructionsPlaceholder')}
                        rows={3}
                      />
                    </div>

                    {/* Order Summary */}
                    {selectedCoffee && (
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>{selectedCoffee.name[language]} x {orderForm.quantity}</span>
                          <span>£{(coffeePrice * orderForm.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('delivery.orderForm.deliveryFee')}</span>
                          <span>£{deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('delivery.orderForm.estimatedTime')}</span>
                          <span>{estimatedTimeDisplay}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>{t('delivery.orderForm.total')}</span>
                          <span>£{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!orderForm.coffee || !addressValidation?.isWithinRange || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('delivery.orderForm.calculating')}
                        </>
                      ) : (
                        t('delivery.orderForm.placeOrder')
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                {t('delivery.map.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                businessLocation={businessLocation}
                customerLocation={addressValidation?.coordinates}
                deliveryRadius={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DeliveryPage;
