import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	createTheme,
	ThemeProvider as RestyleThemeProvider,
	useTheme,
} from '@shopify/restyle';
import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { getApproximateScreenCornerRadius } from './utils';

const screenRadius = getApproximateScreenCornerRadius().dp;

export type ThemedProps = {
	themeOverride?: ThemeName;
};

export const LightTheme = {
	spacing: {
		sm: 8,
		md: 16,
		lg: 24,
		xl: 40,
	},
	borderRadii: {
		sm: screenRadius / 3,

		screen: screenRadius,
	},
	colors: {
		background: '#f2f2f2',
		surface: '#ffffff',

		border: '#ddd',
		borderLight: '#f7f7f7',

		textPrimary: '#000000',
		textSecondary: '#333333',
		textTertiary: '#888888',

		// Branding & gradient colors
		voidEclipse: '#0b0b0b',
		abyssBlue: '#2b396d',
		silverMist: '#e4e4e4',
	},
	durations: {
		themeTransition: 100,
	},
};

export type Theme = typeof LightTheme;

export const DarkTheme: Theme = {
	...LightTheme,
	colors: {
		...LightTheme.colors,
		background: '#111111',
		surface: '#222222',

		border: '#444444',
		borderLight: '#666666',

		textPrimary: '#ffffff',
		textSecondary: '#dddddd',
		textTertiary: '#222222',
	},
};

const THEME_NAME_STORAGE_KEY = 'app-theme-name';

export type ThemeName = 'light' | 'dark' | 'system';
type ThemeContextType = {
	themeName: ThemeName;
	theme: Theme;
	switchTheme: (scheme: ThemeName) => void;
	toggleTheme: () => void;
};

const AppThemeContext = createContext<ThemeContextType | undefined>(undefined);

type AppThemeProviderProps = {
	defaultTheme?: 'light' | 'dark';
} & PropsWithChildren;

export const AppThemeProvider: React.FC<AppThemeProviderProps> = (props) => {
	const { defaultTheme, children } = props;

	const systemScheme = useColorScheme();
	const [override, setOverride] = useState<'light' | 'dark' | null>(
		defaultTheme ?? null,
	);
	const [ready, setReady] = useState(false);

	const colorScheme =
		override ?? (systemScheme === 'dark' ? 'dark' : 'light');

	const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

	// Load stored override on startup
	useEffect(() => {
		(async () => {
			const stored = await AsyncStorage.getItem(THEME_NAME_STORAGE_KEY);
			if (stored === 'light' || stored === 'dark') {
				setOverride(stored);
			} else if (stored === 'system' || !stored) {
				setOverride(null);
			}
			setReady(true);
		})();
	}, []);

	// Save whenever override changes
	useEffect(() => {
		if (ready) {
			if (override) {
				AsyncStorage.setItem(THEME_NAME_STORAGE_KEY, override);
			} else {
				AsyncStorage.removeItem(THEME_NAME_STORAGE_KEY);
			}
		}
	}, [override, ready]);

	const value = useMemo(
		() => ({
			themeName: colorScheme,
			theme: theme,
			toggleTheme: () =>
				setOverride(colorScheme === 'dark' ? 'light' : 'dark'),
			switchTheme: (scheme: ThemeName) => {
				setOverride(
					scheme === 'dark'
						? 'dark'
						: scheme === 'light'
							? 'light'
							: null,
				);
			},
		}),
		[colorScheme],
	);

	return (
		<AppThemeContext.Provider value={value}>
			<RestyleThemeProvider theme={theme}>
				{children}
			</RestyleThemeProvider>
		</AppThemeContext.Provider>
	);
};

export const useAppTheme = (
	overrideTheme?: ThemeContextType['themeName'],
): ThemeContextType => {
	const ctx = useContext(AppThemeContext);
	if (!ctx)
		throw new Error('useAppTheme must be used inside AppThemeProvider');

	if (overrideTheme) {
		return {
			themeName: overrideTheme,
			theme: overrideTheme === 'dark' ? DarkTheme : LightTheme,
			switchTheme: () => {},
			toggleTheme: () => {},
		};
	}

	return ctx;
};
