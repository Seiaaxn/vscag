import React from 'react';
import ContentCard from './ContentCard';

const Shimmer = () => (
  <div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite]
    bg-gradient-to-r from-transparent via-white/5 to-transparent"
    style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />
);

export const CardSkeleton = () => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <div className="relative aspect-[2/1] overflow-hidden rounded-md bg-[#16161a]"><Shimmer /></div>
    <div className="relative h-2.5 w-3/4 overflow-hidden rounded-sm bg-[#16161a]"><Shimmer /></div>
  </div>
);

export const ListSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
    {[...Array(count)].map((_, index) => <CardSkeleton key={index} />)}
  </div>
);

const ContentGrid = ({ items = [], loading = false, skeletonCount = 8, emptyText = 'Tidak ada konten.' }) => (
  loading ? <ListSkeleton count={skeletonCount} /> : items.length > 0 ? (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => <ContentCard key={item.id || item.slug || index} item={item} />)}
    </div>
  ) : (
    <div className="py-12 text-center text-xs font-bold text-white/30">{emptyText}</div>
  )
);

export default ContentGrid;
