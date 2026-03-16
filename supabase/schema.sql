-- ==========================================
-- 나눗(nanoot) DB 초안 스키마 (Supabase)
-- ==========================================

-- 1. Users 테이블 (auth.users의 부가정보)
-- Supabase의 Auth 사용 시 id는 auth.users의 id(UUID)를 FK로 사용
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    profile_image_url TEXT,
    building_id UUID,                     -- 건물 ID
    role VARCHAR(50) DEFAULT 'USER',      -- ADMIN / USER
    create_permission BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Buildings 테이블 (건물/아파트 정보)
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    invite_code VARCHAR(100) UNIQUE,
    open_chat_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- users.building_id를 buildings.id에 FK 연결
ALTER TABLE users ADD CONSTRAINT fk_user_building
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;


-- 3. CoBuyings 테이블 (공동구매 정보)
-- 상태 코드: RECRUITING, PAYMENT_WAITING, ORDER_IN_PROGRESS, READY_FOR_PICKUP, COMPLETED, RECRUITING_FAILED, CANCELLED
CREATE TABLE co_buyings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    status VARCHAR(50) DEFAULT 'RECRUITING' NOT NULL,
    total_price INTEGER DEFAULT 0 NOT NULL,
    total_quantity INTEGER DEFAULT 0 NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    pay_deadline TIMESTAMP WITH TIME ZONE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE, 
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,     
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 4. ProductOptions 테이블 (공구의 구체적 상품/옵션)
CREATE TABLE product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    co_buying_id UUID NOT NULL REFERENCES co_buyings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 0 NOT NULL,         -- 모집 목표 또는 초기 수량
    unit_description VARCHAR(255),               -- "1박스(10개)", "1kg" 등
    remain_quantity INTEGER,                     -- 옵션별 잔여 수량 설정 가능할 시
    price INTEGER DEFAULT 0 NOT NULL,            -- 옵션 당 가격
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 5. Joiners 테이블 (공동구매 참여 내역)
CREATE TABLE joiners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    co_buying_id UUID NOT NULL REFERENCES co_buyings(id) ON DELETE CASCADE,
    joiner_total_pay INTEGER DEFAULT 0 NOT NULL,
    joiner_total_quantity INTEGER DEFAULT 0 NOT NULL,
    pay_status VARCHAR(50) DEFAULT 'UNPAID',        -- UNPAID, PAID, REFUNDED 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- 한 사용자가 같은 공구에 여러 번 참여하는 것을 막으려면 UNIQUE 제약:
    UNIQUE (user_id, co_buying_id)
);


-- 6. JoinerProductDetails 테이블 (참여자의 옵션별 상세 내역)
CREATE TABLE joiner_product_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    joiner_id UUID NOT NULL REFERENCES joiners(id) ON DELETE CASCADE,
    product_option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    joiner_quantity INTEGER DEFAULT 1 NOT NULL,     -- 구매 수량
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (joiner_id, product_option_id)
);

-- ==========================================
-- Update triggering function for update_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 추가
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_buildings_modtime BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_cobuyings_modtime BEFORE UPDATE ON co_buyings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_productoptions_modtime BEFORE UPDATE ON product_options FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_joiners_modtime BEFORE UPDATE ON joiners FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_joinerdetails_modtime BEFORE UPDATE ON joiner_product_details FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
