import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import CoffeeDetail from "./pages/CoffeeDetail";
import MenuPage from "./pages/MenuPage";
import DeliveryPage from "./pages/DeliveryPage";
import AdminPage from "./pages/AdminPage";
import QRCodePage from "./pages/QRCodePage";
import OrderTracking from "./pages/OrderTracking";
import DatabaseTest from "./components/DatabaseTest";
import NotFound from "./pages/NotFound";
import HelpPage from "./pages/HelpPage";
import InstallPage from "./pages/InstallPage";
import AuthPage from "./pages/AuthPage";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/coffee/:id" element={<CoffeeDetail />} />
            <Route path="/delivery" element={<DeliveryPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/track-order" element={<OrderTracking />} />
            <Route path="/database-test" element={<DatabaseTest />} />
            <Route path="/qrcode" element={<QRCodePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/install" element={<InstallPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
