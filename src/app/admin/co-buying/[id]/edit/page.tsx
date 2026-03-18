'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, use, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, Camera } from 'lucide-react';

const CATEGORIES = ['전체', '생필품', '과일·신선식품', '가공품', '냉동식품'];

export default function EditCoBuyingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    buildingId: '',
    category: '전체',
    title: '',
    link: '',
    image: null as File | null,
    previewUrl: '',
    price: 0,
    feeType: 0.10 as number | 'manual',
    manualFee: 0,
    unit: '',
    options: [{ id: '', name: '', quantity: 1 }] as { id: string; name: string; quantity: number }[],
    hostQuantity: 1,
    minQuantity: 1,
    deadline: '',
    status: '',
  });

  const fetchData = useCallback(async () => {
    // Fetch Buildings
    const { data: bData } = await supabase.from('buildings').select('id, name');
    if (bData) setBuildings(bData);

    // Fetch Co-buying
    const { data: cb, error: cbError } = await supabase
      .from('co_buyings')
      .select('*, product_options(*)')
      .eq('id', id)
      .single();

    if (cbError) {
      alert('데이터를 불러오지 못했습니다.');
      router.push('/admin');
      return;
    }

    interface RawProductOption {
      id: string;
      name: string;
      quantity: number;
      unit_description?: string;
    }

    setFormData({
      buildingId: cb.building_id,
      category: cb.category || '전체',
      title: cb.title,
      link: '', // Not stored in DB yet
      image: null,
      previewUrl: cb.image_url || '',
      price: cb.total_price,
      feeType: 0.10, // Placeholder calculation
      manualFee: 0,
      unit: cb.product_options?.[0]?.unit_description || '',
      options: (cb.product_options as RawProductOption[])?.map((opt) => ({
        id: opt.id,
        name: opt.name,
        quantity: opt.quantity,
      })) || [{ id: '', name: '', quantity: 1 }],
      hostQuantity: 1, // Placeholder
      minQuantity: 1,
      deadline: new Date(cb.deadline).toISOString().slice(0, 16),
      status: cb.status,
    });
    setIsLoading(false);
  }, [id, router, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNext = () => setStep(2);

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
      options: [...formData.options, { id: '', name: '', quantity: 1 }],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 1) return;
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, field: string, value: string | number) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const calculatedFee = formData.feeType === 'manual' ? formData.manualFee : Math.floor(formData.price * (formData.feeType as number));
  const totalQuantity = formData.options.reduce((sum, opt) => sum + opt.quantity, 0);
  const participantQuantity = totalQuantity - formData.hostQuantity;
  const unitPrice = formData.price + calculatedFee;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let imageUrl = formData.previewUrl;
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        await supabase.storage.from('co-buying-images').upload(fileName, formData.image);
        const { data: { publicUrl } } = supabase.storage.from('co-buying-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // 1. Update Co-buying
      const { error: cbError } = await supabase
        .from('co_buyings')
        .update({
          title: formData.title,
          category: formData.category,
          total_price: formData.price,
          total_quantity: totalQuantity,
          deadline: formData.deadline,
          building_id: formData.buildingId,
          image_url: imageUrl,
        })
        .eq('id', id);

      if (cbError) throw cbError;

      // 2. Update Product Options (Simplified: Delete then Re-insert for now)
      await supabase.from('product_options').delete().eq('co_buying_id', id);
      const optionsToInsert = formData.options.map(opt => ({
        co_buying_id: id,
        name: opt.name,
        quantity: opt.quantity,
        price: unitPrice,
        unit_description: formData.unit,
        remain_quantity: opt.quantity,
      }));
      await supabase.from('product_options').insert(optionsToInsert);

      alert('수정되었습니다.');
      router.push('/admin');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert('오류: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (formData.status !== 'RECRUITING') {
      alert('모집 중 상태인 공구만 삭제할 수 있습니다.');
      return;
    }
    if (!confirm('정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) return;

    const { error } = await supabase.from('co_buyings').delete().eq('id', id);
    if (error) alert('삭제 실패');
    else {
      alert('삭제되었습니다.');
      router.push('/admin');
    }
  };

  if (isLoading) return <div className="p-10 text-center">불러오는 중...</div>;

  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen max-w-[440px] mx-auto shadow-xl pb-10">
      <header className="sticky top-0 bg-white z-10 px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <button onClick={() => step === 2 ? setStep(1) : router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">공구 수정 ({step}/2)</h1>
        <button onClick={handleDelete} className="text-red-500 text-sm font-bold">삭제</button>
      </header>

      {step === 1 ? (
        <div className="p-5 flex flex-col gap-6">
          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">건물 선택</label>
            <select
              value={formData.buildingId}
              onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white"
            >
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </section>

          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">상품 카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${formData.category === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">상품명</label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </section>

          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">대표 이미지</label>
            <label className="w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
              {formData.previewUrl ? <Image src={formData.previewUrl} alt="Preview" width={400} height={400} className="w-full h-full object-cover" /> : <Camera className="text-gray-400" size={32} />}
              <input type="file" className="hidden" onChange={handleImageChange} />
            </label>
          </section>

          <Button className="w-full h-14 rounded-2xl font-bold mt-4" onClick={handleNext}>다음</Button>
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-8">
          {/* Step 2 Content restored from registration page */}
          <section className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">정가(원)</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">수고비 설정</label>
              <Input
                type="number"
                placeholder="금액 직접 입력"
                value={formData.manualFee}
                onChange={(e) => setFormData({ ...formData, manualFee: Number(e.target.value), feeType: 'manual' })}
              />
              <div className="mt-2 text-[13px] text-gray-400 flex justify-between">
                <span>적용된 수고비</span>
                <span className="font-bold text-gray-900">₩{calculatedFee.toLocaleString()}</span>
              </div>
            </div>
          </section>

          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">단위</label>
            <Input
              placeholder="예) 개, g, L"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </section>

          <section className="flex flex-col gap-4">
            <label className="block text-sm font-bold text-gray-900 flex justify-between items-center">
              옵션별 수량
              <button onClick={addOption} className="text-blue-500 text-xs flex items-center gap-1">
                + 옵션 추가
              </button>
            </label>
            {formData.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Input
                  placeholder="옵션명"
                  className="flex-1"
                  value={opt.name}
                  onChange={(e) => updateOption(idx, 'name', e.target.value)}
                />
                <Input
                  type="number"
                  className="w-20"
                  value={opt.quantity}
                  onChange={(e) => updateOption(idx, 'quantity', Number(e.target.value))}
                />
                {formData.options.length > 1 && (
                  <button onClick={() => removeOption(idx)} className="text-gray-400">삭제</button>
                )}
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-4 bg-gray-50 p-4 rounded-2xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">주최자 수량</span>
              <Input
                type="number"
                className="w-20"
                value={formData.hostQuantity}
                onChange={(e) => setFormData({ ...formData, hostQuantity: Number(e.target.value) })}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">최소 성사 수량</span>
              <Input
                type="number"
                className="w-20"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              />
            </div>
          </section>

          <section>
            <label className="block text-sm font-bold text-gray-900 mb-2">마감일</label>
            <Input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </section>

          <Button className="w-full h-14 rounded-2xl font-bold" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      )}
    </div>
  );
}
