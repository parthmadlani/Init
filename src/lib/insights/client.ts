'use client';
export function sendActivity(kind:'PAGE_VIEW'|'HEARTBEAT'|'VIDEO_PLAY'|'VIDEO_ERROR',videoId?:string) {
  const pathname=window.location.pathname;
  const lesson=/^\/paths\/([^/]+)\/topics\/([^/]+)$/.exec(pathname);
  const area=lesson?'lesson':pathname.includes('/revision')?'revision':pathname.startsWith('/paths/')?'path':pathname.startsWith('/quizzes/')?'quiz':pathname.startsWith('/collections/')?'collection':pathname.startsWith('/courses')?'courses':pathname==='/wizard'?'wizard':pathname==='/bookmarks'?'bookmarks':pathname==='/profile'?'account':'overview';
  const body={kind,area,...(lesson?{pathId:lesson[1],topicId:lesson[2]}:{}),...(videoId?{videoId}:{})};
  void fetch('/api/insights/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true}).catch(()=>{});
}
