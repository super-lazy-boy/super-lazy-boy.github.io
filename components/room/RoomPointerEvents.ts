import {events} from '@react-three/fiber';
import {LatestFrameTask} from '@/lib/latest-frame';

/** Preserve exact R3F picking, but process high-frequency mouse hardware once per frame. */
export function roomPointerEvents(store:Parameters<typeof events>[0]):ReturnType<typeof events>{
  const manager=events(store),handlers=manager.handlers;if(!handlers)return manager;
  const move=new LatestFrameTask<PointerEvent>(event=>handlers.onPointerMove?.(event));
  manager.handlers={...handlers,
    onPointerMove:event=>move.push(event as PointerEvent),
    onPointerDown:event=>{move.cancel();handlers.onPointerDown?.(event);},
    onPointerLeave:event=>{move.cancel();handlers.onPointerLeave?.(event);},
    onPointerCancel:event=>{move.cancel();handlers.onPointerCancel?.(event);}
  };
  const disconnect=manager.disconnect;manager.disconnect=()=>{move.cancel();disconnect?.();};
  return manager;
}
