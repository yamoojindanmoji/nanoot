// Dummy generation helper
export const mockCoBuyings = [
  {
    id: '1',
    title: '성주 꿀참외 3kg (10~13과) 직거래',
    category: '과일/채소',
    status: 'RECRUITING',
    totalQuantity: 20,
    currentQuantity: 12,
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days later
    thumbnailUrl: 'https://images.unsplash.com/photo-1590481845199-3543ebce321f?q=80&w=2670&auto=format&fit=crop'
  },
  {
    id: '2',
    title: '동원참치 라이트스탠다드 135g x 30캔',
    category: '가공식품',
    status: 'PAYMENT_WAITING',
    totalQuantity: 30,
    currentQuantity: 30,
    deadline: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    thumbnailUrl: 'https://images.unsplash.com/photo-1599813203991-343d043d937a?q=80&w=2574&auto=format&fit=crop'
  },
  {
    id: '3',
    title: '친환경 세탁세제 대용량 5L 나눔',
    category: '생활용품',
    status: 'RECRUITING',
    totalQuantity: 10,
    currentQuantity: 2,
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
    thumbnailUrl: ''
  }
];
