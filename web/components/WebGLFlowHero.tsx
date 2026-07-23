"use client";

import { useEffect, useRef, useState } from "react";

type Mesh = { mode: number; vertices: Float32Array; color: [number, number, number] };

function box(x: number, y: number, z: number, width: number, height: number, depth: number) {
  const x0 = x - width / 2;
  const x1 = x + width / 2;
  const y0 = y - height / 2;
  const y1 = y + height / 2;
  const z0 = z - depth / 2;
  const z1 = z + depth / 2;
  return new Float32Array([
    x0,y0,z1, x1,y0,z1, x1,y1,z1, x0,y0,z1, x1,y1,z1, x0,y1,z1,
    x1,y0,z0, x0,y0,z0, x0,y1,z0, x1,y0,z0, x0,y1,z0, x1,y1,z0,
    x0,y0,z0, x0,y0,z1, x0,y1,z1, x0,y0,z0, x0,y1,z1, x0,y1,z0,
    x1,y0,z1, x1,y0,z0, x1,y1,z0, x1,y0,z1, x1,y1,z0, x1,y1,z1,
    x0,y1,z1, x1,y1,z1, x1,y1,z0, x0,y1,z1, x1,y1,z0, x0,y1,z0,
    x0,y0,z0, x1,y0,z0, x1,y0,z1, x0,y0,z0, x1,y0,z1, x0,y0,z1,
  ]);
}

function hexPrism(x: number, y: number, z: number, radius: number, depth: number) {
  const values: number[] = [];
  const front = z + depth / 2;
  const back = z - depth / 2;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    const b = Math.PI / 6 + (((i + 1) % 6) * Math.PI) / 3;
    const ax = x + Math.cos(a) * radius;
    const ay = y + Math.sin(a) * radius;
    const bx = x + Math.cos(b) * radius;
    const by = y + Math.sin(b) * radius;
    values.push(x,y,front, ax,ay,front, bx,by,front, x,y,back, bx,by,back, ax,ay,back);
    values.push(ax,ay,front, ax,ay,back, bx,by,back, ax,ay,front, bx,by,back, bx,by,front);
  }
  return new Float32Array(values);
}

function line(points: Array<[number, number, number]>) {
  return new Float32Array(points.flat());
}

function dashedLine(a: [number, number, number], b: [number, number, number]) {
  const values: number[] = [];
  for (let i = 0; i < 8; i += 2) {
    const start = i / 8;
    const end = (i + 1) / 8;
    values.push(
      a[0] + (b[0] - a[0]) * start, a[1] + (b[1] - a[1]) * start, a[2] + (b[2] - a[2]) * start,
      a[0] + (b[0] - a[0]) * end, a[1] + (b[1] - a[1]) * end, a[2] + (b[2] - a[2]) * end,
    );
  }
  return new Float32Array(values);
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed");
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, `attribute vec3 aPosition; attribute vec3 aColor; uniform float uTime; uniform float uAspect; varying vec3 vColor; void main(){ vec3 p=aPosition; float sway=sin(uTime*.8)*.025; float cy=cos(sway), sy=sin(sway); p.xz=mat2(cy,-sy,sy,cy)*p.xz; float pitch=cos(.14), sp=sin(.14); p.yz=mat2(pitch,-sp,sp,pitch)*p.yz; float fitAspect=max(uAspect,1.2); gl_Position=vec4(p.x*.30/fitAspect,p.y*.30,0.0,1.0); vColor=aColor; }`);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, `precision mediump float; varying vec3 vColor; void main(){ gl_FragColor=vec4(vColor,1.0); }`);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Program link failed");
  return program;
}

