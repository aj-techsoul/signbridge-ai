'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Landmark } from '../lib/gestureClassifier';

interface LiveAvatar3DProps {
  multiHandLandmarks: Landmark[][];
  multiHandedness: Array<{ label: string; score: number }>;
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17]             // Palm base
];

export const LiveAvatar3D: React.FC<LiveAvatar3DProps> = ({ multiHandLandmarks }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const handsGroupRef = useRef<THREE.Group | null>(null);
  
  // meshPoolRef holds meshes for joints and bones
  const meshPoolRef = useRef<Array<{ joints: THREE.Mesh[], bones: THREE.Mesh[], palm: THREE.Mesh }>>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Realistic Lighting Setup for Skin
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(1, 3, 4);
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    fillLight.position.set(-2, -1, 2);
    scene.add(fillLight);

    const backLight = new THREE.PointLight(0xffaa88, 3.0, 10);
    backLight.position.set(0, 2, -2);
    scene.add(backLight);

    const handsGroup = new THREE.Group();
    scene.add(handsGroup);
    handsGroupRef.current = handsGroup;

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) mountRef.current.innerHTML = '';
      sceneRef.current = null;
      handsGroupRef.current = null;
      meshPoolRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!handsGroupRef.current) return;
    const group = handsGroupRef.current;
    
    // Hide existing
    meshPoolRef.current.forEach(handPool => {
      handPool.joints.forEach(j => j.visible = false);
      handPool.bones.forEach(b => b.visible = false);
      handPool.palm.visible = false;
    });

    // Realistic Skin Material
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xf3c8a9,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.1,
      clearcoatRoughness: 0.4,
      transmission: 0.1, 
      thickness: 0.5,
    });

    while (meshPoolRef.current.length < multiHandLandmarks.length) {
      const joints: THREE.Mesh[] = [];
      const bones: THREE.Mesh[] = [];

      const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
      for (let i = 0; i < 21; i++) {
        const mesh = new THREE.Mesh(sphereGeo, skinMat);
        group.add(mesh);
        joints.push(mesh);
      }

      const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 32);
      cylGeo.translate(0, 0.5, 0);
      cylGeo.rotateX(Math.PI / 2);
      for (let i = 0; i < HAND_CONNECTIONS.length; i++) {
        const mesh = new THREE.Mesh(cylGeo, skinMat);
        group.add(mesh);
        bones.push(mesh);
      }

      // Palm center geometry (flattened sphere)
      const palmGeo = new THREE.SphereGeometry(1, 32, 32);
      const palmMesh = new THREE.Mesh(palmGeo, skinMat);
      group.add(palmMesh);

      meshPoolRef.current.push({ joints, bones, palm: palmMesh });
    }

    multiHandLandmarks.forEach((landmarks, handIdx) => {
      const pool = meshPoolRef.current[handIdx];
      const SCALE = 2.5; 
      const mappedPositions: THREE.Vector3[] = [];

      landmarks.forEach((lm, idx) => {
        const mesh = pool.joints[idx];
        mesh.visible = true;
        
        // Mirror matching video
        const vx = -(lm.x - 0.5) * SCALE * 1.6;
        const vy = -(lm.y - 0.5) * SCALE * 1.2;
        const vz = -lm.z * SCALE; 
        mesh.position.set(vx, vy, vz);
        
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const radius = isTip ? 0.045 : (idx === 0 ? 0.07 : 0.055);
        mesh.scale.setScalar(radius);

        mappedPositions.push(new THREE.Vector3(vx, vy, vz));
      });

      // Update bones (finger segments)
      HAND_CONNECTIONS.forEach((connection, bIdx) => {
        const start = mappedPositions[connection[0]];
        const end = mappedPositions[connection[1]];
        const boneMesh = pool.bones[bIdx];
        boneMesh.visible = true;

        const distance = start.distanceTo(end);
        boneMesh.position.copy(start);
        boneMesh.lookAt(end);
        
        const thickness = [4, 8, 12, 16, 20].includes(connection[1]) ? 0.045 : 0.055;
        boneMesh.scale.set(thickness, thickness, distance);
      });

      // Render fleshy palm
      const palm = pool.palm;
      palm.visible = true;
      const wrist = mappedPositions[0];
      const middleBase = mappedPositions[9];
      const indexBase = mappedPositions[5];
      const pinkyBase = mappedPositions[17];
      
      const palmCenter = new THREE.Vector3()
        .add(wrist)
        .add(middleBase)
        .add(indexBase)
        .add(pinkyBase)
        .multiplyScalar(0.25);
        
      palm.position.copy(palmCenter);
      
      const width = indexBase.distanceTo(pinkyBase) * 0.7;
      const height = wrist.distanceTo(middleBase) * 0.6;
      palm.scale.set(width, height, 0.05); // flatten it like a real palm
      
      const palmDir = new THREE.Vector3().subVectors(middleBase, wrist).normalize();
      const palmRight = new THREE.Vector3().subVectors(indexBase, pinkyBase).normalize();
      const palmNormal = new THREE.Vector3().crossVectors(palmRight, palmDir).normalize();
      
      const target = new THREE.Vector3().addVectors(palmCenter, palmNormal);
      palm.lookAt(target);

    });

  }, [multiHandLandmarks]);

  return (
    <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }} />
  );
};
