import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:support@nanoot.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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

    if (!subscriptions || subscriptions.length === 0) {
      console.warn(`No subscriptions found for users: ${userIds}`);
      return NextResponse.json({ 
        success: false, 
        error: '대상 유저의 푸시 구독 정보가 없습니다. (알림 권한 미허용 등)' 
      });
    }

    console.log(`Sending push to ${subscriptions.length} subscriptions`);

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({ title, body, url: `/my/co-buying/${coBuyingId}` })
          );

          // 2. Save notification to history
          await supabase.from('notifications').insert({
            user_id: sub.user_id,
            title,
            content: body,
            link_url: `/my/co-buying/${coBuyingId}`,
            is_read: false,
          });

          return { success: true, userId: sub.user_id };
        } catch (error: any) {
          console.error(`Push failed for user ${sub.user_id}:`, error);
          
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', sub.user_id);
          }
          return { success: false, userId: sub.user_id, error: error.message };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Push API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
