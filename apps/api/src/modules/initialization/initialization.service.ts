import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BadRequestException,
	ProjectDocument,
	ProjectsService,
	UsersService,
} from '@aquacode/common';
import { InitializationErrors } from './errors';

@Injectable()
export class InitializationService {
	private readonly logger: Logger = new Logger(InitializationService.name);
	private readonly defaultProjectName: string = 'aqua-project';
	private readonly defaultProjectDescription: string = 'From idea to an app with AI';

	private readonly aquaStudioDefaultEmail: string | null;
	private readonly aquaStudioDefaultPassword: string | null;

	constructor(
		private readonly configService: ConfigService,
		private readonly projectsService: ProjectsService,
		private readonly usersService: UsersService,
	) {
		this.aquaStudioDefaultEmail = this.configService.get('AQUA_STUDIO_DEFAULT_EMAIL') ?? null;
		this.aquaStudioDefaultPassword =
			this.configService.get('AQUA_STUDIO_DEFAULT_PASSWORD') ?? null;
	}

	async initialize() {
		this.logger.log('Starting platform initialization...');
		if (!this.aquaStudioDefaultEmail || !this.aquaStudioDefaultPassword) {
			this.logger.warn(InitializationErrors.REQUIRED_ENV_VARS_MISSING);
			throw new BadRequestException({
				errors: InitializationErrors.REQUIRED_ENV_VARS_MISSING,
			});
		}

		let project: ProjectDocument;
		try {
			const { result } = await this.projectsService.createAquaProject({
				name: this.defaultProjectName,
				description: this.defaultProjectDescription,
			});
			project = result;
		} catch (error: unknown) {
			if (!(error instanceof BadRequestException)) {
				throw error;
			}

			const { result } = await this.projectsService.getProjectByName(this.defaultProjectName);
			project = result;
		}

		await this.usersService.createUser({
			email: this.aquaStudioDefaultEmail,
			password: this.aquaStudioDefaultPassword,
			connection: project.connection,
		});

		this.logger.log('Platform initialization completed successfully');
		return {
			result: { project },
			success: true,
			message: ['Platform initialization completed successfully'],
			errors: [],
		};
	}
}
