import { createClient } from './supabase/client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotification() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser');
    return;
  }

  try {
    // 1. Register and Wait for Service Worker
    console.log('Registering Service Worker...');
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready; // Ensure SW is ready
    console.log('Service Worker is ready');

    // Check if in Standalone Mode (Important for iOS)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                         || (window.navigator as any).standalone 
                         || document.referrer.includes('android-app://');
    console.log('Is PWA Standalone Mode:', isStandalone);

    // 2. Request Permission (Must be triggered by user gesture on some browsers)
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    // 3. Subscribe to Push
    console.log('Subscribing to push service...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    });
    console.log('Push subscription successful:', subscription);

    // 4. Save to Supabase (Upsert based on user_id)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('Saving subscription to Supabase for user:', user.id);
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id' // Assuming user_id is unique per subscription for this app
        });
      
      if (error) {
        console.error('Error saving/updating push subscription in Supabase:', error);
      } else {
        console.log('Push subscription synced successfully');
      }
    } else {
       console.warn('No authenticated user found, subscription not saved to DB');
    }
  } catch (error) {
    console.error('Detailed error in registerPushNotification:', error);
  }
}
