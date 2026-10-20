"use client";

import { createContext, useContext } from "react";

export type RoomServices = {
  connected: boolean;
  revision: number;
  signedIn: boolean;
  request: (path: string, init?: RequestInit) => Promise<Response>;
  signIn?: () => Promise<void>;
  signOut?: () => Promise<void>;
};

export const RoomServicesContext = createContext<RoomServices>({
  connected: false, revision: 0, signedIn: false,
  request: (path, init) => fetch(path, init),
});

export const useRoomServices = () => useContext(RoomServicesContext);
