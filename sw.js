/* 分析ノート Service Worker
   スムーズ更新の方式：新バージョンはすぐには適用せず「待機」させ、
   アプリのバナーからユーザーがタップしたときだけ切り替える。
   キャッシュ（Cache API）は静的ファイルだけを扱い、データ（IndexedDB）には一切触らない
   ＝更新しても手元のデータは消えない。 */
const CACHE='bunseki-note-v1.0.0'; /* リリースごとに上げる（＝sw.jsが変わり、更新が検知される） */
const SHELL=[
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon-180.png'
];

self.addEventListener('install',function(e){
  /* すぐには有効化しない（skipWaitingしない）＝待機状態でバナーを出す */
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL)}).catch(function(err){console.error('[SW] precache',err)}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k)}));
    }).then(function(){return self.clients.claim()})
  );
});

self.addEventListener('message',function(e){
  /* アプリのバナー「最新にする」から呼ばれたら、待機中の新SWを有効化 */
  if(e.data&&e.data.type==='skipWaiting')self.skipWaiting();
});

self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==self.location.origin)return; /* Workerプロキシ等の外部通信はSWを通さない */
  if(req.mode==='navigate'){
    /* ページ遷移はキャッシュのindexを返す（オフラインでも開ける）。無ければネット */
    e.respondWith(caches.match('./index.html').then(function(c){return c||fetch(req)}));
    return;
  }
  e.respondWith(
    caches.match(req).then(function(c){
      return c||fetch(req).then(function(r){
        if(r&&r.ok){var rc=r.clone();caches.open(CACHE).then(function(ca){ca.put(req,rc)})}
        return r;
      });
    })
  );
});
