import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(request: Request) {
  try {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublic || !vapidPrivate) {
      console.error('VAPID keys are missing in environment variables');
      return NextResponse.json({ 
        success: false, 
        error: '서버 설정 오류: VAPID 키가 누락되었습니다.' 
      }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:support@nanoot.com',
      vapidPublic,
      vapidPrivate
    );

    const { userIds, title, body, coBuyingId } = await request.json();
    const supabase = await createClient();

    // 1. Get subscriptions for target users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')
      .in('user_id', userIds);

    if (subError) throw subError;

    // 2. Perform Push Sending
    let pushResults: any[] = [];
    if (subscriptions && subscriptions.length > 0) {
      console.log(`Sending push to ${subscriptions.length} subscriptions for users: ${userIds}`);
      pushResults = await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
          try {
            await webpush.sendNotification(
              sub.subscription,
              JSON.stringify({ title, body, url: `/my/co-buying/${coBuyingId}` })
            );
            return { success: true, userId: sub.user_id };
          } catch (error: any) {
            console.error(`Push failed for user ${sub.user_id}:`, error);
            // If subscription is expired or invalid, remove it
            if (error.statusCode === 404 || error.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('user_id', sub.user_id);
            }
            return { success: false, userId: sub.user_id, error: error.message };
          }
        })
      );
    } else {
      console.warn(`No subscriptions found for users: ${userIds}`);
    }

    // 3. Save notification to history for ALL targeted users (Bulk Insert)
    // History should be saved even if push subscription is missing or push fails
    const notificationData = userIds.map((uId: string) => ({
      user_id: uId,
      title,
      content: body,
      link_url: `/my/co-buying/${coBuyingId}`,
      is_read: false,
    }));

    if (notificationData.length > 0) {
      const { error: insertError } = await supabase.from('notifications').insert(notificationData);
      if (insertError) {
        console.error('Bulk notification insert failed:', insertError);
        // We don't necessarily want to fail the whole request if history save fails, 
        // but it's good to know.
      } else {
        console.log(`Successfully saved ${notificationData.length} notifications to history.`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      pushCount: subscriptions?.length || 0,
      historyCount: notificationData.length 
    });
  } catch (error: any) {
    console.error('Push API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