export function WebGLFlowHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (!gl) {
      setSupported(false);
      return;
    }
    try {
      const program = createProgram(gl);
      const position = gl.getAttribLocation(program, "aPosition");
      const color = gl.getAttribLocation(program, "aColor");
      const time = gl.getUniformLocation(program, "uTime");
      const aspect = gl.getUniformLocation(program, "uAspect");
      const meshes: Mesh[] = [
        { mode: gl.TRIANGLES, vertices: hexPrism(-2.2, .72, .12, .58, .22), color: [.94,.45,.17] },
        { mode: gl.TRIANGLES, vertices: box(.1, .76, 0, 1.9, 1.28, .24), color: [.13,.16,.19] },
        { mode: gl.TRIANGLES, vertices: box(.1, -1.16, .16, 1.9, 1.28, .24), color: [.11,.14,.17] },
        { mode: gl.TRIANGLES, vertices: box(-.02, .43, .28, 1.42, .07, .035), color: [.94,.94,.88] },
        { mode: gl.TRIANGLES, vertices: box(-.02, .65, .28, 1.42, .07, .035), color: [.94,.94,.88] },
        { mode: gl.TRIANGLES, vertices: box(-.02, .87, .28, 1.42, .07, .035), color: [.94,.45,.17] },
        { mode: gl.TRIANGLES, vertices: box(-.02, -1.49, .44, 1.42, .07, .035), color: [.94,.94,.88] },
        { mode: gl.TRIANGLES, vertices: box(-.02, -1.27, .44, 1.42, .07, .035), color: [.94,.94,.88] },
        { mode: gl.TRIANGLES, vertices: box(-.02, -1.05, .44, 1.42, .07, .035), color: [.78,.22,.18] },
        { mode: gl.LINES, vertices: line([[-1.64,.72,.2],[-.88,.76,.1]]), color: [.49,.53,.55] },
        { mode: gl.LINES, vertices: dashedLine([.1,.1,.18],[.1,-.52,.28]), color: [.94,.45,.17] },
        { mode: gl.LINES, vertices: line([[1.06,-1.16,.36],[1.66,-1.16,.36]]), color: [.45,.75,.58] },
      ];
      const particleValues: number[] = [];
      for (let i = 0; i < 100; i++) particleValues.push((Math.random() - .5) * 8, (Math.random() - .5) * 5, (Math.random() - .5) * 2);
      meshes.push({ mode: gl.POINTS, vertices: new Float32Array(particleValues), color: [.94,.45,.17] });
      const buffers = meshes.map((mesh) => {
        const buffer = gl.createBuffer();
        if (!buffer) throw new Error("Unable to create buffer");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
        return buffer;
      });
      gl.useProgram(program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(rect.width * ratio));
        canvas.height = Math.max(1, Math.floor(rect.height * ratio));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1f(aspect, rect.width / Math.max(rect.height, 1));
      };
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();
      let frame = 0;
      const render = (now: number) => {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1f(time, reduced ? 0 : now * .001);
        meshes.forEach((mesh, index) => {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers[index]);
          gl.enableVertexAttribArray(position);
          gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
          gl.disableVertexAttribArray(color);
          gl.vertexAttrib3f(color, mesh.color[0], mesh.color[1], mesh.color[2]);
          gl.drawArrays(mesh.mode, 0, mesh.vertices.length / 3);
        });
        if (!reduced) frame = requestAnimationFrame(render);
      };
      render(0);
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        buffers.forEach((buffer) => gl.deleteBuffer(buffer));
        gl.deleteProgram(program);
      };
    } catch {
      setSupported(false);
    }
  }, []);

  return (
    <div className="flow-hero-stage" role="img" aria-label="Animated 3D workflow graph showing the MasarCI sample pipeline">
      {supported ? <canvas ref={canvasRef} aria-hidden="true" /> : <div className="flow-fallback" aria-hidden="true" />}
      <div className="flow-stage-status">● trigger → build → deploy</div>
      <div className="flow-label flow-label-trigger"><b>on: push</b><small>branches: [main]</small></div>
      <div className="flow-label flow-label-build"><b>build</b><small>ubuntu-latest · 3 steps</small></div>
      <div className="flow-label flow-label-deploy"><b>deploy</b><small>needs: [build] · <em>finding</em></small></div>
      <div className="flow-stage-caption">the whole path, in one frame.</div>
    </div>
  );
}
