import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Layout } from './components/Layout.tsx';
import { ToastViewport } from './components/ui/Primitives.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { PassportPage } from './pages/PassportPage.tsx';
import {
  ProducerProfilePage,
  ProducersDirectoryPage,
} from './pages/ProducerPages.tsx';
import {
  CommunityBlogPage,
  HowItWorksPage,
  InfoStaticPage,
} from './pages/CommunityAndInfoPages.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { DashboardShell } from './pages/DashboardShell.tsx';

function RouteView() {
  const { route } = useApp();

  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'catalog':
      return <CatalogPage />;
    case 'product':
      return <ProductDetailPage productId={route.id} />;
    case 'passport':
      return <PassportPage productId={route.id} />;
    case 'producers':
      return <ProducersDirectoryPage />;
    case 'producer':
      return <ProducerProfilePage producerId={route.id} />;
    case 'how-it-works':
      return <HowItWorksPage />;
    case 'community':
      return <CommunityBlogPage />;
    case 'info':
      return <InfoStaticPage page={route.page} />;
    case 'auth':
      return <AuthPage initialMode={route.mode} />;
    case 'checkout':
      return <CheckoutPage />;
    case 'dashboard':
      return <DashboardShell initialTab={route.tab} />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <RouteView />
      </Layout>
      <ToastViewport />
    </AppProvider>
  );
}
