import type { Config } from "jest";

const config: Config = {
  projects: [
    {
      // ── ユニットテスト (Node環境, 純粋なロジックのみ)
      displayName: "unit",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/__tests__/unit/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: { module: "CommonJS" } },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^firebase/firestore$": "<rootDir>/src/__mocks__/firebase/firestore.ts",
      },
    },
    {
      // ── 統合テスト: UIコンポーネント (jsdom環境, React Testing Library)
      displayName: "integration-ui",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/__tests__/integration/**/*.test.tsx"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: {
              module: "CommonJS",
              jsx: "react-jsx",  // JSXを正しく変換
            },
          },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^firebase/(.*)$": "<rootDir>/src/__mocks__/firebase/$1.ts",
        "^next/navigation$": "<rootDir>/src/__mocks__/next/navigation.ts",
        // APIルートテストはこのプロジェクトでは使わないのでモック
        "^next/server$": "<rootDir>/src/__mocks__/next/server.ts",
      },
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    },
    {
      // ── 統合テスト: APIルート (Node環境, Firebase Adminモック)
      displayName: "integration-api",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/__tests__/integration-api/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: { module: "CommonJS" } },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    },
  ],
};

export default config;
