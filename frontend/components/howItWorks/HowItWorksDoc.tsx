import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { assetPath } from '../../constants';
import type { HowItWorksSection, HowItWorksNode } from './howItWorksDocContent';
import { HOW_IT_WORKS_SECTIONS } from './howItWorksDocContent';

type Props = {
  className?: string;
  showTitle?: boolean;
  linkTarget?: '_self' | '_blank';
};

type FlatNavItem = {
  id: string;
  title: string;
  depth: number;
};

const flattenSections = (sections: HowItWorksSection[], depth: number): FlatNavItem[] => {
  const out: FlatNavItem[] = [];
  for (const s of sections) {
    out.push({ id: s.id, title: s.sidebarTitle ?? s.title, depth });
    if (s.children && s.children.length > 0) out.push(...flattenSections(s.children, depth + 1));
  }
  return out;
};

const getToneClasses = (tone: 'note' | 'warning') => {
  if (tone === 'warning') {
    return {
      border: 'border-amber-500/25',
      bg: 'bg-amber-500/10',
      title: 'text-amber-200',
      text: 'text-slate-200',
    };
  }
  return {
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/10',
    title: 'text-emerald-200',
    text: 'text-slate-200',
  };
};

const NodeView: React.FC<{ node: HowItWorksNode; linkTarget: '_self' | '_blank' }> = ({ node, linkTarget }) => {
  if (node.type === 'p') {
    return <p className="text-slate-300 leading-relaxed">{node.text}</p>;
  }

  if (node.type === 'ul') {
    return (
      <ul className="list-disc list-inside space-y-1 text-slate-300 leading-relaxed">
        {node.items.map((t, idx) => (
          <li key={idx}>{t}</li>
        ))}
      </ul>
    );
  }

  if (node.type === 'links') {
    return (
      <div className="flex flex-wrap gap-2">
        {node.links.map((l) => (
          <a
            key={l.hrefPath}
            href={assetPath(l.hrefPath)}
            target={linkTarget}
            rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-white/10"
          >
            {l.label}
          </a>
        ))}
      </div>
    );
  }

  const tone = getToneClasses(node.tone);
  return (
    <div className={`rounded-2xl border ${tone.border} ${tone.bg} p-4`}>
      <div className={`text-sm font-semibold ${tone.title}`}>{node.title}</div>
      <div className={`mt-2 text-sm ${tone.text} leading-relaxed`}>{node.text}</div>
    </div>
  );
};

const SectionView: React.FC<{ section: HowItWorksSection; level: number; linkTarget: string }> = ({ section, level, linkTarget }) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <section id={section.id} className="space-y-4 scroll-mt-16">
      <HeadingTag className={level === 2 ? 'text-xl font-bold text-white' : 'text-lg font-semibold text-white'}>
        {section.title}
      </HeadingTag>
      <div className="mt-3 space-y-3">
        {section.nodes.map((n, idx) => (
          <NodeView key={idx} node={n} linkTarget={linkTarget} />
        ))}
      </div>

      {section.children && section.children.length > 0 ? (
        <div className="mt-6 space-y-6">
          {section.children.map((c) => (
            <SectionView key={c.id} section={c} level={3} linkTarget={linkTarget} />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export const HowItWorksDoc: React.FC<Props> = ({ className = '', showTitle = true, linkTarget = '_self' }) => {
  const navItems = useMemo(() => flattenSections(HOW_IT_WORKS_SECTIONS, 0), []);
  const [activeId, setActiveId] = useState<string>(HOW_IT_WORKS_SECTIONS[0]?.id ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const scrollToIdInPane = (id: string) => {
    const el = document.getElementById(id);
    const container = contentRef.current;
    if (!el || !container) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = elRect.top - containerRect.top + container.scrollTop;
    container.scrollTo({ top: offset, behavior: 'smooth' });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    // Prevent native hash navigation (which scrolls the outer page)
    e.preventDefault();
    scrollToIdInPane(id);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nodes = navItems
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0));
        const first = visible[0]?.target as HTMLElement | undefined;
        if (first?.id) setActiveId(first.id);
      },
      {
        root: contentRef.current,
        rootMargin: '-20% 0px -70% 0px',
        threshold: [0, 1],
      }
    );

    for (const el of nodes) observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [navItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.location.hash || '';
    const id = raw.startsWith('#') ? raw.slice(1) : raw;
    if (!id) return;

    scrollToIdInPane(id);
  }, []);

  return (
    <div className={`space-y-8 ${className}`}>
      {showTitle ? (
        <div className="px-5 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">How LiftShift works</h1>
          <p className="mt-2 text-slate-300">
            A user-friendly overview of the features, assumptions, and definitions behind the workout analytics dashboard.
          </p>
        </div>
      ) : null}

      <details className="lg:hidden mx-5 sm:mx-6 rounded-2xl border border-white/10 bg-black/20">
        <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-200">
          Table of contents
          <ChevronDown className="w-4 h-4" />
        </summary>
        <div className="px-3 pb-3">
          <nav className="space-y-1">
            {navItems.map((i) => (
              <a
                key={i.id}
                href={`#${i.id}`}
                onClick={(e) => handleNavClick(e, i.id)}
                className="block rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {i.title}
              </a>
            ))}
          </nav>
        </div>
      </details>

      <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)] px-5 sm:px-6 h-[70vh] min-h-0">
        <aside className="hidden lg:block pr-2 h-full min-h-0">
          <div className="h-full min-h-0 overflow-y-auto pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">On this page</div>
            <nav className="mt-3 space-y-1 pb-6">
              {navItems.map((i) => {
                const isActive = i.id === activeId;
                const pad = i.depth === 0 ? 'pl-0' : i.depth === 1 ? 'pl-3' : 'pl-6';
                return (
                  <a
                    key={i.id}
                    href={`#${i.id}`}
                    onClick={(e) => handleNavClick(e, i.id)}
                    className={`block rounded-lg px-2 py-1.5 text-sm ${pad} transition-colors border border-transparent ${isActive
                      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {i.title}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        <div ref={contentRef} className="space-y-10 overflow-y-auto pr-2 h-full min-h-0 scroll-pt-16 pb-32">
          {HOW_IT_WORKS_SECTIONS.map((s) => (
            <SectionView key={s.id} section={s} level={2} linkTarget={linkTarget} />
          ))}
        </div>
      </div>
    </div>
  );
};
