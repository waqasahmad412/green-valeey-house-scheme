import React, { useEffect, useRef, useState } from 'react';
import { GENERATED_IMAGES } from '../data/initialSocietyData';
import { ResilientImage } from './Logo';

interface HeroLiveSimulationProps {
  effectiveNight: boolean;
}

interface Waypoint {
  x: number;
  y: number;
}

// Compute the exact rendered rectangle of the object-cover image inside the container
// Natural image resolution of hero_green_valley_entrance is 1376 x 768 (aspect ratio 1.791666)
const IMG_NATURAL_W = 1376;
const IMG_NATURAL_H = 768;
const IMG_ASPECT = IMG_NATURAL_W / IMG_NATURAL_H;

function getImageDisplayRect(containerW: number, containerH: number) {
  const containerAspect = containerW / containerH;
  let renderW = containerW;
  let renderH = containerH;
  let offsetX = 0;
  let offsetY = 0;

  if (containerAspect > IMG_ASPECT) {
    // Container is wider than image aspect -> image width fits container, height expands and is vertically centered
    renderW = containerW;
    renderH = containerW / IMG_ASPECT;
    offsetY = (containerH - renderH) / 2;
  } else {
    // Container is taller than image aspect -> image height fits container, width expands and is horizontally centered
    renderH = containerH;
    renderW = containerH * IMG_ASPECT;
    offsetX = (containerW - renderW) / 2;
  }

  return { offsetX, offsetY, renderW, renderH };
}

// Smooth Catmull-Rom spline interpolation along exact road waypoints
function sampleRoadSpline(
  t: number,
  points: Waypoint[]
): { x: number; y: number; dx: number; dy: number } {
  const n = points.length - 1;
  const clamped = Math.max(0, Math.min(0.9999, t));
  const scaled = clamped * n;
  const idx = Math.floor(scaled);
  const frac = scaled - idx;

  const p0 = points[Math.max(0, idx - 1)];
  const p1 = points[idx];
  const p2 = points[Math.min(n, idx + 1)];
  const p3 = points[Math.min(n, idx + 2)];

  const tt = frac * frac;
  const ttt = tt * frac;

  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * frac +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt);

  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * frac +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return { x, y, dx, dy };
}

// EXACT verified asphalt road (sarak) waypoints verified against hero_green_valley_entrance image pixels:
// Left Lane: Downhill traffic heading towards foreground on the left side of the road
const LEFT_ROAD_LANE: Waypoint[] = [
  { x: 0.528, y: 0.42 },
  { x: 0.522, y: 0.48 },
  { x: 0.515, y: 0.55 },
  { x: 0.505, y: 0.62 },
  { x: 0.485, y: 0.70 },
  { x: 0.410, y: 0.78 },
  { x: 0.395, y: 0.86 },
  { x: 0.375, y: 0.94 },
  { x: 0.360, y: 0.99 },
];

// Right Lane: Uphill traffic heading towards the grand gate on the right side of the road
const RIGHT_ROAD_LANE: Waypoint[] = [
  { x: 0.540, y: 0.42 },
  { x: 0.538, y: 0.48 },
  { x: 0.555, y: 0.55 },
  { x: 0.575, y: 0.62 },
  { x: 0.600, y: 0.70 },
  { x: 0.590, y: 0.78 },
  { x: 0.605, y: 0.86 },
  { x: 0.605, y: 0.94 },
  { x: 0.610, y: 0.99 },
];

// Pedestrian Lane 1: People (insaan) walking directly ON the main road asphalt (sarak ke upar)
const WALK_ROAD_LANE_1: Waypoint[] = [
  { x: 0.534, y: 0.44 },
  { x: 0.530, y: 0.50 },
  { x: 0.535, y: 0.58 },
  { x: 0.540, y: 0.66 },
  { x: 0.505, y: 0.74 },
  { x: 0.495, y: 0.82 },
  { x: 0.495, y: 0.90 },
  { x: 0.490, y: 0.98 },
];

// Pedestrian Lane 2: People walking along the right lane of the road (sarak ke upar)
const WALK_ROAD_LANE_2: Waypoint[] = [
  { x: 0.535, y: 0.46 },
  { x: 0.532, y: 0.54 },
  { x: 0.560, y: 0.62 },
  { x: 0.565, y: 0.72 },
  { x: 0.550, y: 0.80 },
  { x: 0.555, y: 0.88 },
  { x: 0.555, y: 0.96 },
];

