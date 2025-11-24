import { ApiProperty } from '@nestjs/swagger';
import { SessionDto, UserDto } from '@aquacode/common';
import { Expose, Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';

export class ProfileDto {
	/**
	 * Authenticated user data
	 */
	@ApiProperty({
		description: 'Authenticated user data.',
		required: true,
		type: () => UserDto,
	})
	@Expose()
	@Type(() => UserDto)
	@IsDefined({ message: 'User is required' })
	@ValidateNested()
	user: UserDto;

	/**
	 * Current user session data
	 */
	@ApiProperty({
		description: 'Current user session data.',
		required: true,
		type: () => SessionDto,
	})
	@Expose()
	@Type(() => SessionDto)
	@IsDefined({ message: 'Session is required' })
	@ValidateNested()
	session: SessionDto;
}
