export const dynamic = "force-dynamic";
export const revalidate = 15;

import { ok } from '@/lib/api-response';
import type { GovernanceProposal } from '@/lib/api-types';

const now = Date.now();
const DAY = 86_400_000;

const MOCK_PROPOSALS: GovernanceProposal[] = [
  {
    id: 1,
    title: 'Reduce DEX swap fee from 0.3% to 0.25%',
    description:
      'This proposal seeks to reduce the base swap fee on the QFC DEX from 0.3% to 0.25% to improve competitiveness with other chains and attract more trading volume. Analysis shows a 0.05% reduction would increase volume by an estimated 18%, resulting in net-positive fee revenue.',
    type: 'Parameter Change',
    status: 'Active',
    proposer: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    forVotes: 1_360_000,
    againstVotes: 640_000,
    abstainVotes: 120_000,
    quorum: 2_120_000,
    quorumRequired: 2_000_000,
    startTime: now - 3 * DAY,
    endTime: now + 4 * DAY,
    createdAt: now - 4 * DAY,
    executedAt: null,
    paramKey: 'dex.swapFee',
    paramCurrentValue: '0.3%',
    paramProposedValue: '0.25%',
  },
  {
    id: 2,
    title: 'Add USDC as QUSD collateral',
    description:
      'Proposal to whitelist USDC (bridged) as accepted collateral for minting QUSD stablecoin. This diversifies the collateral base and reduces single-asset risk. The initial collateral ratio is set at 110%.',
    type: 'General',
    status: 'Passed',
    proposer: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    forVotes: 2_430_000,
    againstVotes: 570_000,
    abstainVotes: 200_000,
    quorum: 3_200_000,
    quorumRequired: 2_000_000,
    startTime: now - 14 * DAY,
    endTime: now - 7 * DAY,
    createdAt: now - 15 * DAY,
    executedAt: now - 6 * DAY,
  },
  {
    id: 3,
    title: 'Allocate 50,000 QFC to ecosystem grants',
    description:
      'Requesting 50,000 QFC from the community treasury to fund ecosystem development grants for Q2 2026. Grants will be distributed through the QFC Grants Committee to projects building on QFC including DeFi protocols, developer tools, and educational content.',
    type: 'Treasury',
    status: 'Active',
    proposer: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    forVotes: 1_080_000,
    againstVotes: 920_000,
    abstainVotes: 150_000,
    quorum: 2_150_000,
    quorumRequired: 2_000_000,
    startTime: now - 2 * DAY,
    endTime: now + 5 * DAY,
    createdAt: now - 3 * DAY,
    executedAt: null,
  },
  {
    id: 4,
    title: 'Upgrade ResultVerifier contract v2',
    description:
      'Upgrade the ResultVerifier contract to v2 which includes optimized gas usage for batch verification, support for new model output formats, and improved slashing conditions for invalid results.',
    type: 'Protocol Upgrade',
    status: 'Pending',
    proposer: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    forVotes: 0,
    againstVotes: 0,
    abstainVotes: 0,
    quorum: 0,
    quorumRequired: 2_000_000,
    startTime: now + 2 * DAY,
    endTime: now + 9 * DAY,
    createdAt: now - 1 * DAY,
    executedAt: null,
  },
  {
    id: 5,
    title: 'Increase stQFC unstaking period to 14 days',
    description:
      'Proposal to increase the stQFC unstaking cooldown from 7 days to 14 days to improve network security and reduce short-term staking manipulation. This aligns with industry best practices for PoS networks.',
    type: 'Parameter Change',
    status: 'Failed',
    proposer: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    forVotes: 760_000,
    againstVotes: 1_240_000,
    abstainVotes: 300_000,
    quorum: 2_300_000,
    quorumRequired: 2_000_000,
    startTime: now - 21 * DAY,
    endTime: now - 14 * DAY,
    createdAt: now - 22 * DAY,
    executedAt: null,
    paramKey: 'staking.unstakePeriod',
    paramCurrentValue: '7 days',
    paramProposedValue: '14 days',
  },
];

export async function GET() {
  const activeCount = MOCK_PROPOSALS.filter(p => p.status === 'Active').length;
  return ok({
    proposals: MOCK_PROPOSALS,
    stats: {
      totalProposals: MOCK_PROPOSALS.length,
      activeProposals: activeCount,
      participationRate: '64.2%',
      quorumThreshold: '2,000,000 QFC',
    },
  });
}
