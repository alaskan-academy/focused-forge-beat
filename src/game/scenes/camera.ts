import type Phaser from 'phaser';
import { TILE } from '@/lib/coffee/map';

// Zoom inteiro (pixel art nítida) e câmera seguindo o jogador quando o mapa não cabe na tela.
export function layoutCamera(scene: Phaser.Scene, target: Phaser.GameObjects.Sprite, mapTilesW: number, mapTilesH: number) {
  const cam = scene.cameras.main;
  const { width, height } = scene.scale.gameSize;
  const mapW = mapTilesW * TILE;
  const mapH = mapTilesH * TILE;
  let zoom = Math.max(2, Math.floor(Math.min(width / mapW, height / mapH)));
  // celular em pé: sobra altura; aproxima mais se ainda couberem ~7 tiles de largura
  if (height / zoom > mapH && width / (zoom + 1) >= 7 * TILE) zoom++;
  cam.setZoom(zoom);
  cam.setRoundPixels(true);
  const viewW = width / zoom;
  const viewH = height / zoom;
  if (viewW >= mapW && viewH >= mapH) {
    cam.stopFollow();
    cam.removeBounds();
    cam.centerOn(mapW / 2, mapH / 2);
  } else {
    // limites da câmera; no eixo em que o mapa é menor que a tela, centraliza
    const bx = viewW > mapW ? -(viewW - mapW) / 2 : 0;
    const by = viewH > mapH ? -(viewH - mapH) / 2 : 0;
    cam.setBounds(bx, by, Math.max(mapW, viewW), Math.max(mapH, viewH), true);
    cam.startFollow(target, true, 0.15, 0.15);
  }
}

// Mostra o mapa inteiro (modo decorar): zoom fracionado se precisar, sem seguir ninguém.
// bottom: pixels da tela reservados embaixo (barra do modo decorar); o mapa fica acima dela.
export function fitCamera(scene: Phaser.Scene, mapTilesW: number, mapTilesH: number, bottom = 0, margin = 8) {
  const cam = scene.cameras.main;
  const { width, height } = scene.scale.gameSize;
  const reserve = Math.min(bottom, height * 0.45);
  const mapW = mapTilesW * TILE + margin * 2;
  const mapH = mapTilesH * TILE + margin * 2;
  const fit = Math.min(width / mapW, (height - reserve) / mapH);
  const zoom = fit >= 1 ? Math.floor(fit) : fit;
  cam.stopFollow();
  cam.removeBounds();
  cam.setZoom(zoom);
  cam.setRoundPixels(fit >= 1);
  cam.centerOn((mapTilesW * TILE) / 2, (mapTilesH * TILE) / 2 + reserve / 2 / zoom);
}
