import { BCR_ROLE_CONFIG, BcrRoleConfig } from '@/constants/enum/bcrApproval.constants';
import { BcrRoleEnum } from '@/constants/enum/bcrApproval.enum';

export function getRoleConfig(role: string): BcrRoleConfig {
    const roleEnum = role as BcrRoleEnum;
    return BCR_ROLE_CONFIG[roleEnum] || { reasons: [], recommendations: [] };
}
