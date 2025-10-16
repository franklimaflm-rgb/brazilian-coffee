import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Index from "./pages/Index";
import CoffeeDetail from "./pages/CoffeeDetail";
import MenuPage from "./pages/MenuPage";
import DeliveryPage from "./pages/DeliveryPage";
import AdminPage from "./pages/AdminPage";
import QRCodePage from "./pages/QRCodePage";
import OrderTracking from "./pages/OrderTracking";
import DatabaseTest from "./components/DatabaseTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/coffee/:id" element={<CoffeeDetail />} />
            <Route path="/delivery" element={<DeliveryPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/track-order" element={<OrderTracking />} />
            <Route path="/database-test" element={<DatabaseTest />} />
            <Route path="/qrcode" element={<QRCodePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
