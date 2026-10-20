import {useEffect,useMemo,useRef,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
import RoomApp from '../components/room/RoomApp';
import {RoomServicesContext} from '../components/room/RoomServices';
import {createRoomRequest} from '../lib/supabase-room';
import {serviceConfig} from '../lib/service-config';
import type {RoomRecord} from '../lib/room-types';
import settings from '../content/services.json';

const config=serviceConfig.parse(settings);
const client=createClient(config.url,config.publishableKey,{
  auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,storage:window.sessionStorage},
});
const request=createRoomRequest(client);

export default function ConnectedRoom({records}:{records:RoomRecord[]}) {
  const [revision,setRevision]=useState(0),[signedIn,setSignedIn]=useState(false);
  const identity=useRef<string|null>(null);
  useEffect(()=>{
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
      const next=session?.user.id||null;
      setSignedIn(!!next);
      if(identity.current!==next){identity.current=next;setRevision(v=>v+1);}
    });
    return()=>subscription.unsubscribe();
  },[]);
  const services=useMemo(()=>({connected:true,revision,signedIn,request,
    signIn:async()=>{
      const response=await fetch(config.url+'/auth/v1/settings',{headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('登录暂时不可用，请稍后重试。');
      const settings=await response.json();
      if(!settings.external?.github)throw new Error('站主登录暂未启用，请稍后再试。');
      sessionStorage.setItem('room-login-zone',location.hash);
      const {error}=await client.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+location.pathname}});
      if(error)throw new Error('GitHub 登录暂时不可用，请稍后重试。');
    },
    signOut:async()=>{const {error}=await client.auth.signOut({scope:'local'});if(error)throw new Error('退出未成功，请重试。');},
  }),[revision,signedIn]);
  useEffect(()=>{
    if(!signedIn)return;
    const zone=sessionStorage.getItem('room-login-zone');
    if(zone&&/^#(overview|office|books|cinema)$/.test(zone)){
      // Keep the restored view after the SDK removes the one-time callback code.
      sessionStorage.removeItem('room-login-zone');
      history.replaceState(null,'',location.pathname+zone);
    }
  },[signedIn]);
  return <RoomServicesContext.Provider value={services}><RoomApp publishedRecords={records}/></RoomServicesContext.Provider>;
}
