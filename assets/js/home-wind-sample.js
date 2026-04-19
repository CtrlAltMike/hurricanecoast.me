(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const DEFAULT_VALUES = {
    headlineX: 0,
    headlineSkew: 0,
    headlineScale: 1,
    imageX: 0,
    imageY: 0,
    imageScale: 1,
    frameX: 0,
    shadowBoost: 0,
    bandProgress: 0,
    bandOpacity: 0,
    bandScale: 1,
    washProgress: 0,
    washOpacity: 0,
    heroWashProgress: 0,
    heroWashOpacity: 0
  };

  const VARIANT_CONFIG = {
    'headline-pressure': {
      gap: [4.6, 7.8],
      response(state, motion) {
        return {
          headlineX: motion.total * 9.4,
          headlineSkew: (-motion.push * 1.55) - (motion.resist * 0.72),
          headlineScale: 1 - Math.min(0.01, motion.push * 0.008),
          imageScale: 1,
          bandScale: 1
        };
      },
      speeds: {
        headline: 7.2,
        image: 8.5,
        frame: 8.5,
        atmosphere: 8.5
      }
    },
    'illustration-gust': {
      gap: [4.1, 6.5],
      response(state, motion) {
        return {
          imageX: motion.total * 4.8,
          imageY: -motion.push * 0.45,
          imageScale: 1.012 + Math.min(0.018, motion.wash * 0.014),
          frameX: motion.push * 1.55,
          shadowBoost: Math.min(0.9, motion.wash * 0.55),
          bandProgress: motion.sweep,
          bandOpacity: Math.min(0.72, (motion.wash * 0.46) + (motion.tail * 0.12)),
          bandScale: 1 + Math.min(0.12, motion.push * 0.08),
          washProgress: motion.sweep,
          washOpacity: Math.min(0.38, (motion.wash * 0.24) + (motion.tail * 0.1))
        };
      },
      speeds: {
        headline: 9,
        image: 10,
        frame: 9.5,
        atmosphere: 10.5
      }
    },
    'passing-front': {
      gap: [5.2, 8.2],
      response(state, motion) {
        return {
          imageX: motion.total * 1.45,
          imageScale: 1.008 + Math.min(0.012, motion.wash * 0.008),
          frameX: motion.push * 1.1,
          shadowBoost: Math.min(0.7, motion.wash * 0.42),
          bandProgress: motion.sweep,
          bandOpacity: Math.min(0.28, motion.wash * 0.18),
          bandScale: 1 + Math.min(0.08, motion.wash * 0.05),
          washProgress: motion.sweep,
          washOpacity: Math.min(0.22, motion.wash * 0.14),
          heroWashProgress: motion.sweep,
          heroWashOpacity: Math.min(0.34, (motion.wash * 0.18) + (motion.tail * 0.08))
        };
      },
      speeds: {
        headline: 8.5,
        image: 8.2,
        frame: 8,
        atmosphere: 7.2
      }
    },
    'paired-response': {
      gap: [4.5, 7.2],
      response(state, motion) {
        const laggedPush = (state.render.imageX / 4.1);

        return {
          headlineX: laggedPush * 3.9,
          headlineSkew: (-laggedPush * 0.72) - (motion.resist * 0.16),
          headlineScale: 1 - Math.min(0.006, laggedPush * 0.004),
          imageX: motion.total * 4.1,
          imageY: -motion.push * 0.34,
          imageScale: 1.01 + Math.min(0.014, motion.wash * 0.011),
          frameX: motion.push * 1.15,
          shadowBoost: Math.min(0.78, motion.wash * 0.48),
          bandProgress: motion.sweep,
          bandOpacity: Math.min(0.44, (motion.wash * 0.3) + (motion.tail * 0.08)),
          bandScale: 1 + Math.min(0.08, motion.push * 0.06),
          washProgress: motion.sweep,
          washOpacity: Math.min(0.24, motion.wash * 0.14),
          heroWashProgress: motion.sweep,
          heroWashOpacity: Math.min(0.18, motion.wash * 0.1)
        };
      },
      speeds: {
        headline: 4.9,
        image: 10,
        frame: 9.2,
        atmosphere: 9.8
      }
    }
  };

  function randomBetween(min, max) {
    return min + (Math.random() * (max - min));
  }

  function randomInteger(min, max) {
    return Math.round(randomBetween(min, max));
  }

  function choose(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function easeInOutSine(value) {
    return 0.5 - (0.5 * Math.cos(Math.PI * value));
  }

  function blend(current, target, dt, speed) {
    return current + ((target - current) * (1 - Math.exp(-dt * speed)));
  }

  function createGustProfile(variantName) {
    const weight = choose(['light', 'light', 'medium', 'medium', 'strong']);
    const activeFactor = variantName === 'passing-front' ? 0.86 : 1;

    if (weight === 'light') {
      return {
        startDelay: randomBetween(0, 0.14),
        peak: randomBetween(0.42, 0.6) * activeFactor,
        build: randomBetween(0.28, 0.42),
        hold: randomBetween(0.08, 0.18),
        release: randomBetween(0.7, 1.06),
        resistAmp: randomBetween(0.02, 0.04),
        resistCycles: 1
      };
    }

    if (weight === 'strong') {
      const prolonged = Math.random() < (variantName === 'headline-pressure' ? 0.16 : 0.22);

      return {
        startDelay: randomBetween(0, 0.18),
        peak: randomBetween(0.76, prolonged ? 1.02 : 0.94) * activeFactor,
        build: randomBetween(prolonged ? 0.42 : 0.32, prolonged ? 0.68 : 0.52),
        hold: randomBetween(prolonged ? 0.55 : 0.22, prolonged ? 1.1 : 0.56),
        release: randomBetween(prolonged ? 1.4 : 0.92, prolonged ? 2.2 : 1.55),
        resistAmp: randomBetween(prolonged ? 0.04 : 0.03, prolonged ? 0.065 : 0.055),
        resistCycles: randomInteger(1, prolonged ? 3 : 2)
      };
    }

    return {
      startDelay: randomBetween(0, 0.16),
      peak: randomBetween(0.58, 0.78) * activeFactor,
      build: randomBetween(0.3, 0.46),
      hold: randomBetween(0.16, 0.34),
      release: randomBetween(0.82, 1.28),
      resistAmp: randomBetween(0.025, 0.048),
      resistCycles: randomInteger(1, 2)
    };
  }

  function launchBurst(study, now) {
    const gustCount = choose([1, 1, 1, 2]);

    for (let index = 0; index < gustCount; index += 1) {
      const gust = createGustProfile(study.variant);
      const stagger = index === 0 ? 0 : randomBetween(0.26, 0.52);
      gust.startAt = now + gust.startDelay + stagger;
      study.gusts.push(gust);
    }
  }

  function sampleGust(gust, now) {
    const elapsed = now - gust.startAt;

    if (elapsed < 0) {
      return { alive: true, push: 0, resist: 0, sweep: 0, wash: 0, tail: 0 };
    }

    const total = gust.build + gust.hold + gust.release;
    if (elapsed >= total) {
      return { alive: false, push: 0, resist: 0, sweep: 1, wash: 0, tail: 0 };
    }

    let push = 0;
    if (elapsed < gust.build) {
      push = gust.peak * easeOutCubic(elapsed / gust.build);
    } else if (elapsed < gust.build + gust.hold) {
      const holdProgress = (elapsed - gust.build) / Math.max(0.001, gust.hold);
      push = gust.peak * (1 - (0.08 * easeInOutSine(holdProgress)));
    } else {
      const releaseProgress = (elapsed - gust.build - gust.hold) / gust.release;
      push = gust.peak * (1 - easeInOutSine(releaseProgress));
    }

    let resist = 0;
    const resistStart = gust.build * 0.92;
    const resistWindow = gust.hold + (gust.release * 0.16);

    if (elapsed > resistStart && resistWindow > 0) {
      const resistProgress = clamp((elapsed - resistStart) / resistWindow, 0, 1);
      const decay = 1 - easeInOutSine(resistProgress);
      const wave = Math.sin(resistProgress * Math.PI * gust.resistCycles);
      resist = gust.peak * gust.resistAmp * decay * wave;
    }

    const sweep = easeInOutSine(clamp((elapsed - (gust.build * 0.1)) / (total * 0.82), 0, 1));
    const wash = gust.peak * (elapsed < gust.build ? elapsed / gust.build : 1 - Math.max(0, (elapsed - gust.build - gust.hold) / (gust.release * 1.08)));
    const tailStart = gust.build + (gust.hold * 0.55);
    const tailProgress = elapsed <= tailStart ? 0 : clamp((elapsed - tailStart) / Math.max(0.001, total - tailStart), 0, 1);
    const tail = gust.peak * (1 - tailProgress) * 0.5;

    return { alive: true, push, resist, sweep, wash: Math.max(0, wash), tail };
  }

  function setHeroValue(study, key, value) {
    study.root.style.setProperty(`--wind-${key}`, value.toFixed(3));
  }

  function clearStudy(study) {
    Object.keys(DEFAULT_VALUES).forEach((key) => {
      study.render[key] = DEFAULT_VALUES[key];
    });

    setHeroValue(study, 'headline-x', 0);
    setHeroValue(study, 'headline-skew', 0);
    setHeroValue(study, 'headline-scale', 1);
    setHeroValue(study, 'image-x', 0);
    setHeroValue(study, 'image-y', 0);
    setHeroValue(study, 'image-scale', 1);
    setHeroValue(study, 'frame-x', 0);
    setHeroValue(study, 'shadow-boost', 0);
    setHeroValue(study, 'band-progress', 0);
    setHeroValue(study, 'band-opacity', 0);
    setHeroValue(study, 'band-scale', 1);
    setHeroValue(study, 'wash-progress', 0);
    setHeroValue(study, 'wash-opacity', 0);
    setHeroValue(study, 'hero-wash-progress', 0);
    setHeroValue(study, 'hero-wash-opacity', 0);
  }

  function initWindSample() {
    const roots = Array.from(document.querySelectorAll('[data-wind-hero]'));
    if (!roots.length) return;

    const studies = roots.map((root) => ({
      root,
      variant: root.getAttribute('data-wind-hero'),
      gusts: [],
      lastTime: 0,
      nextBurstAt: 0,
      render: Object.assign({}, DEFAULT_VALUES)
    })).filter((study) => VARIANT_CONFIG[study.variant]);

    if (!studies.length) return;

    studies.forEach(clearStudy);

    function frame(nowMs) {
      const now = nowMs / 1000;

      studies.forEach((study, index) => {
        const config = VARIANT_CONFIG[study.variant];

        if (!study.lastTime) {
          study.lastTime = now;
          study.nextBurstAt = now + randomBetween(config.gap[0], config.gap[1]) + (index * 0.7);
        }

        if (prefersReducedMotion.matches || document.hidden) {
          study.gusts.length = 0;
          clearStudy(study);
          study.lastTime = now;
          return;
        }

        const dt = Math.min(0.05, now - study.lastTime);
        study.lastTime = now;

        if (now >= study.nextBurstAt) {
          launchBurst(study, now);
          study.nextBurstAt = now + randomBetween(config.gap[0], config.gap[1]);
        }

        let push = 0;
        let resist = 0;
        let wash = 0;
        let tail = 0;
        let sweep = 0;

        for (let gustIndex = study.gusts.length - 1; gustIndex >= 0; gustIndex -= 1) {
          const sample = sampleGust(study.gusts[gustIndex], now);
          if (!sample.alive) {
            study.gusts.splice(gustIndex, 1);
            continue;
          }

          push += sample.push;
          resist += sample.resist;
          wash += sample.wash;
          tail += sample.tail;
          sweep = Math.max(sweep, sample.sweep);
        }

        const motion = {
          push,
          resist,
          total: Math.max(0, push + resist),
          wash: Math.max(0, wash),
          tail: Math.max(0, tail),
          sweep
        };

        const targets = Object.assign({}, DEFAULT_VALUES, config.response(study, motion));

        study.render.headlineX = blend(study.render.headlineX, targets.headlineX, dt, config.speeds.headline);
        study.render.headlineSkew = blend(study.render.headlineSkew, targets.headlineSkew, dt, config.speeds.headline);
        study.render.headlineScale = blend(study.render.headlineScale, targets.headlineScale, dt, config.speeds.headline);
        study.render.imageX = blend(study.render.imageX, targets.imageX, dt, config.speeds.image);
        study.render.imageY = blend(study.render.imageY, targets.imageY, dt, config.speeds.image);
        study.render.imageScale = blend(study.render.imageScale, targets.imageScale, dt, config.speeds.image);
        study.render.frameX = blend(study.render.frameX, targets.frameX, dt, config.speeds.frame);
        study.render.shadowBoost = blend(study.render.shadowBoost, targets.shadowBoost, dt, config.speeds.frame);
        study.render.bandProgress = blend(study.render.bandProgress, targets.bandProgress, dt, config.speeds.atmosphere);
        study.render.bandOpacity = blend(study.render.bandOpacity, targets.bandOpacity, dt, config.speeds.atmosphere);
        study.render.bandScale = blend(study.render.bandScale, targets.bandScale, dt, config.speeds.atmosphere);
        study.render.washProgress = blend(study.render.washProgress, targets.washProgress, dt, config.speeds.atmosphere);
        study.render.washOpacity = blend(study.render.washOpacity, targets.washOpacity, dt, config.speeds.atmosphere);
        study.render.heroWashProgress = blend(study.render.heroWashProgress, targets.heroWashProgress, dt, config.speeds.atmosphere);
        study.render.heroWashOpacity = blend(study.render.heroWashOpacity, targets.heroWashOpacity, dt, config.speeds.atmosphere);

        setHeroValue(study, 'headline-x', study.render.headlineX);
        setHeroValue(study, 'headline-skew', study.render.headlineSkew);
        setHeroValue(study, 'headline-scale', study.render.headlineScale);
        setHeroValue(study, 'image-x', study.render.imageX);
        setHeroValue(study, 'image-y', study.render.imageY);
        setHeroValue(study, 'image-scale', study.render.imageScale);
        setHeroValue(study, 'frame-x', study.render.frameX);
        setHeroValue(study, 'shadow-boost', study.render.shadowBoost);
        setHeroValue(study, 'band-progress', study.render.bandProgress);
        setHeroValue(study, 'band-opacity', study.render.bandOpacity);
        setHeroValue(study, 'band-scale', study.render.bandScale);
        setHeroValue(study, 'wash-progress', study.render.washProgress);
        setHeroValue(study, 'wash-opacity', study.render.washOpacity);
        setHeroValue(study, 'hero-wash-progress', study.render.heroWashProgress);
        setHeroValue(study, 'hero-wash-opacity', study.render.heroWashOpacity);
      });

      window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);

    if (prefersReducedMotion.addEventListener) {
      prefersReducedMotion.addEventListener('change', () => {
        if (prefersReducedMotion.matches) {
          studies.forEach(clearStudy);
        }
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        studies.forEach(clearStudy);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initWindSample);
})();
