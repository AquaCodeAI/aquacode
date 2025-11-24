export interface CacheModuleOptions {
	redisUri: string;
}

export interface CacheModuleAsyncOptions {
	global?: boolean;
	imports?: any[];
	inject?: any[];
	useFactory: (...args: any[]) => Promise<CacheModuleOptions> | CacheModuleOptions;
}
