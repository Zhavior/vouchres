import React, { useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface ProfileThemeWrapperProps {
  themeId?: string;
  children: React.ReactNode;
}

export default function ProfileThemeWrapper({ themeId, children }: ProfileThemeWrapperProps) {
  const { setOverrideTheme } = useTheme();

  useEffect(() => {
    if (themeId) {
      setOverrideTheme(themeId);
    }
    return () => {
      setOverrideTheme(null);
    };
  }, [themeId, setOverrideTheme]);

  return <>{children}</>;
}
