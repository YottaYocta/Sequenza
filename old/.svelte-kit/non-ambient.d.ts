
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/patch" | "/api/patch/[slug]" | "/explore" | "/login" | "/logout" | "/patches" | "/patches/[slug]" | "/patch" | "/patch/[slug]" | "/signup";
		RouteParams(): {
			"/api/patch/[slug]": { slug: string };
			"/patches/[slug]": { slug: string };
			"/patch/[slug]": { slug: string }
		};
		LayoutParams(): {
			"/": { slug?: string };
			"/api": { slug?: string };
			"/api/patch": { slug?: string };
			"/api/patch/[slug]": { slug: string };
			"/explore": Record<string, never>;
			"/login": Record<string, never>;
			"/logout": Record<string, never>;
			"/patches": { slug?: string };
			"/patches/[slug]": { slug: string };
			"/patch": { slug?: string };
			"/patch/[slug]": { slug: string };
			"/signup": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/patch" | "/api/patch/" | `/api/patch/${string}` & {} | `/api/patch/${string}/` & {} | "/explore" | "/explore/" | "/login" | "/login/" | "/logout" | "/logout/" | "/patches" | "/patches/" | `/patches/${string}` & {} | `/patches/${string}/` & {} | "/patch" | "/patch/" | `/patch/${string}` & {} | `/patch/${string}/` & {} | "/signup" | "/signup/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/robots.txt" | string & {};
	}
}