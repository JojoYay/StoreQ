export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
}));

export const useParams = jest.fn(() => ({ storeId: "store-001" }));
export const usePathname = jest.fn(() => "/dashboard");
