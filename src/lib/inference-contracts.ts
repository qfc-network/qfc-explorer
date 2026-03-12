import { ethers } from 'ethers';

// Contract addresses — override via env vars
export const TASK_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_TASK_REGISTRY_ADDRESS ?? '0x0000000000000000000000000000000000000000';

export const MODEL_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS ?? '0x0000000000000000000000000000000000000000';

// ABI fragments — only the functions the UI needs
export const TASK_REGISTRY_ABI = [
  'function submitTask(uint256 modelId, bytes calldata input) payable returns (uint256)',
  'function cancelTask(uint256 taskId)',
  'function getTask(uint256 taskId) view returns (tuple(uint256 id, address submitter, uint256 modelId, bytes input, uint256 maxFee, uint8 status, address miner, bytes result, uint256 createdAt, uint256 claimedAt, uint256 completedAt))',
  'function nextTaskId() view returns (uint256)',
  'function challengeResult(uint256 taskId)',
  'event TaskSubmitted(uint256 indexed taskId, address indexed submitter, uint256 indexed modelId, uint256 maxFee)',
];

export const MODEL_REGISTRY_ABI = [
  'function getModel(uint256 modelId) view returns (tuple(uint256 modelId, string name, uint256 baseFee, uint8 minTier, bool approved, uint256 registeredAt))',
  'function modelCount() view returns (uint256)',
  'function getBaseFee(uint256 modelId) view returns (uint256)',
];

// Model definitions for the submit form
export const AVAILABLE_MODELS = [
  { id: 1, name: 'Llama 3 8B', label: 'Llama 3 8B' },
  { id: 2, name: 'Llama 3 70B', label: 'Llama 3 70B' },
  { id: 3, name: 'Whisper Large V3', label: 'Whisper Large V3' },
  { id: 4, name: 'SDXL', label: 'SDXL' },
  { id: 5, name: 'DeepSeek R1 7B', label: 'DeepSeek R1 7B' },
] as const;

// Task status enum matching the contract
export const TASK_STATUS_LABELS: Record<number, string> = {
  0: 'Pending',
  1: 'Assigned',
  2: 'Completed',
  3: 'Failed',
  4: 'Cancelled',
  5: 'Challenged',
};

/**
 * Get a read-only provider for QFC testnet.
 */
export function getReadProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://rpc.testnet.qfc.network';
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get the TaskRegistry contract instance.
 */
export function getTaskRegistry(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
  return new ethers.Contract(TASK_REGISTRY_ADDRESS, TASK_REGISTRY_ABI, signerOrProvider);
}

/**
 * Get the ModelRegistry contract instance.
 */
export function getModelRegistry(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
  return new ethers.Contract(MODEL_REGISTRY_ADDRESS, MODEL_REGISTRY_ABI, signerOrProvider);
}

/**
 * Estimate cost for a given model. Returns base fee in wei.
 */
export async function getAmountEstimate(modelId: number): Promise<bigint> {
  try {
    const provider = getReadProvider();
    const registry = getModelRegistry(provider);
    const baseFee: bigint = await registry.getBaseFee(modelId);
    return baseFee;
  } catch {
    // Fallback: return a default estimate (0.01 QFC)
    return ethers.parseEther('0.01');
  }
}
