"use client";
import { useEffect, useRef, useState } from 'react';
import TourArrow from './TourArrow';
import { drinks } from '../lib/drinks';
import { desserts } from '../lib/desserts';

export default function ProductCarousel({selected,onSelect,category='coffee'}:{selected:string;onSelect:(name:string)=>void;category?:'coffee'|'dessert'}){
 const isDessert=category==='dessert';
 const items=isDessert?desserts:drinks;
 const trackId=`${category}-track`;
 const titleId=`${category}-carousel-title`;
 const track=useRef<HTMLDivElement>(null);
 const title=useRef<HTMLHeadingElement>(null);
 const drag=useRef({active:false,moved:false,startX:0,startScroll:0});
 const [limits,setLimits]=useState({back:false,next:true});
 useEffect(()=>{
  const list=track.current;if(!list)return;
  const scene=list.closest('main');if(!scene)return;
  title.current?.focus({preventScroll:true});
  const update=()=>{
   const max=Math.max(0,list.scrollWidth-list.clientWidth);
   setLimits({back:list.scrollLeft>2,next:list.scrollLeft<max-2});
   const frame=scene.getBoundingClientRect();
   list.querySelectorAll<HTMLElement>('.drink-card').forEach(card=>{
    const rect=card.getBoundingClientRect();
    card.style.setProperty('--glass-x',`${rect.left-frame.left}px`);
    card.style.setProperty('--glass-y',`${rect.top-frame.top}px`);
    card.style.setProperty('--scene-width',`${frame.width}px`);
    card.style.setProperty('--scene-height',`${frame.height}px`);
    card.dataset.glassReady='true';
   });
  };
  const wheel=(event:WheelEvent)=>{
   if(event.ctrlKey||event.shiftKey||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
   const scale=event.deltaMode===1?24:event.deltaMode===2?list.clientWidth:1;
   const max=list.scrollWidth-list.clientWidth;
   const next=Math.max(0,Math.min(max,list.scrollLeft+event.deltaY*scale));
   if(next!==list.scrollLeft){event.preventDefault();list.scrollLeft=next;}
  };
  update();const observer=new ResizeObserver(update);observer.observe(list);observer.observe(scene);
  list.addEventListener('scroll',update,{passive:true});list.addEventListener('wheel',wheel,{passive:false});
  return()=>{observer.disconnect();list.removeEventListener('scroll',update);list.removeEventListener('wheel',wheel);};
 },[category]);
 function move(direction:number){
  const list=track.current;if(!list)return;
  const card=list.querySelector<HTMLElement>('.drink-card');
  const step=(card?.getBoundingClientRect().width??200)+(parseFloat(getComputedStyle(list).columnGap)||16);
  list.scrollBy({left:direction*step*3,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 return <section className={`coffee-carousel ${isDessert?'dessert-carousel':''}`} aria-labelledby={titleId}>
  <div className="coffee-carousel-heading"><div><h2 id={titleId} ref={title} tabIndex={-1}>{isDessert?'Tatlı bir mola':'Kahve & İçecekler'}</h2><p>{isDessert?'Kahvenizin yanına küçük bir mutluluk.':'Fincanınızı seçin, molanız başlasın.'}</p></div>
   <div className="carousel-controls"><button type="button" aria-label={isDessert?'Önceki tatlıları göster':'Önceki içecekleri göster'} aria-controls={trackId} disabled={!limits.back} onClick={()=>move(-1)}><TourArrow left/></button><button type="button" aria-label={isDessert?'Sonraki tatlıları göster':'Sonraki içecekleri göster'} aria-controls={trackId} disabled={!limits.next} onClick={()=>move(1)}><TourArrow/></button></div>
  </div>
  <div className={`drink-track-wrap ${limits.next?'more-drinks':''}`}>
   <div ref={track} id={trackId} className="drink-track" tabIndex={0} role="region" aria-label={isDessert?'Tatlılar, yatay kaydırın':'İçecekler, yatay kaydırın'}
    onPointerDown={event=>{
     if(event.pointerType!=='mouse'||event.button!==0)return;
     drag.current={active:true,moved:false,startX:event.clientX,startScroll:event.currentTarget.scrollLeft};
    }}
    onPointerMove={event=>{
     const state=drag.current;if(!state.active||event.pointerType!=='mouse')return;
     if(!event.buttons){state.active=false;event.currentTarget.classList.remove('is-dragging');return;}
     const distance=event.clientX-state.startX;
     if(!state.moved&&Math.abs(distance)<6)return;
     if(!state.moved){state.moved=true;event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.classList.add('is-dragging');}
     event.preventDefault();event.currentTarget.scrollLeft=state.startScroll-distance;
    }}
    onPointerUp={event=>{drag.current.active=false;event.currentTarget.classList.remove('is-dragging');if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
    onPointerCancel={event=>{drag.current.active=false;drag.current.moved=false;event.currentTarget.classList.remove('is-dragging');}}
    onPointerLeave={()=>{if(!drag.current.moved)drag.current.active=false;}}
    onClickCapture={event=>{if(drag.current.moved&&event.detail!==0){event.preventDefault();event.stopPropagation();drag.current.moved=false;}}}
    onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}}}>
    {items.map((drink,index)=><button type="button" key={drink.id} className={`drink-card ${selected===drink.name?'drink-selected':''}`} aria-pressed={selected===drink.name} onClick={()=>onSelect(drink.name)}><img src={drink.image} alt="" width={640} height={640} loading={index<7?'eager':'lazy'} draggable={false}/><span className="drink-name">{drink.name}</span>{selected===drink.name&&<span className="drink-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}</button>)}
   </div>
  </div>
  <p className="sr-only" role="status">{selected?`${selected} seçildi.`:isDessert?'Bir tatlı seçin.':'Bir içecek seçin.'}</p>
 </section>;
}
