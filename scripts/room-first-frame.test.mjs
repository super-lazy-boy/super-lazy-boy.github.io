import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act,Suspense,useCallback,useState} from 'react';
import * as THREE from 'three';
import {createRoot,extend,useFrame} from '@react-three/fiber';
import RoomFirstFrame from '../components/room/RoomFirstFrame.ts';
import RoomPreparation from '../components/room/RoomPreparation.ts';
import {ModelResourceCache} from '../lib/model-resource-cache.ts';
import {useModelPhase,useModelProgress} from '../lib/model-resource-hooks.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
extend(THREE);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

async function fixture(compile){
  // Real React/R3F lifecycle with a CPU renderer double; no browser or GPU is launched.
  const canvas=Object.assign(new EventTarget(),{width:1000,height:600,style:{}}),log=[];let target=null;
  const gl={domElement:canvas,contextLost:false,getContext(){return {isContextLost:()=>this.contextLost};},shadowMap:{},info:{render:{frame:0}},xr:Object.assign(new EventTarget(),{isPresenting:false}),
    setPixelRatio(){},setSize(){},getPixelRatio(){return 1;},getRenderTarget(){return target;},setRenderTarget(value){target=value;},render(scene){log.push(scene.children.map(o=>o.name));this.info.render.frame++;},compileAsync:compile};
  const root=createRoot(canvas);await root.configure({gl,size:{width:1000,height:600,top:0,left:0},frameloop:'never',dpr:1});
  return {root,gl,log};
}
function Draw({enabled}){useFrame(({gl,scene,camera})=>{if(enabled)gl.render(scene,camera);},1);return null;}

test('download byte updates refresh the loading label without rerendering the canvas owner',async()=>{
  const pending=deferred();let controls,canvasRenders=0,labelRenders=0;
  const cache=new ModelResourceCache(async(_,ctx)=>{controls=ctx;return pending.promise;}),loaded=cache.preload('room');
  await tick();const {root}=await fixture(async()=>{});
  function CanvasOwner(){useModelPhase(cache,'room');canvasRenders++;return null;}
  function Label(){useModelProgress(cache,'room');labelRenders++;return null;}
  try{
    await act(async()=>{root.render(React.createElement(React.Fragment,null,React.createElement(CanvasOwner),React.createElement(Label)));await tick();});
    const initialCanvas=canvasRenders,initialLabel=labelRenders;
    for(let i=1;i<=8;i++)await act(async()=>{controls.download(i*100,1000);});
    assert.equal(canvasRenders,initialCanvas);assert.ok(labelRenders>initialLabel);
    await act(async()=>{controls.decoding();});assert.ok(canvasRenders>initialCanvas,'phase changes still reach the startup controller');
  }finally{await act(async()=>{pending.resolve({});await loaded;root.unmount();});}
});

test('the room draws only after shaders are prepared, without waiting for a slow collectible',async()=>{
  const main=deferred(),extra=deferred(),compiled=deferred(),cache=new ModelResourceCache(async url=>url==='room'?main.promise:extra.promise);
  const errors=[];let notifications=0;const onReady=()=>notifications++,onError=e=>errors.push(e);
  const renderTarget=new THREE.WebGLRenderTarget(8,8),target=()=>renderTarget;
  const {root,gl,log}=await fixture(function(){assert.equal(this.getRenderTarget(),renderTarget,'compile for the same linear target as the composer');return compiled.promise;});let store;
  function Extra(){const object=cache.read('collectible');return React.createElement('primitive',{object});}
  function Body(){
    const object=cache.read('room'),[prepared,setPrepared]=useState(false),onPrepared=useCallback(()=>setPrepared(true),[]);
    return React.createElement(React.Fragment,null,React.createElement('primitive',{object}),React.createElement(RoomPreparation,{onPrepared,onError,target}),React.createElement(Draw,{enabled:prepared}),React.createElement(RoomFirstFrame,{enabled:prepared,onReady}),React.createElement(Suspense,{fallback:null},React.createElement(Extra)));
  }
  try{
    await act(async()=>{store=root.render(React.createElement(Suspense,{fallback:null},React.createElement(Body)));await tick();});
    await act(async()=>{store.getState().advance(.016);});assert.equal(notifications,0);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());mesh.name='room';
    await act(async()=>{main.resolve(mesh);await main.promise;await tick();});
    await act(async()=>{store.getState().advance(.032);});assert.ok(log.every(frame=>!frame.includes('room')),'room must not draw while shaders are pending');assert.equal(notifications,0);assert.equal(gl.getRenderTarget(),null,'restore the target while asynchronous compilation is pending');
    await act(async()=>{compiled.resolve();await compiled.promise;await tick();});
    gl.contextLost=true;await act(async()=>{store.getState().advance(.048);});assert.equal(notifications,0,'a lost context cannot report a valid first frame');
    gl.contextLost=false;await act(async()=>{store.getState().advance(.056);});assert.equal(notifications,1);assert.ok(log.at(-1).includes('room'));assert.equal(cache.snapshot('collectible').phase,'downloading');
    await act(async()=>{extra.resolve(new THREE.Group());await extra.promise;await tick();store.getState().advance(.064);});
    assert.equal(notifications,1,'later models cannot restart the startup loader');assert.deepEqual(errors,[]);
  }finally{main.resolve(new THREE.Group());extra.resolve(new THREE.Group());compiled.resolve();await act(async()=>{await tick();root.unmount();});renderTarget.dispose();}
});

test('shader preparation failures reach recovery without falsely reporting a first frame',async()=>{
  const errors=[];let notified=0;const onError=e=>errors.push(e),{root}=await fixture(async()=>{throw new Error('shader preparation failed');});
  function Body(){return React.createElement(React.Fragment,null,React.createElement(RoomPreparation,{onPrepared:()=>notified++,onError}),React.createElement(RoomFirstFrame,{enabled:false,onReady:()=>notified++}));}
  try{await act(async()=>{root.render(React.createElement(Body));await tick();});assert.equal(notified,0);assert.equal(errors.length,1);assert.match(errors[0].message,/shader preparation failed/);}
  finally{await act(async()=>root.unmount());}
});