const ROAD_CONVERSATIONS_1 = [
  {
    speaker: 'Ali',
    text: 'Tariq bhai! Dekhein Green Valley ki main sarak kitni khuli, saaf aur carpeted hai.',
  },
  {
    speaker: 'Tariq',
    text: 'Walaikum Assalam! Haan Ali bhai, sarak par walk aur gariyon ka discipline behtareen hai.',
  },
  {
    speaker: 'Ali',
    text: 'Aage chal kar 1 Kanal aur 10 Marla wale naye designer villas dekhte hain.',
  },
  {
    speaker: 'Tariq',
    text: 'Chalo bhai! Sarak bilkul smooth hai aur chalne ka apna hi maza hai.',
  },
];

const ROAD_CONVERSATIONS_2 = [
  {
    speaker: 'Usman',
    text: 'Hamza bhai, Gate 1 se seedha yeh main sarak Central Botanical Park aur Gym jati hai.',
  },
  {
    speaker: 'Hamza',
    text: 'Bohot umdah! 40 se 80 foot wide sarak hai aur lighting har jagah lagi hui hai.',
  },
  {
    speaker: 'Usman',
    text: 'Haan bhai, subah aur shaam dono waqt sarak par walk karna bohot pur-sukoon hai.',
  },
  {
    speaker: 'Hamza',
    text: 'Sahi baat hai! Poori society ki sarak bilkul clean aur high quality hai.',
  },
];

