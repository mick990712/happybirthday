(() => {
  "use strict";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const experience = document.getElementById("experience");
  const sceneNumber = document.getElementById("sceneNumber");
  const eyebrow = document.getElementById("eyebrow");
  const title = document.getElementById("title");
  const subtitle = document.getElementById("subtitle");
  const hint = document.getElementById("hint");
  const nextButton = document.getElementById("nextButton");
  const buttonLabel = document.getElementById("buttonLabel");
  const glyphs = Array.from("アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン✦✧♡♥◆◇※░▒▓0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/{}[]!?");
  const cakeImage = new Image();
  const pigImage = new Image();
  const rosesImage = new Image();
  const heartImage = new Image();
  const scenes = [
    { eyebrow: "A SECRET IS UNFOLDING", title: "正在解碼專屬於你的 <span class=\"accent\">17 歲</span>驚喜", subtitle: "點擊螢幕，讓魔法開始", button: "開始解碼" },
    { eyebrow: "A LITTLE PIG, A LOT OF LOVE", title: "聽說這隻可愛的小豬，<br>最喜歡黏著最可愛的你", subtitle: "我是豬豬大王", button: "下一幕" },
    { eyebrow: "A WISH FROM MY HEART", title: "Happy 17th Birthday！", subtitle: "願你的 17 歲，每一天都像這場特效一樣充滿驚喜與閃耀。有你真好 ❤️", button: "收下祝福" },
    { eyebrow: "THE NIGHT IS YOURS", title: "To My Dearest:<br><span class=\"accent\">祝你生日快樂，永遠愛你</span>", subtitle: "今天、明天，還有好多好多天。", button: "再看一次" }
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let rain = [];
  let fireworks = [];
  let roseGlyphs = [];
  let cakeFlames = [];
  let currentScene = 0;
  let settled = false;
  let transitionTimer = null;
  let typewriterTimer = null;
  let sceneStartedAt = performance.now();

  cakeImage.addEventListener("load", () => assemble(currentScene, false));
  pigImage.addEventListener("load", () => {
    if (currentScene === 1) assemble(currentScene, false);
  });
  rosesImage.addEventListener("load", buildRoseGlyphs);
  heartImage.addEventListener("load", () => {
    if (currentScene === 2) assemble(currentScene, false);
  });
  cakeImage.src = "./1.webp";
  pigImage.src = "./7.jpg";
  rosesImage.src = "./images.jpg";
  heartImage.src = "./8.webp";

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rain = Array.from({ length: Math.ceil(width / 40) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 5 + Math.random() * 9,
      length: 5 + Math.floor(Math.random() * 7),
      hue: Math.random() < .18 ? 320 : 155
    }));
    assemble(currentScene, false);
  }

  function makeTextTargets(lines, options = {}) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const pen = offscreen.getContext("2d", { willReadFrequently: true });
    const fontSize = options.fontSize || Math.max(15, Math.min(23, width / 48));
    const lineHeight = fontSize * 1.34;
    const maxLength = Math.max(...lines.map(line => line.length));
    const charWidth = fontSize * .61;
    const scale = Math.min(1, (width * .84) / (maxLength * charWidth));
    const size = fontSize * scale;
    pen.textAlign = "center";
    pen.textBaseline = "middle";
    pen.font = `600 ${size}px "DM Mono", monospace`;
    pen.fillStyle = "#fff";
    lines.forEach((line, index) => {
      pen.fillText(line, width / 2, height * (options.y || .43) + (index - (lines.length - 1) / 2) * lineHeight * scale, width * .9);
    });
    return bitmapTargets(offscreen, options.step || 5, options.color || "pink");
  }

  function bitmapTargets(bitmap, step, color) {
    const pixels = bitmap.getContext("2d").getImageData(0, 0, width, height).data;
    const points = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (pixels[(y * width + x) * 4 + 3] > 100) {
          points.push({ x: x + (Math.random() - .5) * 2, y: y + (Math.random() - .5) * 2, color });
        }
      }
    }
    return points;
  }

  function imageTargets(image, options = {}) {
    if (!image.complete || !image.naturalWidth) return [];
    const maxWidth = width * (options.width || .46);
    const maxHeight = height * (options.height || .48);
    const crop = options.crop || { x: 0, y: 0, width: 1, height: 1 };
    const sourceX = crop.x * image.naturalWidth;
    const sourceY = crop.y * image.naturalHeight;
    const sourceWidth = crop.width * image.naturalWidth;
    const sourceHeight = crop.height * image.naturalHeight;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    const imageWidth = Math.round(sourceWidth * scale);
    const imageHeight = Math.round(sourceHeight * scale);
    const offscreen = document.createElement("canvas");
    offscreen.width = imageWidth;
    offscreen.height = imageHeight;
    const pen = offscreen.getContext("2d", { willReadFrequently: true });
    pen.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, imageWidth, imageHeight);
    const pixels = pen.getImageData(0, 0, imageWidth, imageHeight).data;
    const points = [];
    const step = options.heartGlow
      ? Math.max(8, Math.ceil(Math.sqrt(imageWidth * imageHeight / 650)))
      : options.pigGlow
        ? Math.max(4, Math.round(imageWidth / 60))
        : Math.max(7, Math.round(imageWidth / 32));
    const left = (width - imageWidth) / 2;
    const top = options.centerY ? (height - imageHeight) / 2 : height * (options.top || .12);
    if (options.cakeSilhouette) cakeFlames = [];
    const isHeartPixel = (pixelX, pixelY) => {
      if (pixelX < 0 || pixelY < 0 || pixelX >= imageWidth || pixelY >= imageHeight) return false;
      const offset = (pixelY * imageWidth + pixelX) * 4;
      return pixels[offset + 3] >= 100 &&
        (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3 >= 35;
    };
    for (let y = 0; y < imageHeight; y += step) {
      for (let x = 0; x < imageWidth; x += step) {
        if (options.cakeSilhouette && x > imageWidth / 2) continue;
        const offset = (y * imageWidth + x) * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const brightness = (red + green + blue) / 3;
        const saturation = (Math.max(red, green, blue) - Math.min(red, green, blue)) / Math.max(1, Math.max(red, green, blue));
        if (options.heartGlow && brightness < 35) continue;
        const heartEdge = options.heartGlow && (
          !isHeartPixel(x - step, y) || !isHeartPixel(x + step, y) ||
          !isHeartPixel(x, y - step) || !isHeartPixel(x, y + step)
        );
        if (options.cakeSilhouette) {
          const relativeY = y / imageHeight;
          const halfWidth = relativeY < .18 ? .16 : relativeY < .4 ? .23 : relativeY < .68 ? .35 : .48;
          if (Math.abs(x / imageWidth - .5) > halfWidth) continue;
        }
        if (options.pigMask) {
          const relativeY = y / imageHeight;
          const center = relativeY < .23 ? .61 : .51;
          const halfWidth = relativeY < .23 ? .14 : relativeY < .38 ? .42 : relativeY < .58 ? .34 : relativeY < .82 ? .43 : .38;
          const relativeX = x / imageWidth;
          if (Math.abs(relativeX - center) > halfWidth) continue;
          if (relativeY > .85 && Math.abs(relativeX - .5) < .055) continue;
        }
        if (options.pigGlow && brightness > 170 && saturation < .22) continue;
        if (options.removeNeutralBackground && saturation < .12 && brightness < 205) continue;
        if (pixels[offset + 3] < 100 || (brightness > 249 && saturation < .08)) continue;
        const color = options.heartGlow
          ? heartEdge ? "#fff0f8" : y / imageHeight < .5 ? "#ff4f9a" : "#ff82cb"
          : options.pigGlow
            ? brightness < 150 ? "#b9ff65" : saturation > .25 ? "#ff79e8" : "#70ffe2"
            : saturation > .17
              ? `hsl(${rgbHue(red, green, blue)}, 88%, ${brightness < 155 ? 66 : 78}%)`
              : brightness > 230 ? "#fff3f8" : brightness > 190 ? "#ffd7e8" : "#ffb9cf";
        const target = { x: left + x, y: top + y, color, size: options.heartGlow ? heartEdge ? 13 : 10 : undefined };
        points.push(target);
        if (options.cakeSilhouette && x < imageWidth / 2) {
          points.push({ ...target, x: left + imageWidth - x });
        }
      }
    }
    if (options.cakeSilhouette) {
      const candleXs = [.36, .43, .5, .57, .64];
      candleXs.forEach((relativeX, index) => {
        const x = left + imageWidth * relativeX;
        const y = top - imageHeight * .01;
        cakeFlames.push({ x, y, phase: index * .8 });
        points.push({
          x,
          y,
          color: index % 2 ? "#ff9f43" : "#ffe48a",
          glyph: "✦",
          size: 18
        });
        for (let row = 1; row <= 3; row++) {
          points.push({
            x,
            y: top + imageHeight * (.006 + row * .018),
            color: "#fff1c2",
            glyph: "│",
            size: 15
          });
        }
      });
      [
        { y: .4, halfWidth: .23 },
        { y: .68, halfWidth: .35 }
      ].forEach(rim => {
        for (let x = .5 - rim.halfWidth; x <= .5 + rim.halfWidth; x += .025) {
          points.push({
            x: left + imageWidth * x,
            y: top + imageHeight * rim.y,
            color: "#ffe6aa",
            glyph: "━",
            size: 13
          });
        }
      });
    }
    if (options.pigFeatures) {
      [
        { x: .34, y: .39, color: "#d8ff65", glyph: "●", size: 15 },
        { x: .66, y: .39, color: "#d8ff65", glyph: "●", size: 15 },
        { x: .5, y: .42, color: "#ff54dd", glyph: "◎", size: 19 },
        { x: .48, y: .42, color: "#b9ff65", glyph: "•", size: 13 },
        { x: .52, y: .42, color: "#b9ff65", glyph: "•", size: 13 },
        { x: .22, y: .2, color: "#61fff0", glyph: "▲", size: 16 },
        { x: .78, y: .2, color: "#61fff0", glyph: "▲", size: 16 },
        { x: .23, y: .5, color: "#ff5cf0", glyph: "●", size: 17 },
        { x: .77, y: .5, color: "#ff5cf0", glyph: "●", size: 17 }
      ].forEach(mark => points.push({
        x: left + imageWidth * mark.x,
        y: top + imageHeight * mark.y,
        color: mark.color,
        glyph: mark.glyph,
        size: mark.size
      }));
    }
    return points;
  }

  function rgbHue(red, green, blue) {
    red /= 255;
    green /= 255;
    blue /= 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    if (!delta) return 0;
    let hue;
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    return Math.round((hue * 60 + 360) % 360);
  }

  function buildRoseGlyphs() {
    const source = document.createElement("canvas");
    source.width = rosesImage.naturalWidth;
    source.height = rosesImage.naturalHeight;
    const pen = source.getContext("2d", { willReadFrequently: true });
    pen.drawImage(rosesImage, 0, 0);
    const pixels = pen.getImageData(0, 0, source.width, source.height).data;
    roseGlyphs = [];
    for (let y = 0; y < source.height; y += 25) {
      for (let x = 0; x < source.width; x += 25) {
        const offset = (y * source.width + x) * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const saturation = (Math.max(red, green, blue) - Math.min(red, green, blue)) / Math.max(1, Math.max(red, green, blue));
        if (saturation < .22) continue;
        roseGlyphs.push({
          x: x / source.width,
          y: y / source.height,
          hue: rgbHue(red, green, blue),
          glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  function targetsForScene(index) {
    if (index === 0) {
      return imageTargets(cakeImage, {
        width: .92,
        height: .75,
        centerY: true,
        cakeSilhouette: true,
        removeNeutralBackground: true,
        crop: { x: .25, y: .06, width: .54, height: .9 }
      });
    }
    if (index === 1) {
      return imageTargets(pigImage, {
        width: .76,
        height: .64,
        centerY: true,
        pigGlow: true,
        pigFeatures: true,
        crop: { x: .08, y: .23, width: .84, height: .53 }
      });
    }
    if (index === 2) {
      return imageTargets(heartImage, {
        width: .84,
        height: .54,
        top: .07,
        heartGlow: true
      });
    }
    return [];
  }

  function chaosParticle(target) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(width, height) * (.35 + Math.random() * .75);
    return {
      x: target ? target.x + (Math.random() - .5) * width * 1.2 : Math.random() * width,
      y: target ? target.y + (Math.random() - .5) * height * 1.2 : Math.random() * height,
      tx: target ? target.x : Math.cos(angle) * radius + width / 2,
      ty: target ? target.y : Math.sin(angle) * radius + height / 2,
      glyph: target && target.glyph ? target.glyph : glyphs[Math.floor(Math.random() * glyphs.length)],
      color: target ? target.color : "#75e9bd",
      size: target && target.size ? target.size : 9 + Math.random() * 7,
      alpha: .35 + Math.random() * .65,
      phase: Math.random() * Math.PI * 2,
      jitter: 5 + Math.random() * 20,
      settled: false
    };
  }

  function assemble(index, immediate) {
    const targets = targetsForScene(index);
    const count = index === 3 ? 760 : targets.length || 450;
    particles = Array.from({ length: count }, (_, i) => {
      const target = targets.length ? targets[i % targets.length] : null;
      const particle = chaosParticle(target);
      if (immediate && target) {
        particle.x = target.x;
        particle.y = target.y;
        particle.settled = true;
      }
      return particle;
    });
    settled = immediate;
    sceneStartedAt = performance.now();
    if (index === 3) launchFirework();
  }

  function transitionTo(index) {
    clearTimeout(transitionTimer);
    clearTimeout(typewriterTimer);
    currentScene = index % scenes.length;
    const scene = scenes[currentScene];
    experience.dataset.scene = String(currentScene + 1);
    sceneNumber.textContent = String(currentScene + 1).padStart(2, "0");
    eyebrow.textContent = scene.eyebrow;
    title.innerHTML = scene.title;
    subtitle.textContent = "";
    buttonLabel.textContent = scene.button;
    hint.style.opacity = "0";
    assemble(currentScene, false);
    if (currentScene === 2) {
      const fullText = scenes[currentScene].subtitle;
      transitionTimer = window.setTimeout(() => {
        let position = 0;
        const type = () => {
          subtitle.textContent = fullText.slice(0, position++);
          if (position <= fullText.length) typewriterTimer = window.setTimeout(type, 47);
        };
        type();
      }, 1700);
    } else {
      subtitle.textContent = scene.subtitle;
    }
    if (currentScene === 3) hint.style.opacity = "0";
  }

  function advance() {
    if (currentScene === 3) {
      transitionTo(0);
      hint.textContent = "點擊任意處，推進下一幕";
      hint.style.opacity = "1";
      return;
    }
    hint.style.opacity = "0";
    transitionTo(currentScene + 1);
    if (currentScene === 3) buttonLabel.textContent = "再看一次";
  }

  function drawRain(time) {
    ctx.font = "12px 'DM Mono', monospace";
    rain.forEach(drop => {
      const char = glyphs[Math.floor(Math.random() * glyphs.length)];
      for (let i = 0; i < drop.length; i++) {
        ctx.fillStyle = `hsla(${drop.hue}, 88%, 65%, ${(1 - i / drop.length) * .12})`;
        ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], drop.x, drop.y - i * 14);
      }
      drop.y += drop.speed;
      if (drop.y > height + drop.length * 14) {
        drop.y = -Math.random() * height * .4;
        drop.x = Math.random() * width;
      }
    });
  }

  function drawRoseGlyphs(time) {
    if (!rosesImage.naturalWidth || !roseGlyphs.length) return;
    const scale = Math.max(width / rosesImage.naturalWidth, height / rosesImage.naturalHeight);
    const imageWidth = rosesImage.naturalWidth * scale;
    const imageHeight = rosesImage.naturalHeight * scale;
    const left = (width - imageWidth) / 2;
    const top = (height - imageHeight) / 2;
    ctx.font = "10px 'DM Mono', monospace";
    roseGlyphs.forEach(rose => {
      const x = left + rose.x * imageWidth + Math.sin(time * .00035 + rose.phase) * 1.5;
      const y = top + rose.y * imageHeight + Math.cos(time * .0003 + rose.phase) * 1.5;
      ctx.globalAlpha = .065 + (Math.sin(time * .001 + rose.phase) + 1) * .025;
      ctx.fillStyle = `hsl(${rose.hue}, 82%, 70%)`;
      ctx.fillText(rose.glyph, x, y);
    });
    ctx.globalAlpha = 1;
  }

  function drawParticles(time) {
    particles.forEach(particle => {
      if (!particle.settled) {
        const dx = particle.tx - particle.x;
        const dy = particle.ty - particle.y;
        const agitation = Math.max(0, 1 - (time - sceneStartedAt) / 1200);
        particle.x += dx * .055 + (Math.random() - .5) * particle.jitter * agitation;
        particle.y += dy * .055 + (Math.random() - .5) * particle.jitter * agitation;
        particle.x += Math.sin(time * .012 + particle.phase) * .75;
        particle.y += Math.cos(time * .01 + particle.phase) * .75;
        if (Math.abs(dx) + Math.abs(dy) < 1.8 && time - sceneStartedAt > 1500) particle.settled = true;
      } else {
        particle.x += (particle.tx - particle.x) * .08;
        particle.y += (particle.ty - particle.y) * .08;
      }
      const shimmer = .62 + Math.sin(time * .006 + particle.phase) * .28;
      if (currentScene === 3) {
        particle.x += (Math.random() - .5) * 3;
        particle.y += (Math.random() - .5) * 3;
      }
      ctx.globalAlpha = particle.alpha * shimmer;
      ctx.font = `${particle.size}px "DM Mono", monospace`;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = currentScene === 1 ? 18 : currentScene === 0 ? 4 : currentScene === 2 ? 3 : 9;
      ctx.fillText(particle.glyph, particle.x, particle.y);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }

  function drawCakeFlames(time) {
    cakeFlames.forEach(flame => {
      const flicker = Math.sin(time * .018 + flame.phase);
      const x = flame.x + flicker * 1.8;
      const y = flame.y + Math.cos(time * .014 + flame.phase) * 1.2;
      const size = 8 + (flicker + 1) * 2;
      ctx.save();
      ctx.globalAlpha = .76 + (flicker + 1) * .1;
      ctx.shadowColor = "#ff9c43";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ff8b45";
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.quadraticCurveTo(x - size * .85, y + size * .15, x, y - size);
      ctx.quadraticCurveTo(x + size * .8, y + size * .15, x, y + size);
      ctx.fill();
      ctx.shadowColor = "#fff4a8";
      ctx.shadowBlur = 11;
      ctx.fillStyle = "#fff3a2";
      ctx.beginPath();
      ctx.moveTo(x, y + size * .55);
      ctx.quadraticCurveTo(x - size * .35, y, x + flicker, y - size * .46);
      ctx.quadraticCurveTo(x + size * .43, y + size * .08, x, y + size * .55);
      ctx.fill();
      ctx.restore();
    });
  }

  function launchFirework() {
    if (currentScene !== 3) return;
    const x = width * (.12 + Math.random() * .76);
    const y = height * (.08 + Math.random() * .42);
    const hue = Math.random() < .45 ? 330 : Math.random() * 70 + 260;
    for (let i = 0; i < 85; i++) {
      const angle = Math.PI * 2 * i / 85;
      const speed = 1.1 + Math.random() * 3.2;
      fireworks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, hue, char: glyphs[Math.floor(Math.random() * glyphs.length)] });
    }
    window.setTimeout(launchFirework, 330 + Math.random() * 540);
  }

  function drawFireworks() {
    fireworks = fireworks.filter(spark => spark.life > .03);
    fireworks.forEach(spark => {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vx *= .985;
      spark.vy = spark.vy * .985 + .018;
      spark.life *= .974;
      ctx.globalAlpha = spark.life;
      ctx.fillStyle = `hsl(${spark.hue}, 100%, 74%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.font = "12px 'DM Mono', monospace";
      ctx.fillText(spark.char, spark.x, spark.y);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function frame(time) {
    ctx.clearRect(0, 0, width, height);
    drawRain(time);
    drawRoseGlyphs(time);
    drawParticles(time);
    if (currentScene === 0) drawCakeFlames(time);
    if (currentScene === 3) drawFireworks();
    if (!settled && time - sceneStartedAt > 1900) settled = particles.every(particle => particle.settled);
    requestAnimationFrame(frame);
  }

  nextButton.addEventListener("click", event => {
    event.stopPropagation();
    advance();
  });
  experience.addEventListener("click", event => {
    if (event.target !== nextButton && !nextButton.contains(event.target)) advance();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advance();
    }
  });
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
