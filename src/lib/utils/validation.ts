import { z } from "zod";

export const joinFormSchema = z.object({
  customerName: z
    .string()
    .min(1, "お名前を入力してください")
    .max(50, "50文字以内で入力してください"),
  partySize: z
    .number()
    .int()
    .min(1, "1名以上で入力してください")
    .max(20, "20名以下で入力してください"),
});

export const storeFormSchema = z.object({
  name: z
    .string()
    .min(1, "店舗名を入力してください")
    .max(100, "100文字以内で入力してください"),
  averageSeatingDuration: z
    .number()
    .int()
    .min(5, "5分以上で入力してください")
    .max(300, "300分以下で入力してください"),
});

export const loginFormSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
});

export type JoinFormData = z.infer<typeof joinFormSchema>;
export type StoreFormData = z.infer<typeof storeFormSchema>;
export type LoginFormData = z.infer<typeof loginFormSchema>;