export const HeroLiveSimulation: React.FC<HeroLiveSimulationProps> = ({
  effectiveNight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chatIndex, setChatIndex] = useState(0);
  const [bubblePositions, setBubblePositions] = useState<{
    pair1: { x: number; y: number; visible: boolean };
    pair2: { x: number; y: number; visible: boolean };
  }>({
    pair1: { x: 50, y: 80, visible: true },
    pair2: { x: 55, y: 75, visible: true },
  });

  // Cycle friendly resident conversations about the road and society
  useEffect(() => {
    const timer = setInterval(() => {
      setChatIndex((prev) => (prev + 1) % ROAD_CONVERSATIONS_1.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Cars driving directly ON the road lanes (sarak ke upar)
    const roadCars = [
      // Left lane cars driving towards foreground on the sarak
      { t: 0.12, speed: 0.0015, lane: 'left', dir: 1, bodyColor: '#F8FAFC', accent: '#38BDF8' },
      { t: 0.58, speed: 0.0016, lane: 'left', dir: 1, bodyColor: '#CBD5E1', accent: '#22C55E' },
      // Right lane cars driving up towards the grand gate on the sarak
      { t: 0.92, speed: 0.0014, lane: 'right', dir: -1, bodyColor: '#0F172A', accent: '#EF4444' },
      { t: 0.44, speed: 0.0015, lane: 'right', dir: -1, bodyColor: '#334155', accent: '#F59E0B' },
    ];

    // People (insaan) walking directly ON the road (sarak ke upar)
    const roadPedestrians = [
      // Pair 1: Ali & Tariq walking together ON the road & talking
      {
        id: 'pair1',
        t: 0.68,
        speed: 0.00045,
        dir: 1,
        lane: 'walk1',
        shirt1: '#16A34A', // Green
        shirt2: '#F8FAFC', // White
        isTalkingPair: true,
      },
      // Pair 2: Usman & Hamza walking together ON the road & talking
      {
        id: 'pair2',
        t: 0.50,
        speed: 0.00042,
        dir: -1,
        lane: 'walk2',
        shirt1: '#0284C7', // Sky Blue
        shirt2: '#D97706', // Amber
        isTalkingPair: true,
      },
      // Solo resident walking on the road
      {
        id: 'solo1',
        t: 0.35,
        speed: 0.00048,
        dir: 1,
        lane: 'walk1',
        shirt1: '#9333EA', // Purple
        shirt2: '#9333EA',
        isTalkingPair: false,
      },
    ];

    // Draw realistic perspective 3D vehicle firmly resting on the road asphalt
    const drawCarOnRoad = (
      x: number,
      y: number,
      dx: number,
      scale: number,
      bodyColor: string,
      drivingTowardsCamera: boolean,
      elapsed: number,
      alpha: number
    ) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.translate(x, y);

      // Curve tilt
      const curveShift = Math.max(-0.25, Math.min(0.25, dx * 2.5));
      ctx.scale(scale, scale);

      // 1. Headlight beam illuminating the road surface ahead
      const beamGrad = ctx.createRadialGradient(
        curveShift * 20,
        drivingTowardsCamera ? 24 : -20,
        3,
        curveShift * 40,
        drivingTowardsCamera ? 65 : -55,
        60
      );
      beamGrad.addColorStop(
        0,
        effectiveNight ? 'rgba(254, 240, 138, 0.65)' : 'rgba(254, 240, 138, 0.28)'
      );
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.ellipse(
        curveShift * 30,
        drivingTowardsCamera ? 38 : -30,
        32,
        22,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 2. Dark Contact Shadow on the asphalt under the tires
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 7, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Four Rubber Tires rolling on the sarak
      const wheelBounce = Math.sin(elapsed * 25) * 0.5;
      ctx.fillStyle = '#090D16';
      // Left tires
      ctx.beginPath();
      ctx.roundRect(-21, -2 + wheelBounce, 7, 10, 2);
      // Right tires
      ctx.roundRect(14, -2 - wheelBounce, 7, 10, 2);
      ctx.fill();

      // Metallic alloy rim reflections
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.arc(-17.5, 3, 2, 0, Math.PI * 2);
      ctx.arc(17.5, 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // 4. Main Car Body Chassis
      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-22, -13 + wheelBounce * 0.4, 44, 15, 4);
      ctx.fill();
      ctx.stroke();

      // 5. Upper Cabin / Windshield & Roof
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(-15 + curveShift * 3, -24 + wheelBounce * 0.4, 30, 12, 3);
      ctx.fill();

      // Roof panel
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-13 + curveShift * 3, -25 + wheelBounce * 0.4, 26, 4, 1.5);
      ctx.fill();

      // Glass highlight
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.roundRect(-12 + curveShift * 2, -21 + wheelBounce * 0.4, 24, 7, 1.5);
      ctx.fill();

      if (drivingTowardsCamera) {
        // Front Grille & Bright LED Headlights
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-10, -8, 20, 6, 1.5);
        ctx.fill();

        // Glowing Yellow/White Headlights
        ctx.fillStyle = '#FEF08A';
        ctx.shadowColor = '#FDE047';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(-19, -9, 6.5, 4, 1.5);
        ctx.roundRect(12.5, -9, 6.5, 4, 1.5);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Front License Plate
        ctx.fillStyle = '#16A34A';
        ctx.fillRect(-5, -3.5, 10, 2.5);
      } else {
        // Rear Bumper & Red LED Taillights
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(-19, -9, 7, 4, 1.5);
        ctx.roundRect(12, -9, 7, 4, 1.5);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Rear License Plate
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(-5, -4.5, 10, 2.5);
      }

      ctx.restore();
    };

    // Draw realistic animated person (insaan) walking directly on the road
    const drawPersonOnRoad = (
      x: number,
      y: number,
      scale: number,
      elapsed: number,
      shirtColor: string,
      facingRight: boolean,
      isTalking: boolean
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const legStride = Math.sin(elapsed * 7.2) * 6;
      const armSwing = Math.cos(elapsed * 7.2) * 5;
      const talkWave = isTalking ? Math.sin(elapsed * 9) * 5.5 : 0;

      // Contact shadow firmly on the road asphalt
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 1.5, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Walking legs (trousers & shoes touching the sarak)
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';

      // Left leg
      ctx.beginPath();
      ctx.moveTo(-2.5, -14);
      ctx.lineTo(-2.5 - legStride, 0);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(2.5, -14);
      ctx.lineTo(2.5 + legStride, 0);
      ctx.stroke();

      // Shoes
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(-2.5 - legStride, 0.5, 2, 0, Math.PI * 2);
      ctx.arc(2.5 + legStride, 0.5, 2, 0, Math.PI * 2);
      ctx.fill();

      // Torso / Kurta / Shirt
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.roundRect(-5.5, -28, 11, 15, 3.5);
      ctx.fill();

      // Arms swinging while walking & conversing
      ctx.strokeStyle = shirtColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-4.5, -25);
      ctx.lineTo(-7 - armSwing * 0.6, -16);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(4.5, -25);
      ctx.lineTo(
        7 + (facingRight ? 1.5 : -1.5),
        -18 - (isTalking ? talkWave : -armSwing * 0.6)
      );
      ctx.stroke();

      // Head & Face
      ctx.fillStyle = '#FDBA74';
      ctx.beginPath();
      ctx.arc(0, -33, 4.8, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(0, -34.5, 4.8, Math.PI, Math.PI * 2);
      ctx.fill();

      // Animated talking speech ripple indicator directly above head on road
      if (isTalking) {
        const pulse = Math.sin(elapsed * 9);
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(-3.5, -42 + pulse * 0.8, 1.5, 0, Math.PI * 2);
        ctx.arc(0, -44 - pulse * 0.6, 1.8, 0, Math.PI * 2);
        ctx.arc(3.5, -42 + pulse * 0.8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const startTime = performance.now();
    let lastBubbleUpdate = 0;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const elapsed = (now - startTime) / 1000;

      ctx.clearRect(0, 0, width, height);

      // Compute exact display rect so road projection stays 100% locked across all screens
      const { offsetX, offsetY, renderW, renderH } = getImageDisplayRect(width, height);

      const getLaneWaypoints = (lane: string) => {
        if (lane === 'left') return LEFT_ROAD_LANE;
        if (lane === 'right') return RIGHT_ROAD_LANE;
        if (lane === 'walk2') return WALK_ROAD_LANE_2;
        return WALK_ROAD_LANE_1;
      };

      const drawQueue: { y: number; draw: () => void }[] = [];

      // 1. Update & Queue Cars driving strictly ON the road
      roadCars.forEach((car) => {
        car.t += car.speed * car.dir;
        // Seamless loop within the road boundary
        if (car.t > 0.98) car.t = 0.04;
        if (car.t < 0.04) car.t = 0.98;

        const pts = getLaneWaypoints(car.lane);
        const sample = sampleRoadSpline(car.t, pts);

        // Map normalized image road coordinates to actual screen coordinates
        const px = offsetX + sample.x * renderW;
        const py = offsetY + sample.y * renderH;

        // Smooth perspective scale based on road vertical depth
        const depth = Math.max(0.05, Math.min(1.0, (sample.y - 0.38) / 0.60));
        const carScale = 0.22 + depth * 0.82;

        // Fade in/out near horizon and foreground edges
        const alpha =
          sample.y < 0.45
            ? (sample.y - 0.40) / 0.05
            : sample.y > 0.94
            ? (0.99 - sample.y) / 0.05
            : 1.0;

        drawQueue.push({
          y: py,
          draw: () =>
            drawCarOnRoad(
              px,
              py,
              sample.dx,
              carScale,
              car.bodyColor,
              car.dir > 0,
              elapsed,
              alpha
            ),
        });
      });

      // 2. Update & Queue People walking & conversing strictly ON the road
      let p1Bubble = { x: 50, y: 75, visible: true };
      let p2Bubble = { x: 55, y: 70, visible: true };

      roadPedestrians.forEach((ped, idx) => {
        ped.t += ped.speed * ped.dir;
        // People naturally walk back and forth along the road without leaving the sarak
        if (ped.t > 0.94) ped.dir = -1;
        if (ped.t < 0.12) ped.dir = 1;

        const pts = getLaneWaypoints(ped.lane);
        const sample = sampleRoadSpline(ped.t, pts);

        const px = offsetX + sample.x * renderW;
        const py = offsetY + sample.y * renderH;

        const depth = Math.max(0.06, Math.min(1.0, (sample.y - 0.38) / 0.60));
        const personScale = 0.38 + depth * 0.80;

        if (ped.id === 'pair1') {
          p1Bubble = {
            x: Math.max(5, Math.min(95, (px / width) * 100)),
            y: Math.max(10, Math.min(92, ((py - 48 * personScale) / height) * 100)),
            visible: py > 0 && py < height + 50,
          };
        } else if (ped.id === 'pair2') {
          p2Bubble = {
            x: Math.max(5, Math.min(95, (px / width) * 100)),
            y: Math.max(10, Math.min(92, ((py - 48 * personScale) / height) * 100)),
            visible: py > 0 && py < height + 50,
          };
        }

        drawQueue.push({
          y: py,
          draw: () => {
            // Main walking person on the road
            drawPersonOnRoad(
              px,
              py,
              personScale,
              elapsed + idx * 2,
              ped.shirt1,
              true,
              ped.isTalkingPair
            );

            // Walking companion right beside them on the road & talking to each other
            if (ped.isTalkingPair) {
              drawPersonOnRoad(
                px + 12 * personScale,
                py + 1.5 * personScale,
                personScale * 0.97,
                elapsed + idx * 2 + 1.5,
                ped.shirt2,
                false,
                true
              );
            }
          },
        });
      });

      // Update speech bubble positions smoothly at ~12fps
      if (now - lastBubbleUpdate > 80) {
        lastBubbleUpdate = now;
        setBubblePositions({ pair1: p1Bubble, pair2: p2Bubble });
      }

      // Painter's algorithm: sort by Y coordinate so closer items naturally overlap distant items
      drawQueue
        .sort((a, b) => a.y - b.y)
        .forEach((item) => item.draw());
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [effectiveNight]);

  const chat1 = ROAD_CONVERSATIONS_1[chatIndex % ROAD_CONVERSATIONS_1.length];
  const chat2 = ROAD_CONVERSATIONS_2[chatIndex % ROAD_CONVERSATIONS_2.length];

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden select-none">
      {/* Exact Hero Architectural Road Backdrop */}
      <ResilientImage
        src={GENERATED_IMAGES.heroEntrance}
        alt="Green Valley Residencia Main Boulevard Road and Gate"
        className={`w-full h-full object-cover transition-all duration-700 ${
          effectiveNight ? 'brightness-75 contrast-110' : 'brightness-95 contrast-105'
        }`}
      />

      {/* Left text-protection gradient: keeps the hero copy 100% legible on the left, but leaves the entire central road completely open and bright */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#071827]/95 via-[#071827]/60 to-transparent lg:w-[46%] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1724]/85 via-transparent to-black/20 pointer-events-none" />

      {/* 60FPS Canvas Rendering Cars & People Strictly ON the Road (Sarak ke upar) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
      />

      {/* Floating Status Badge: Indicating Live Road Traffic & Pedestrian Walkway */}
      <div className="absolute top-4 right-4 z-[4] hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#071827]/85 backdrop-blur-md border border-[#22C55E]/40 rounded-full shadow-lg text-[11px] font-mono-tabular text-slate-200">
        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
        <span className="text-[#22C55E] font-semibold">Live Sarak Simulation:</span>
        <span>Gadiyan & Insaan Road Par Active</span>
      </div>

      {/* Dynamic Speech Bubble Following Walking Pair 1 ON the Road */}
      {bubblePositions.pair1.visible && (
        <div
          className="block absolute z-[3] pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-100"
          style={{
            left: `${bubblePositions.pair1.x}%`,
            top: `${bubblePositions.pair1.y}%`,
          }}
        >
          <div className="relative bg-[#071827]/95 backdrop-blur-md border border-[#22C55E]/90 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xl max-w-[200px] sm:max-w-[250px]">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono-tabular font-semibold text-[#22C55E]">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>{chat1.speaker} (Sarak Par Walk)</span>
            </div>
            <p className="text-[10px] sm:text-xs text-white leading-snug mt-1 font-medium">
              &ldquo;{chat1.text}&rdquo;
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-[#071827] border-t-6 border-x-transparent border-x-6 border-b-0" />
          </div>
        </div>
      )}

      {/* Dynamic Speech Bubble Following Walking Pair 2 ON the Road */}
      {bubblePositions.pair2.visible && (
        <div
          className="block absolute z-[3] pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-100"
          style={{
            left: `${bubblePositions.pair2.x}%`,
            top: `${bubblePositions.pair2.y}%`,
          }}
        >
          <div className="relative bg-[#071827]/95 backdrop-blur-md border border-[#38BDF8]/90 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xl max-w-[190px] sm:max-w-[240px]">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono-tabular font-semibold text-[#38BDF8]">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
              <span>{chat2.speaker} (Main Road)</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-100 leading-snug mt-1 font-medium">
              &ldquo;{chat2.text}&rdquo;
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-[#071827] border-t-6 border-x-transparent border-x-6 border-b-0" />
          </div>
        </div>
      )}
    </div>
  );
};
