import React from 'react';
import { ShieldCheck, ShoppingBag } from 'lucide-react';
import { type ProductItem, useApp } from '../context/AppContext.tsx';
import { formatDzd } from '../i18n/messages.ts';
import { Button, SafeImage } from './ui/Primitives.tsx';

export function ProductCard({ product }: { product: ProductItem }) {
  const { locale, t, navigate, addToCart } = useApp();
  const name = locale === 'ar' ? product.nameAr : product.nameFr;
  const producerName = locale === 'ar' ? product.producerName : product.producerNameFr;
  const aiReason = locale === 'ar' ? product.aiReasonAr : product.aiReasonFr;

  return (
    <article className="group flex flex-col bg-white border border-[#E5E1D8] rounded-lg overflow-hidden transition-transform duration-150 hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => navigate({ name: 'product', id: product.id })}
        className="block w-full aspect-[4/3] overflow-hidden bg-[#F2EFE9] cursor-pointer text-start"
      >
        <SafeImage
          src={product.images?.[0]}
          alt={name}
          fallbackTitle={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      <div className="flex flex-1 flex-col p-4">
        {/* Clean Unboxed Metadata Line (Zero-Pill Rule) */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#52615A]">
          <span>{product.producerWilaya}</span>
          <span aria-hidden="true">·</span>
          <span
            className={
              product.hasActiveSpgBadge
                ? 'font-semibold text-[#1B4D3E]'
                : 'text-[#52615A]'
            }
          >
            {product.hasActiveSpgBadge
              ? t.catalog.spgVerified
              : t.catalog.selfDeclared}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-[#17211C]">
            {product.sustainabilityScore}/100
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate({ name: 'product', id: product.id })}
          className="mt-2 text-start cursor-pointer"
        >
          <h3 className="text-base font-semibold text-[#17211C] leading-snug group-hover:text-[#1B4D3E] transition-colors line-clamp-2">
            {name}
          </h3>
        </button>

        <p className="mt-1 text-xs text-[#52615A] truncate">{producerName}</p>

        {aiReason && (
          <p className="mt-2 text-xs text-[#4A7C59] leading-relaxed line-clamp-1">
            {aiReason}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-[#F2EFE9]">
          <div>
            <p className="text-base font-semibold text-[#17211C] font-mono tabular-nums">
              {formatDzd(product.priceDzd, locale)}
            </p>
            <p className="text-xs text-[#52615A]">{product.unit}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              title={t.catalog.viewPassport}
              aria-label={t.catalog.viewPassport}
              onClick={() => navigate({ name: 'passport', id: product.id })}
              className="px-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />
            </Button>
            <Button
              size="sm"
              disabled={product.stock <= 0}
              onClick={() => addToCart(product, 1)}
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {product.stock > 0 ? t.catalog.addToCart : t.catalog.outOfStock}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
