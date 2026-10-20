"use client";
import { createContext, useContext } from "react";
export type Lang="zh"|"en";
export const LanguageContext=createContext<Lang>("zh");
export function useT(){const lang=useContext(LanguageContext);return (zh:string,en:string)=>lang==="zh"?zh:en;}

