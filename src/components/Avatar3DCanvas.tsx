'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Avatar3DProps {
  currentWord: string;
  isPlaying: boolean;
}

export const Avatar3DCanvas: React.FC<Avatar3DProps> = ({ currentWord, isPlaying }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const width = mountNode.clientWidth || 480;
    const height = mountRef.current.clientHeight || 340;

    // Scene setup with high-contrast background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    // Position camera closer to focus on hand & torso details clearly
    camera.position.set(0.1, 1.1, 2.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountNode.appendChild(renderer.domElement);

    // ----------------------------------------------------
    // High-Clarity Studio Lighting Setup
    // ----------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Key Light focusing on hand details
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(1.5, 3, 2.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Cyan Fill light for hand contours
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    fillLight.position.set(-2, 2, 2);
    scene.add(fillLight);

    // Pink Rim light highlighting individual fingers
    const rimLight = new THREE.PointLight(0xf472b6, 2.5, 10);
    rimLight.position.set(0.5, 1.8, 1);
    scene.add(rimLight);

    // ----------------------------------------------------
    // Materials with High Visual Clarity & Distinct Colors
    // ----------------------------------------------------
    // Skin Material with subsurface warm look
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5d0a9,
      roughness: 0.25,
      metalness: 0.05,
    });

    // Natural joint material to match skin closely
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0xeabf99,
      roughness: 0.35,
      metalness: 0.05,
    });

    // Natural fingertip material instead of neon
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xf5cca3,
      roughness: 0.3,
      metalness: 0.05,
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      roughness: 0.5,
    });

    const avatarGroup = new THREE.Group();

    // Head & Features
    const headGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.35, 0);
    avatarGroup.add(head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.21, 32, 16);
    hairGeo.scale(1, 0.6, 1);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.48, -0.02);
    avatarGroup.add(hair);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.028, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.07, 1.38, 0.18);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.07, 1.38, 0.18);
    avatarGroup.add(leftEye);
    avatarGroup.add(rightEye);

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.65, 32);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.set(0, 0.8, 0);
    avatarGroup.add(torso);

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const rightShoulder = new THREE.Mesh(shoulderGeo, shirtMat);
    rightShoulder.position.set(0.3, 1.05, 0);
    avatarGroup.add(rightShoulder);

    // ----------------------------------------------------
    // HD Right Arm & Anatomically Articulated 5-Finger Hand
    // ----------------------------------------------------
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.3, 1.05, 0); // Shoulder Pivot

    const upperArmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.3, 16);
    const upperArm = new THREE.Mesh(upperArmGeo, shirtMat);
    upperArm.position.set(0, -0.15, 0);
    rightArmGroup.add(upperArm);

    // Forearm
    const forearmGroup = new THREE.Group();
    forearmGroup.position.set(0, -0.3, 0);

    const forearmGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.3, 16);
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.position.set(0, -0.15, 0);
    forearmGroup.add(forearm);

    // Wrist Joint Indicator
    const wristGeo = new THREE.SphereGeometry(0.038, 16, 16);
    const wristJoint = new THREE.Mesh(wristGeo, jointMat);
    wristJoint.position.set(0, -0.3, 0);
    forearmGroup.add(wristJoint);

    // ----------------------------------------------------
    // Detailed Palm & High-Clarity 5 Fingers with Joints
    // ----------------------------------------------------
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.3, 0);

    // Palm base
    const palmGeo = new THREE.BoxGeometry(0.11, 0.12, 0.035);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, -0.06, 0);
    handGroup.add(palm);

    // 5 Finger Assemblies (Thumb, Index, Middle, Ring, Pinky)
    interface FingerJoints {
      base: THREE.Group;
      mid: THREE.Group;
      tip: THREE.Mesh;
    }

    const fingerJointsList: FingerJoints[] = [];
    const fingerXOffsets = [-0.05, -0.035, 0.0, 0.035, 0.05];
    const fingerLengths = [0.08, 0.11, 0.12, 0.11, 0.09];

    for (let i = 0; i < 5; i++) {
      const isThumb = i === 0;
      const xPos = fingerXOffsets[i];
      const len = fingerLengths[i];

      // Base Joint Group
      const baseGroup = new THREE.Group();
      baseGroup.position.set(xPos, isThumb ? -0.03 : 0.0, 0);

      // Base Joint Sphere
      const knuckleGeo = new THREE.SphereGeometry(0.016, 12, 12);
      const knuckle = new THREE.Mesh(knuckleGeo, jointMat);
      baseGroup.add(knuckle);

      // Phalanx 1 (Lower Finger Cylinder)
      const p1Geo = new THREE.CylinderGeometry(0.014, 0.012, len * 0.5, 12);
      const p1 = new THREE.Mesh(p1Geo, skinMat);
      p1.position.set(0, len * 0.25, 0);
      baseGroup.add(p1);

      // Mid Joint Group (PIP joint)
      const midGroup = new THREE.Group();
      midGroup.position.set(0, len * 0.5, 0);

      const midKnuckle = new THREE.Mesh(knuckleGeo, jointMat);
      midGroup.add(midKnuckle);

      // Phalanx 2 (Upper Finger Cylinder)
      const p2Geo = new THREE.CylinderGeometry(0.012, 0.01, len * 0.4, 12);
      const p2 = new THREE.Mesh(p2Geo, skinMat);
      p2.position.set(0, len * 0.2, 0);
      midGroup.add(p2);

      // Highlighted Neon Fingertip (DIP tip)
      const tipGeo = new THREE.SphereGeometry(0.014, 12, 12);
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(0, len * 0.4, 0);
      midGroup.add(tip);

      baseGroup.add(midGroup);
      handGroup.add(baseGroup);

      fingerJointsList.push({ base: baseGroup, mid: midGroup, tip: tip });
    }

    forearmGroup.add(handGroup);
    rightArmGroup.add(forearmGroup);
    avatarGroup.add(rightArmGroup);

    // Left arm standby
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.3, 1.05, 0);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, shirtMat);
    leftUpperArm.position.set(0, -0.15, 0);
    leftArmGroup.add(leftUpperArm);
    avatarGroup.add(leftArmGroup);

    scene.add(avatarGroup);

    // Pedestal Ring
    const ringGeo = new THREE.RingGeometry(0.4, 0.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.01, 0);
    scene.add(ring);

    // ----------------------------------------------------
    // High-Precision Finger Joint & Arm Animator
    // ----------------------------------------------------
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      head.position.y = 1.35 + Math.sin(elapsedTime * 2) * 0.01;

      if (isPlaying && currentWord) {
        const w = currentWord.toUpperCase();

        // Position camera to zoom closer onto hand for ultra clarity
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0.3, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.9, 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 1.5, 0.05);

        if (w.includes('HELLO') || w.includes('HI') || w.includes('WAVE')) {
          // Open Palm Hello Gesture
          rightArmGroup.rotation.x = -Math.PI / 2.5;
          rightArmGroup.rotation.z = 0.5 + Math.sin(elapsedTime * 8) * 0.3;
          forearmGroup.rotation.x = -Math.PI / 4;
          handGroup.rotation.y = Math.PI / 2;

          // Open all fingers straight
          fingerJointsList.forEach((f) => {
            f.base.rotation.x = 0;
            f.mid.rotation.x = 0;
          });
        } else if (w.includes('THANK') || w.includes('THANKS')) {
          // Thank You Sign (Fingertips from mouth moving forward)
          const sweep = (Math.sin(elapsedTime * 4) + 1) / 2;
          rightArmGroup.rotation.x = -Math.PI / 2 + sweep * 0.4;
          rightArmGroup.rotation.z = 0.2;
          forearmGroup.rotation.x = -Math.PI / 3 + sweep * 0.5;
          handGroup.rotation.x = -sweep * 0.4;

          fingerJointsList.forEach((f) => {
            f.base.rotation.x = 0;
          });
        } else if (w.includes('LOVE') || w.includes('YOU')) {
          // ASL I Love You (🤟)
          rightArmGroup.rotation.x = -Math.PI / 2.2;
          rightArmGroup.rotation.z = 0.4;
          forearmGroup.rotation.x = -Math.PI / 3;
          handGroup.rotation.y = Math.PI / 2;

          // Thumb (0), Index (1), Pinky (4) extended; Middle (2) & Ring (3) curled tight
          fingerJointsList[0].base.rotation.x = -0.3; // Thumb out
          fingerJointsList[1].base.rotation.x = 0;    // Index out
          fingerJointsList[2].base.rotation.x = Math.PI / 1.8; // Middle curled
          fingerJointsList[2].mid.rotation.x = Math.PI / 2;
          fingerJointsList[3].base.rotation.x = Math.PI / 1.8; // Ring curled
          fingerJointsList[3].mid.rotation.x = Math.PI / 2;
          fingerJointsList[4].base.rotation.x = 0;    // Pinky out
        } else if (w.includes('HELP') || w.includes('YES')) {
          // Thumbs Up / Yes
          rightArmGroup.rotation.x = -Math.PI / 2;
          rightArmGroup.rotation.z = 0.3;
          forearmGroup.rotation.x = -Math.PI / 3;

          fingerJointsList[0].base.rotation.x = -Math.PI / 3; // Thumb up
          for (let i = 1; i <= 4; i++) {
            fingerJointsList[i].base.rotation.x = Math.PI / 1.6; // Fist
            fingerJointsList[i].mid.rotation.x = Math.PI / 2;
          }
        } else {
          // Exact ASL Dictionary for numbers and common letters
          const char = w.charAt(0).toUpperCase();

          rightArmGroup.rotation.x = -Math.PI / 2.2;
          rightArmGroup.rotation.z = 0.4;
          forearmGroup.rotation.x = -Math.PI / 3;
          handGroup.rotation.y = Math.PI / 2;

          const PI = Math.PI;
          const OPEN = { base: 0, mid: 0 };
          const CLOSED = { base: PI / 1.6, mid: PI / 2 };
          const HALF = { base: PI / 3, mid: PI / 4 };
          const THUMB_IN = { base: PI / 4, mid: 0 };

          let poses = [CLOSED, CLOSED, CLOSED, CLOSED, CLOSED];

          if (char === '5') {
            poses = [OPEN, OPEN, OPEN, OPEN, OPEN];
          } else if (char === '4') {
            poses = [THUMB_IN, OPEN, OPEN, OPEN, OPEN];
          } else if (char === '3') {
            poses = [OPEN, OPEN, OPEN, CLOSED, CLOSED];
          } else if (char === '2' || char === 'V') {
            poses = [THUMB_IN, OPEN, OPEN, CLOSED, CLOSED];
          } else if (char === '1') {
            poses = [THUMB_IN, OPEN, CLOSED, CLOSED, CLOSED];
          } else if (char === '0' || char === 'S') {
            poses = [THUMB_IN, CLOSED, CLOSED, CLOSED, CLOSED];
          } else if (char === 'Y') {
            poses = [OPEN, CLOSED, CLOSED, CLOSED, OPEN];
          } else if (char === 'F' || char === '9') {
            poses = [HALF, HALF, OPEN, OPEN, OPEN];
          } else if (char === '8') {
            poses = [HALF, OPEN, HALF, OPEN, OPEN];
          } else if (char === '7') {
            poses = [HALF, OPEN, OPEN, HALF, OPEN];
          } else if (char === '6') {
            poses = [HALF, OPEN, OPEN, OPEN, HALF];
          } else {
            // Fallback for unmapped chars to still have some movement
            const charCode = w.charCodeAt(0) || 65;
            poses = [0, 1, 2, 3, 4].map((idx) => {
              const bend = Math.sin(elapsedTime * 6 + charCode + idx * 1.5) > 0 ? PI / 2 : 0;
              return { base: bend * 0.7, mid: bend };
            });
          }

          // Articulate individual finger joints distinctly per character
          fingerJointsList.forEach((f, idx) => {
            f.base.rotation.x = THREE.MathUtils.lerp(f.base.rotation.x, poses[idx].base, 0.2);
            f.mid.rotation.x = THREE.MathUtils.lerp(f.mid.rotation.x, poses[idx].mid, 0.2);
          });
        }
      } else {
        // Reset camera position to default view
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0.1, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.1, 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 2.2, 0.05);

        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0, 0.1);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, 0.1, 0.1);
        forearmGroup.rotation.x = THREE.MathUtils.lerp(forearmGroup.rotation.x, -0.2, 0.1);

        fingerJointsList.forEach((f) => {
          f.base.rotation.x = THREE.MathUtils.lerp(f.base.rotation.x, 0, 0.1);
          f.mid.rotation.x = THREE.MathUtils.lerp(f.mid.rotation.x, 0, 0.1);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountNode) return;
      const newW = mountNode.clientWidth;
      const newH = mountNode.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      if (mountNode) mountNode.innerHTML = '';
    };
  }, [currentWord, isPlaying]);

  return <div ref={mountRef} className="w-full h-[360px] rounded-2xl overflow-hidden shadow-2xl relative" />;
};
