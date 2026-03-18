'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 단순 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 1. Supabase Auth 계정 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Postgres `users` 테이블에 추가 정보 (name, nickname) 삽입
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // 필수 (FK to auth.users)
          name: formData.name,
          nickname: formData.nickname,
          email: formData.email,
        });

      if (dbError) {
        console.error('DB Insert Error:', dbError);
        setError('프로필 생성 중 오류가 발생했습니다.');
        
        // 롤백 전략이 필요할 수 있으나 MVP 수준에서는 생략
        setIsLoading(false);
        return;
      }

      // 가입 성공! 회원가입 완료 후 바로 건물 인증으로 넘기기.
      // (Supabase 설정에 따라 Email Confirm이 필수라면 이메일 확인이 필요할 수 있습니다.
      // 현재는 confirm 필요 없다고 가정하고 리디렉션)
      router.push('/building/setup');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 px-6 pt-12 pb-8 overflow-y-auto">
      <button 
        onClick={() => router.back()}
        className="self-start mb-6 p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <h1 className="text-2xl font-bold mb-2">반가워요!</h1>
      <p className="text-gray-500 mb-8 text-sm">나눗에 오신 것을 환영합니다.<br/>시작하기 위해 계정을 만들어주세요.</p>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-600 bg-red-100/50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-5 flex-1">
        <Input
          label="이름"
          name="name"
          placeholder="실명을 입력해주세요"
          required
          value={formData.name}
          onChange={handleChange}
        />
        
        <Input
          label="닉네임"
          name="nickname"
          placeholder="사용하실 닉네임을 입력해주세요"
          required
          value={formData.nickname}
          onChange={handleChange}
        />
        
        <Input
          label="이메일"
          name="email"
          type="email"
          placeholder="example@email.com"
          required
          value={formData.email}
          onChange={handleChange}
        />
        
        <Input
          label="비밀번호"
          name="password"
          type="password"
          placeholder="8자 이상, 영문/숫자/특수문자 포함"
          required
          minLength={6}
          value={formData.password}
          onChange={handleChange}
        />
        
        <Input
          label="비밀번호 확인"
          name="confirmPassword"
          type="password"
          placeholder="비밀번호를 다시 한 번 입력해주세요"
          required
          minLength={6}
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <div className="mt-8 mb-4">
          <Button type="submit" className="w-full text-[15px]" disabled={isLoading}>
            {isLoading ? '가입 중...' : '회원가입 완료'}
          </Button>
        </div>
      </form>

      <div className="flex justify-center text-[13px] gap-2 mt-auto pt-4 border-t border-gray-100">
        <span className="text-gray-500">이미 계정이 있으신가요?</span>
        <button onClick={() => router.push('/login')} className="font-semibold text-gray-900 underline">
          로그인
        </button>
      </div>
    </div>
  );
}
