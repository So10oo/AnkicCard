"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

/** Client-side hash navigation for static Cloudflare hosting */
export function HashLink({ href, children, className, onClick, ...rest }: Props) {
  const hash = href.startsWith("#") ? href : `#${href.startsWith("/") ? href : `/${href}`}`;
  return (
    <a
      href={hash}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          if (window.location.hash !== hash) {
            window.location.hash = hash.slice(1);
          }
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export function hashNavigate(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  window.location.hash = normalized;
}
