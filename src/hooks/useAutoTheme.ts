import { useEffect } from "react";
import { useTheme } from "next-themes";

export const useAutoTheme = (enabled: boolean = true) => {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!enabled) return;

    const updateTheme = () => {
      const hour = new Date().getHours();
      // Light mode: 6 AM - 6 PM
      // Dark mode: 6 PM - 6 AM
      const shouldBeDark = hour < 6 || hour >= 18;
      setTheme(shouldBeDark ? "dark" : "light");
    };

    // Set theme immediately
    updateTheme();

    // Update theme every hour
    const interval = setInterval(updateTheme, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, setTheme]);
};
