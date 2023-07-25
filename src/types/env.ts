export interface GlobalEnv {
	API_ENDPOINT: string;
	API_VERSION: number;
	GATEWAY_ENDPOINT: string;
	WEBAPP_ENDPOINT: string;
	CDN_HOST: string;
	ASSET_ENDPOINT: string;
	MEDIA_PROXY_ENDPOINT: string;
	WIDGET_ENDPOINT: string;
	INVITE_HOST: string;
	GUILD_TEMPLATE_HOST: string;
	GIFT_CODE_HOST: string;
	RELEASE_CHANNEL: string;
	MARKETING_ENDPOINT: string;
	BRAINTREE_KEY: string;
	STRIPE_KEY: string;
	NETWORKING_ENDPOINT: string;
	RTC_LATENCY_ENDPOINT: string;
	ACTIVITY_APPLICATION_HOST: string;
	PROJECT_ENV: string;
	REMOTE_AUTH_ENDPOINT: string;
	SENTRY_TAGS: SentryTags;
	MIGRATION_SOURCE_ORIGIN: string;
	MIGRATION_DESTINATION_ORIGIN: string;
	HTML_TIMESTAMP: number;
	ALGOLIA_KEY: string;
	PUBLIC_PATH: string;
}

export interface SentryTags {
	buildId: string;
	buildType: string;
}

export interface Patterns {
	find: string;
	replace: string;
	type: "loose" | "exact";
}

export interface Config {
	GLOBAL_ENV: GlobalEnv;
	patterns: Patterns[];
}
