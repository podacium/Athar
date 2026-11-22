import React, { useEffect, useState } from 'react';
import { CheckCircle2, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { ALGERIA_WILAYAS, DELIVERY_SLOTS, PICKUP_POINTS } from '../lib/algeria.ts';
import { formatDzd } from '../i18n/messages.ts';
import { Button, Input, Select } from '../components/ui/Primitives.tsx';

export function CheckoutPage() {
  const {
    locale,
    t,
    user,
    cart,
    clearCart,
    navigate,
    pushToast,
  } = useApp();

  const [deliveryType, setDeliveryType] = useState<'HOME_DELIVERY' | 'PICKUP_POINT'>(
    'HOME_DELIVERY'
  );
  const [wilaya, setWilaya] = useState(user?.wilaya || '16 - Alger');
  const [address, setAddress] = useState(user?.address || '');
  const [pickupPoint, setPickupPoint] = useState(PICKUP_POINTS[0].nameFr);
  const [deliverySlot, setDeliverySlot] = useState<string>(DELIVERY_SLOTS[0]);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'SATIM' | 'BARIDIMOB'>('COD');
  const [simOutcome, setSimOutcome] = useState<'SUCCESS' | 'FAILURE'>('SUCCESS');
  const [atharBalance, setAtharBalance] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: number;
    trackingNumber: string;
    total: number;
    paymentRef: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    apiRequest<{ balance: number }>('/loyalty/me')
      .then((res) => setAtharBalance(res.balance || 0))
      .catch(() => {});
  }, [user]);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.priceDzd * item.quantity,
    0
  );
  const isCentral =
    wilaya.startsWith('16') ||
    wilaya.startsWith('09') ||
    wilaya.startsWith('35') ||
    wilaya.startsWith('42');
  const deliveryFee =
    deliveryType === 'PICKUP_POINT' ? 150 : isCentral ? 350 : 550;
  const discountAmount = Math.min(subtotal, Math.max(0, redeemPoints) * 5);
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ name: 'auth', mode: 'login' });
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiRequest<{
        order: { id: number; trackingNumber: string; total: number; paymentRef: string };
      }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
          paymentMethod,
          simulatePaymentOutcome: simOutcome,
          deliveryType,
          wilaya,
          address: deliveryType === 'HOME_DELIVERY' ? address : pickupPoint,
          pickupPoint: deliveryType === 'PICKUP_POINT' ? pickupPoint : undefined,
          deliverySlot,
          redeemAtharPoints: redeemPoints,
        }),
      });
      setConfirmedOrder(res.order);
      clearCart();
      pushToast(
        locale === 'ar'
          ? `تم تأكيد الطلب #${res.order.id} بنجاح`
          : `Commande #${res.order.id} confirmée avec succès`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="bg-white border border-[#E5E1D8] rounded-lg p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#1B4D3E] mx-auto" />
          <h1 className="mt-4 font-editorial text-2xl text-[#17211C]">
            {locale === 'ar'
              ? `تم تأكيد طلبك #${confirmedOrder.id}`
              : `Commande #${confirmedOrder.id} confirmée`}
          </h1>
          <p className="mt-2 text-sm text-[#52615A]">
            {locale === 'ar'
              ? 'ستضاف نقاط «أثرك» تلقائياً إلى محفظتك فور تسليم الطلب.'
              : 'Vos points Atharouk seront automatiquement crédités dès la livraison.'}
          </p>
          <dl className="mt-6 border-y border-[#E5E1D8] divide-y divide-[#F2EFE9] text-sm text-start">
            <div className="py-3 flex justify-between">
              <dt className="text-[#52615A]">
                {locale === 'ar' ? 'رقم التتبع' : 'Numéro de suivi'}
              </dt>
              <dd className="font-mono font-semibold text-[#1B4D3E]">
                {confirmedOrder.trackingNumber}
              </dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-[#52615A]">
                {locale === 'ar' ? 'مرجع الدفع' : 'Référence paiement'}
              </dt>
              <dd className="font-mono text-[#17211C]">
                {confirmedOrder.paymentRef}
              </dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-[#52615A]">{t.cart.total}</dt>
              <dd className="font-mono font-semibold tabular-nums">
                {formatDzd(confirmedOrder.total, locale)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate({ name: 'dashboard', tab: 'orders' })}>
              <Truck className="w-4 h-4" />
              <span>
                {locale === 'ar' ? 'تتبع طلبي' : 'Suivre ma commande'}
              </span>
            </Button>
            <Button variant="outline" onClick={() => navigate({ name: 'catalog' })}>
              {t.cart.browse}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-[#52615A]">{t.cart.empty}</p>
        <Button className="mt-4" onClick={() => navigate({ name: 'catalog' })}>
          {t.cart.browse}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-editorial text-3xl text-[#17211C] pb-6 border-b border-[#E5E1D8]">
        {t.cart.checkout}
      </h1>

      {!user && (
        <div className="mt-6 rounded-md border border-[#B45309]/40 bg-white p-4 flex items-center justify-between gap-4">
          <span className="text-sm text-[#17211C]">{t.cart.loginRequired}</span>
          <Button size="sm" onClick={() => navigate({ name: 'auth', mode: 'login' })}>
            {t.nav.login}
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-[#B91C1C]/40 bg-white p-4 text-sm text-[#991B1B]">
          {error}
        </div>
      )}

      <form
        onSubmit={handlePlaceOrder}
        className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        <div className="lg:col-span-7 bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-6">
          {/* Delivery Mode */}
          <div>
            <label className="block text-sm font-semibold text-[#17211C] mb-2">
              {t.cart.deliveryMethod}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { id: 'HOME_DELIVERY', label: t.cart.homeDelivery },
                  { id: 'PICKUP_POINT', label: t.cart.pickupPoint },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDeliveryType(opt.id)}
                  className={`p-3.5 text-start rounded-md border text-sm transition-colors cursor-pointer ${
                    deliveryType === opt.id
                      ? 'border-[#1B4D3E] bg-[#1B4D3E]/5 font-medium text-[#17211C]'
                      : 'border-[#E5E1D8] text-[#52615A]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#52615A] mb-1">
                {t.cart.wilaya}
              </label>
              <Select value={wilaya} onChange={(e) => setWilaya(e.target.value)}>
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#52615A] mb-1">
                {t.cart.deliverySlot}
              </label>
              <Select
                value={deliverySlot}
                onChange={(e) => setDeliverySlot(e.target.value)}
              >
                {DELIVERY_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {deliveryType === 'HOME_DELIVERY' ? (
            <div>
              <label className="block text-xs font-medium text-[#52615A] mb-1">
                {t.cart.address}
              </label>
              <Input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  locale === 'ar'
                    ? 'الحي، الشارع، رقم العمارة...'
                    : 'Rue, cité, bâtiment...'
                }
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-[#52615A] mb-1">
                {t.cart.selectPickup}
              </label>
              <Select
                value={pickupPoint}
                onChange={(e) => setPickupPoint(e.target.value)}
              >
                {PICKUP_POINTS.map((pt) => (
                  <option key={pt.id} value={pt.nameFr}>
                    {locale === 'ar' ? pt.nameAr : pt.nameFr} ({pt.hours})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Payment Method */}
          <div className="pt-4 border-t border-[#E5E1D8]">
            <label className="block text-sm font-semibold text-[#17211C] mb-2">
              {t.cart.paymentMethod}
            </label>
            <div className="space-y-2">
              {(
                [
                  { id: 'COD', label: t.cart.cod },
                  { id: 'SATIM', label: t.cart.satim },
                  { id: 'BARIDIMOB', label: t.cart.baridimob },
                ] as const
              ).map((pm) => (
                <label
                  key={pm.id}
                  className={`flex items-center gap-3 p-3 rounded-md border text-sm cursor-pointer ${
                    paymentMethod === pm.id
                      ? 'border-[#1B4D3E] bg-[#1B4D3E]/5 font-medium'
                      : 'border-[#E5E1D8] text-[#52615A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === pm.id}
                    onChange={() => setPaymentMethod(pm.id)}
                    className="accent-[#1B4D3E]"
                  />
                  <span>{pm.label}</span>
                </label>
              ))}
            </div>

            {paymentMethod !== 'COD' && (
              <div className="mt-3 p-3.5 rounded-md bg-[#F2EFE9] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[#17211C]">
                  {t.cart.simulateResult}:
                </span>
                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={simOutcome === 'SUCCESS'}
                      onChange={() => setSimOutcome('SUCCESS')}
                      className="accent-[#1B4D3E]"
                    />
                    <span>{t.cart.simSuccess}</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={simOutcome === 'FAILURE'}
                      onChange={() => setSimOutcome('FAILURE')}
                      className="accent-[#B91C1C]"
                    />
                    <span>{t.cart.simFailure}</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Atharouk Points Redemption */}
          {user && atharBalance > 0 && (
            <div className="pt-4 border-t border-[#E5E1D8]">
              <label className="block text-xs font-medium text-[#17211C] mb-1">
                {t.cart.useAthar} ({locale === 'ar' ? 'رصيدك:' : 'Solde :'} {atharBalance})
              </label>
              <Input
                type="number"
                min={0}
                max={atharBalance}
                value={redeemPoints}
                onChange={(e) =>
                  setRedeemPoints(
                    Math.max(0, Math.min(atharBalance, Number(e.target.value) || 0))
                  )
                }
              />
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5 bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#17211C]">
            {locale === 'ar' ? 'ملخص الطلب' : 'Récapitulatif'}
          </h2>
          <ul className="divide-y divide-[#F2EFE9] text-sm">
            {cart.map(({ product, quantity }) => (
              <li key={product.id} className="py-2.5 flex justify-between gap-3">
                <span className="text-[#52615A] truncate">
                  {quantity} × {locale === 'ar' ? product.nameAr : product.nameFr}
                </span>
                <span className="font-mono tabular-nums shrink-0">
                  {formatDzd(product.priceDzd * quantity, locale)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="pt-3 border-t border-[#E5E1D8] space-y-2 text-sm">
            <div className="flex justify-between text-[#52615A]">
              <dt>{t.cart.subtotal}</dt>
              <dd className="font-mono tabular-nums">{formatDzd(subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between text-[#52615A]">
              <dt>{t.cart.deliveryFee}</dt>
              <dd className="font-mono tabular-nums">{formatDzd(deliveryFee, locale)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#1B4D3E]">
                <dt>{t.cart.discount}</dt>
                <dd className="font-mono tabular-nums">
                  -{formatDzd(discountAmount, locale)}
                </dd>
              </div>
            )}
            <div className="pt-3 border-t border-[#E5E1D8] flex justify-between text-base font-bold text-[#17211C]">
              <dt>{t.cart.total}</dt>
              <dd className="font-mono tabular-nums">{formatDzd(total, locale)}</dd>
            </div>
          </dl>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting || !user}
          >
            {t.cart.placeOrder}
          </Button>
        </div>
      </form>
    </div>
  );
}
