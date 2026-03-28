"use client";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinFormSchema, type JoinFormData } from "@/lib/utils/validation";

interface JoinFormProps {
  onSubmit: (data: JoinFormData) => Promise<void>;
  maxCapacity: number;
}

export function JoinForm({ onSubmit, maxCapacity }: JoinFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinFormData>({
    // z.coerce.number() により input 型が unknown になるため明示的にキャスト
    resolver: zodResolver(joinFormSchema) as Resolver<JoinFormData>,
    defaultValues: { partySize: 1 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          お名前 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("customerName")}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="山田 太郎"
        />
        {errors.customerName && (
          <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          人数 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n <= maxCapacity).map((n) => (
            <label
              key={n}
              className="flex items-center justify-center border rounded-xl py-3 cursor-pointer has-[:checked]:bg-indigo-600 has-[:checked]:text-white has-[:checked]:border-indigo-600 hover:border-indigo-400 transition-colors"
            >
              <input
                type="radio"
                value={n}
                {...register("partySize", { valueAsNumber: true })}
                className="sr-only"
              />
              {n}名
            </label>
          ))}
        </div>
        {errors.partySize && (
          <p className="text-red-500 text-xs mt-1">{errors.partySize.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-medium text-base hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "登録中..." : "順番待ちに登録する"}
      </button>
    </form>
  );
}
