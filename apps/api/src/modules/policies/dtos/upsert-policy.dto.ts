import { PickType } from '@nestjs/swagger';
import { PolicyDto } from './policy.dto';

export class UpsertPolicyDto extends PickType(PolicyDto, [
	'policyName',
	'schemaName',
	'policyOperation',
	'policyFilterQuery',
	'policyUpdateQuery',
	'connection',
] as const) {}
