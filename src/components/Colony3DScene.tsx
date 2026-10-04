import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Sun,
  Moon,
  Clock,
  Compass,
  RotateCcw,
  Home as HomeIcon,
  Calendar,
  MessageSquare,
  Shield,
  Dumbbell,
  Trees,
  Eye,
  Tv,
} from 'lucide-react';
import { House, LightingMode } from '../types/society';
import { Room3DInterior } from './Room3DInterior';

interface Colony3DSceneProps {
  houses: House[];
  lightingMode: LightingMode;
  onLightingModeChange: (mode: LightingMode) => void;
  effectiveNight: boolean;
  selectedHouse: House | null;
  onSelectHouse: (house: House | null) => void;
  onInspectHouseDetails: (house: House) => void;
  onBookVisit: (house: House) => void;
  onInquireHouse: (house: House) => void;
}

type CameraPreset = 'overview' | 'entrance' | 'park' | 'sectorA' | 'sectorC';

export const Colony3DScene: React.FC<Colony3DSceneProps> = ({
  houses,
  lightingMode,
  onLightingModeChange,
  effectiveNight,
  selectedHouse,
  onSelectHouse,
  onInspectHouseDetails,
  onBookVisit,
  onInquireHouse,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFallback, setWebglFallback] = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPreset>('overview');
  const [viewMode, setViewMode] = useState<'colony' | 'room'>('colony');

  // Mutable references for interactive camera & night lighting updates
  const sceneStateRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    targetPos: THREE.Vector3;
    cameraGoal: THREE.Vector3;
    lookAtGoal: THREE.Vector3;
    isDragging: boolean;
    prevMouse: { x: number; y: number };
    spherical: { radius: number; phi: number; theta: number };
    streetLightBulbs: THREE.MeshStandardMaterial[];
    streetPointLights: THREE.PointLight[];
    windowMaterials: THREE.MeshStandardMaterial[];
    gateLightMat?: THREE.MeshStandardMaterial;
    sunLight?: THREE.DirectionalLight;
    ambientLight?: THREE.AmbientLight;
    hemiLight?: THREE.HemisphereLight;
    houseMeshes: Map<string, THREE.Object3D>;
  }>({
    targetPos: new THREE.Vector3(0, 0, 0),
    cameraGoal: new THREE.Vector3(0, 38, 56),
    lookAtGoal: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    prevMouse: { x: 0, y: 0 },
    spherical: { radius: 64, phi: 1.02, theta: 0.25 },
    streetLightBulbs: [],
    streetPointLights: [],
    windowMaterials: [],
    houseMeshes: new Map(),
  });

  // Update Camera when a house is selected
  useEffect(() => {
    if (selectedHouse && selectedHouse.coordinates3D) {
      const { x, z } = selectedHouse.coordinates3D;
      sceneStateRef.current.lookAtGoal.set(x, 2.5, z);
      sceneStateRef.current.spherical.radius = 24;
      sceneStateRef.current.spherical.phi = 1.12;
    }
  }, [selectedHouse]);

  // Apply Camera Presets
  const applyCameraPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    const st = sceneStateRef.current;
    if (preset === 'overview') {
      st.lookAtGoal.set(0, 0, 0);
      st.spherical = { radius: 64, phi: 1.0, theta: 0.25 };
      onSelectHouse(null);
    } else if (preset === 'entrance') {
      st.lookAtGoal.set(-38, 2, 0);
      st.spherical = { radius: 26, phi: 1.18, theta: -1.35 };
      onSelectHouse(null);
    } else if (preset === 'park') {
      st.lookAtGoal.set(0, 1.5, 0);
      st.spherical = { radius: 30, phi: 1.1, theta: 0.6 };
      onSelectHouse(null);
    } else if (preset === 'sectorA') {
      st.lookAtGoal.set(-18, 2, -18);
      st.spherical = { radius: 28, phi: 1.1, theta: 0.15 };
    } else if (preset === 'sectorC') {
      st.lookAtGoal.set(18, 2, 18);
      st.spherical = { radius: 28, phi: 1.1, theta: 2.8 };
    }
  };

  // Synchronize Day / Night Materials & Lighting
  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st.scene) return;

    const skyColor = new THREE.Color(effectiveNight ? '#061320' : '#7EC8E3');
    st.scene.background = skyColor;
    st.scene.fog = new THREE.FogExp2(effectiveNight ? '#061320' : '#7EC8E3', 0.0065);

    if (st.sunLight) {
      st.sunLight.intensity = effectiveNight ? 0.22 : 2.1;
      st.sunLight.color.set(effectiveNight ? '#60A5FA' : '#FFF7ED');
      st.sunLight.position.set(
        effectiveNight ? -30 : 45,
        effectiveNight ? 35 : 55,
        effectiveNight ? -25 : 30
      );
    }

    if (st.ambientLight) {
      st.ambientLight.intensity = effectiveNight ? 0.35 : 0.85;
      st.ambientLight.color.set(effectiveNight ? '#1E3A8A' : '#FFFFFF');
    }

    if (st.hemiLight) {
      st.hemiLight.intensity = effectiveNight ? 0.3 : 0.75;
    }

    // Toggle Streetlight bulbs & point lights (ON at night, OFF during day)
    st.streetLightBulbs.forEach((mat) => {
      mat.emissive.set(effectiveNight ? '#FDE047' : '#000000');
      mat.emissiveIntensity = effectiveNight ? 3.2 : 0;
      mat.color.set(effectiveNight ? '#FEF08A' : '#CBD5E1');
    });

    st.streetPointLights.forEach((pl) => {
      pl.intensity = effectiveNight ? 14 : 0;
    });

    // Toggle Warm House Window Illumination at night
    st.windowMaterials.forEach((mat) => {
      mat.emissive.set(effectiveNight ? '#F59E0B' : '#0EA5E9');
      mat.emissiveIntensity = effectiveNight ? 1.65 : 0.12;
      mat.color.set(effectiveNight ? '#FDE68A' : '#38BDF8');
    });

    if (st.gateLightMat) {
      st.gateLightMat.emissive.set(effectiveNight ? '#22C55E' : '#15803D');
      st.gateLightMat.emissiveIntensity = effectiveNight ? 2.4 : 0.4;
    }
  }, [effectiveNight]);

  // Initialize Three.js WebGL Colony Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch {
      setWebglFallback(true);
      return;
    }

    const canvas = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFallback(true);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.5,
      300
    );

    const st = sceneStateRef.current;
    st.scene = scene;
    st.camera = camera;
    st.streetLightBulbs = [];
    st.streetPointLights = [];
    st.windowMaterials = [];
    st.houseMeshes.clear();

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight('#FFFFFF', 0.8);
    scene.add(ambientLight);
    st.ambientLight = ambientLight;

    const hemiLight = new THREE.HemisphereLight('#E0F2FE', '#14532D', 0.65);
    scene.add(hemiLight);
    st.hemiLight = hemiLight;

    const sunLight = new THREE.DirectionalLight('#FFFBEB', 2.0);
    sunLight.position.set(45, 55, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    const d = 55;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);
    st.sunLight = sunLight;

    // 1. Ground Terrain & Lush Emerald Lawns
    const groundGeo = new THREE.PlaneGeometry(160, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#14532D',
      roughness: 0.92,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Road Network, Intersections & Pedestrian Walkways
    const roadMat = new THREE.MeshStandardMaterial({
      color: '#1E293B',
      roughness: 0.85,
    });
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: '#94A3B8',
      roughness: 0.75,
    });
    const laneStripeMat = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      emissive: '#F8FAFC',
      emissiveIntensity: 0.2,
    });

    // Main East-West Boulevard (Split around Central Botanical Park)
    const createRoadSegment = (w: number, l: number, x: number, z: number) => {
      const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(w + 1.4, 0.14, l + 1.4), sidewalkMat);
      sidewalk.position.set(x, 0.07, z);
      sidewalk.receiveShadow = true;
      scene.add(sidewalk);

      const asphalt = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, l), roadMat);
      asphalt.position.set(x, 0.09, z);
      asphalt.receiveShadow = true;
      scene.add(asphalt);
    };

    // North & South Boulevards + Cross Streets
    createRoadSegment(96, 6.5, 0, -9.5); // North Boulevard
    createRoadSegment(96, 6.5, 0, 9.5); // South Boulevard
    createRoadSegment(7, 26, -34, 0); // West Entrance Connector
    createRoadSegment(7, 26, 34, 0); // East Connector
    createRoadSegment(18, 7.5, -45, 0); // Main Entrance Approach

    // Dashed Center Road Markings
    for (let x = -42; x <= 42; x += 6) {
      const dashN = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.2), laneStripeMat);
      dashN.position.set(x, 0.1, -9.5);
      scene.add(dashN);

      const dashS = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.2), laneStripeMat);
      dashS.position.set(x, 0.1, 9.5);
      scene.add(dashS);
    }

    // 3. Central Emerald Botanical Park & Walking Track
    const parkGrass = new THREE.Mesh(
      new THREE.BoxGeometry(58, 0.2, 11.5),
      new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.8 })
    );
    parkGrass.position.set(-2, 0.1, 0);
    parkGrass.receiveShadow = true;
    scene.add(parkGrass);

    // Cushioned Jogging Track Loop inside Central Park
    const trackOuter = new THREE.Mesh(
      new THREE.BoxGeometry(54, 0.22, 8.8),
      new THREE.MeshStandardMaterial({ color: '#9A3412', roughness: 0.7 })
    );
    trackOuter.position.set(-2, 0.11, 0);
    scene.add(trackOuter);

    const parkInnerLawn = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.24, 6.4),
      new THREE.MeshStandardMaterial({ color: '#16A34A', roughness: 0.75 })
    );
    parkInnerLawn.position.set(-2, 0.12, 0);
    parkInnerLawn.receiveShadow = true;
    scene.add(parkInnerLawn);

    // Park Benches & Ornamental Gazebo
    const gazeboRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.6, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: '#071827', roughness: 0.5 })
    );
    gazeboRoof.position.set(-6, 3.1, 0);
    gazeboRoof.castShadow = true;
    scene.add(gazeboRoof);

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8),
        new THREE.MeshStandardMaterial({ color: '#E2E8F0' })
      );
      pillar.position.set(-6 + Math.cos(angle) * 2.0, 1.2, Math.sin(angle) * 2.0);
      scene.add(pillar);
    }

    // 4. Modern Glass Gym & Community Clubhouse Building (East end of Central Park)
    const gymGroup = new THREE.Group();
    gymGroup.position.set(22, 0, 0);

    const gymBase = new THREE.Mesh(
      new THREE.BoxGeometry(9.5, 4.2, 6.2),
      new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.35, metalness: 0.3 })
    );
    gymBase.position.y = 2.1;
    gymBase.castShadow = true;
    gymBase.receiveShadow = true;
    gymGroup.add(gymBase);

    const gymGlassMat = new THREE.MeshStandardMaterial({
      color: '#38BDF8',
      emissive: '#0284C7',
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.7,
    });
    st.windowMaterials.push(gymGlassMat);

    const gymGlassFront = new THREE.Mesh(new THREE.BoxGeometry(8.6, 3.2, 6.35), gymGlassMat);
    gymGlassFront.position.y = 2.0;
    gymGroup.add(gymGlassFront);

    const gymRoofTrim = new THREE.Mesh(
      new THREE.BoxGeometry(10.4, 0.45, 7.0),
      new THREE.MeshStandardMaterial({ color: '#22C55E', roughness: 0.4 })
    );
    gymRoofTrim.position.y = 4.35;
    gymGroup.add(gymRoofTrim);
    scene.add(gymGroup);

    // 5. Grand Entrance Gate & Security Guard Cabin (West Entrance)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(-41, 0, 0);

    const pillarMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.5 });
    const darkArchMat = new THREE.MeshStandardMaterial({ color: '#071827', roughness: 0.4 });
    const gateGlowMat = new THREE.MeshStandardMaterial({
      color: '#22C55E',
      emissive: '#22C55E',
      emissiveIntensity: 1.2,
    });
    st.gateLightMat = gateGlowMat;

    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.5, 1.6), pillarMat);
    leftPillar.position.set(0, 3.25, -4.8);
    leftPillar.castShadow = true;
    gateGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.5, 1.6), pillarMat);
    rightPillar.position.set(0, 3.25, 4.8);
    rightPillar.castShadow = true;
    gateGroup.add(rightPillar);

    const topCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.3, 12.4), darkArchMat);
    topCanopy.position.set(0, 6.6, 0);
    topCanopy.castShadow = true;
    gateGroup.add(topCanopy);

    const accentBand = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.28, 11.8), gateGlowMat);
    accentBand.position.set(0, 6.1, 0);
    gateGroup.add(accentBand);

    // Security Guard Cabin in Center Median
    const guardCabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.8, 2.0),
      new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.5 })
    );
    guardCabin.position.set(2.2, 1.4, 0);
    guardCabin.castShadow = true;
    gateGroup.add(guardCabin);

    const cabinWindow = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.1, 1.6), gymGlassMat);
    cabinWindow.position.set(2.2, 1.65, 0);
    gateGroup.add(cabinWindow);

    scene.add(gateGroup);

    // 6. Streetlights Along the Roads (Turn ON at night, OFF during day)
    const poleMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.8,
      roughness: 0.3,
    });

    const createStreetLight = (x: number, z: number, zDir: number) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(x, 0, z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.2, 8), poleMat);
      pole.position.y = 2.6;
      pole.castShadow = true;
      lampGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.3), poleMat);
      arm.position.set(0, 5.1, zDir * 0.55);
      lampGroup.add(arm);

      const bulbMat = new THREE.MeshStandardMaterial({
        color: '#FEF08A',
        emissive: '#FDE047',
        emissiveIntensity: 0,
      });
      st.streetLightBulbs.push(bulbMat);

      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.55), bulbMat);
      bulb.position.set(0, 5.02, zDir * 1.05);
      lampGroup.add(bulb);

      const pointLight = new THREE.PointLight('#FDE047', 0, 18, 1.6);
      pointLight.position.set(0, 4.7, zDir * 1.05);
      lampGroup.add(pointLight);
      st.streetPointLights.push(pointLight);

      scene.add(lampGroup);
    };

    const lampXPositions = [-30, -18, -6, 6, 18, 30];
    lampXPositions.forEach((lx) => {
      createStreetLight(lx, -13.2, 1);
      createStreetLight(lx, -5.8, -1);
      createStreetLight(lx, 5.8, 1);
      createStreetLight(lx, 13.2, -1);
    });

    // 7. Landscaped Trees Across the Society
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#451A03', roughness: 0.9 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.75 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: '#22C55E', roughness: 0.7 });

    const createTree = (tx: number, tz: number, scale = 1) => {
      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.8, 7), trunkMat);
      trunk.position.y = 0.9;
      trunk.castShadow = true;
      tree.add(trunk);

      const lowerCrown = new THREE.Mesh(new THREE.ConeGeometry(1.35, 2.6, 8), foliageMat1);
      lowerCrown.position.y = 2.4;
      lowerCrown.castShadow = true;
      tree.add(lowerCrown);

      const upperCrown = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.1, 8), foliageMat2);
      upperCrown.position.y = 3.6;
      upperCrown.castShadow = true;
      tree.add(upperCrown);

      tree.scale.setScalar(scale);
      scene.add(tree);
    };

    const treePositions: [number, number, number][] = [
      [-26, 0, 1.1],
      [-20, 2.2, 0.95],
      [-14, -2.1, 1.15],
      [-1, 2.1, 1.0],
      [6, -2.0, 1.1],
      [12, 2.0, 0.9],
      [-38, -16, 1.2],
      [-38, 16, 1.2],
      [38, -16, 1.2],
      [38, 16, 1.2],
      [-18, -24, 0.95],
      [2, -24, 1.05],
      [18, -24, 0.95],
      [-18, 24, 0.95],
      [2, 24, 1.05],
      [18, 24, 0.95],
    ];
    treePositions.forEach(([tx, tz, sc]) => createTree(tx, tz, sc));

    // 8. Construct Detailed 3D Modern Houses Mapped to Real Database Houses
    houses.forEach((house, index) => {
      const coords = house.coordinates3D || {
        x: -26 + (index % 4) * 17,
        z: index < 4 ? -18 : 18,
        rotationY: index < 4 ? 0 : Math.PI,
      };

      const houseGroup = new THREE.Group();
      houseGroup.position.set(coords.x, 0, coords.z);
      houseGroup.rotation.y = coords.rotationY || 0;
      houseGroup.userData = { houseId: house.id, houseNumber: house.houseNumber };

      // Scale based on Plot Size (1 Kanal > 10 Marla > 5 Marla > 3 Marla)
      const sizeScale =
        house.plotSize === '1 Kanal'
          ? 1.22
          : house.plotSize === '10 Marla'
          ? 1.05
          : house.plotSize === '5 Marla'
          ? 0.92
          : 0.82;

      // Private Lawn & Plot Boundary Base
      const plotBase = new THREE.Mesh(
        new THREE.BoxGeometry(11.5 * sizeScale, 0.18, 9.5 * sizeScale),
        new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.85 })
      );
      plotBase.position.y = 0.09;
      plotBase.receiveShadow = true;
      houseGroup.add(plotBase);

      // Paved Carport Driveway
      const driveway = new THREE.Mesh(
        new THREE.BoxGeometry(3.4 * sizeScale, 0.2, 4.2 * sizeScale),
        new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8 })
      );
      driveway.position.set(-2.6 * sizeScale, 0.1, 2.4 * sizeScale);
      houseGroup.add(driveway);

      // Ground Floor Architectural Volume
      const wallMat = new THREE.MeshStandardMaterial({
        color: house.plotSize === '1 Kanal' ? '#F8FAFC' : '#F1F5F9',
        roughness: 0.55,
      });
      const groundFloor = new THREE.Mesh(
        new THREE.BoxGeometry(7.6 * sizeScale, 3.0, 5.8 * sizeScale),
        wallMat
      );
      groundFloor.position.set(0.5 * sizeScale, 1.5, -0.5 * sizeScale);
      groundFloor.castShadow = true;
      groundFloor.receiveShadow = true;
      houseGroup.add(groundFloor);

      // First Floor Cantilevered Volume with Cedar / Slate Cladding
      const upperCladdingMat = new THREE.MeshStandardMaterial({
        color:
          house.plotSize === '1 Kanal'
            ? '#78350F'
            : house.plotSize === '10 Marla'
            ? '#334155'
            : '#1E293B',
        roughness: 0.5,
      });
      const firstFloor = new THREE.Mesh(
        new THREE.BoxGeometry(6.8 * sizeScale, 2.7, 5.2 * sizeScale),
        upperCladdingMat
      );
      firstFloor.position.set(-0.2 * sizeScale, 4.35, -0.2 * sizeScale);
      firstFloor.castShadow = true;
      firstFloor.receiveShadow = true;
      houseGroup.add(firstFloor);

      // Flat Cantilevered Roof Overhang
      const roofSlab = new THREE.Mesh(
        new THREE.BoxGeometry(7.8 * sizeScale, 0.32, 6.0 * sizeScale),
        new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.4 })
      );
      roofSlab.position.set(0, 5.8, -0.2 * sizeScale);
      roofSlab.castShadow = true;
      houseGroup.add(roofSlab);

      // Glass Balcony Railing
      const winMat = new THREE.MeshStandardMaterial({
        color: '#38BDF8',
        emissive: '#0EA5E9',
        emissiveIntensity: 0.15,
        roughness: 0.15,
        metalness: 0.6,
      });
      st.windowMaterials.push(winMat);

      // Ground & Upper Windows (glow warmly at night)
      const lowerWin = new THREE.Mesh(
        new THREE.BoxGeometry(3.4 * sizeScale, 1.8, 0.15),
        winMat
      );
      lowerWin.position.set(1.4 * sizeScale, 1.6, 2.42 * sizeScale);
      houseGroup.add(lowerWin);

      const upperWin = new THREE.Mesh(
        new THREE.BoxGeometry(4.2 * sizeScale, 1.7, 0.15),
        winMat
      );
      upperWin.position.set(0.2 * sizeScale, 4.4, 2.42 * sizeScale);
      houseGroup.add(upperWin);

      // Entrance Timber Door
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 2.2, 0.18),
        new THREE.MeshStandardMaterial({ color: '#451A03', roughness: 0.6 })
      );
      door.position.set(-1.1 * sizeScale, 1.1, 2.42 * sizeScale);
      houseGroup.add(door);

      // Status Beacon Marker Above Roof (Emerald = Available, Amber = Reserved, Red = Sold)
      const badgeColor =
        house.availability === 'Available'
          ? '#22C55E'
          : house.availability === 'Reserved'
          ? '#F59E0B'
          : '#EF4444';
      const markerBeacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshStandardMaterial({
          color: badgeColor,
          emissive: badgeColor,
          emissiveIntensity: 1.3,
        })
      );
      markerBeacon.position.set(0, 7.1, 0);
      houseGroup.add(markerBeacon);

      scene.add(houseGroup);
      st.houseMeshes.set(house.id, houseGroup);
    });

    // Trigger initial lighting sync
    const initSky = new THREE.Color(effectiveNight ? '#061320' : '#7EC8E3');
    scene.background = initSky;
    scene.fog = new THREE.FogExp2(effectiveNight ? '#061320' : '#7EC8E3', 0.0065);
    st.streetLightBulbs.forEach((mat) => {
      mat.emissive.set(effectiveNight ? '#FDE047' : '#000000');
      mat.emissiveIntensity = effectiveNight ? 3.2 : 0;
    });
    st.streetPointLights.forEach((pl) => {
      pl.intensity = effectiveNight ? 14 : 0;
    });
    st.windowMaterials.forEach((mat) => {
      mat.emissive.set(effectiveNight ? '#F59E0B' : '#0EA5E9');
      mat.emissiveIntensity = effectiveNight ? 1.65 : 0.12;
    });

    // Pointer Interaction (Orbit, Zoom & Click Raycasting on Houses)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      st.isDragging = true;
      st.prevMouse = { x: e.clientX, y: e.clientY };
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (st.isDragging) {
        const dx = e.clientX - st.prevMouse.x;
        const dy = e.clientY - st.prevMouse.y;
        st.spherical.theta -= dx * 0.0065;
        st.spherical.phi = Math.max(
          0.35,
          Math.min(Math.PI / 2 - 0.08, st.spherical.phi - dy * 0.0055)
        );
        st.prevMouse = { x: e.clientX, y: e.clientY };
        return;
      }

      // Hover detection
      raycaster.setFromCamera(mouse, camera);
      const targets = Array.from(st.houseMeshes.values());
      const intersects = raycaster.intersectObjects(targets, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.houseNumber) {
          obj = obj.parent;
        }
        if (obj?.userData?.houseNumber) {
          setHoveredLabel(obj.userData.houseNumber);
          canvas.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredLabel(null);
      canvas.style.cursor = st.isDragging ? 'grabbing' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      st.isDragging = false;
      const moveDist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (moveDist < 6) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const targets = Array.from(st.houseMeshes.values());
        const intersects = raycaster.intersectObjects(targets, true);
        if (intersects.length > 0) {
          let obj: THREE.Object3D | null = intersects[0].object;
          while (obj && !obj.userData?.houseId) {
            obj = obj.parent;
          }
          if (obj?.userData?.houseId) {
            const found = houses.find((h) => h.id === obj!.userData.houseId);
            if (found) onSelectHouse(found);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      st.spherical.radius = Math.max(
        16,
        Math.min(95, st.spherical.radius + e.deltaY * 0.04)
      );
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let animId = 0;
    const clock = new THREE.Clock();

    // 9. Animated 3D Traffic Vehicles on North & South Boulevards
    const createCar3D = (bodyColor: string) => {
      const car = new THREE.Group();
      const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.65, 1.35),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.5 })
      );
      chassis.position.y = 0.45;
      chassis.castShadow = true;
      car.add(chassis);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.52, 1.18),
        new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.2, metalness: 0.7 })
      );
      cabin.position.set(-0.1, 0.95, 0);
      car.add(cabin);

      const headLightMat = new THREE.MeshStandardMaterial({
        color: '#FEF08A',
        emissive: '#FDE047',
        emissiveIntensity: 2.2,
      });
      const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.28), headLightMat);
      hlLeft.position.set(1.36, 0.48, -0.44);
      const hlRight = hlLeft.clone();
      hlRight.position.z = 0.44;
      car.add(hlLeft, hlRight);

      const tailLightMat = new THREE.MeshStandardMaterial({
        color: '#EF4444',
        emissive: '#EF4444',
        emissiveIntensity: 1.8,
      });
      const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.28), tailLightMat);
      tlLeft.position.set(-1.36, 0.48, -0.44);
      const tlRight = tlLeft.clone();
      tlRight.position.z = 0.44;
      car.add(tlLeft, tlRight);

      scene.add(car);
      return car;
    };

    const trafficCars = [
      { mesh: createCar3D('#F8FAFC'), x: -35, z: -10.8, speed: 9.5, dir: 1 },
      { mesh: createCar3D('#22C55E'), x: 15, z: -8.2, speed: 8.5, dir: -1 },
      { mesh: createCar3D('#38BDF8'), x: -12, z: 8.2, speed: 9.0, dir: 1 },
      { mesh: createCar3D('#E2E8F0'), x: 28, z: 10.8, speed: 8.2, dir: -1 },
    ];
    trafficCars.forEach((c) => {
      c.mesh.position.set(c.x, 0.1, c.z);
      c.mesh.rotation.y = c.dir > 0 ? 0 : Math.PI;
    });

    // 10. Animated 3D Walking & Talking Residents in Central Park & Sidewalks
    const createPerson3D = (shirtColor: string) => {
      const person = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.22, 0.58, 4, 8),
        new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 })
      );
      body.position.y = 0.65;
      body.castShadow = true;
      person.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 10, 10),
        new THREE.MeshStandardMaterial({ color: '#FDBA74', roughness: 0.5 })
      );
      head.position.y = 1.25;
      person.add(head);

      scene.add(person);
      return person;
    };

    const parkWalkers = [
      { mesh: createPerson3D('#22C55E'), baseX: -14, z: -12.1, range: 16, speed: 1.3, phase: 0 },
      { mesh: createPerson3D('#F8FAFC'), baseX: -13.1, z: -12.1, range: 16, speed: 1.3, phase: 0 },
      { mesh: createPerson3D('#38BDF8'), baseX: 8, z: 6.9, range: 15, speed: 1.4, phase: 2.1 },
      { mesh: createPerson3D('#F59E0B'), baseX: 8.9, z: 6.9, range: 15, speed: 1.4, phase: 2.1 },
      { mesh: createPerson3D('#EC4899'), baseX: -22, z: 12.1, range: 14, speed: 1.2, phase: 1.1 },
    ];

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotate floating beacons gently
      st.houseMeshes.forEach((group) => {
        const beacon = group.children[group.children.length - 1];
        if (beacon) {
          beacon.rotation.y = elapsed * 1.4;
          beacon.position.y = 7.1 + Math.sin(elapsed * 2.2) * 0.2;
        }
      });

      // Move 3D traffic vehicles smoothly along boulevards
      trafficCars.forEach((c) => {
        let nx = c.x + elapsed * c.speed * c.dir;
        nx = ((((nx + 44) % 88) + 88) % 88) - 44;
        c.mesh.position.x = nx;
      });

      // Animate 3D pedestrians walking & talking in Central Botanical Park
      parkWalkers.forEach((pw, idx) => {
        const offset = Math.sin(elapsed * pw.speed * 0.25 + pw.phase) * pw.range;
        pw.mesh.position.set(
          pw.baseX + offset,
          0.12 + Math.abs(Math.sin(elapsed * 6 + idx)) * 0.08,
          pw.z
        );
      });

      // Smooth camera interpolation
      st.targetPos.lerp(st.lookAtGoal, 0.08);
      const { radius, phi, theta } = st.spherical;
      const cx = st.targetPos.x + radius * Math.sin(phi) * Math.sin(theta);
      const cy = st.targetPos.y + radius * Math.cos(phi);
      const cz = st.targetPos.z + radius * Math.sin(phi) * Math.cos(theta);

      camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.1);
      camera.lookAt(st.targetPos);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [houses]);

  return (
    <section className="relative w-full bg-[#071827] border-y border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#22C55E] mb-2">
              Interactive 3D Architectural Environment
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Explore Green Valley Residencia in 3D
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Orbit across our master-planned residential enclave. Click any residence to inspect
              its plot dimensions, architectural specifications, and live availability, or toggle
              between Day and Night illumination.
            </p>
          </div>

          {/* Day / Night / Auto Lighting Controls & Room Walkthrough Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher: Colony Outdoor vs Room Interior */}
            <div className="flex items-center bg-[#0B1724] border border-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('colony')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  viewMode === 'colony'
                    ? 'bg-[#22C55E] text-[#071827] font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>3D Colony Street View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('room')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  viewMode === 'room'
                    ? 'bg-[#22C55E] text-[#071827] font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Walk Inside Room (Live LCD TV) ✨</span>
              </button>
            </div>

            <div className="flex items-center bg-[#0B1724] border border-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => onLightingModeChange('day')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  lightingMode === 'day'
                    ? 'bg-[#22C55E] text-[#071827] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Day Mode</span>
              </button>
              <button
                type="button"
                onClick={() => onLightingModeChange('night')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  lightingMode === 'night'
                    ? 'bg-[#22C55E] text-[#071827] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Night Mode</span>
              </button>
              <button
                type="button"
                onClick={() => onLightingModeChange('auto')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  lightingMode === 'auto'
                    ? 'bg-[#22C55E] text-[#071827] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Auto ({effectiveNight ? 'Night' : 'Day'})</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: 3D Villa Master Room Walkthrough with Live 85" LCD TV Screen */}
        {viewMode === 'room' && (
          <div className="mb-6">
            <Room3DInterior
              onExitToColony={() => setViewMode('colony')}
              selectedHouseNumber={selectedHouse?.houseNumber || 'GV-101'}
              selectedHouseTitle={selectedHouse?.title || '10 Marla Executive Residence'}
              lightingMode={lightingMode}
              onLightingModeChange={onLightingModeChange}
              effectiveNight={effectiveNight}
            />
          </div>
        )}

        {/* View Mode 2: Outdoor 3D Residential Colony Viewport */}
        <div className={`relative w-full h-[560px] sm:h-[640px] rounded-xl overflow-hidden border border-white/15 bg-[#0B1724] ${viewMode === 'colony' ? 'block' : 'hidden'}`}>
          {!webglFallback ? (
            <div ref={mountRef} className="w-full h-full" />
          ) : (
            /* Graceful Interactive 2D Master Plan Fallback if WebGL is unavailable */
            <div className="w-full h-full flex flex-col justify-between p-8 bg-gradient-to-br from-[#071827] via-[#0B1724] to-[#0F2922]">
              <div>
                <p className="text-xs text-[#22C55E] font-medium mb-1">
                  Interactive Architectural Master Layout
                </p>
                <h3 className="font-display text-2xl text-white">
                  Green Valley Residencia Sector Map
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-auto">
                {houses.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => onSelectHouse(h)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedHouse?.id === h.id
                        ? 'bg-[#22C55E]/20 border-[#22C55E]'
                        : 'bg-black/40 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-mono-tabular text-sm font-semibold text-white">
                      {h.houseNumber}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      {h.plotSize} · {h.availability}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top-Left Camera Zone Switcher HUD */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-black/55 backdrop-blur-md border border-white/10 rounded-lg p-1.5">
            <button
              type="button"
              onClick={() => applyCameraPreset('overview')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activePreset === 'overview'
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Full Colony</span>
            </button>
            <button
              type="button"
              onClick={() => applyCameraPreset('entrance')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activePreset === 'entrance'
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Security Gate</span>
            </button>
            <button
              type="button"
              onClick={() => applyCameraPreset('park')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activePreset === 'park'
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Trees className="w-3.5 h-3.5" />
              <span>Central Park & Gym</span>
            </button>
            <button
              type="button"
              onClick={() => applyCameraPreset('sectorA')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activePreset === 'sectorA'
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>1 Kanal & 10 Marla</span>
            </button>
            <button
              type="button"
              onClick={() => applyCameraPreset('sectorC')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activePreset === 'sectorC'
                  ? 'bg-[#22C55E] text-[#071827] font-semibold'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>5 & 3 Marla</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('room')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap bg-[#22C55E]/20 text-[#4ADE80] border border-[#22C55E]/40 hover:bg-[#22C55E] hover:text-[#071827]"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Walk Inside Room (Live LCD TV)</span>
            </button>
          </div>

          {/* Hover Tooltip */}
          {hoveredLabel && (
            <div className="absolute top-16 left-4 z-10 pointer-events-none bg-black/70 backdrop-blur-sm border border-[#22C55E]/40 px-3 py-1.5 rounded-md text-xs text-white font-mono-tabular">
              Click to inspect Plot {hoveredLabel}
            </div>
          )}

          {/* Bottom-Left Quick Plot Selector Strip */}
          <div className="absolute bottom-4 left-4 right-4 lg:right-auto z-10 flex items-center gap-1.5 overflow-x-auto bg-black/55 backdrop-blur-md border border-white/10 rounded-lg p-1.5 max-w-full">
            {houses.map((h) => {
              const isSelected = selectedHouse?.id === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onSelectHouse(h)}
                  className={`px-2.5 py-1.5 rounded text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#22C55E] text-[#071827] font-semibold'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {h.houseNumber} · {h.plotSize}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => applyCameraPreset('overview')}
              title="Reset Camera"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selected House Floating Semantic DOM Inspector Overlay */}
          {selectedHouse && (
            <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 bg-[#071827]/95 backdrop-blur-md border border-white/15 rounded-xl p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400 font-mono-tabular">
                    {selectedHouse.houseNumber} · {selectedHouse.plotSize} ·{' '}
                    <span
                      className={
                        selectedHouse.availability === 'Available'
                          ? 'text-[#22C55E] font-semibold'
                          : selectedHouse.availability === 'Reserved'
                          ? 'text-amber-400 font-semibold'
                          : 'text-red-400 font-semibold'
                      }
                    >
                      {selectedHouse.availability}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white mt-0.5">
                    {selectedHouse.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectHouse(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Close
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-mono-tabular">
                <span>{selectedHouse.bedrooms} Beds</span>
                <span aria-hidden="true">·</span>
                <span>{selectedHouse.bathrooms} Baths</span>
                <span aria-hidden="true">·</span>
                <span>{selectedHouse.coveredAreaSqFt.toLocaleString()} sq.ft</span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Listing Price</span>
                <span className="font-mono-tabular text-lg font-semibold text-[#22C55E]">
                  PKR {(selectedHouse.pricePKR / 1000000).toFixed(2)}M
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                {selectedHouse.description}
              </p>

              {/* Primary Walk Inside Room Action */}
              <button
                type="button"
                onClick={() => setViewMode('room')}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:brightness-110 text-[#071827] font-semibold text-xs rounded-lg shadow-lg transition-transform active:scale-95"
              >
                <Tv className="w-4 h-4" />
                <span>Walk Inside Room (Live LCD TV)</span>
              </button>

              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onInspectHouseDetails(selectedHouse)}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => onBookVisit(selectedHouse)}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-[#22C55E] hover:bg-[#4ADE80] text-[#071827] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Visit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInquireHouse(selectedHouse)}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Inquire</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legend & Controls Guide Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span>Drag to Orbit Camera</span>
            <span aria-hidden="true">·</span>
            <span>Scroll to Zoom</span>
            <span aria-hidden="true">·</span>
            <span>Click Any Villa to Inspect Specs</span>
          </div>
          <div className="flex items-center gap-4 font-mono-tabular">
            <span className="text-[#22C55E]">● Available Plot</span>
            <span className="text-amber-400">● Reserved Plot</span>
            <span className="text-red-400">● Sold / Occupied</span>
          </div>
        </div>
      </div>
    </section>
  );
};
