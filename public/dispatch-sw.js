self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? '🚗 お客様来店', {
      body: data.body ?? '担当するボタンを押してください',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'dispatch',
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/dispatch') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/dispatch/staff');
    })
  );
});
