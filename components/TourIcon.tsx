export default function TourIcon({terrace=false}:{terrace?:boolean}){
 return <svg className="route-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{terrace?<><path d="M30 54c0-19 8-33 23-43-1 21-9 33-23 31M30 45C15 45 10 33 10 24c13 1 21 9 20 21M18 31l12 15M30 44l15-21"/></>:<><path d="M11 28h36v9a18 18 0 0 1-36 0v-9ZM47 30h4a7 7 0 0 1 0 14h-6M8 53c9 5 35 5 43 0M25 21c-6-6 8-8 3-15M33 22c-5-5 8-7 4-13"/></>}</svg>
}
