import { Controller, Get, HttpCode } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiExtraModels,
	ApiOperation,
	ApiResponse,
	ApiTags,
	getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUserSession, OptionalAuth, type UserSession } from '@aquacode/common';
import { plainToInstance } from 'class-transformer';
import { ProfileDto } from './dtos';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('v1/profile')
export class ProfileController {
	@Get()
	@HttpCode(200)
	@OptionalAuth()
	@ApiOperation({ summary: 'Get Profile' })
	@ApiExtraModels(ProfileDto)
	@ApiResponse({
		status: 200,
		schema: {
			oneOf: [{ $ref: getSchemaPath(ProfileDto) }, { type: 'null' }],
		},
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	getProfile(@CurrentUserSession() currentSession: UserSession): ProfileDto | string {
		if (!currentSession || !currentSession.user || !currentSession.session) {
			return JSON.stringify(null);
		}
		return plainToInstance(
			ProfileDto,
			{ user: currentSession?.user, session: currentSession?.session },
			{ excludeExtraneousValues: true },
		);
	}
}
