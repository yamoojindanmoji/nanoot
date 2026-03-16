-- ==========================================
-- 나눗(nanoot) 테스트용 시드 데이터 (Seed Data)
-- 건물 인증 테스트 및 UI 확인용
-- ==========================================

-- 1. 더미 건물 데이터 추가
INSERT INTO buildings (name, address, invite_code, open_chat_link) 
VALUES 
  ('나눗아파트 1단지', '서울시 동작구 상도동 123-45', 'NANOOT1', 'https://open.kakao.com/o/demo1'),
  ('새싹오피스텔', '서울시 영등포구 문래동 67-89', 'SESAC24', 'https://open.kakao.com/o/demo2')
ON CONFLICT (invite_code) DO NOTHING;

-- 테스트용 건물 확인 쿼리 (실행 결과 확인용)
-- SELECT * FROM buildings;

-- 2. 테스트용 공구 개설자(유저) 식별용 더미 데이터
-- (주의: users 테이블은 auth.users와 연결되어 있으므로 실제 가입된 유저 ID가 필요합니다.)
-- 따라서 여기서는 auth 트리거 대신, 가짜 UUID로 auth.users와 users에 억지 데이터를 넣거나 
-- 혹은 실제 가입한 유저의 building_id를 활용해 공구를 넣는 방식을 사용해야 합니다.
-- 
-- 임시로 아무 유저나 하나 배정하는 건 위험하므로, co_buyings의 creator_id를 당분간 NULL로 허용하거나
-- 직접 가입하신 본인 계정 UUID를 알아내어 연결해야 완벽합니다.
-- 아래는 creator_id 없이 건물 ID만 지정해 공구를 올리는 더미입니다.

DO $$
DECLARE
  v_building_id uuid;
  v_cobuying_id1 uuid;
  v_cobuying_id2 uuid;
BEGIN
  -- 앞서 생성한 NANOOT1 건물 ID 가져오기
  SELECT id INTO v_building_id FROM buildings WHERE invite_code = 'NANOOT1' LIMIT 1;

  IF v_building_id IS NOT NULL THEN
    -- 첫 번째 공구 (성주 꿀참외)
    INSERT INTO co_buyings (title, category, status, total_price, total_quantity, deadline, building_id)
    VALUES (
      '성주 꿀참외 3kg (10~13과) 직거래', 
      '과일/채소', 
      'RECRUITING', 
      0, 20, 
      (now() + interval '3 days'), 
      v_building_id
    ) RETURNING id INTO v_cobuying_id1;

    -- 첫 번째 공구의 옵션들
    INSERT INTO product_options (co_buying_id, name, quantity, unit_description, price)
    VALUES 
      (v_cobuying_id1, '참외 3kg (10과 내외)', 10, '1박스', 20000),
      (v_cobuying_id1, '참외 5kg (15과 내외)', 10, '1박스', 32000);

    -- 두 번째 공구 (동원참치)
    INSERT INTO co_buyings (title, category, status, total_price, total_quantity, deadline, building_id)
    VALUES (
      '동원참치 라이트스탠다드 135g x 30캔', 
      '가공식품', 
      'PAYMENT_WAITING', 
      0, 30, 
      (now() - interval '1 days'), 
      v_building_id
    ) RETURNING id INTO v_cobuying_id2;

     -- 두 번째 공구의 옵션
    INSERT INTO product_options (co_buying_id, name, quantity, unit_description, price)
    VALUES 
      (v_cobuying_id2, '참치 30캔 세트', 30, '1박스', 25000);
  END IF;
END $$;
