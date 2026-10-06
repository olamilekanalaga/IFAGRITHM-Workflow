// Browser console script used for animation and layout verification.
JSON.stringify({
  theme: document.querySelector('.shell')?.className,
  overflow: document.documentElement.scrollWidth > innerWidth,
  motionRecords: document.querySelectorAll('.motion-step button:not(:disabled)').length,
  animations: document.getAnimations().map(animation => ({name: animation.animationName, state: animation.playState})),
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  logoLoaded: [...document.images].filter(image => image.src.includes('brand-symbol')).every(image => image.complete && image.naturalWidth > 0)
});
