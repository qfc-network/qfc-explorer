import { keccak256 } from 'js-sha3';
import { RpcClient } from '@/indexer/rpc';

const AGENT_REGISTRY = '0x7791dfa4d489f3d524708cbc0caa8689b76322b3';

const PERMISSION_LABELS: Record<number, string> = {
  0: 'Transfer',
  1: 'Approve',
  2: 'Stake',
  3: 'Vote',
};

function sel(sig: string): string {
  return '0x' + keccak256(sig).slice(0, 8);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function encodeString(value: string): string {
  const hex = Buffer.from(value, 'utf8').toString('hex');
  const len = (hex.length / 2).toString(16).padStart(64, '0');
  const padded = hex.padEnd(Math.ceil(hex.length / 64) * 64 || 64, '0');
  return '0000000000000000000000000000000000000000000000000000000000000020' + len + padded;
}

function decodeAddress(data: string, offset: number): string {
  return '0x' + data.slice(offset + 24, offset + 64);
}

function decodeUint256(data: string, offset: number): string {
  return BigInt('0x' + (data.slice(offset, offset + 64) || '0')).toString();
}

function decodeBool(data: string, offset: number): boolean {
  return parseInt(data.slice(offset, offset + 64), 16) === 1;
}

function decodeStringFrom(data: string, base: number, slotOffset: number): string {
  const relOffset = parseInt(data.slice(base + slotOffset, base + slotOffset + 64), 16) * 2;
  const strStart = base + relOffset;
  const strLen = parseInt(data.slice(strStart, strStart + 64), 16);
  if (strLen === 0) return '';
  const strHex = data.slice(strStart + 64, strStart + 64 + strLen * 2);
  return new TextDecoder().decode(hexToBytes(strHex));
}

function decodeUint8Array(data: string, base: number, slotOffset: number): number[] {
  const relOffset = parseInt(data.slice(base + slotOffset, base + slotOffset + 64), 16) * 2;
  const arrStart = base + relOffset;
  const arrLen = parseInt(data.slice(arrStart, arrStart + 64), 16);
  const result: number[] = [];
  for (let i = 0; i < arrLen; i++) {
    result.push(parseInt(data.slice(arrStart + 64 + i * 64, arrStart + 128 + i * 64), 16));
  }
  return result;
}

export type AgentInfo = {
  agentId: string;
  owner: string;
  agentAddress: string;
  permissions: number[];
  permissionLabels: string[];
  dailyLimit: string;
  maxPerTx: string;
  deposit: string;
  spentToday: string;
  lastSpendDay: string;
  registeredAt: string;
  active: boolean;
};

export function permissionLabel(p: number): string {
  return PERMISSION_LABELS[p] ?? `Permission(${p})`;
}

export async function fetchAgent(client: RpcClient, agentId: string): Promise<AgentInfo | null> {
  const callData = sel('getAgent(string)') + encodeString(agentId);

  try {
    const result = await client.call<string>('eth_call', [
      { to: AGENT_REGISTRY, data: callData },
      'latest',
    ]);

    if (!result || result === '0x' || result.length < 130) return null;
    return decodeAgentResult(result);
  } catch {
    return null;
  }
}

function decodeAgentResult(raw: string): AgentInfo | null {
  const data = raw.replace('0x', '');

  // Return is a single tuple, first 32 bytes = offset to tuple
  const tupleOffset = parseInt(data.slice(0, 64), 16) * 2;
  const b = tupleOffset; // base offset in hex chars

  // Tuple layout (11 slots):
  //  0: offset to agentId (string, dynamic)
  //  1: owner (address)
  //  2: agentAddress (address)
  //  3: offset to permissions (uint8[], dynamic)
  //  4: dailyLimit (uint256)
  //  5: maxPerTx
  //  6: deposit
  //  7: spentToday
  //  8: lastSpendDay
  //  9: registeredAt
  // 10: active (bool)

  const agentId = decodeStringFrom(data, b, 0);
  if (!agentId) return null;

  const owner = decodeAddress(data, b + 64);
  const agentAddress = decodeAddress(data, b + 128);
  const permissions = decodeUint8Array(data, b, 192);
  const dailyLimit = decodeUint256(data, b + 256);
  const maxPerTx = decodeUint256(data, b + 320);
  const deposit = decodeUint256(data, b + 384);
  const spentToday = decodeUint256(data, b + 448);
  const lastSpendDay = decodeUint256(data, b + 512);
  const registeredAt = decodeUint256(data, b + 576);
  const active = decodeBool(data, b + 640);

  return {
    agentId,
    owner,
    agentAddress,
    permissions,
    permissionLabels: permissions.map(permissionLabel),
    dailyLimit,
    maxPerTx,
    deposit,
    spentToday,
    lastSpendDay,
    registeredAt,
    active,
  };
}

export async function fetchAllAgentIds(client: RpcClient): Promise<string[]> {
  const topic0 = '0x' + keccak256('AgentRegistered(string,address,address)');

  const logs = await client.call<Array<{
    transactionHash: string;
  }>>('eth_getLogs', [{
    fromBlock: '0x0',
    toBlock: 'latest',
    address: AGENT_REGISTRY,
    topics: [topic0],
  }]);

  // agentId is an indexed string (hashed in topic), so decode from tx input
  const txHashes = [...new Set(logs.map(l => l.transactionHash))];
  const registerSel = sel('registerAgent(string,address,uint8[],uint256,uint256)');

  const agentIds: string[] = [];
  for (const txHash of txHashes) {
    try {
      const tx = await client.call<{ input: string }>('eth_getTransactionByHash', [txHash]);
      if (!tx?.input?.startsWith(registerSel)) continue;

      const inputData = tx.input.slice(10); // skip 0x + 4-byte selector
      const strOffset = parseInt(inputData.slice(0, 64), 16) * 2;
      const strLen = parseInt(inputData.slice(strOffset, strOffset + 64), 16);
      const strHex = inputData.slice(strOffset + 64, strOffset + 64 + strLen * 2);
      const agentId = new TextDecoder().decode(hexToBytes(strHex));
      if (agentId) agentIds.push(agentId);
    } catch {
      // skip
    }
  }

  return [...new Set(agentIds)];
}

export async function fetchAllAgents(client: RpcClient): Promise<AgentInfo[]> {
  const agentIds = await fetchAllAgentIds(client);
  const agents: AgentInfo[] = [];

  for (const id of agentIds) {
    const agent = await fetchAgent(client, id);
    if (agent) agents.push(agent);
  }

  // Sort by registeredAt descending (newest first)
  agents.sort((a, b) => Number(BigInt(b.registeredAt) - BigInt(a.registeredAt)));
  return agents;
}
