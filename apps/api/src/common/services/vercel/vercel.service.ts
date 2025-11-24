import { Inject, Injectable } from '@nestjs/common';
import { Sandbox as VercelSandbox } from '@vercel/sandbox';
import { Vercel } from '@vercel/sdk';
import ms from 'ms';
import { VERCEL_CLIENT, VERCEL_MODULE_OPTIONS } from './constants';
import { DeploymentTarget } from './enums';
import type { VercelModuleOptions } from './interfaces';

export { Sandbox as VercelSandbox } from '@vercel/sandbox';

interface CreateSandboxParams {
	vercelProjectId: string;
	templateUrl: string;
	ports?: number[];
	timeout?: number;
	vcpus?: number;
	runtime?: string;
}

interface CreateDeploymentParams {
	projectId: string;
	projectName: string;
	projectFiles?: {
		file: string;
		data: string;
	}[];
	deploymentId?: string;
	target?: DeploymentTarget;
}

interface CreateProjectParams {
	name: string;
}

interface GetSandboxParams {
	vercelProjectId: string;
	vercelSandboxId: string;
}

@Injectable()
export class VercelService {
	constructor(
		@Inject(VERCEL_CLIENT)
		private readonly client: Vercel,
		@Inject(VERCEL_MODULE_OPTIONS)
		private readonly options: VercelModuleOptions,
	) {}

	async createProject(params: CreateProjectParams) {
		const teamId = this.options.vercelTeamId;
		return this.client.projects.createProject({
			teamId,
			requestBody: {
				name: params.name,
				framework: 'nextjs',
				ssoProtection: null,
				installCommand: 'bun install',
				buildCommand: 'bun run build',
			},
		});
	}

	async createDeployment(params: CreateDeploymentParams) {
		const teamId = this.options.vercelTeamId;
		return this.client.deployments.createDeployment({
			teamId,
			requestBody: {
				name: params.projectName,
				project: params.projectId,
				projectSettings: {
					framework: 'nextjs',
				},
				...(params.projectFiles ? { files: params.projectFiles } : {}),
				...(params.deploymentId ? { deploymentId: params.deploymentId } : {}),
				...(params.target ? { target: params.target } : {}),
			},
		});
	}

	async getDeploymentById(deploymentId: string) {
		const teamId = this.options.vercelTeamId;
		return this.client.deployments.getDeployment({ teamId, idOrUrl: deploymentId });
	}

	async createSandbox(params: CreateSandboxParams): Promise<VercelSandbox> {
		const {
			vercelProjectId,
			templateUrl,
			ports = [3000],
			timeout = ms('45m'),
			vcpus = 2,
			runtime = 'node22',
		} = params;

		return VercelSandbox.create({
			token: this.options.vercelToken,
			teamId: this.options.vercelTeamId,
			projectId: vercelProjectId,
			source: { type: 'tarball', url: templateUrl },
			ports,
			runtime,
			timeout,
			resources: { vcpus },
		});
	}

	async getSandbox(params: GetSandboxParams): Promise<VercelSandbox> {
		const { vercelProjectId, vercelSandboxId } = params;
		return VercelSandbox.get({
			token: this.options.vercelToken,
			teamId: this.options.vercelTeamId,
			projectId: vercelProjectId,
			sandboxId: vercelSandboxId,
		});
	}
}
