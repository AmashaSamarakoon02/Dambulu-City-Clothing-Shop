import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

// Bento-style image grid: one large tile and four smaller ones, each linking to a collection.
const Lookbook = ({ tiles }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3 sm:gap-4 lg:h-[620px]">
    {tiles.map((t, i) => (
      <Link
        key={t.to}
        to={t.to}
        className={`group relative overflow-hidden rounded-2xl bg-page-alt ${
          i === 0 ? 'col-span-2 lg:row-span-2 aspect-[4/3] lg:aspect-auto' : 'aspect-square lg:aspect-auto'
        }`}
      >
        <img
          src={t.image}
          alt=""
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover ${t.position || 'object-center'} group-hover:scale-105 transition-transform duration-700`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex items-end justify-between gap-3 text-white">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-white/80">{t.eyebrow}</span>
            <h3 className={`font-light tracking-wide ${i === 0 ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'}`}>{t.title}</h3>
          </div>
          <span className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    ))}
  </div>
);

export default Lookbook;
