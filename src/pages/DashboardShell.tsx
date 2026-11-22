import React, { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Button } from '../components/ui/Primitives.tsx';
import { ConsumerDashboard } from './dashboards/ConsumerDashboard.tsx';
import { ProducerDashboard } from './dashboards/ProducerDashboard.tsx';
import { AmbassadorDashboard } from './dashboards/AmbassadorDashboard.tsx';
import { AdminDashboard } from './dashboards/AdminDashboard.tsx';

export function DashboardShell({ initialTab }: { initialTab?: string }) {
  const { t, user, authLoading, navigate, logout } = useApp();

  const roleTabs = (() => {
    if (!user) return [];
    if (user.role === 'ADMIN') {
      return [
        { id: 'kpis', label: t.dashboard.tabs.kpis },
        { id: 'spgReview', label: t.dashboard.tabs.spgReview },
        { id: 'producers', label: t.dashboard.tabs.producers },
        { id: 'users', label: t.dashboard.tabs.users },
        { id: 'ambApps', label: t.dashboard.tabs.ambApps },
        { id: 'adminDisputes', label: t.dashboard.tabs.adminDisputes },
        { id: 'cms', label: t.dashboard.tabs.cms },
        { id: 'audit', label: t.dashboard.tabs.audit },
      ];
    }
    if (user.role === 'PRODUCER') {
      return [
        { id: 'myProducts', label: t.dashboard.tabs.myProducts },
        { id: 'producerOrders', label: t.dashboard.tabs.producerOrders },
        { id: 'spgReports', label: t.dashboard.tabs.spgReports },
        { id: 'analytics', label: t.dashboard.tabs.analytics },
        { id: 'farm', label: t.dashboard.tabs.farm },
      ];
    }
    if (user.role === 'AMBASSADOR') {
      return [
        { id: 'submitVisit', label: t.dashboard.tabs.submitVisit },
        { id: 'myVisits', label: t.dashboard.tabs.myVisits },
      ];
    }
    return [
      { id: 'orders', label: t.dashboard.tabs.orders },
      { id: 'loyalty', label: t.dashboard.tabs.loyalty },
      { id: 'basket', label: t.dashboard.tabs.basket },
      { id: 'disputes', label: t.dashboard.tabs.disputes },
      { id: 'notifications', label: t.dashboard.tabs.notifications },
      { id: 'becomeAmbassador', label: t.dashboard.tabs.becomeAmbassador },
      { id: 'profile', label: t.dashboard.tabs.profile },
    ];
  })();

  const [activeTab, setActiveTab] = useState(
    initialTab || roleTabs[0]?.id || 'orders'
  );

  useEffect(() => {
    if (initialTab && roleTabs.some((r) => r.id === initialTab)) {
      setActiveTab(initialTab);
    } else if (roleTabs.length > 0 && !roleTabs.some((r) => r.id === activeTab)) {
      setActiveTab(roleTabs[0].id);
    }
  }, [user?.role, initialTab]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12">
        <div className="h-72 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-[#52615A] mb-4">{t.cart.loginRequired}</p>
        <Button onClick={() => navigate({ name: 'auth', mode: 'login' })}>
          {t.nav.login}
        </Button>
      </div>
    );
  }

  const roleTitle =
    user.role === 'ADMIN'
      ? t.dashboard.adminTitle
      : user.role === 'PRODUCER'
        ? t.dashboard.producerTitle
        : user.role === 'AMBASSADOR'
          ? t.dashboard.ambassadorTitle
          : t.dashboard.consumerTitle;

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-white border border-[#E5E1D8] rounded-lg p-5">
          <div className="pb-4 border-b border-[#E5E1D8]">
            <p className="text-xs font-mono text-[#4A7C59]">{user.role}</p>
            <h1 className="mt-1 text-base font-semibold text-[#17211C] truncate">
              {user.name}
            </h1>
            <p className="text-xs text-[#52615A] truncate">{user.email}</p>
            <p className="text-xs text-[#52615A] mt-0.5">{roleTitle}</p>
          </div>

          <nav aria-label="Dashboard sections" className="mt-4 space-y-1">
            {roleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-start px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#1B4D3E] text-white font-medium'
                    : 'text-[#52615A] hover:bg-[#F2EFE9] hover:text-[#17211C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-4 border-t border-[#E5E1D8]">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-[#B91C1C] hover:text-[#991B1B]"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              <span>{t.nav.logout}</span>
            </Button>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <section className="lg:col-span-9 min-w-0">
          {user.role === 'ADMIN' && <AdminDashboard activeTab={activeTab} />}
          {user.role === 'PRODUCER' && <ProducerDashboard activeTab={activeTab} />}
          {user.role === 'AMBASSADOR' && (
            <AmbassadorDashboard activeTab={activeTab} />
          )}
          {user.role === 'CONSUMER' && <ConsumerDashboard activeTab={activeTab} />}
        </section>
      </div>
    </div>
  );
}
