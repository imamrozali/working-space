import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isOriginAllowed, isPrivateOrLocalHost } from '../src/origins.js';

describe('web-service origins validator', () => {
  it('allows empty/undefined origin (e.g. desktop/mobile native clients)', () => {
    assert.equal(isOriginAllowed(undefined), true);
    assert.equal(isOriginAllowed(''), true);
  });

  it('allows standard localhost and loopback origins', () => {
    assert.equal(isOriginAllowed('http://localhost:38291'), true);
    assert.equal(isOriginAllowed('http://127.0.0.1:38291'), true);
    assert.equal(isOriginAllowed('http://localhost:1420'), true);
    assert.equal(isOriginAllowed('http://localhost:1421'), true);
    assert.equal(isOriginAllowed('http://tauri.localhost'), true);
    assert.equal(isOriginAllowed('tauri://localhost'), true);
  });

  it('allows local LAN private subnet IPs in development mode', () => {
    assert.equal(isOriginAllowed('http://192.168.1.100:38291'), true);
    assert.equal(isOriginAllowed('http://10.0.0.5:1421'), true);
    assert.equal(isOriginAllowed('http://172.20.10.2:38291'), true);
    assert.equal(isOriginAllowed('http://my-macbook.local:38291'), true);
  });

  it('correctly validates private vs public hosts', () => {
    assert.equal(isPrivateOrLocalHost('localhost'), true);
    assert.equal(isPrivateOrLocalHost('127.0.0.1'), true);
    assert.equal(isPrivateOrLocalHost('192.168.0.1'), true);
    assert.equal(isPrivateOrLocalHost('10.1.2.3'), true);
    assert.equal(isPrivateOrLocalHost('172.16.0.1'), true);
    assert.equal(isPrivateOrLocalHost('172.31.255.255'), true);
    assert.equal(isPrivateOrLocalHost('172.32.0.1'), false); // Outside private 172.16-31 range
    assert.equal(isPrivateOrLocalHost('example.com'), false);
    assert.equal(isPrivateOrLocalHost('malicious-site.org'), false);
  });
});

