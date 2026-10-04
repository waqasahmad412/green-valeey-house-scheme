import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Tv,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Film,
  Flame,
  Car,
  Compass,
  Eye,
  Sliders,
} from 'lucide-react';
import { LightingMode } from '../types/society';

interface Room3DInteriorProps {
  onExitToColony: () => void;
  selectedHouseNumber?: string;
  selectedHouseTitle?: string;
  lightingMode: LightingMode;
  onLightingModeChange: (mode: LightingMode) => void;
  effectiveNight: boolean;
}

type MovieChannel = 'scifi' | 'colony' | 'racing' | 'fireplace';
type RoomCameraView = 'sofa' | 'tv-focus' | 'wide' | 'window';

export const Room3DInterior: React.FC<Room3DInteriorProps> = ({
  onExitToColony,
  selectedHouseNumber = 'GV-101',
  selectedHouseTitle = '10 Marla Executive Villa',
  lightingMode,
  onLightingModeChange,
  effectiveNight,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeChannel, setActiveChannel] = useState<MovieChannel>('scifi');
  const [cameraView, setCameraView] = useState<RoomCameraView>('sofa');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roomDimmer, setRoomDimmer] = useState<'cinema' | 'cozy' | 'day'>('cozy');

  // References for WebGL Scene & TV animation
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    tvLight?: THREE.PointLight;
    ambientLight?: THREE.AmbientLight;
    ceilingDownlights?: THREE.SpotLight[];
    windowLight?: THREE.DirectionalLight;
    lampLight?: THREE.PointLight;
    targetLookAt: THREE.Vector3;
    cameraGoal: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    isDragging: boolean;
    prevMouse: { x: number; y: number };
    spherical: { radius: number; phi: number; theta: number };
    animationFrameId?: number;
    audioContext?: AudioContext | null;
    audioGain?: GainNode | null;
  }>({
    targetLookAt: new THREE.Vector3(0, 3.2, -6.9),
    cameraGoal: new THREE.Vector3(0, 2.2, 2.8),
    currentLookAt: new THREE.Vector3(0, 3.2, -6.9),
    isDragging: false,
    prevMouse: { x: 0, y: 0 },
    spherical: { radius: 10, phi: 1.45, theta: 0 },
  });

  // State refs for animation loop access without re-binding
  const channelRef = useRef<MovieChannel>(activeChannel);
  const isPlayingRef = useRef(isPlaying);
  channelRef.current = activeChannel;
  isPlayingRef.current = isPlaying;

  // Apply Camera Views
  const applyCameraView = (view: RoomCameraView) => {
    setCameraView(view);
    const st = sceneRef.current;
    if (!st.camera) return;

    if (view === 'sofa') {
      // Sitting on sectional sofa facing TV
      st.cameraGoal.set(0, 2.1, 2.6);
      st.targetLookAt.set(0, 3.3, -7.0);
    } else if (view === 'tv-focus') {
      // Cinema zoomed right in front of the 85" LCD TV
      st.cameraGoal.set(0, 3.3, -2.6);
      st.targetLookAt.set(0, 3.3, -7.0);
    } else if (view === 'wide') {
      // High corner wide view of the whole luxury room
      st.cameraGoal.set(4.8, 4.4, 4.8);
      st.targetLookAt.set(-0.5, 2.4, -2.0);
    } else if (view === 'window') {
      // Near panoramic window looking across room toward TV
      st.cameraGoal.set(-4.5, 2.4, 0.5);
      st.targetLookAt.set(0.5, 3.0, -5.0);
    }
  };

  // Sound Synthesizer via Web Audio API (cinematic ambient movie sound)
  const toggleSound = () => {
    const st = sceneRef.current;
    if (isMuted) {
      // Unmute: Initialize Web Audio Context
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!st.audioContext) {
          const ctx = new AudioCtx();
          const gain = ctx.createGain();
          gain.gain.value = 0.08;
          gain.connect(ctx.destination);

          // Subtle sci-fi / movie drone generator
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(55, ctx.currentTime); // Low A hum
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(110, ctx.currentTime);

          // LFO filter for cinematic swell
          const biquad = ctx.createBiquadFilter();
          biquad.type = 'lowpass';
          biquad.frequency.setValueAtTime(400, ctx.currentTime);

          osc1.connect(biquad);
          osc2.connect(biquad);
          biquad.connect(gain);

          osc1.start();
          osc2.start();

          st.audioContext = ctx;
          st.audioGain = gain;
        } else if (st.audioContext.state === 'suspended') {
          st.audioContext.resume();
        }
        if (st.audioGain) {
          st.audioGain.gain.setTargetAtTime(0.08, st.audioContext!.currentTime, 0.1);
        }
        setIsMuted(false);
      } catch {
        setIsMuted(true);
      }
    } else {
      // Mute
      if (st.audioGain && st.audioContext) {
        st.audioGain.gain.setTargetAtTime(0.0, st.audioContext.currentTime, 0.05);
      }
      setIsMuted(true);
    }
  };

  // Three.js Room Setup & Live TV Canvas Rendering
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 550;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(effectiveNight ? '#050D18' : '#87CEEB');

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.2, 100);
    camera.position.set(0, 2.2, 2.8);
    camera.lookAt(0, 3.2, -7.0);

    const st = sceneRef.current;
    st.scene = scene;
    st.camera = camera;
    st.renderer = renderer;
    st.cameraGoal.set(0, 2.2, 2.8);
    st.targetLookAt.set(0, 3.2, -7.0);
    st.currentLookAt.set(0, 3.2, -7.0);

    // =========================================================================
    // 1. DYNAMIC LCD TV SCREEN CANVAS & 60FPS MOVIE RENDERER
    // =========================================================================
    const tvCanvas = document.createElement('canvas');
    tvCanvas.width = 1280;
    tvCanvas.height = 720;
    const tvCtx = tvCanvas.getContext('2d')!;

    const tvTexture = new THREE.CanvasTexture(tvCanvas);
    tvTexture.minFilter = THREE.LinearFilter;
    tvTexture.magFilter = THREE.LinearFilter;
    tvTexture.generateMipmaps = false;

    // TV Screen Mesh (85-inch bezel-less 16:9 ratio)
    const tvScreenWidth = 6.4;
    const tvScreenHeight = 3.6;
    const tvScreenGeo = new THREE.PlaneGeometry(tvScreenWidth, tvScreenHeight);
    const tvScreenMat = new THREE.MeshBasicMaterial({
      map: tvTexture,
    });
    const tvScreen = new THREE.Mesh(tvScreenGeo, tvScreenMat);
    tvScreen.position.set(0, 3.3, -6.9);
    scene.add(tvScreen);

    // TV Chassis & Slim Obsidian Bezel Frame
    const tvFrameGeo = new THREE.BoxGeometry(tvScreenWidth + 0.16, tvScreenHeight + 0.16, 0.12);
    const tvFrameMat = new THREE.MeshStandardMaterial({
      color: '#0A0F1D',
      metalness: 0.92,
      roughness: 0.18,
    });
    const tvFrame = new THREE.Mesh(tvFrameGeo, tvFrameMat);
    tvFrame.position.set(0, 3.3, -6.98);
    tvFrame.castShadow = true;
    scene.add(tvFrame);

    // Dynamic TV PointLight (casts glowing movie color onto room/sofa)
    const tvLight = new THREE.PointLight('#38BDF8', 5.5, 14);
    tvLight.position.set(0, 3.3, -6.2);
    scene.add(tvLight);
    st.tvLight = tvLight;

    // High-End Floating Soundbar under TV
    const soundbarGeo = new THREE.BoxGeometry(4.2, 0.18, 0.22);
    const soundbarMat = new THREE.MeshStandardMaterial({
      color: '#0F172A',
      roughness: 0.35,
      metalness: 0.85,
    });
    const soundbar = new THREE.Mesh(soundbarGeo, soundbarMat);
    soundbar.position.set(0, 1.32, -6.85);
    soundbar.castShadow = true;
    scene.add(soundbar);

    // Floating Walnut & Dark Marble Media Credenza
    const consoleGeo = new THREE.BoxGeometry(8.2, 0.55, 1.1);
    const consoleMat = new THREE.MeshStandardMaterial({
      color: '#27170E', // Rich walnut wood
      roughness: 0.65,
      metalness: 0.1,
    });
    const mediaConsole = new THREE.Mesh(consoleGeo, consoleMat);
    mediaConsole.position.set(0, 0.55, -6.4);
    mediaConsole.castShadow = true;
    mediaConsole.receiveShadow = true;
    scene.add(mediaConsole);

    // Console Ambient LED Strip Underglow
    const consoleLedGeo = new THREE.PlaneGeometry(8.0, 0.08);
    const consoleLedMat = new THREE.MeshBasicMaterial({ color: '#22C55E' });
    const consoleLed = new THREE.Mesh(consoleLedGeo, consoleLedMat);
    consoleLed.rotation.x = Math.PI / 2;
    consoleLed.position.set(0, 0.28, -6.0);
    scene.add(consoleLed);

    // =========================================================================
    // 2. LUXURY ARCHITECTURAL ROOM ENVELOPE (WALLS, FLOOR, CEILING)
    // =========================================================================
    const roomWidth = 14;
    const roomLength = 16;
    const roomHeight = 6.2;

    // Floor: Large Format Polished Charcoal Marble Tile
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#1E293B',
      roughness: 0.28,
      metalness: 0.35,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Designer Luxury Area Rug under sofa
    const rugGeo = new THREE.PlaneGeometry(7.5, 6.2);
    const rugMat = new THREE.MeshStandardMaterial({
      color: '#0F172A',
      roughness: 0.95,
      metalness: 0.02,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.02, 0.5);
    rug.receiveShadow = true;
    scene.add(rug);

    // Ceiling with Recessed Light Cove
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: '#09131F',
      roughness: 0.85,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    scene.add(ceiling);

    // Back Feature Accent Wall behind TV (Wood Slats + Marble Center Panel)
    // 2A. Back Main Wall Base
    const backWallGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: '#091524',
      roughness: 0.8,
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, roomHeight / 2, -7.05);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // 2B. Central Italian Calacatta White Marble Panel behind TV
    const marblePanelGeo = new THREE.BoxGeometry(8.8, 5.0, 0.1);
    const marblePanelMat = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      roughness: 0.2,
      metalness: 0.1,
    });
    const marblePanel = new THREE.Mesh(marblePanelGeo, marblePanelMat);
    marblePanel.position.set(0, 3.3, -7.0);
    marblePanel.receiveShadow = true;
    scene.add(marblePanel);

    // Back Wall Ambient LED Halo Lighting behind marble slab
    const wallHaloLight = new THREE.PointLight('#F59E0B', 2.8, 9);
    wallHaloLight.position.set(0, 3.3, -6.85);
    scene.add(wallHaloLight);

    // 2C. Vertical Fluted Acoustic Wood Slats on Side Panels
    const slatMat = new THREE.MeshStandardMaterial({
      color: '#3B2314', // Natural walnut slat
      roughness: 0.6,
    });
    for (let x = -6.5; x <= -4.6; x += 0.22) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.6, 0.08), slatMat);
      slat.position.set(x, 2.9, -6.98);
      scene.add(slat);
    }
    for (let x = 4.6; x <= 6.5; x += 0.22) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.6, 0.08), slatMat);
      slat.position.set(x, 2.9, -6.98);
      scene.add(slat);
    }

    // Right Side Gallery Wall
    const rightWallGeo = new THREE.PlaneGeometry(roomLength, roomHeight);
    const rightWallMat = new THREE.MeshStandardMaterial({
      color: '#071827',
      roughness: 0.75,
    });
    const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Luxury Architectural Art Frames on Right Wall
    const artFrameGeo = new THREE.BoxGeometry(0.08, 2.2, 3.2);
    const artFrameMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.4 });
    const artFrame = new THREE.Mesh(artFrameGeo, artFrameMat);
    artFrame.position.set(roomWidth / 2 - 0.05, 3.2, 0.5);
    scene.add(artFrame);

    // Left Wall: Grand Floor-To-Ceiling Panoramic Glass Sliding Doors
    // Looking out onto Green Valley Residencia gardens, lawns & roads
    const glassDoorGeo = new THREE.BoxGeometry(0.06, 5.2, 11);
    const glassDoorMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      transmission: 0.85,
      thickness: 0.5,
    });
    const glassDoor = new THREE.Mesh(glassDoorGeo, glassDoorMat);
    glassDoor.position.set(-roomWidth / 2 + 0.05, 2.7, 0);
    scene.add(glassDoor);

    // Exterior Society Backdrop beyond panoramic window (Green Valley lawns & trees)
    const exteriorGrassGeo = new THREE.PlaneGeometry(16, 24);
    const exteriorGrassMat = new THREE.MeshStandardMaterial({
      color: effectiveNight ? '#052E16' : '#15803D',
      roughness: 0.9,
    });
    const exteriorGrass = new THREE.Mesh(exteriorGrassGeo, exteriorGrassMat);
    exteriorGrass.rotation.x = -Math.PI / 2;
    exteriorGrass.position.set(-14, -0.05, 0);
    scene.add(exteriorGrass);

    // Exterior Streetlight & Palm Trees outside window
    const treeTrunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 6, 8);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: '#451A03' });
    const treeFoliageGeo = new THREE.ConeGeometry(2.2, 5.5, 8);
    const treeFoliageMat = new THREE.MeshStandardMaterial({
      color: effectiveNight ? '#064E3B' : '#22C55E',
      roughness: 0.85,
    });
    for (let tz = -6; tz <= 6; tz += 5) {
      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.set(-11, 3.0, tz);
      scene.add(trunk);
      const foliage = new THREE.Mesh(treeFoliageGeo, treeFoliageMat);
      foliage.position.set(-11, 6.2, tz);
      scene.add(foliage);
    }

    // =========================================================================
    // 3. LUXURY FURNITURE: SECTIONAL SOFA & DESIGNER COFFEE TABLE
    // =========================================================================
    const sofaMat = new THREE.MeshStandardMaterial({
      color: '#1E293B', // Charcoal premium fabric
      roughness: 0.85,
      metalness: 0.05,
    });
    const sofaCushionMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.9,
    });
    const emeraldPillowMat = new THREE.MeshStandardMaterial({
      color: '#22C55E',
      roughness: 0.8,
    });

    // Main Sofa Base
    const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.5, 2.2), sofaMat);
    sofaMain.position.set(0, 0.45, 2.8);
    sofaMain.castShadow = true;
    sofaMain.receiveShadow = true;
    scene.add(sofaMain);

    // Sofa Backrest
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.2, 0.55), sofaMat);
    sofaBack.position.set(0, 1.2, 3.65);
    sofaBack.castShadow = true;
    scene.add(sofaBack);

    // L-Shaped Sectional Chaise on Right
    const sofaChaise = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 3.2), sofaMat);
    sofaChaise.position.set(2.15, 0.45, 0.35);
    sofaChaise.castShadow = true;
    sofaChaise.receiveShadow = true;
    scene.add(sofaChaise);

    // Sofa Cushions
    for (let cx = -2.1; cx <= 2.1; cx += 1.4) {
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 1.7), sofaCushionMat);
      cushion.position.set(cx, 0.75, 2.7);
      cushion.castShadow = true;
      scene.add(cushion);
    }

    // Emerald Green Accent Pillows
    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.25), emeraldPillowMat);
    pillow1.position.set(-2.4, 1.0, 3.2);
    pillow1.rotation.y = 0.2;
    scene.add(pillow1);

    const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.25), emeraldPillowMat);
    pillow2.position.set(2.4, 1.0, 3.2);
    pillow2.rotation.y = -0.25;
    scene.add(pillow2);

    // Sculptural Coffee Table (Dual Tier Marble & Glass)
    const tableBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.38, 32),
      new THREE.MeshStandardMaterial({ color: '#0F172A', metalness: 0.6, roughness: 0.3 })
    );
    tableBase.position.set(0, 0.38, 0.1);
    tableBase.castShadow = true;
    tableBase.receiveShadow = true;
    scene.add(tableBase);

    // Table Top Accessories: Ceramic Succulent & Remote Control
    const plantPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.15, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: '#E2E8F0' })
    );
    plantPot.position.set(-0.5, 0.72, 0.0);
    scene.add(plantPot);

    const plantLeaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 12),
      new THREE.MeshStandardMaterial({ color: '#22C55E', roughness: 0.7 })
    );
    plantLeaves.position.set(-0.5, 0.95, 0.0);
    scene.add(plantLeaves);

    const remote = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 0.45),
      new THREE.MeshStandardMaterial({ color: '#090D16', metalness: 0.8, roughness: 0.2 })
    );
    remote.position.set(0.4, 0.6, 0.15);
    remote.rotation.y = 0.35;
    scene.add(remote);

    // Modern Arched Brass Floor Lamp in Corner
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.5, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: '#CA8A04', metalness: 0.85, roughness: 0.2 })
    );
    lampBase.position.set(-4.8, 0.08, -4.5);
    scene.add(lampBase);

    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 0.75, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: '#FEF08A',
        emissive: '#F59E0B',
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
      })
    );
    lampShade.position.set(-4.2, 4.2, -4.0);
    scene.add(lampShade);

    const lampLight = new THREE.PointLight('#FBBF24', 3.5, 9);
    lampLight.position.set(-4.2, 4.0, -4.0);
    scene.add(lampLight);
    st.lampLight = lampLight;

    // =========================================================================
    // 4. LIGHTING & ATMOSPHERE (CINEMA, COZY, DAY)
    // =========================================================================
    const ambientLight = new THREE.AmbientLight('#E2E8F0', 0.5);
    scene.add(ambientLight);
    st.ambientLight = ambientLight;

    // Window Light streaming into room
    const windowLight = new THREE.DirectionalLight('#F0FDFA', 1.8);
    windowLight.position.set(-15, 8, 0);
    windowLight.castShadow = true;
    scene.add(windowLight);
    st.windowLight = windowLight;

    // Recessed Ceiling Downlights
    const downlight1 = new THREE.SpotLight('#FFFBEB', 2.0, 10, Math.PI / 6, 0.4);
    downlight1.position.set(0, roomHeight - 0.2, 0);
    downlight1.target.position.set(0, 0, 0);
    scene.add(downlight1);
    scene.add(downlight1.target);

    // =========================================================================
    // 5. INTERACTIVE MOUSE & TOUCH ORBIT CONTROLS
    // =========================================================================
    const onMouseDown = (e: MouseEvent) => {
      st.isDragging = true;
      st.prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!st.isDragging) return;
      const dx = e.clientX - st.prevMouse.x;
      const dy = e.clientY - st.prevMouse.y;
      st.prevMouse = { x: e.clientX, y: e.clientY };

      // Rotate camera lookAt target around current camera position
      st.targetLookAt.x -= dx * 0.015;
      st.targetLookAt.y += dy * 0.015;
      st.targetLookAt.y = Math.max(0.5, Math.min(5.5, st.targetLookAt.y));
    };

    const onMouseUp = () => {
      st.isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        st.isDragging = true;
        st.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!st.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - st.prevMouse.x;
      const dy = e.touches[0].clientY - st.prevMouse.y;
      st.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      st.targetLookAt.x -= dx * 0.018;
      st.targetLookAt.y += dy * 0.018;
      st.targetLookAt.y = Math.max(0.5, Math.min(5.5, st.targetLookAt.y));
    };
    const onTouchEnd = () => {
      st.isDragging = false;
    };
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // =========================================================================
    // 6. 60FPS TV FILM ANIMATION & PROCEDURAL GRAPHICS ENGINE
    // =========================================================================
    let filmTime = 0;
    const stars: { x: number; y: number; z: number; size: number }[] = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 1280,
        y: (Math.random() - 0.5) * 720,
        z: Math.random() * 800 + 50,
        size: Math.random() * 2.5 + 0.8,
      });
    }

    const fireParticles: { x: number; y: number; vy: number; vx: number; alpha: number; size: number }[] = [];
    for (let i = 0; i < 90; i++) {
      fireParticles.push({
        x: 640 + (Math.random() - 0.5) * 400,
        y: 650 + Math.random() * 40,
        vy: -(Math.random() * 4.5 + 2.5),
        vx: (Math.random() - 0.5) * 2.2,
        alpha: Math.random() * 0.8 + 0.2,
        size: Math.random() * 24 + 10,
      });
    }

    const renderMovieFrame = (delta: number) => {
      if (isPlayingRef.current) {
        filmTime += delta;
      }

      const ch = channelRef.current;
      const w = tvCanvas.width;
      const h = tvCanvas.height;

      if (ch === 'scifi') {
        // CHANNEL 1: 🎬 STAR VOYAGER: BEYOND THE GALAXY (Cinematic Sci-Fi Film)
        const bgGrad = tvCtx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#040714');
        bgGrad.addColorStop(0.5, '#0C1B33');
        bgGrad.addColorStop(1, '#1A0B2E');
        tvCtx.fillStyle = bgGrad;
        tvCtx.fillRect(0, 0, w, h);

        // Nebula glow clouds
        tvCtx.save();
        const nebGrad = tvCtx.createRadialGradient(
          w * 0.65 + Math.sin(filmTime * 0.5) * 40,
          h * 0.4 + Math.cos(filmTime * 0.4) * 30,
          20,
          w * 0.65,
          h * 0.4,
          340
        );
        nebGrad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
        nebGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tvCtx.fillStyle = nebGrad;
        tvCtx.fillRect(0, 0, w, h);
        tvCtx.restore();

        // Warp Starfield moving towards camera
        tvCtx.fillStyle = '#FFFFFF';
        stars.forEach((s) => {
          if (isPlayingRef.current) {
            s.z -= delta * 340;
            if (s.z <= 10) s.z = 800;
          }
          const k = 400 / s.z;
          const px = s.x * k + w / 2;
          const py = s.y * k + h / 2;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const rad = s.size * k;
            tvCtx.beginPath();
            tvCtx.arc(px, py, Math.max(0.6, rad), 0, Math.PI * 2);
            tvCtx.fill();
          }
        });

        // Massive ringed alien planet in background
        const planetX = w * 0.78;
        const planetY = h * 0.38;
        const planetRad = 110;
        const pGrad = tvCtx.createRadialGradient(
          planetX - 35,
          planetY - 35,
          20,
          planetX,
          planetY,
          planetRad
        );
        pGrad.addColorStop(0, '#38BDF8');
        pGrad.addColorStop(0.7, '#1E3A8A');
        pGrad.addColorStop(1, '#020617');
        tvCtx.beginPath();
        tvCtx.arc(planetX, planetY, planetRad, 0, Math.PI * 2);
        tvCtx.fillStyle = pGrad;
        tvCtx.fill();

        // High-Tech Starship Gliding Across Screen
        const shipX = w * 0.35 + Math.sin(filmTime * 1.2) * 60;
        const shipY = h * 0.55 + Math.cos(filmTime * 1.4) * 35;

        // Glowing Blue/Cyan Plasma Thruster Trail
        const thrusterGrad = tvCtx.createLinearGradient(shipX - 160, shipY, shipX - 30, shipY);
        thrusterGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        thrusterGrad.addColorStop(1, 'rgba(56, 189, 248, 0.95)');
        tvCtx.fillStyle = thrusterGrad;
        tvCtx.beginPath();
        tvCtx.moveTo(shipX - 30, shipY - 10);
        tvCtx.lineTo(shipX - 160, shipY);
        tvCtx.lineTo(shipX - 30, shipY + 10);
        tvCtx.fill();

        // Ship Hull
        tvCtx.save();
        tvCtx.translate(shipX, shipY);
        tvCtx.rotate(Math.sin(filmTime * 0.8) * 0.08);

        tvCtx.fillStyle = '#E2E8F0';
        tvCtx.beginPath();
        tvCtx.moveTo(70, 0);
        tvCtx.lineTo(-40, -32);
        tvCtx.lineTo(-30, -8);
        tvCtx.lineTo(-55, 0);
        tvCtx.lineTo(-30, 8);
        tvCtx.lineTo(-40, 32);
        tvCtx.closePath();
        tvCtx.fill();

        // Cockpit canopy glow
        tvCtx.fillStyle = '#22C55E';
        tvCtx.beginPath();
        tvCtx.moveTo(35, -4);
        tvCtx.lineTo(55, 0);
        tvCtx.lineTo(35, 4);
        tvCtx.closePath();
        tvCtx.fill();
        tvCtx.restore();

        // Movie Title & HUD Overlays
        tvCtx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        tvCtx.font = 'bold 36px sans-serif';
        tvCtx.fillText('STAR VOYAGER: BEYOND THE GALAXY', 70, 90);

        tvCtx.fillStyle = '#22C55E';
        tvCtx.font = 'bold 18px monospace';
        tvCtx.fillText('4K ULTRA HD · DOLBY ATMOS · 60 FPS', 70, 125);

        // Subtitles / Dialogue
        tvCtx.fillStyle = '#FEF08A';
        tvCtx.font = '22px sans-serif';
        tvCtx.textAlign = 'center';
        tvCtx.fillText(
          'Commander: "Hyperspace coordinates locked. Entering Green Valley Sector."',
          w / 2,
          h - 60
        );
        tvCtx.textAlign = 'left';

        // Update TV PointLight color to match Sci-Fi Cyan/Blue
        if (st.tvLight) {
          st.tvLight.color.set('#38BDF8');
          st.tvLight.intensity = 5.0 + Math.sin(filmTime * 6) * 1.2;
        }
      } else if (ch === 'colony') {
        // CHANNEL 2: 🌿 GREEN VALLEY RESIDENCIA 4K AERIAL SHOWCASE
        const skyGrad = tvCtx.createLinearGradient(0, 0, 0, h * 0.6);
        skyGrad.addColorStop(0, '#38BDF8');
        skyGrad.addColorStop(1, '#BAE6FD');
        tvCtx.fillStyle = skyGrad;
        tvCtx.fillRect(0, 0, w, h * 0.6);

        // Lush green hills in distance
        tvCtx.fillStyle = '#15803D';
        tvCtx.beginPath();
        tvCtx.moveTo(0, h * 0.6);
        for (let x = 0; x <= w; x += 40) {
          const y = h * 0.45 + Math.sin((x + filmTime * 40) * 0.008) * 35;
          tvCtx.lineTo(x, y);
        }
        tvCtx.lineTo(w, h * 0.6);
        tvCtx.fill();

        // Society Ground & Lawns
        tvCtx.fillStyle = '#16A34A';
        tvCtx.fillRect(0, h * 0.6, w, h * 0.4);

        // Wide Asphalt Road with Moving Cars
        tvCtx.fillStyle = '#1E293B';
        tvCtx.beginPath();
        tvCtx.moveTo(w * 0.1, h);
        tvCtx.lineTo(w * 0.45, h * 0.6);
        tvCtx.lineTo(w * 0.55, h * 0.6);
        tvCtx.lineTo(w * 0.9, h);
        tvCtx.fill();

        // White Road Markings
        tvCtx.strokeStyle = '#FFFFFF';
        tvCtx.setLineDash([20, 20]);
        tvCtx.lineWidth = 4;
        tvCtx.beginPath();
        tvCtx.moveTo(w * 0.5, h);
        tvCtx.lineTo(w * 0.5, h * 0.6);
        tvCtx.stroke();
        tvCtx.setLineDash([]);

        // Moving Modern Car on society boulevard
        const carProgress = (filmTime * 0.35) % 1.0;
        const carY = h * 0.65 + carProgress * (h * 0.3);
        const carScale = 0.5 + carProgress * 0.8;
        const carX = w * 0.42 + (carProgress - 0.5) * 120;

        tvCtx.fillStyle = '#22C55E';
        tvCtx.fillRect(carX - 25 * carScale, carY, 50 * carScale, 28 * carScale);
        tvCtx.fillStyle = '#0F172A';
        tvCtx.fillRect(carX - 20 * carScale, carY + 4 * carScale, 40 * carScale, 14 * carScale);

        // Water Fountain in Central Park
        const fountainX = w * 0.22;
        const fountainY = h * 0.68;
        tvCtx.fillStyle = '#38BDF8';
        for (let i = 0; i < 8; i++) {
          const waterH = Math.sin(filmTime * 5 + i) * 30 + 40;
          tvCtx.fillRect(fountainX + (i - 4) * 6, fountainY - waterH, 4, waterH);
        }

        // Showcase Banner
        tvCtx.fillStyle = 'rgba(7, 24, 39, 0.85)';
        tvCtx.fillRect(60, 40, 520, 110);
        tvCtx.fillStyle = '#22C55E';
        tvCtx.font = 'bold 30px sans-serif';
        tvCtx.fillText('GREEN VALLEY RESIDENCIA', 80, 85);
        tvCtx.fillStyle = '#FFFFFF';
        tvCtx.font = '18px sans-serif';
        tvCtx.fillText('Premier 3D Colony Living · Bookings: 03298271687', 80, 120);

        if (st.tvLight) {
          st.tvLight.color.set('#22C55E');
          st.tvLight.intensity = 5.2 + Math.sin(filmTime * 3) * 0.8;
        }
      } else if (ch === 'racing') {
        // CHANNEL 3: 🏎️ APEX HORIZON: NEON STREET DRIFT (High Octane Action Movie)
        tvCtx.fillStyle = '#05070E';
        tvCtx.fillRect(0, 0, w, h);

        // Neon City Skyscraper Silhouettes
        tvCtx.fillStyle = '#0B1120';
        for (let b = 0; b < w; b += 70) {
          const bh = 140 + Math.sin(b * 123) * 80;
          tvCtx.fillRect(b, h * 0.5 - bh, 65, bh);
        }

        // Fast moving neon road grid
        const horizon = h * 0.5;
        tvCtx.strokeStyle = '#A855F7';
        tvCtx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const rad = (i / 12) * Math.PI;
          tvCtx.beginPath();
          tvCtx.moveTo(w / 2, horizon);
          tvCtx.lineTo(w / 2 + Math.cos(rad) * 900, horizon + Math.sin(rad) * 500);
          tvCtx.stroke();
        }

        // Speed Lines
        tvCtx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
        for (let l = 0; l < 16; l++) {
          const lx = (l * 90 + filmTime * 800) % w;
          tvCtx.beginPath();
          tvCtx.moveTo(lx, horizon + 30);
          tvCtx.lineTo(lx - 70, h);
          tvCtx.stroke();
        }

        // Racing Supercar (Front View with glowing LED headlights)
        const carShake = Math.sin(filmTime * 35) * 4;
        const carX = w / 2 + Math.sin(filmTime * 2.5) * 80;
        const carY = h * 0.68 + carShake;

        // Headlight Beams
        const beamGrad = tvCtx.createRadialGradient(carX, carY, 10, carX, carY, 320);
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        beamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tvCtx.fillStyle = beamGrad;
        tvCtx.fillRect(carX - 250, carY - 80, 500, 300);

        // Car Body
        tvCtx.fillStyle = '#22C55E';
        tvCtx.fillRect(carX - 110, carY, 220, 60);
        tvCtx.fillStyle = '#0F172A';
        tvCtx.fillRect(carX - 85, carY - 35, 170, 40);

        // Headlight LEDs
        tvCtx.fillStyle = '#FFFFFF';
        tvCtx.fillRect(carX - 100, carY + 12, 35, 12);
        tvCtx.fillRect(carX + 65, carY + 12, 35, 12);

        // Speedometer HUD
        tvCtx.fillStyle = 'rgba(236, 72, 153, 0.95)';
        tvCtx.font = 'bold 48px monospace';
        tvCtx.fillText('284 KM/H', w - 320, 100);
        tvCtx.font = 'bold 20px monospace';
        tvCtx.fillText('TURBO BOOST: 98% · NITRO ACTIVE', w - 420, 140);

        tvCtx.fillStyle = '#FFFFFF';
        tvCtx.font = 'bold 36px sans-serif';
        tvCtx.fillText('APEX HORIZON: NIGHT CHASE', 70, 90);

        if (st.tvLight) {
          st.tvLight.color.set('#EC4899');
          st.tvLight.intensity = 6.2 + Math.sin(filmTime * 15) * 2.2;
        }
      } else if (ch === 'fireplace') {
        // CHANNEL 4: 🔥 4K COZY AMBIENT FIREPLACE
        tvCtx.fillStyle = '#0A0503';
        tvCtx.fillRect(0, 0, w, h);

        // Dark brick fireplace hearth
        tvCtx.fillStyle = '#1C100B';
        tvCtx.fillRect(w * 0.15, h * 0.2, w * 0.7, h * 0.8);
        tvCtx.fillStyle = '#0F0805';
        tvCtx.fillRect(w * 0.25, h * 0.35, w * 0.5, h * 0.65);

        // Burning Firewood logs
        tvCtx.fillStyle = '#2E1205';
        tvCtx.fillRect(w * 0.32, h * 0.78, 460, 40);
        tvCtx.fillStyle = '#3F1A08';
        tvCtx.fillRect(w * 0.38, h * 0.74, 340, 35);

        // Glowing Embers
        const emberGrad = tvCtx.createRadialGradient(w / 2, h * 0.82, 10, w / 2, h * 0.82, 280);
        emberGrad.addColorStop(0, '#EF4444');
        emberGrad.addColorStop(0.4, '#F97316');
        emberGrad.addColorStop(0.8, '#FBBF24');
        emberGrad.addColorStop(1, 'rgba(0,0,0,0)');
        tvCtx.fillStyle = emberGrad;
        tvCtx.fillRect(w * 0.2, h * 0.45, w * 0.6, h * 0.55);

        // Animated Dancing Fire Flame Particles
        fireParticles.forEach((p) => {
          if (isPlayingRef.current) {
            p.y += p.vy;
            p.x += p.vx + Math.sin(filmTime * 8 + p.y * 0.05) * 1.5;
            p.alpha -= delta * 0.9;
            p.size -= delta * 8;

            if (p.y <= h * 0.35 || p.alpha <= 0 || p.size <= 2) {
              p.x = 640 + (Math.random() - 0.5) * 320;
              p.y = h * 0.82;
              p.vy = -(Math.random() * 5.0 + 3.0);
              p.alpha = Math.random() * 0.8 + 0.3;
              p.size = Math.random() * 28 + 12;
            }
          }

          tvCtx.save();
          tvCtx.globalAlpha = Math.max(0, p.alpha);
          const fGrad = tvCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          fGrad.addColorStop(0, '#FEF08A');
          fGrad.addColorStop(0.4, '#F59E0B');
          fGrad.addColorStop(0.8, '#DC2626');
          fGrad.addColorStop(1, 'rgba(0,0,0,0)');
          tvCtx.fillStyle = fGrad;
          tvCtx.beginPath();
          tvCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          tvCtx.fill();
          tvCtx.restore();
        });

        // Ambient Title Overlay
        tvCtx.fillStyle = '#FEF08A';
        tvCtx.font = '26px serif';
        tvCtx.fillText('4K Ultra HD Ambient Fireside Lounge', 90, 80);

        if (st.tvLight) {
          st.tvLight.color.set('#F59E0B');
          st.tvLight.intensity = 5.8 + Math.sin(filmTime * 12) * 1.8;
        }
      }

      // Film Letterbox Cinematic Bars (Top & Bottom)
      tvCtx.fillStyle = '#000000';
      tvCtx.fillRect(0, 0, w, 32);
      tvCtx.fillRect(0, h - 32, w, 32);

      // Play / Pause Indicator Watermark
      if (!isPlayingRef.current) {
        tvCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        tvCtx.fillRect(0, 0, w, h);
        tvCtx.fillStyle = '#FFFFFF';
        tvCtx.font = 'bold 38px sans-serif';
        tvCtx.textAlign = 'center';
        tvCtx.fillText('❚❚ MOVIE PAUSED', w / 2, h / 2);
        tvCtx.textAlign = 'left';
      }

      tvTexture.needsUpdate = true;
    };

    // =========================================================================
    // 7. ANIMATION RENDER LOOP & CAMERA LERP
    // =========================================================================
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Render video on TV canvas
      renderMovieFrame(delta);

      // Smooth camera interpolation towards goal
      camera.position.lerp(st.cameraGoal, 0.045);
      st.currentLookAt.lerp(st.targetLookAt, 0.045);
      camera.lookAt(st.currentLookAt);

      renderer.render(scene, camera);
      st.animationFrameId = requestAnimationFrame(animate);
    };

    st.animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (st.animationFrameId) cancelAnimationFrame(st.animationFrameId);

      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (st.audioContext) {
        try {
          st.audioContext.close();
        } catch {
          // ignore
        }
      }

      renderer.dispose();
      tvTexture.dispose();
      tvScreenGeo.dispose();
      tvScreenMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [effectiveNight]);

  // Synchronize Room Lighting Dimmer Modes
  useEffect(() => {
    const st = sceneRef.current;
    if (!st.ambientLight || !st.windowLight || !st.lampLight) return;

    if (roomDimmer === 'cinema') {
      // Cinema Dark: Turn off ambient & window light, TV and soft lamp illuminate the room
      st.ambientLight.intensity = 0.08;
      st.windowLight.intensity = 0.15;
      st.lampLight.intensity = 1.8;
      if (st.tvLight) st.tvLight.intensity = 7.5;
    } else if (roomDimmer === 'cozy') {
      // Cozy Evening: Warm ambient glow with vibrant TV
      st.ambientLight.intensity = 0.35;
      st.windowLight.intensity = 0.6;
      st.lampLight.intensity = 3.5;
      if (st.tvLight) st.tvLight.intensity = 5.5;
    } else {
      // Bright Day: Daylight streaming through glass window
      st.ambientLight.intensity = 0.75;
      st.windowLight.intensity = 2.4;
      st.lampLight.intensity = 1.0;
      if (st.tvLight) st.tvLight.intensity = 4.2;
    }
  }, [roomDimmer]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#071827] select-none ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[620px] lg:h-[720px] rounded-2xl border border-white/10 shadow-2xl'
      }`}
    >
      {/* Three.js 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Navigation Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onExitToColony}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#22C55E] hover:bg-[#4ADE80] text-[#071827] font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Walk Outside to 3D Colony</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-xs text-white">
            <span className="text-[#22C55E] font-semibold">Inside Villa:</span>
            <span>{selectedHouseNumber} · {selectedHouseTitle}</span>
          </div>
        </div>

        {/* Top-Right Room Camera & Lighting Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Day / Night / Cinema Mood Toggle */}
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setRoomDimmer('cinema')}
              title="Cinema Mood Lighting"
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                roomDimmer === 'cinema' ? 'bg-[#22C55E] text-[#071827] font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Cinema
            </button>
            <button
              type="button"
              onClick={() => setRoomDimmer('cozy')}
              title="Cozy Evening Lighting"
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                roomDimmer === 'cozy' ? 'bg-[#22C55E] text-[#071827] font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Cozy
            </button>
            <button
              type="button"
              onClick={() => setRoomDimmer('day')}
              title="Day Natural Light"
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                roomDimmer === 'day' ? 'bg-[#22C55E] text-[#071827] font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Daylight
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white rounded-xl"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating 85" Smart LCD TV Remote Control Panel (Bottom Bar) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Left: TV Channel / Movie Selector */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-white/15 rounded-xl p-1.5 overflow-x-auto max-w-full">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#22C55E]">
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">LCD TV Film:</span>
          </div>

          {[
            { id: 'scifi', label: '🎬 Sci-Fi Space Movie', icon: Film },
            { id: 'colony', label: '🌿 Green Valley 4K Tour', icon: Compass },
            { id: 'racing', label: '🏎️ Neon Street Race', icon: Car },
            { id: 'fireplace', label: '🔥 4K Cozy Fireplace', icon: Flame },
          ].map((ch) => {
            const Icon = ch.icon;
            const isSelected = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch.id as MovieChannel)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#22C55E] text-[#071827] font-semibold shadow-md'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center / Right: Movie Playback Controls & Camera Angles */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-black/75 backdrop-blur-md border border-white/15 rounded-xl p-1.5">
          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isPlaying ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-amber-400 text-[#071827]'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Movie' : 'Play Movie'}</span>
          </button>

          {/* Sound Mute / Unmute */}
          <button
            type="button"
            onClick={toggleSound}
            title={isMuted ? 'Unmute Movie Sound' : 'Mute Sound'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !isMuted ? 'bg-[#22C55E] text-[#071827]' : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Sound Off' : 'Sound On'}</span>
          </button>

          <div className="w-[1px] h-5 bg-white/20 hidden sm:block" />

          {/* Camera View Presets */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyCameraView('sofa')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                cameraView === 'sofa' ? 'bg-[#22C55E] text-[#071827] font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              🛋️ Sofa
            </button>
            <button
              type="button"
              onClick={() => applyCameraView('tv-focus')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                cameraView === 'tv-focus' ? 'bg-[#22C55E] text-[#071827] font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              📺 Cinema TV
            </button>
            <button
              type="button"
              onClick={() => applyCameraView('wide')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                cameraView === 'wide' ? 'bg-[#22C55E] text-[#071827] font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Room View
            </button>
            <button
              type="button"
              onClick={() => applyCameraView('window')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                cameraView === 'window' ? 'bg-[#22C55E] text-[#071827] font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Balcony View
            </button>
          </div>
        </div>
      </div>

      {/* Helpful Hint Overlay */}
      <div className="absolute top-16 left-4 z-10 pointer-events-none hidden sm:block bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg text-xs text-slate-300">
        🖱️ Click & Drag anywhere to look around the room (360° View)
      </div>
    </div>
  );
};
