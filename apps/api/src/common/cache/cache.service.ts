import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BadRequestException, InternalServerErrorException } from '@aquacode/common/exceptions';
import {
	circuitBreaker,
	CircuitBreakerPolicy,
	ConsecutiveBreaker,
	handleAll,
	IFailureEvent,
} from 'cockatiel';
import Redis from 'ioredis';
import { RedisOptions } from 'ioredis/built/redis/RedisOptions';
import { CACHE_MODULE_OPTIONS } from './constants';
import { CacheErrors } from './errors';
import type { CacheModuleOptions } from './interfaces';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(CacheService.name);
	private readonly client: Redis;
	private readonly circuitBreaker: CircuitBreakerPolicy;

	constructor(
		@Inject(CACHE_MODULE_OPTIONS)
		private readonly options: CacheModuleOptions,
	) {
		const redisUri = this.options.redisUri;

		const maxConsecutiveFailures = 5;
		const halfOpenAfterMs = 15000;

		this.circuitBreaker = circuitBreaker(handleAll, {
			halfOpenAfter: halfOpenAfterMs,
			breaker: new ConsecutiveBreaker(maxConsecutiveFailures),
		});

		this.circuitBreaker.onSuccess(() =>
			this.logger.log('Circuit breaker reset to closed state'),
		);

		this.circuitBreaker.onHalfOpen(() =>
			this.logger.warn('Circuit breaker in half-open state'),
		);

		this.circuitBreaker.onBreak(() =>
			this.logger.error('Circuit breaker opened! Redis operations will fail fast'),
		);

		this.circuitBreaker.onFailure(({ reason }: IFailureEvent) =>
			this.logger.error(
				`Circuit breaker failure threshold reached: ${reason as unknown as string}`,
			),
		);

		const redisOptions: RedisOptions = {
			maxRetriesPerRequest: null as number | null,
			retryStrategy: (times: number) => {
				const delay = Math.min(times * 100, 10000);
				this.logger.log(`Retrying Redis connection in ${delay}ms...`);
				return delay;
			},
			reconnectOnError: (err: Error) => {
				this.logger.error(`Redis connection error: ${err.message}`, (err as any).stack);
				return err.message.includes('READONLY') || err.message.includes('ETIMEDOUT');
			},
		};

		this.client = new Redis(redisUri, redisOptions);

		this.client.on('connect', () => {
			this.logger.log('Connected to Redis');
		});

		this.client.on('error', (err) => {
			this.logger.error(`Redis error: ${err.message}`, err.stack);
		});

		this.client.on('reconnecting', () => {
			this.logger.log('Reconnecting to Redis...');
		});
	}

	getClient(): Redis {
		return this.client;
	}

	async onModuleInit() {
		try {
			await this.client.ping();
			this.logger.log('Redis cache service initialized');
		} catch (error) {
			this.logger.error(`Failed to initialize Redis cache: ${error.message}`, error.stack);
			throw new InternalServerErrorException({
				errors: CacheErrors.CACHE_INITIALIZATION_FAILED,
			});
		}
	}

	async onModuleDestroy() {
		try {
			await this.client.quit();
			this.logger.log('Redis connection closed');
		} catch (error) {
			this.logger.error(`Error closing Redis connection: ${error.message}`, error.stack);
		}
	}

	/**
	 * Push one or more values to the tail of a Redis list
	 */
	async rpush<T>(key: string, ...values: T[]): Promise<number> {
		if (!key || key.trim() === '') {
			throw new BadRequestException({
				errors: CacheErrors.INVALID_LIST_KEY,
			});
		}

		if (!values || values.length === 0) {
			throw new BadRequestException({
				errors: CacheErrors.LIST_VALUES_REQUIRED,
			});
		}

		for (const v of values) {
			if (v === undefined || v === null) {
				throw new BadRequestException({
					errors: CacheErrors.NULL_VALUE_NOT_ALLOWED,
				});
			}
		}

		try {
			return await this.circuitBreaker.execute(async () => {
				const serialized = values.map((v) => JSON.stringify(v));
				return this.client.rpush(key, ...serialized);
			});
		} catch (error) {
			this.logger.error(`Error executing RPUSH on key ${key}: ${error.message}`, error.stack);
			throw new InternalServerErrorException({ errors: CacheErrors.LIST_PUSH_FAILED });
		}
	}

	/**
	 * Pop a value from the head of a Redis list
	 */
	async lpop<T>(key: string): Promise<T | null> {
		if (!key || key.trim() === '') {
			this.logger.warn('Invalid key provided to lpop method');
			return null;
		}

		try {
			const value = await this.circuitBreaker.execute(async () => {
				return this.client.lpop(key);
			});

			if (value === null) {
				return null;
			}
			return JSON.parse(value) as T;
		} catch (error) {
			this.logger.error(`Error executing LPOP on key ${key}: ${error.message}`, error.stack);
			throw new InternalServerErrorException({ errors: CacheErrors.LIST_POP_FAILED });
		}
	}

	/**
	 * Get the length of a Redis list
	 */
	async llen(key: string): Promise<number> {
		if (!key || key.trim() === '') {
			throw new BadRequestException({
				errors: CacheErrors.INVALID_LIST_KEY,
			});
		}

		try {
			return await this.circuitBreaker.execute(async () => {
				return this.client.llen(key);
			});
		} catch (error) {
			this.logger.error(`Error executing LLEN on key ${key}: ${error.message}`, error.stack);
			throw new InternalServerErrorException({ errors: CacheErrors.LIST_LENGTH_FAILED });
		}
	}
}
