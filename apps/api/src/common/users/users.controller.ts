import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import {
	CreateUserDto,
	UserFilteringParameterDto,
	UserItemResponseDto,
	UserListResponseDto,
	UserParameterDto,
} from './dtos';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	@HttpCode(200)
	@ApiOperation({ summary: 'Get Users' })
	@ApiResponse({
		status: 200,
		type: UserListResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async getUsers(@Query() filter: UserFilteringParameterDto): Promise<UserListResponseDto> {
		const users = await this.usersService.getUsers(filter);
		return plainToInstance(UserListResponseDto, users, { excludeExtraneousValues: true });
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Create User' })
	@ApiResponse({
		status: 201,
		type: UserItemResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 400,
		description: 'The provided data is invalid.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async createUser(@Body() createUserDto: CreateUserDto): Promise<UserItemResponseDto> {
		const createdUser = await this.usersService.createUser(createUserDto);
		return plainToInstance(UserItemResponseDto, createdUser, { excludeExtraneousValues: true });
	}

	@Get(':userId')
	@HttpCode(200)
	@ApiOperation({ summary: 'Get User' })
	@ApiResponse({
		status: 200,
		type: UserItemResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 404,
		description: 'The requested resource or entity could not be found.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async getUser(@Param() { userId }: UserParameterDto) {
		const user = await this.usersService.getUserById(userId);
		return plainToInstance(UserItemResponseDto, user, { excludeExtraneousValues: true });
	}

	@Delete(':userId')
	@HttpCode(204)
	@ApiOperation({ summary: 'Delete User' })
	@ApiResponse({
		status: 204,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 404,
		description: 'The requested resource or entity could not be found.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async deleteUser(@Param() { userId }: UserParameterDto) {
		await this.usersService.deleteUser(userId);
	}
}
