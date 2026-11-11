"use client";

import type { ReactNode } from "react";
import * as THREE from "three";

/**
 * Surface presets keep every material physically distinct: lacquer reflects a
 * soft highlight, oak stays matte and warm, fabric has sheen but no specular,
 * metal reflects the environment, paper stays completely diffuse.
 */
export type SurfaceKind = "lacquer" | "oak" | "fabric" | "plastic" | "metal" | "paper" | "glass" | "screen" | "tape" | "ceramic";

type Preset = {
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  sheen?: number;
  sheenRoughness?: number;
  envMapIntensity: number;
  ior?: number;
};

export const SURFACES: Record<SurfaceKind, Preset> = {
  lacquer: { roughness: .34, metalness: .02, clearcoat: .55, clearcoatRoughness: .3, envMapIntensity: .8 },
  oak: { roughness: .62, metalness: 0, clearcoat: .08, clearcoatRoughness: .6, envMapIntensity: .45 },
  fabric: { roughness: .97, metalness: 0, sheen: .8, sheenRoughness: .85, envMapIntensity: .16 },
  plastic: { roughness: .44, metalness: .04, clearcoat: .32, clearcoatRoughness: .42, envMapIntensity: .65 },
  metal: { roughness: .3, metalness: .92, envMapIntensity: 1.15 },
  paper: { roughness: 1, metalness: 0, envMapIntensity: .1 },
  glass: { roughness: .06, metalness: 0, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.5, ior: 1.5 },
  screen: { roughness: .16, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.1 },
  tape: { roughness: .55, metalness: .08, clearcoat: .2, clearcoatRoughness: .5, envMapIntensity: .5 },
  ceramic: { roughness: .26, metalness: 0, clearcoat: .85, clearcoatRoughness: .12, envMapIntensity: .95 },
};

type SurfaceProps = {
  kind: SurfaceKind;
  color?: string;
  map?: THREE.Texture | null;
  bumpMap?: THREE.Texture | null;
  bumpScale?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  children?: ReactNode;
};

export function Surface({ kind, color = "#f4f3ef", map, bumpMap, bumpScale, emissive, emissiveIntensity, transparent, opacity, side }: SurfaceProps) {
  const preset = SURFACES[kind];
  return <meshPhysicalMaterial
    color={color}
    map={map || undefined}
    bumpMap={bumpMap || undefined}
    bumpScale={bumpScale ?? .006}
    roughness={preset.roughness}
    metalness={preset.metalness}
    clearcoat={preset.clearcoat ?? 0}
    clearcoatRoughness={preset.clearcoatRoughness ?? .5}
    sheen={preset.sheen ?? 0}
    sheenRoughness={preset.sheenRoughness ?? .5}
    sheenColor="#ffffff"
    envMapIntensity={preset.envMapIntensity}
    ior={preset.ior ?? 1.5}
    emissive={emissive || "#000000"}
    emissiveIntensity={emissiveIntensity ?? 1}
    transparent={!!transparent}
    opacity={opacity ?? 1}
    side={side ?? THREE.FrontSide}
  />;
}
