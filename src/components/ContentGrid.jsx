import React from 'react';
import ContentCard from './ContentCard';
import EmptyState from './EmptyState';

const Shimmer = () => (
  <div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite]
    bg-gradient-to-r from-transparent via-white/10 to-transparent"
    style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />
);

export const CardSkeleton = () => (
  <div className="flex min-w-0 flex-col gap-2">
    <div className="glass relative aspect-[2/1] overflow-hidden rounded-2xl"><Shimmer /></div>
    <div className="glass relative h-2.5 w-3/4 overflow-hidden rounded-full"><Shimmer /></div>
  </div>
);

const GRID = 'grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4';

export const ListSkeleton = ({ count = 8 }) => (
  <div className={GRID}>{[...Array(count)].map((_, index) => <CardSkeleton key={index} />)}</div>
);

const ContentGrid = ({ items = [], loading = false, skeletonCount = 8, emptyText = 'Belum ada konten di sini. Coba kata kunci lain atau jelajahi menu lain.' }) => (
  loading ? <ListSkeleton count={skeletonCount} /> : items.length > 0 ? (
    <div className={GRID}>
      {items.map((item, index) => (
        <div key={item.id || item.slug || index} className="cv-auto">
          <ContentCard item={item} />
        </div>
      ))}
    </div>
  ) : (
    <EmptyState title="Tidak ada konten" text={emptyText} />
  )
);

export default ContentGrid;
