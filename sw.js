// Cache names
const PRE_CACHE_NAME = 'PRE_V6';
const DYNAMIC_CACHE_NAME = 'DYNAMIC_V1';
// Cache assets
const PRE_CACHE_ASSETS = [
	'/',
	'/index.html',

	'resource/app.js',
	'resource/boards.json',
	'resource/style.css',

	'/board/index.html',
	'/board/app.js',
	'/board/form.js',
	'/board/style.css',
	'/board/form.css',

	'/img/apple-touch-icon.png'
];


// cache size limit function
const limitCacheSize = (name, size) => {
	caches.open(name).then(cache => {
		cache.keys().then(keys => {
			if (keys.length > size) {
				cache.delete(keys[0]).then(limitCacheSize(name, size));
			};
		});
	});
};

// install event
self.addEventListener('install', evt => {
	//console.log('service worker installed');
	self.skipWaiting();
	evt.waitUntil(
		caches.open(PRE_CACHE_NAME).then((cache) => {
			console.log('⚙ Service worker: PRE CACHING STARTED');
			cache.addAll(PRE_CACHE_ASSETS);
			console.log('⚙ Service worker: PRE CACHING COMPLETED');
		})
	);
});

// activate event
self.addEventListener('activate', evt => {
	//console.log('service worker activated');
	evt.waitUntil(
		// Delete old caches versions
		caches.keys().then(keys => {
			return Promise.all(keys
				.filter(key => (key !== DYNAMIC_CACHE_NAME) && (key !== PRE_CACHE_NAME))
				.map(key => caches.delete(key))
			);
		})
	);
	self.clients.claim();
});


// fetch event
self.addEventListener('fetch', event => {
	// Let the browser do its default thing
	// for non-GET requests.
	if (event.request.method != 'GET') return;
	// if (event.request.url.contains('wzicaa.deta.dev')) return;
	// console.log(event.request.url)

	// Prevent the default, and handle the request ourselves.
	event.respondWith(async function () {
		// Try to get the response from a cache.
		const cache = await caches.open(PRE_CACHE_NAME);
		const cachedResponse = await cache.match(event.request.url.split("?")[0].split("#")[0]);

		if (cachedResponse) {
			// console.log('cache matched')
			// If we found a match in the cache, return it, but also
			// update the entry in the cache in the background.
			// event.waitUntil(cache.add(event.request));
			return cachedResponse;
		};

		// If we didn't find a match in the cache, use the network.
		return fetch(event.request);
	}());
});