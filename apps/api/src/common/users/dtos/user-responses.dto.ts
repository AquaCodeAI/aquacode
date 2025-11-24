import { ApiProperty } from '@nestjs/swagger';
import { ItemResponseDto, ListResponseDto } from '@aquacode/common/dtos';
import { Expose, Type } from 'class-transformer';
import { UserDto } from './user.dto';

export class UserListResponseDto extends ListResponseDto<UserDto> {
	/**
	 * List of users
	 */
	@ApiProperty({
		type: [UserDto],
		isArray: true,
		description: 'List of users',
	})
	@Expose()
	@Type(() => UserDto)
	declare result: UserDto[];
}

export class UserItemResponseDto extends ItemResponseDto<UserDto> {
	/**
	 * User data object
	 */
	@ApiProperty({
		type: UserDto,
		description: 'User data object',
		required: true,
	})
	@Expose()
	@Type(() => UserDto)
	declare result: UserDto;
}
