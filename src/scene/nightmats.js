import * as THREE from 'three';

/** Materiales compartidos que se encienden de noche (ventanas y farolas del pueblo, de los POI, etc.). */
export const WINMAT = new THREE.MeshStandardMaterial({ color: '#cfe8f2', emissive: '#ffd27a', emissiveIntensity: 0, roughness: 0.3 });
export const LAMPMAT = new THREE.MeshStandardMaterial({ color: '#fff1c8', emissive: '#ffb84a', emissiveIntensity: 0.3 });
export const updateNightMats = (n) => { WINMAT.emissiveIntensity = n * 1.6; LAMPMAT.emissiveIntensity = 0.25 + n * 2.2; };
