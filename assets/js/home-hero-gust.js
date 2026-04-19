(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function delay(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomInteger(min, max) {
    return Math.round(randomBetween(min, max));
  }

  function choose(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function buildTransform(values) {
    const x = values.x || 0;
    const skew = values.skew || 0;
    const rotate = values.rotate || 0;
    return `translateX(${x.toFixed(2)}px) skewX(${skew.toFixed(2)}deg) rotate(${rotate.toFixed(2)}deg)`;
  }

  function buildGustVariant(isAnchor) {
    const variantName = isAnchor
      ? choose(['medium', 'strong', 'strong'])
      : choose(['light', 'light', 'medium']);

    if (variantName === 'light') {
      return {
        strength: randomBetween(0.64, 0.9),
        push: randomInteger(64, 108),
        hold: randomInteger(34, 82),
        vibrationCount: randomInteger(1, 2),
        vibrationStep: randomInteger(64, 108),
        vibrationStepDrift: randomBetween(1.02, 1.06),
        vibrationDecay: randomBetween(0.46, 0.66),
        release: randomInteger(300, 480),
        gap: randomInteger(180, 420)
      };
    }

    if (variantName === 'strong') {
      const isProlonged = Math.random() < 0.4;

      return {
        strength: randomBetween(1.18, isProlonged ? 1.64 : 1.56),
        push: randomInteger(104, isProlonged ? 188 : 176),
        hold: randomInteger(isProlonged ? 520 : 160, isProlonged ? 1300 : 320),
        vibrationCount: randomInteger(isProlonged ? 3 : 2, isProlonged ? 5 : 4),
        vibrationStep: randomInteger(isProlonged ? 34 : 42, isProlonged ? 58 : 72),
        vibrationStepDrift: randomBetween(isProlonged ? 1.1 : 1.05, isProlonged ? 1.18 : 1.11),
        vibrationDecay: randomBetween(isProlonged ? 0.72 : 0.64, isProlonged ? 0.88 : 0.82),
        release: randomInteger(isProlonged ? 1700 : 760, isProlonged ? 2600 : 1300),
        gap: randomInteger(isProlonged ? 520 : 340, isProlonged ? 980 : 760)
      };
    }

    return {
      strength: randomBetween(0.9, 1.18),
      push: randomInteger(80, 136),
      hold: randomInteger(70, 140),
      vibrationCount: randomInteger(1, 3),
      vibrationStep: randomInteger(52, 84),
      vibrationStepDrift: randomBetween(1.04, 1.09),
      vibrationDecay: randomBetween(0.56, 0.74),
      release: randomInteger(460, 760),
      gap: randomInteger(240, 560)
    };
  }

  const gustSpecs = {
    headline: {
      peakX: 13.4,
      peakSkew: -2.55,
      holdXFactor: 0.86,
      holdSkewFactor: 0.7,
      vibrationX: 1.05,
      vibrationSkew: 0.26,
      returnXFactor: 0.2,
      returnSkewFactor: 0.12
    }
  };

  function buildBurstProfile() {
    const gustCount = choose([1, 1, 2, 2, 3]);
    const anchorIndex = randomInteger(0, gustCount - 1);
    const gusts = [];

    for (let index = 0; index < gustCount; index += 1) {
      const variant = buildGustVariant(index === anchorIndex);
      gusts.push({
        strength: variant.strength,
        push: variant.push,
        hold: variant.hold,
        vibrationCount: variant.vibrationCount,
        vibrationStep: variant.vibrationStep,
        vibrationStepDrift: variant.vibrationStepDrift,
        vibrationDecay: variant.vibrationDecay,
        release: variant.release,
        gap: index < gustCount - 1 ? variant.gap : 0
      });
    }

    return {
      initialDelay: randomInteger(80, 180),
      gusts
    };
  }

  function buildBurstKeyframes(kind, profile) {
    const spec = gustSpecs[kind];
    const frames = [{ ms: 0, x: 0, skew: 0, rotate: 0 }];
    let elapsed = profile.initialDelay;
    frames.push({ ms: elapsed, x: 0, skew: 0, rotate: 0 });

    profile.gusts.forEach((gust) => {
      const peakX = spec.peakX * gust.strength;
      const peakSkew = spec.peakSkew * gust.strength;
      const holdX = peakX * randomBetween(spec.holdXFactor * 0.95, spec.holdXFactor * 1.04);
      const holdSkew = peakSkew * randomBetween(spec.holdSkewFactor * 0.94, spec.holdSkewFactor * 1.03);
      const vibrationX = spec.vibrationX * gust.strength;
      const vibrationSkew = spec.vibrationSkew * gust.strength;
      const pushSwellOneMs = Math.round(gust.push * randomBetween(0.3, 0.4));
      const pushSwellTwoMs = Math.round(gust.push * randomBetween(0.3, 0.38));
      const pushPeakMs = Math.max(1, gust.push - pushSwellOneMs - pushSwellTwoMs);
      const pushSwellOneFactor = randomBetween(0.12, 0.2);
      const pushSwellTwoFactor = randomBetween(0.46, 0.62);
      const leftResistanceFactor = randomBetween(0.34, 0.46);
      const rightReboundFactor = randomBetween(0.08, 0.18);

      elapsed += pushSwellOneMs;
      frames.push({
        ms: elapsed,
        x: peakX * pushSwellOneFactor,
        skew: peakSkew * pushSwellOneFactor,
        rotate: 0
      });

      elapsed += pushSwellTwoMs;
      frames.push({
        ms: elapsed,
        x: peakX * pushSwellTwoFactor,
        skew: peakSkew * pushSwellTwoFactor,
        rotate: 0
      });

      elapsed += pushPeakMs;
      frames.push({
        ms: elapsed,
        x: peakX,
        skew: peakSkew,
        rotate: 0
      });

      elapsed += gust.hold;
      frames.push({
        ms: elapsed,
        x: holdX,
        skew: holdSkew,
        rotate: 0
      });

      for (let vibrationIndex = 0; vibrationIndex < gust.vibrationCount; vibrationIndex += 1) {
        const decay = Math.pow(gust.vibrationDecay, vibrationIndex);
        const direction = vibrationIndex % 2 === 0 ? -leftResistanceFactor : rightReboundFactor;
        const vibrationStep = Math.round(gust.vibrationStep * Math.pow(gust.vibrationStepDrift, vibrationIndex));

        elapsed += vibrationStep;
        frames.push({
          ms: elapsed,
          x: holdX + (vibrationX * decay * direction),
          skew: holdSkew + (vibrationSkew * decay * direction),
          rotate: 0
        });
      }

      elapsed += Math.round(gust.release * 0.42);
      frames.push({
        ms: elapsed,
        x: peakX * spec.returnXFactor,
        skew: peakSkew * spec.returnSkewFactor,
        rotate: 0
      });

      elapsed += Math.round(gust.release * 0.58);
      frames.push({ ms: elapsed, x: 0, skew: 0, rotate: 0 });

      if (gust.gap) {
        elapsed += gust.gap;
        frames.push({ ms: elapsed, x: 0, skew: 0, rotate: 0 });
      }
    });

    return {
      duration: elapsed,
      keyframes: frames.map((frame) => ({
        offset: frame.ms / elapsed,
        transform: buildTransform(frame)
      }))
    };
  }

  async function runBurst(parts) {
    const profile = buildBurstProfile();
    const headline = buildBurstKeyframes('headline', profile);
    const animation = parts.headline.animate(headline.keyframes, {
      duration: headline.duration,
      easing: 'linear',
      fill: 'both'
    });

    await animation.finished.catch(() => undefined);
  }

  function clearTransforms(parts) {
    parts.headline.getAnimations().forEach((animation) => animation.cancel());
    parts.headline.style.transform = '';
  }

  async function loopGusts(parts) {
    await delay(randomInteger(1200, 2200));

    while (true) {
      if (prefersReducedMotion.matches || document.hidden) {
        clearTransforms(parts);
        await delay(1000);
        continue;
      }

      await runBurst(parts);
      await delay(randomInteger(3800, 8600));
    }
  }

  function initWindGustHeadlines() {
    const copies = Array.from(document.querySelectorAll('[data-wind-gust="headline"]'));
    if (!copies.length || typeof Element === 'undefined' || !Element.prototype.animate) {
      return;
    }

    const partsList = copies
      .map((copy) => {
        const headline = copy.querySelector('h1');
        return headline ? { headline } : null;
      })
      .filter(Boolean);

    if (!partsList.length) return;

    partsList.forEach((parts) => {
      loopGusts(parts);
    });

    if (prefersReducedMotion.addEventListener) {
      prefersReducedMotion.addEventListener('change', () => {
        if (prefersReducedMotion.matches) {
          partsList.forEach(clearTransforms);
        }
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        partsList.forEach(clearTransforms);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initWindGustHeadlines);
})();
