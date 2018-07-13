importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v24';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/utility.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(function (cache) {
//       return cache.keys().then(function (keys) {
//         if (keys.length > maxItems) {
//           cache.delete(keys[0])
//             .then(trimCache(cacheName, maxItems))
//         }
//       })
//     })

// }

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(caches.open(CACHE_STATIC_NAME)
    .then(function (cache) {
      console.log('[Service Worker] Precaching App shell');
      cache.addAll(STATIC_FILES);
    }));
});

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
    .then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

//Se conseguir conectar na rede, responde que o request. Caso contrário, usa o cache
// self.addEventListener('fetch', function (event) {
//   debugger;
//   event.respondWith(
//     fetch(event.request)
//     .then(function (response) {
//       return caches.open(CACHE_DYNAMIC_NAME)
//         .then(function (cache) {
//           cache.put(event.request, response.clone());
//           return response;
//         })
//     })
//     .catch(function (err) {
//       if (err.message == "Failed to fetch") {
//         return caches.match(event.request)
//           .then(function (res) {
//             if (res) {
//               return res;
//             } else {
//               return event.response;
//             }
//           })
//       }
//     })
//   )
// });


// Cache with network fallback
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//     .then(function (response) {
//       if (response) {
//         return response;
//       } else {
//         return fetch(event.request)
//           .then(function (res) {
//             return caches.open(CACHE_DYNAMIC_NAME)
//               .then(function (cache) {
//                 cache.put(event.request.url, res.clone());
//                 return res;
//               });
//           })
//           .catch(function (err) {
//             return caches.open(CACHE_STATIC_NAME)
//             .then(function (cache) {
//               return cache.match('/offline.html');
//             })
//           });
//       }
//     })
//   );
// });

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    console.log('matched', string);
    cachePath = string.substring(self.origin.length);
  } else {
    cachePath = string;
  }
  return array.indexOf(cachePath) > -1;
}

// Cache then network
self.addEventListener('fetch', function (event) {
  var url = 'https://pwagram-7edc8.firebaseio.com/posts';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData('posts', data[key]);
            }
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      caches.match(event.request)
    );
  } else {
    event.respondWith(
      caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function (cache) {
                  // trimCache(CACHE_DYNAMIC_NAME, 3);
                  cache.put(event.request.url, res.clone());
                  return res;
                })
            })
            .catch(function (err) {
              return caches.open(CACHE_STATIC_NAME)
                .then(function (cache) {
                  if (event.request.headers.get('accept').includes('text/html')) {
                    return cache.match('/offline.html');
                  }
                })

            })
        }
      })
    );
  }
});



//Cache only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

//Network only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });


//Network then cache
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//     .then(function (response) {
//       return caches.open(CACHE_DYNAMIC_NAME)
//         .then(function (cache) {
//           cache.put(event.request.url, response.clone());
//           return response;
//         })
//     })
//     .catch(function (err) {
//       return caches.match(event.request);
//     }));
// });

self.addEventListener('sync', function (evt) {
  debugger;
  console.log('[Service Worker] Background Syncing', evt);
  if (evt.tag === 'sync-new-posts') {
    console.log('[Service Workder] Syncing new Posts');
    evt.waitUntil(
      readAllData('sync-posts')
      .then(function (data) {
        for (var dt of data) {
          fetch('https://pwagram-7edc8.firebaseio.com/posts.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-7edc8.appspot.com/o/sf-boat.jpg?alt=media&token=a001905a-4c52-4903-a485-522c2b7012f4'
              })
            })
            .then(function (res) {
              console.log('Sent data', res);
              if (res.ok) {
                deleteItemFromData('sync-posts', dt.id);
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        }
      })
    );
  }
});

self.addEventListener('push', function (evt) {
  debugger;
});