"use client";
import { useEffect, useRef, useState } from "react";
import TerraceTour from "../components/TerraceTour";
import TourArrow from "../components/TourArrow";
import TourIcon from "../components/TourIcon";
import PastryIcon from "../components/PastryIcon";
import ProductCarousel from "../components/ProductCarousel";
type Scene="entrance"|"loadingEntrance"|"entering"|"counter"|"loadingCoffee"|"coffeeApproach"|"coffee"|"loadingDessert"|"dessertApproach"|"dessert"|"returningEntrance"|"returningCounter"|"returningCoffee";
type Category="coffee"|"dessert";
// Keep stop images mounted and decoded before revealing them. The completed
// video remains underneath as a fallback, including on slow image downloads.
function StopImage({visible,src,alt,className=""}:{visible:boolean;src:string;alt:string;className?:string}){
 const [decoded,setDecoded]=useState(false);
 return <img className={`scene stop-image absolute inset-0 h-full w-full object-cover ${className} ${visible&&decoded?"visible-stop":""}`} src={src} alt={alt} aria-hidden={!visible} loading="eager" onLoad={async event=>{const img=event.currentTarget;try{await img.decode();setDecoded(true)}catch{/* Retain the video's last frame if decoding fails. */}}}/>;
}
export default function Cafe(){
 const shell=useRef<HTMLDivElement>(null);
 const [terraceActive,setTerraceActive]=useState(false);
 const [scene,setScene]=useState<Scene>("entrance");const [error,setError]=useState("");const [selected,setSelected]=useState("");const [returnBusy,setReturnBusy]=useState(false);
 const reverseCoffee=useRef<HTMLVideoElement>(null);const coffeeVideo=useRef<HTMLVideoElement>(null);
 const reverseEntrance=useRef<HTMLVideoElement>(null);const reverseDessert=useRef<HTMLVideoElement>(null);const returnTarget=useRef<"entrance"|"counter">("counter");const returning=useRef(false);
 const entranceVideo=useRef<HTMLVideoElement>(null);const dessertVideo=useRef<HTMLVideoElement>(null);const attempt=useRef(0);
 useEffect(()=>{
  if((scene!=="entrance"&&scene!=="counter")||terraceActive||!shell.current)return;
  const container=shell.current;
  const background=container.querySelector<HTMLElement>(".entrance");
  if(!background)return;
  const align=()=>{
   const sceneRect=background.getBoundingClientRect();
   container.querySelectorAll<HTMLElement>(".home-route, .category-choice").forEach(card=>{
    const rect=card.getBoundingClientRect();
    card.style.setProperty("--glass-x",`${rect.left-sceneRect.left}px`);
    card.style.setProperty("--glass-y",`${rect.top-sceneRect.top}px`);
    card.style.setProperty("--scene-width",`${sceneRect.width}px`);
    card.style.setProperty("--scene-height",`${sceneRect.height}px`);
    card.style.setProperty("--glass-image",scene==="counter"?"url(/counter.webp)":"url(/entrance.webp)");
    card.dataset.glassReady="true";
   });
  };
  align();const observer=new ResizeObserver(align);observer.observe(background);
  window.addEventListener("resize",align);
  return()=>{observer.disconnect();window.removeEventListener("resize",align)};
 },[scene,terraceActive]);
 async function playReturn(route:"entrance"|"dessert"|"coffee",offset=0){
  const candidate=route==="entrance"?reverseEntrance.current:route==="coffee"?reverseCoffee.current:reverseDessert.current;if(!candidate)throw new Error("Video unavailable");const player:HTMLVideoElement=candidate;
  if(player.readyState<1)await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(new Error("Video timeout"))},15000);const ready=()=>{cleanup();resolve()};const failed=()=>{cleanup();reject(new Error("Video failed"))};function cleanup(){clearTimeout(timer);player.removeEventListener("loadedmetadata",ready);player.removeEventListener("error",failed)}player.addEventListener("loadedmetadata",ready);player.addEventListener("error",failed);player.load()});
  const position=Math.min(offset,Math.max(0,player.duration-0.05));
  if(Math.abs(player.currentTime-position)>0.01)await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(new Error("Seek timeout"))},10000);const ready=()=>{cleanup();resolve()};function cleanup(){clearTimeout(timer);player.removeEventListener("seeked",ready)}player.addEventListener("seeked",ready);player.currentTime=position});
  setScene(route==="entrance"?"returningEntrance":route==="coffee"?"returningCoffee":"returningCounter");await player.play();
 }
 function finishReturn(target:"entrance"|"counter"|"dessert"|"coffee"){returning.current=false;setReturnBusy(false);setScene(target);}
 async function returnedToCounter(){
  if(!returning.current)return;
  if(returnTarget.current==="entrance")try{await playReturn("entrance")}catch{finishReturn("counter");setError("Dönüş videosu yüklenemedi. Lütfen tekrar deneyin.")}
  else finishReturn("counter");
 }
 async function goBack(target:"entrance"|"counter"){
  if(returning.current||scene==="entrance")return;
  attempt.current++;setError("");setSelected("");returnTarget.current=target;
  const coffeeTime=coffeeVideo.current?.currentTime??0;const entranceTime=entranceVideo.current?.currentTime??0;const dessertTime=dessertVideo.current?.currentTime??0;
  entranceVideo.current?.pause();dessertVideo.current?.pause();coffeeVideo.current?.pause();
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){finishReturn(target);return;}
  returning.current=true;setReturnBusy(true);
  try{
   if(scene==="coffee"||scene==="coffeeApproach")await playReturn("coffee",scene==="coffeeApproach"?Math.max(0,8-coffeeTime):0);
   else if(scene==="dessert"||scene==="dessertApproach")await playReturn("dessert",scene==="dessertApproach"?Math.max(0,8-dessertTime):0);
   else if(scene==="entering")await playReturn("entrance",Math.max(0,8-entranceTime));
   else if(scene==="loadingEntrance")finishReturn("entrance");
   else if(target==="entrance")await playReturn("entrance");
   else finishReturn("counter");
  }catch{finishReturn(scene==="dessert"||scene==="dessertApproach"?"dessert":scene==="coffee"||scene==="coffeeApproach"?"coffee":"counter");setError("Dönüş videosu başlatılamadı. Lütfen tekrar deneyin.")}
 }
 async function travel(category:"entrance"|"dessert"|"coffee"){
  if(category==="entrance"&&scene!=="entrance"||category!=="entrance"&&scene!=="counter")return;
  const player=category==="entrance"?entranceVideo.current:category==="coffee"?coffeeVideo.current:dessertVideo.current;if(!player)return;
  const id=++attempt.current;setError("");setSelected("");
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){setScene(category==="entrance"?"counter":category);return;}
  setScene(category==="entrance"?"loadingEntrance":category==="coffee"?"loadingCoffee":"loadingDessert");player.currentTime=0;
  try{await player.play()}catch{if(id===attempt.current){setScene(category==="entrance"?"entrance":"counter");setError("Video başlatılamadı. Lütfen tekrar deneyin.")}}
 }
 function videoError(category:"entrance"|"dessert"|"coffee"){setScene(s=>category==="entrance"&&(s==="loadingEntrance"||s==="entering")?"entrance":category!=="entrance"&&(s==="loadingDessert"||s==="dessertApproach"||s==="loadingCoffee"||s==="coffeeApproach")?"counter":s);setError("Video yüklenemedi. Lütfen tekrar deneyin.")}
 const atEntrance=scene==="entrance";const isCoffee=scene==="coffee"||scene==="coffeeApproach";const loading=scene==="loadingEntrance"||scene==="loadingDessert"||scene==="loadingCoffee";const category:Category|null=scene==="coffee"?"coffee":scene==="dessert"?"dessert":null;
 const sceneName=scene==="counter"?"Kahve tezgâhı":isCoffee?"Kahve & İçecekler":scene==="dessert"||scene==="dessertApproach"?"Tatlı vitrini":scene==="returningEntrance"?"Girişe dönüş":scene==="returningCounter"||scene==="returningCoffee"?"Tezgâha dönüş":scene==="entering"?"Kafeye giriş":"Giriş";
 return <div ref={shell} className="cafe-shell"><div inert={terraceActive}><main className={`entrance relative isolate min-h-svh overflow-hidden text-[#fff9ee] ${category?"menu-open":""} ${scene==="counter"?"counter-view":""} ${scene==="coffee"?"coffee-menu-view":""} ${scene==="dessert"?"dessert-menu-view":""}`} aria-busy={loading}>
 <img className="scene absolute inset-0 h-full w-full object-cover" src="/entrance.webp" alt="Zeytin Kafe’nin sıcak ve aydınlık iç mekânı" fetchPriority="high"/>
 <video ref={entranceVideo} className={`scene tour-video absolute inset-0 h-full w-full object-cover ${scene==="entering"||scene==="counter"||scene==="loadingCoffee"||scene==="loadingDessert"?"visible-video":""}`} src="/entrance-to-counter.mp4" poster="/entrance.webp" muted playsInline preload="auto" disablePictureInPicture aria-label="Girişten kahve tezgâhına ilerleyiş" onPlaying={()=>setScene(s=>s==="loadingEntrance"?"entering":s)} onEnded={()=>setScene(s=>s==="entering"?"counter":s)} onError={()=>videoError("entrance")}/>
 <StopImage visible={scene==="counter"||scene==="loadingCoffee"||scene==="loadingDessert"} className="counter-scene" src="/counter.webp" alt="Espresso makinesi ve kahve tezgâhı"/>
 <video ref={coffeeVideo} className={`scene tour-video absolute inset-0 h-full w-full object-cover ${scene==="coffeeApproach"||scene==="coffee"?"visible-video":""}`} src="/counter-to-coffee.mp4" poster="/counter.webp" muted playsInline preload="metadata" disablePictureInPicture aria-label="Tezgâhtan espresso makinesine ilerleyiş" onPlaying={()=>setScene(s=>s==="loadingCoffee"?"coffeeApproach":s)} onEnded={()=>setScene(s=>s==="coffeeApproach"?"coffee":s)} onError={()=>videoError("coffee")}/>
 <StopImage visible={scene==="coffee"} src="/coffee.webp" alt="Espresso makinesinin yakın görünümü"/>
 <video ref={dessertVideo} className={`scene tour-video absolute inset-0 h-full w-full object-cover ${scene==="dessertApproach"||scene==="dessert"?"visible-video":""}`} src="/counter-to-dessert.mp4" poster="/counter.webp" muted playsInline preload="metadata" disablePictureInPicture aria-label="Tezgâhtan tatlı vitrinine ilerleyiş" onPlaying={()=>setScene(s=>s==="loadingDessert"?"dessertApproach":s)} onEnded={()=>setScene(s=>s==="dessertApproach"?"dessert":s)} onError={()=>videoError("dessert")}/>
 <StopImage visible={scene==="dessert"} className="dessert-scene" src="/dessert.webp" alt="Üç raflı tatlı vitrini"/>
 <video ref={reverseEntrance} className={`scene tour-video absolute inset-0 h-full w-full object-cover ${scene==="returningEntrance"?"visible-video":""}`} src="/counter-to-entrance.mp4" poster="/counter.webp" muted playsInline preload="metadata" disablePictureInPicture aria-label="Kahve tezgâhından girişe geri dönüş" onEnded={()=>{if(returning.current)finishReturn("entrance")}}/>
 <video ref={reverseDessert} className={`scene tour-video absolute inset-0 h-full w-full object-cover ${scene==="returningCounter"?"visible-video":""}`} src="/dessert-to-counter.mp4" poster="/dessert.webp" muted playsInline preload="metadata" disablePictureInPicture aria-label="Tatlı vitrininden tezgâha geri dönüş" onEnded={returnedToCounter}/>
 <video ref={reverseCoffee} className={`scene tour-video absolute inset-0 h-full w-full object-cover ${scene==="returningCoffee"?"visible-video":""}`} src="/coffee-to-counter.mp4" poster="/coffee.webp" muted playsInline preload="metadata" disablePictureInPicture aria-label="Espresso makinesinden tezgâha geri dönüş" onEnded={returnedToCounter}/>
 <div className={`shade absolute inset-0 ${!atEntrance?"shade-tour":""}`} aria-hidden="true"/>
 <header className="topbar absolute inset-x-0 top-0 z-10 flex items-center justify-between"><a href="/" onClick={e=>{e.preventDefault();goBack("entrance")}} className="brand" aria-label="Zeytin Kafe, girişe dön"><span className="brand-mark" aria-hidden="true">✳</span><span>zeytin<small>KAHVE & PASTANE</small></span></a>{atEntrance?<span className="header-note">Bir fincanla yavaşla.</span>:<button className="back-button" disabled={returnBusy} onClick={()=>goBack(scene==="counter"||scene==="entering"||scene==="loadingEntrance"?"entrance":"counter")}>{returnBusy?"Geri dönülüyor…":scene==="counter"||scene==="entering"||scene==="loadingEntrance"?"← Girişe dön":"← Tezgâha dön"}</button>}</header>
 {atEntrance&&<section className="invitation absolute z-10" aria-labelledby="title"><p className="eyebrow">KENDİNE BİR MOLA VER</p><h1 id="title"><span>Küçük bir mola.</span><span>Bir fincan kahve</span></h1><p className="intro">İçeri gel, favori köşeni bul.</p><p className="welcome" role="status">{error}</p></section>}
 {atEntrance&&<button className="home-route home-coffee-route" onClick={()=>travel("entrance")}><TourIcon/><span>Kafeye gir</span><TourArrow/></button>}
 {loading&&<div className="loading-state" role="status"><span className="spinner" aria-hidden="true"/>{scene==="loadingDessert"?"Tatlı vitrini hazırlanıyor…":scene==="loadingCoffee"?"Kahve bölümü hazırlanıyor…":"Kafe hazırlanıyor…"}</div>}
 {scene==="counter"&&<section className="counter-welcome choice-panel" aria-labelledby="counter-title"><p className="eyebrow">İYİ Kİ GELDİNİZ</p><h1 id="counter-title">Ne almak istersiniz?</h1><p className="intro">Bir kahve molası mı, tatlı bir kaçamak mı?</p><div className="category-choices"><button className="category-choice" onClick={()=>travel("coffee")}><TourIcon/><span><strong>Kahve & İçecekler</strong><small>Kahve menüsünü keşfet</small></span><TourArrow/></button><button className="category-choice" onClick={()=>travel("dessert")}><PastryIcon/><span><strong>Tatlılar</strong><small>Vitrindeki lezzetleri keşfet</small></span><TourArrow/></button></div><p className="welcome" role="status">{error}</p></section>}
 {category&&<ProductCarousel key={category} category={category} selected={selected} onSelect={setSelected}/>}
 <p className="sr-only" aria-live="polite">{scene==="counter"?"Tezgâha ulaştınız. Kahve veya tatlı seçebilirsiniz.":scene==="dessertApproach"?"Tatlı vitrinine ilerliyorsunuz.":scene==="coffeeApproach"?"Espresso makinesine yaklaşıyorsunuz.":""}</p>
 <footer className="bottom-bar absolute inset-x-0 bottom-0 z-10 flex items-center justify-between"><span className="footer-word">SAKİN ANLAR. GÜZEL KAHVE.</span><span className="scene-number"><span>{category?"03":scene==="counter"?"02":"01"}</span><i aria-hidden="true"/>{sceneName}</span></footer>
 </main></div><TerraceTour available={atEntrance} onActive={setTerraceActive}/></div>
}
