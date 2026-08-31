(function () {
  'use strict';

  const canvas = document.querySelector('[data-profile-motion]');
  if (!canvas || !canvas.getContext) return;

  // x, y, radius, opacity. The static portrait remains in the SVG; only the
  // 108 low-opacity ambient dots enter the per-frame rendering path.
  const dots = new Float32Array([
    158.69,-0.98,1.28,.48,168.47,-1.15,1.20,.48,183.66,-1,1.30,.48,118.72,4.04,1.24,.47,123.76,4.07,1.25,.47,143.47,3.86,1.18,.47,163.69,4.01,1.26,.47,168.92,4.19,1.37,.48,173.90,4.18,1.37,.48,193.68,4.01,1.32,.48,198.85,4.14,1.38,.48,163.89,9.16,1.34,.47,173.82,9.11,1.32,.48,178.85,9.14,1.34,.48,138.73,14.05,1.24,.47,143.82,14.11,1.28,.47,163.59,13.94,1.22,.47,168.48,13.86,1.18,.47,173.58,13.93,1.22,.47,178.60,13.95,1.24,.48,193.74,14.05,1.31,.48,218.85,14.14,1.39,.48,143.89,19.17,1.30,.47,173.55,18.91,1.21,.47,208.90,19.18,1.39,.48,138.91,24.18,1.32,.47,183.85,24.14,1.32,.47,188.64,23.98,1.24,.47,208.80,24.10,1.33,.48,138.77,29.08,1.93,.59,153.64,28.98,1.39,.50,208.83,29.12,1.35,.48,218.92,34.19,1.40,.48,208.84,44.13,1.32,.47,228.45,43.84,1.20,.48,243.53,43.90,1.27,.49,218.70,49.03,1.28,.48,248.70,49.03,1.33,.49,208.54,53.90,1.30,.49,213.84,54.13,1.32,.47,223.84,59.13,1.32,.47,233.93,64.20,1.37,.48,238.63,63.97,1.25,.48,253.86,69.15,1.38,.48,238.91,79.19,1.35,.47,248.56,78.92,1.22,.48,253.48,78.86,1.21,.48,258.88,79.16,1.37,.48,223.81,84.11,1.31,.47,228.51,83.88,1.19,.47,213.44,88.83,1.15,.47,218.76,89.07,1.29,.47,223.44,88.83,1.16,.47,203.67,94,1.23,.47,233.46,93.85,1.19,.48,238.77,94.08,1.31,.48,138.64,98.98,1.94,.60,223.41,98.80,1.15,.47,228.44,98.83,1.18,.48,238.68,99.01,1.27,.48,253.42,98.82,1.19,.48,213.50,103.87,1.13,.46,263.40,108.80,1.19,.48,243.82,119.11,1.36,.48,238.75,124.07,1.32,.48,253.52,123.89,1.24,.48,213.71,129.03,1.19,.46,218.47,133.85,1.16,.47,258.57,133.93,1.28,.48,213.56,138.92,1.13,.46,233.72,139.04,1.30,.48,253.91,139.19,1.41,.48,113.83,144.12,1.62,.53,123.54,143.91,1.97,.61,153.54,143.90,1.58,.54,233.81,144.10,1.32,.48,108.86,149.15,1.94,.58,128.86,149.14,1.88,.57,143.78,149.09,1.58,.52,233.43,148.82,1.17,.48,253.83,149.12,1.36,.48,113.53,153.90,1.86,.59,208.62,153.97,1.16,.46,228.68,154.01,1.27,.48,233.40,153.80,1.16,.48,223.62,158.96,1.23,.47,228.77,169.08,1.29,.47,243.77,169.08,1.31,.48,238.41,173.80,1.15,.47,243.62,173.97,1.25,.48,233.86,179.14,1.33,.47,208.72,199.04,1.21,.46,213.64,208.98,1.20,.47,103.62,238.96,1.52,.53,98.43,243.82,1.46,.53,178.64,248.98,1.86,.59,143.56,278.92,1.91,.60,229.02,24.27,1.45,.48,218.98,29.23,1.42,.48,228.94,34.20,1.41,.48,238.95,54.21,1.40,.48,258.98,94.24,1.41,.48,139.04,104.28,2,.58,258.94,129.20,1.42,.48,253.97,154.23,1.42,.48,94.05,174.29,1.68,.52,218.95,204.21,1.34,.47,179.26,239.44,1.94,.56
  ]);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lowPower = coarsePointer.matches
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const saveData = Boolean(connection && connection.saveData);
  const targetInterval = saveData ? 50 : lowPower ? 1000 / 30 : 1000 / 60;
  const maxPixelRatio = lowPower ? 1.25 : 1.75;
  const contextOptions = {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
    desynchronized: true
  };

  let gl;
  let program;
  let timeUniform;
  let colorUniform;
  let resolutionUniform;
  let motionUniform;
  let frameRequest = 0;
  let frameTimer = 0;
  let resizeRequest = 0;
  let visible = true;
  let contextLost = false;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initialize() {
    gl = canvas.getContext('webgl', contextOptions)
      || canvas.getContext('experimental-webgl', contextOptions);
    if (!gl) return false;

    const vertexShader = compileShader(gl.VERTEX_SHADER, [
      'precision mediump float;',
      'attribute vec4 a_dot;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform float u_motion;',
      'varying float v_alpha;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
      'void main(){',
      'float seed=hash(a_dot.xy);',
      'float duration=mix(2.1,4.1,hash(a_dot.yx+17.3));',
      'float phase=u_time*6.2831853/duration+seed*6.2831853;',
      'float wave=sin(phase);',
      'float rise=cos(phase*.83+seed*3.1);',
      'vec2 direction=vec2(seed<.5?-1.0:1.0,seed<.33?1.0:-1.0);',
      'vec2 position=a_dot.xy+u_motion*direction*vec2(wave*1.35,rise*1.05);',
      'float pulse=.5+.5*wave;',
      'float scale=mix(.62,1.42,pulse*u_motion+(1.0-u_motion)*.5);',
      'vec2 unit=(position+8.0)/316.0;',
      'gl_Position=vec4(unit.x*2.0-1.0,1.0-unit.y*2.0,0.0,1.0);',
      'gl_PointSize=max(1.0,a_dot.z*2.0*scale*u_resolution.x/316.0);',
      'v_alpha=a_dot.w*mix(.42,1.0,pulse*u_motion+(1.0-u_motion)*.72);',
      '}'
    ].join(''));
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, [
      'precision mediump float;',
      'uniform vec3 u_color;',
      'varying float v_alpha;',
      'void main(){',
      'float radius=length(gl_PointCoord-vec2(.5))*2.0;',
      'float edge=1.0-smoothstep(.82,1.0,radius);',
      'gl_FragColor=vec4(u_color*v_alpha*edge,v_alpha*edge);',
      '}'
    ].join(''));
    if (!vertexShader || !fragmentShader) return false;

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, dots, gl.STATIC_DRAW);
    const dotAttribute = gl.getAttribLocation(program, 'a_dot');
    gl.enableVertexAttribArray(dotAttribute);
    gl.vertexAttribPointer(dotAttribute, 4, gl.FLOAT, false, 0, 0);
    timeUniform = gl.getUniformLocation(program, 'u_time');
    colorUniform = gl.getUniformLocation(program, 'u_color');
    resolutionUniform = gl.getUniformLocation(program, 'u_resolution');
    motionUniform = gl.getUniformLocation(program, 'u_motion');
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }

  function syncTheme() {
    if (!gl || contextLost) return;
    const dark = document.documentElement.dataset.theme === 'dark';
    gl.useProgram(program);
    gl.uniform3f(colorUniform, dark ? .76 : .094, dark ? .79 : .239, dark ? .82 : .40);
  }

  function resize() {
    resizeRequest = 0;
    if (!gl || contextLost) return;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    const size = Math.max(1, Math.round(Math.min(rect.width, rect.height) * pixelRatio));
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;
      gl.viewport(0, 0, size, size);
      gl.useProgram(program);
      gl.uniform2f(resolutionUniform, size, size);
    }
    draw(performance.now());
  }

  function queueResize() {
    if (!resizeRequest) resizeRequest = window.requestAnimationFrame(resize);
  }

  function draw(timestamp) {
    if (!gl || contextLost) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(timeUniform, timestamp * .001);
    gl.uniform1f(motionUniform, reducedMotion.matches ? 0 : 1);
    gl.drawArrays(gl.POINTS, 0, dots.length / 4);
  }

  function tick(timestamp) {
    frameRequest = 0;
    if (!visible || document.hidden || reducedMotion.matches || contextLost) return;
    draw(timestamp);
    scheduleFrame();
  }

  function scheduleFrame() {
    if (targetInterval < 20) {
      frameRequest = window.requestAnimationFrame(tick);
      return;
    }
    frameTimer = window.setTimeout(function () {
      frameTimer = 0;
      frameRequest = window.requestAnimationFrame(tick);
    }, targetInterval);
  }

  function syncPlayback() {
    if (frameRequest) window.cancelAnimationFrame(frameRequest);
    if (frameTimer) window.clearTimeout(frameTimer);
    frameRequest = 0;
    frameTimer = 0;
    if (visible && !document.hidden && !reducedMotion.matches && !contextLost) {
      scheduleFrame();
    } else {
      draw(performance.now());
    }
  }

  canvas.addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
    contextLost = true;
    syncPlayback();
  }, false);
  canvas.addEventListener('webglcontextrestored', function () {
    contextLost = false;
    if (initialize()) {
      syncTheme();
      resize();
      syncPlayback();
    }
  }, false);

  if (!initialize()) {
    canvas.hidden = true;
    return;
  }

  syncTheme();
  resize();

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(queueResize)
    : null;
  if (resizeObserver) resizeObserver.observe(canvas);
  else window.addEventListener('resize', queueResize, { passive: true });

  if (typeof IntersectionObserver === 'function') {
    const visibilityObserver = new IntersectionObserver(function (entries) {
      visible = Boolean(entries[0] && entries[0].isIntersecting);
      syncPlayback();
    }, { rootMargin: '80px' });
    visibilityObserver.observe(canvas);
  }

  const themeObserver = new MutationObserver(function (records) {
    if (records.some(function (record) { return record.attributeName === 'data-theme'; })) {
      syncTheme();
      draw(performance.now());
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', syncPlayback, { passive: true });
  if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', syncPlayback);
  else if (typeof reducedMotion.addListener === 'function') reducedMotion.addListener(syncPlayback);
  syncPlayback();
}());
