export const GA_TRACKING_ID = 'G-QMM1FVZP9K';

export const event = (
  action: string,
  params?: Record<string, string | number>
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, params);
  }
};