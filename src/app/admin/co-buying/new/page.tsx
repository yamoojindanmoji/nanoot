'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, X, Plus, Minus, Camera } from 'lucide-react';
import Image from 'next/image';
import { CATEGORIES, CategoryValue } from '@/lib/categories';

// CATEGORIES constant removed here, now using import
const FEES = [
  { label: '5%', value: 0.05 },
  { label: '10%', value: 0.10 },
  { label: '15%', value: 0.15 },
  { label: '직접입력', value: 'manual' },
];

interface Option {
  name: string;
  quantity: number;
}

export default function NewCoBuyingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    buildingId: '',
    category: CATEGORIES[0].value as CategoryValue,
    title: '',
    link: '',
    image: null as File | null,
    previewUrl: '',
    price: '' as unknown as number,
    feeType: 0.10 as number | 'manual',
    manualFee: '' as unknown as number,
    unit: '',
    options: [{ name: '', quantity: 1 }] as Option[],
    hostQuantity: 1, // Currently simplifying to single host quantity or per option
    minQuantity: 1,
    deadline: '',
    description: '',
  });

  // Calculate default deadline: 2 days from now
  useEffect(() => {
    const now = new Date();
    const minDate = now.toISOString().slice(0, 16);
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const formattedDate = twoDaysLater.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, deadline: formattedDate }));
  }, []);

  const fetchBuildings = useCallback(async () => {
    const { data: bData } = await supabase.from('buildings').select('id, name');
    if (bData) setBuildings(bData);

    // Get current user's building_id and set as default
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('building_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.building_id) {
        setFormData(prev => ({ ...prev, buildingId: profile.building_id }));
      }
    }
  }, [supabase]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.buildingId || !formData.title || !formData.image) {
        alert('모든 필수 항목(건물, 상품명, 이미지)을 입력해주세요.');
        return;
      }
      setStep(2);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { name: '', quantity: 1 }],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 1) return;
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, field: keyof Option, value: string | number) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  // Calculations
  const priceVal = typeof formData.price === 'number' ? formData.price : 0;
  const manualFeeVal = typeof formData.manualFee === 'number' ? formData.manualFee : 0;
  const calculatedFee = formData.feeType === 'manual' ? manualFeeVal : Math.floor(priceVal * formData.feeType);
  const totalQuantity = formData.options.reduce((sum, opt) => sum + opt.quantity, 0);
  const hostTotalQuantity = formData.hostQuantity;
  const participantQuantity = totalQuantity - hostTotalQuantity;
  
  // 개당 참가액 = (정가 + 수고비) / 총 수량 (소수점 버림)
  const unitPrice = totalQuantity > 0 ? Math.floor((priceVal + calculatedFee) / totalQuantity) : 0;
  // 주최자 지불액 = (정가 / 총 수량) * 주최자 수량
  const hostPay = totalQuantity > 0 ? Math.floor(priceVal / totalQuantity) * formData.hostQuantity : 0;
  // 받을 총 금액 = 개당 참가액 * 참여자 수량
  const totalReceived = participantQuantity * unitPrice;

  const handleSubmit = async () => {
    if (!formData.deadline) {
      alert('마감일을 선택해주세요.');
      return;
    }

    if (new Date(formData.deadline) <= new Date()) {
      alert('마감일은 현재 시간보다 나중이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload Image
      let imageUrl = '';
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('cobuying-images')
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('cobuying-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // 2. Get User
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Insert Co-buying
      const { data: cb, error: cbError } = await supabase
        .from('co_buyings')
        .insert({
          title: formData.title,
          category: formData.category,
          status: 'RECRUITING',
          total_price: formData.price,
          total_quantity: totalQuantity,
          deadline: formData.deadline,
          building_id: formData.buildingId,
          image_url: imageUrl,
          creator_id: user?.id,
          description: formData.description,
          host_quantity: formData.hostQuantity,
          product_link: formData.link,
        })
        .select()
        .single();

      if (cbError) throw cbError;

      // 3. Insert Product Options
      const optionsToInsert = formData.options.map(opt => ({
        co_buying_id: cb.id,
        name: opt.name,
        quantity: opt.quantity,
        price: unitPrice, // Simplified
        unit_description: formData.unit,
        remain_quantity: opt.quantity,
      }));

      const { error: optError } = await supabase
        .from('product_options')
        .insert(optionsToInsert);

      if (optError) throw optError;

      alert('공구가 등록되었습니다.');
      router.push('/');
    } catch (error: any) {
      console.error('Registration Error Details:', error);
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      alert('등록 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen max-w-[440px] mx-auto shadow-xl pb-10">
      <header className="sticky top-0 bg-white z-10 px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <button onClick={() => step === 2 ? setStep(1) : router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">공구 등록 ({step}/2)</h1>
        <div className="w-10" />
      </header>

      {step === 1 ? (
        <div className="p-5 flex flex-col gap-8">
          {/* Building Selector */}
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">건물 선택</label>
            <select
              value={formData.buildingId}
              onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="" disabled hidden>건물을 선택해주세요</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </section>

          {/* Category */}
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">상품 카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.category === cat.value
                      ? 'bg-[#84CC16] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1.5">{cat.emoji}</span>
                  {cat.value}
                </button>
              ))}
            </div>
          </section>

          {/* Product Name */}
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">상품명</label>
            <Input
              placeholder="예) 의성 꿀사과 5kg"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </section>

          {/* Product Link */}
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">상품 링크 (선택)</label>
            <Input
              placeholder="예) 쿠팡, 네이버 쇼핑 링크"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </section>

          {/* Image Upload */}
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">대표 이미지</label>
            <label className="w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden">
              {formData.previewUrl ? (
                <Image src={formData.previewUrl} alt="Preview" width={400} height={400} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="text-gray-400" size={32} />
                  <span className="text-[13px] text-gray-400">사진 직접 등록하기</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </section>

          <Button className="w-full h-14 rounded-2xl font-bold text-lg mt-4" onClick={handleNext}>
            다음
          </Button>
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-8">
          {/* Price & Fee */}
          <section className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">정가(원)</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' as unknown as number : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                수고비 선택
                <div className="group relative">
                  <div className="w-4 h-4 rounded-full border border-gray-400 text-gray-400 text-[10px] flex items-center justify-center cursor-help">?</div>
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-[12px] rounded-xl hidden group-hover:block z-20 shadow-xl leading-relaxed whitespace-pre-wrap">
                    정가 외에 주최자가 노고의 대가로 받는 소액의 비용입니다. (포장, 배분 비용 등)
                  </div>
                </div>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FEES.map(fee => (
                  <button
                    key={fee.label}
                    onClick={() => setFormData({ ...formData, feeType: fee.value as number | 'manual' })}
                    className={`h-11 rounded-xl text-sm font-medium border transition-colors ${
                      formData.feeType === fee.value
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {fee.label}
                  </button>
                ))}
              </div>
              {formData.feeType === 'manual' && (
                <Input
                  className="mt-2"
                  type="number"
                  placeholder="0"
                  value={formData.manualFee}
                  onChange={(e) => setFormData({ ...formData, manualFee: e.target.value === '' ? '' as unknown as number : Number(e.target.value) })}
                />
              )}
              <div className="mt-2 text-[13px] text-gray-400 flex justify-between">
                <span>계산된 수고비</span>
                <span className="font-bold text-gray-900">₩{calculatedFee.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Unit */}
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">단위</label>
            <div className="flex gap-2">
              {['개', 'g', 'L'].map((u) => (
                <button
                  key={u}
                  onClick={() => setFormData({ ...formData, unit: u })}
                  className={`flex-1 h-11 rounded-xl text-sm font-medium border transition-colors ${
                    formData.unit === u
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </section>

          {/* Options */}
          <section className="flex flex-col gap-4">
            <label className="block text-sm font-bold text-gray-900 flex justify-between items-center">
              옵션별 수량
              <button onClick={addOption} className="text-blue-500 text-xs flex items-center gap-1">
                <Plus size={14} /> 옵션 추가
              </button>
            </label>
            {formData.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Input
                  placeholder={formData.title || "옵션명"}
                  className="flex-1"
                  value={opt.name}
                  onChange={(e) => updateOption(idx, 'name', e.target.value)}
                />
                <div className="flex items-center border border-gray-200 rounded-lg h-10 px-1 bg-gray-50">
                  <button onClick={() => updateOption(idx, 'quantity', Math.max(1, opt.quantity - 1))} className="p-1"><Minus size={16} /></button>
                  <span className="w-8 text-center text-sm font-bold">{opt.quantity}</span>
                  <button onClick={() => updateOption(idx, 'quantity', opt.quantity + 1)} className="p-1"><Plus size={16} /></button>
                </div>
                {formData.options.length > 1 && (
                  <button onClick={() => removeOption(idx)} className="text-gray-400"><X size={20} /></button>
                )}
              </div>
            ))}
          </section>

          {/* Quantities */}
          <section className="flex flex-col gap-4 bg-gray-50 p-4 rounded-2xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">내가 살 수량</span>
              <div className="flex items-center border border-gray-200 rounded-lg h-10 px-1 bg-white">
                <button onClick={() => setFormData({ ...formData, hostQuantity: Math.max(1, formData.hostQuantity - 1) })} className="p-1"><Minus size={16} /></button>
                <span className="w-8 text-center text-sm font-bold">{formData.hostQuantity}</span>
                <button onClick={() => setFormData({ ...formData, hostQuantity: Math.min(totalQuantity, formData.hostQuantity + 1) })} className="p-1"><Plus size={16} /></button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">신청자 최소 구매 수량</span>
              <div className="flex items-center border border-gray-200 rounded-lg h-10 px-1 bg-white">
                <button onClick={() => setFormData({ ...formData, minQuantity: Math.max(1, formData.minQuantity - 1) })} className="p-1"><Minus size={16} /></button>
                <span className="w-8 text-center text-sm font-bold">{formData.minQuantity}</span>
                <button onClick={() => setFormData({ ...formData, minQuantity: Math.min(participantQuantity, formData.minQuantity + 1) })} className="p-1"><Plus size={16} /></button>
              </div>
            </div>
          </section>

          {/* Deadline */}
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">모집 마감일</label>
            <Input
              type="datetime-local"
              value={formData.deadline}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </section>

          {/* Description */}
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">안내사항</label>
            <textarea
              placeholder="이웃님들께 공구 안내사항을 입력해주세요"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-[15px] resize-none"
            />
          </section>

          {/* Summary */}
          {priceVal > 0 && (
            <section className="bg-gray-900 text-white p-6 rounded-2xl flex flex-col gap-3">
               <div className="flex justify-between text-gray-400 text-sm">
                  <span>총 수량</span>
                  <span className="text-white font-bold">{totalQuantity}개</span>
               </div>
               <div className="flex justify-between text-gray-400 text-sm">
                  <span>개당 참가액</span>
                  <span className="text-white font-bold text-[#C1EB3B]">₩{unitPrice.toLocaleString()}</span>
               </div>
               <div className="h-px bg-gray-800 my-1" />
               <div className="flex justify-between text-gray-400 text-sm italic">
                  <span>내가 낼 금액 (주최자 {formData.hostQuantity}개)</span>
                  <span className="text-white font-bold">₩{hostPay.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center mt-1">
                  <span className="font-bold">받을 총 금액 (참가자 {participantQuantity}개)</span>
                  <span className="text-xl font-bold text-[#84CC16]">₩{totalReceived.toLocaleString()}</span>
               </div>
            </section>
          )}

          <Button className="w-full h-14 rounded-2xl font-bold text-lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '진행 중...' : '등록하기'}
          </Button>
        </div>
      )}
    </div>
  );
}
