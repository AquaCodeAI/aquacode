import type { ModuleMetadata } from '@nestjs/common';

export interface VercelModuleOptions {
	vercelToken: string;
	vercelTeamId: string;
}

export interface VercelModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	global?: boolean;
	inject?: any[];
	useFactory: (...args: any[]) => Promise<VercelModuleOptions> | VercelModuleOptions;
}
