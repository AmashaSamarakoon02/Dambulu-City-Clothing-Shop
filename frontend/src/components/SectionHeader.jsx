import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Section title with a small bronze eyebrow label, like "— SHOP BY CATEGORY —".
const SectionHeader = ({ eyebrow, title, subtitle, link, linkLabel = 'View all', center = false, id }) => (
  <div className={`mb-10 md:mb-12 flex gap-4 ${center ? 'flex-col items-center text-center' : 'flex-col sm:flex-row sm:items-end sm:justify-between'}`}>
    <div className={center ? 'flex flex-col items-center' : ''}>
      {eyebrow && (
        <span className="eyebrow mb-3">
          <span className="w-6 h-px bg-accent" aria-hidden="true" />
          {eyebrow}
          {center && <span className="w-6 h-px bg-accent" aria-hidden="true" />}
        </span>
      )}
      <h2 id={id} className="text-2xl md:text-4xl font-light tracking-wide text-luxe-dark">{title}</h2>
      {subtitle && <p className="text-sm md:text-base text-gray-600 mt-3 max-w-2xl">{subtitle}</p>}
    </div>
    {link && (
      <Link
        to={link}
        className="group inline-flex items-center gap-2 self-start sm:self-auto text-xs font-semibold uppercase tracking-[0.2em] border border-luxe-dark rounded-full px-5 py-2.5 hover:bg-luxe-dark hover:text-white transition-colors whitespace-nowrap"
      >
        {linkLabel}
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    )}
  </div>
);

export default SectionHeader;
