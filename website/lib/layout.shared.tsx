import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold">
          <img
            src="/logo.png"
            alt="Domainatrix Logo"
            className="w-13 h-13 rounded-lg drop-shadow-[0_0_4px_rgba(255,255,255,0.25)] mt-4 mb-4"
          />
          <span className="text-base sm:text-lg font-bold tracking-tight">{appName}</span>
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    themeSwitch: {
      enabled: false,
    },
  };
}
