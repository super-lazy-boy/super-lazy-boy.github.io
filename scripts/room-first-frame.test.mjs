import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act,Suspense,useCallback,useState} from 'react';
import * as THREE from 'three';
import {createRoot,extend,useFrame} from '@react-three/fiber';
import RoomFirstFrame from '../components/room/RoomFirstFrame.ts';
import RoomPreparation from '../components/room/RoomPreparation.ts';
import RoomSceneContent from '../components/room/RoomSceneContent.ts';
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

test('the complete room waits for slow collectibles, textures, custom models, postprocessing and a real prepared frame',async()=>{
  const pending=Object.fromEntries(['room','collectible','texture','custom'].map(id=>[id,deferred()])),compiled=deferred(),cache=new ModelResourceCache(async url=>pending[url].promise);
  for(const id of Object.keys(pending))void cache.preload(id);
  const errors=[];let notifications=0,setEffects;const onReady=()=>notifications++,onError=e=>errors.push(e);
  const renderTarget=new THREE.WebGLRenderTarget(8,8),target=()=>renderTarget;
  let compileCalls=0;
  const {root,gl,log}=await fixture(function(scene){
    compileCalls++;assert.equal(this.getRenderTarget(),renderTarget,'compile for the same linear target as the composer');
    for(const id of Object.keys(pending))assert.ok(scene.getObjectByName(id),'compile only after '+id+' has committed');
    return compiled.promise;
  });let store;
  function FullRoom(){
    const objects=Object.keys(pending).map(id=>cache.read(id));
    return React.createElement('group',null,...objects.map(object=>React.createElement('primitive',{key:object.name,object})));
  }
  function App(){
    const [prepared,setPrepared]=useState(false),[effects,changeEffects]=useState(false),onPrepared=useCallback(()=>setPrepared(true),[]);setEffects=changeEffects;
    return React.createElement(React.Fragment,null,React.createElement(RoomSceneContent,{mode:'room',room:React.createElement(FullRoom),films:null,books:null,fallback:null,effectsReady:effects,onPrepared,onError,onReady,target}),React.createElement(Draw,{enabled:prepared}));
  }
  try{
    await act(async()=>{store=root.render(React.createElement(App));await tick();});
    await act(async()=>{store.getState().advance(.016);});assert.equal(notifications,0);
    for(const [i,id] of Object.keys(pending).entries()){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());mesh.name=id;
      await act(async()=>{pending[id].resolve(mesh);await pending[id].promise;await tick();store.getState().advance(.032+i*.016);});
      assert.equal(notifications,0,'no reveal after only '+id+' is ready');assert.equal(compileCalls,0,'wait for postprocessing lookup images too');
    }
    await act(async()=>{setEffects(true);await tick();});assert.equal(compileCalls,1);
    await act(async()=>{store.getState().advance(.12);});assert.equal(notifications,0);assert.equal(gl.getRenderTarget(),null,'restore the target while asynchronous compilation is pending');
    await act(async()=>{compiled.resolve();await compiled.promise;await tick();});
    gl.contextLost=true;await act(async()=>{store.getState().advance(.136);});assert.equal(notifications,0,'a lost context cannot report a valid first frame');
    gl.contextLost=false;await act(async()=>{store.getState().advance(.152);});assert.equal(notifications,1);
    for(const id of Object.keys(pending))assert.ok(store.getState().scene.getObjectByName(id),'the presented frame contains '+id);
    await act(async()=>{store.getState().advance(.168);});assert.equal(notifications,1,'later frames cannot restart the startup screen');assert.ok(log.length>0);assert.deepEqual(errors,[]);
  }finally{for(const value of Object.values(pending))value.resolve(new THREE.Group());compiled.resolve();await act(async()=>{await tick();root.unmount();});renderTarget.dispose();}
});

test('film and book archives remove every room collectible from drawing, shadows and picking; return reuses cached assets',async()=>{
  const ids=['millennium-falcon','tardis','anduril','saved-model'];let loads=0;
  const cache=new ModelResourceCache(async()=>{loads++;return ids.map(id=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());mesh.name=id;mesh.castShadow=true;return mesh;});});
  await cache.preload('collection');const {root}=await fixture(async()=>{});let store;
  const noop=()=>{},target=()=>null;
  function Room(){return React.createElement('group',{name:'room-picking',onClick:noop},...cache.read('collection').map(object=>React.createElement('primitive',{key:object.name,object})));}
  function Archive({name}){return React.createElement('mesh',{name,onClick:noop,castShadow:true},React.createElement('boxGeometry'),React.createElement('meshStandardMaterial'));}
  const render=async mode=>act(async()=>{store=root.render(React.createElement(React.Fragment,null,React.createElement(RoomSceneContent,{mode,room:React.createElement(Room),films:React.createElement(Archive,{name:'film-cabinet'}),books:React.createElement(Archive,{name:'book-shelf'}),fallback:null,effectsReady:true,onPrepared:noop,onError:assert.fail,onReady:noop,target}),React.createElement(Draw,{enabled:true})));await tick();});
  try{
    await render('room');assert.ok(store.getState().scene.getObjectByName('millennium-falcon'));
    for(const [mode,name] of [['films','film-cabinet'],['books','book-shelf']]){
      await render(mode);const state=store.getState();state.scene.updateMatrixWorld(true);
      const ray=new THREE.Raycaster(new THREE.Vector3(0,0,5),new THREE.Vector3(0,0,-1));
      assert.ok(state.scene.getObjectByName(name));
      for(const id of ids)assert.equal(state.scene.getObjectByName(id),undefined,id+' cannot render or cast an archive shadow');
      assert.ok(!state.internal.interaction.some(object=>object.name==='room-picking'),'no room event targets remain');
      assert.ok(ray.intersectObjects(state.scene.children,true).every(hit=>!ids.includes(hit.object.name)),'room props cannot intercept cabinet picking');
    }
    await render('room');for(const id of ids)assert.ok(store.getState().scene.getObjectByName(id));assert.equal(loads,1);
  }finally{await act(async()=>root.unmount());}
});

test('shader preparation failures reach recovery without falsely reporting a first frame',async()=>{
  const errors=[];let notified=0;const onError=e=>errors.push(e),{root}=await fixture(async()=>{throw new Error('shader preparation failed');});
  function Body(){return React.createElement(React.Fragment,null,React.createElement(RoomPreparation,{onPrepared:()=>notified++,onError}),React.createElement(RoomFirstFrame,{enabled:false,onReady:()=>notified++}));}
  try{await act(async()=>{root.render(React.createElement(Body));await tick();});assert.equal(notified,0);assert.equal(errors.length,1);assert.match(errors[0].message,/shader preparation failed/);}
  finally{await act(async()=>root.unmount());}
});
