export type ProviderKeySummaryDto = {
  id: number;
  provider: string;
  label: string;
  updated_at: string;
};

export type ProviderKeySecretDto = {
  provider: string;
  label: string;
  apiKey: string;
};
