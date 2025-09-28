import { GLView } from 'expo-gl';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { View, ViewStyle } from 'react-native';
import {
	SharedValue,
	useDerivedValue,
	useSharedValue,
} from 'react-native-reanimated';

// Vertex shader - simplified version of your original
const vertexShaderSource = `#version 300 es
precision highp float;

in vec4 a_position;
out vec2 v_objectUV;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV;
out vec2 v_imageUV;
out vec2 v_objectBoxSize;
out vec2 v_objectHelperBox;
out vec2 v_responsiveBoxSize;
out vec2 v_responsiveHelperBox;
out vec2 v_patternBoxSize;
out vec2 v_patternHelperBox;

uniform vec2 u_resolution;
uniform float u_pixelRatio;

// Sizing uniforms
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

void main() {
  gl_Position = a_position;
  
  vec2 uv = a_position.xy * 0.5 + 0.5;
  uv -= 0.5;
  
  // Basic object sizing for mesh gradient
  vec2 boxOrigin = vec2(0.5 - u_originX, u_originY - 0.5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.0)) * u_pixelRatio;
  float r = u_rotation * 3.14159265358979323846 / 180.0;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  
  float fixedRatio = 1.0;
  vec2 fixedRatioBoxGivenSize = vec2(
    (u_worldWidth == 0.0) ? u_resolution.x : givenBoxSize.x,
    (u_worldHeight == 0.0) ? u_resolution.y : givenBoxSize.y
  );
  
  vec2 objectBoxSize = vec2(0.0);
  objectBoxSize.x = fixedRatio * min(fixedRatioBoxGivenSize.x / fixedRatio, fixedRatioBoxGivenSize.y);
  if (u_fit == 1.0) { // contain
    objectBoxSize.x = fixedRatio * min(u_resolution.x / fixedRatio, u_resolution.y);
  } else if (u_fit == 2.0) { // cover
    objectBoxSize.x = fixedRatio * max(u_resolution.x / fixedRatio, u_resolution.y);
  }
  objectBoxSize.y = objectBoxSize.x / fixedRatio;
  vec2 objectWorldScale = u_resolution.xy / objectBoxSize;
  
  vec2 objectUV = uv;
  objectUV *= objectWorldScale;
  objectUV += boxOrigin * (objectWorldScale - 1.0);
  objectUV += vec2(-u_offsetX, u_offsetY);
  objectUV /= u_scale;
  objectUV = graphicRotation * objectUV;
  
  v_objectUV = objectUV;
  v_objectBoxSize = objectBoxSize;
  
  // Set other outputs (simplified for mesh gradient)
  v_responsiveUV = uv;
  v_responsiveBoxGivenSize = givenBoxSize;
  v_patternUV = uv;
  v_imageUV = uv;
  v_objectHelperBox = vec2(0.0);
  v_responsiveBoxSize = u_resolution.xy;
  v_responsiveHelperBox = vec2(0.0);
  v_patternBoxSize = u_resolution.xy;
  v_patternHelperBox = vec2(0.0);
}
`;

// Your exact fragment shader with template string interpolation
const createFragmentShader = (maxColorCount: number = 10) => `#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colors[${maxColorCount}];
uniform float u_colorsCount;

uniform float u_distortion;
uniform float u_swirl;
uniform float u_grainMixer;
uniform float u_grainOverlay;

// Sizing variables
in vec2 v_objectUV;
in vec2 v_responsiveUV;
in vec2 v_responsiveBoxGivenSize;
in vec2 v_patternUV;
in vec2 v_imageUV;

// Debug variables
in vec2 v_objectBoxSize;
in vec2 v_objectHelperBox;
in vec2 v_responsiveBoxSize;
in vec2 v_responsiveHelperBox;
in vec2 v_patternBoxSize;
in vec2 v_patternHelperBox;

// Sizing uniforms
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec4 fragColor;

// Shader utils
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float hash21(vec2 p) {
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float noise(vec2 n, vec2 seedOffset) {
  return valueNoise(n + seedOffset);
}

vec2 getPosition(int i, float t) {
  float a = float(i) * 0.37;
  float b = 0.6 + mod(float(i), 3.0) * 0.3;
  float c = 0.8 + mod(float(i + 1), 4.0) * 0.25;

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return 0.5 + 0.5 * vec2(x, y);
}

void main() {
  vec2 shape_uv = v_objectUV;
  shape_uv += 0.5;

  vec2 grainUV = v_objectUV;
  // apply inverse transform to grain_uv so it respects the originXY
  float grainUVRot = u_rotation * 3.14159265358979323846 / 180.0;
  mat2 graphicRotation = mat2(cos(grainUVRot), sin(grainUVRot), -sin(grainUVRot), cos(grainUVRot));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);
  grainUV = transpose(graphicRotation) * grainUV;
  grainUV *= u_scale;
  grainUV *= 0.7;
  grainUV -= graphicOffset;
  grainUV *= v_objectBoxSize;
  
  float grain = noise(grainUV, vec2(0.0));
  float mixerGrain = 0.4 * u_grainMixer * (grain - 0.5);

  const float firstFrameOffset = 41.5;
  float t = 0.5 * (u_time + firstFrameOffset);

  float radius = smoothstep(0.0, 1.0, length(shape_uv - 0.5));
  float center = 1.0 - radius;
  for (float i = 1.0; i <= 2.0; i++) {
    shape_uv.x += u_distortion * center / i * sin(t + i * 0.4 * smoothstep(0.0, 1.0, shape_uv.y)) * cos(0.2 * t + i * 2.4 * smoothstep(0.0, 1.0, shape_uv.y));
    shape_uv.y += u_distortion * center / i * cos(t + i * 2.0 * smoothstep(0.0, 1.0, shape_uv.x));
  }

  vec2 uvRotated = shape_uv;
  uvRotated -= vec2(0.5);
  float angle = 3.0 * u_swirl * radius;
  uvRotated = rotate(uvRotated, -angle);
  uvRotated += vec2(0.5);

  vec3 color = vec3(0.0);
  float opacity = 0.0;
  float totalWeight = 0.0;

  for (int i = 0; i < ${maxColorCount}; i++) {
    if (i >= int(u_colorsCount)) break;

    vec2 pos = getPosition(i, t) + mixerGrain;
    vec3 colorFraction = u_colors[i].rgb * u_colors[i].a;
    float opacityFraction = u_colors[i].a;

    float dist = length(uvRotated - pos);

    dist = pow(dist, 3.5);
    float weight = 1.0 / (dist + 1e-3);
    color += colorFraction * weight;
    opacity += opacityFraction * weight;
    totalWeight += weight;
  }

  color /= totalWeight;
  opacity /= totalWeight;

  float rr = noise(rotate(grainUV, 1.0), vec2(3.0));
  float gg = noise(rotate(grainUV, 2.0) + 10.0, vec2(-1.0));
  float bb = noise(grainUV - 2.0, vec2(5.0));
  vec3 grainColor = vec3(rr, gg, bb);
  color = mix(color, grainColor, 0.01 + 0.3 * u_grainOverlay);
  
  fragColor = vec4(color, opacity);
}
`;

// Utility function to parse hex color to RGBA array
const parseHexColor = (hex: string): [number, number, number, number] => {
	const cleanHex = hex.replace('#', '');
	const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
	const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
	const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
	const a =
		cleanHex.length > 6 ? parseInt(cleanHex.substr(6, 2), 16) / 255 : 1;
	return [r, g, b, a];
};

// Similar to your getShaderColorFromString function
const getShaderColorFromString = (
	colorString: string,
): [number, number, number, number] => {
	return parseHexColor(colorString);
};

// Default sizing options matching your defaultObjectSizing
const defaultObjectSizing = {
	fit: 'contain' as const,
	rotation: 0,
	scale: 1,
	originX: 0.5,
	originY: 0.5,
	offsetX: 0,
	offsetY: 0,
	worldWidth: 0,
	worldHeight: 0,
};

// Shader fit options enum
const ShaderFitOptions = {
	none: 0,
	contain: 1,
	cover: 2,
};

// Motion params interface
export interface ShaderMotionParams {
	speed?: number;
	frame?: number;
}

// Main params interface matching your original
export interface MeshGradientParams {
	colors?: string[];
	distortion?: number;
	swirl?: number;
	grainMixer?: number;
	grainOverlay?: number;
	fit?: keyof typeof ShaderFitOptions;
	rotation?: number;
	scale?: number;
	originX?: number;
	originY?: number;
	offsetX?: number;
	offsetY?: number;
	worldWidth?: number;
	worldHeight?: number;
}

// Component props interface
export interface MeshGradientProps
	extends MeshGradientParams,
		ShaderMotionParams {
	width: number;
	height: number;
	style?: ViewStyle;
	animated?: boolean;
}

// Uniforms interface for type safety
export interface MeshGradientUniforms {
	u_colors: number[][];
	u_colorsCount: number;
	u_distortion: number;
	u_swirl: number;
	u_grainMixer: number;
	u_grainOverlay: number;
	u_fit: number;
	u_rotation: number;
	u_scale: number;
	u_offsetX: number;
	u_offsetY: number;
	u_originX: number;
	u_originY: number;
	u_worldWidth: number;
	u_worldHeight: number;
}

// Preset type
type MeshGradientPreset = {
	name: string;
	params: Required<MeshGradientParams & ShaderMotionParams>;
};

export const defaultPreset: MeshGradientPreset = {
	name: 'Default',
	params: {
		...defaultObjectSizing,
		speed: 1,
		frame: 0,
		colors: ['#e0eaff', '#241d9a', '#f75092', '#9f50d3'],
		distortion: 0.8,
		swirl: 0.1,
		grainMixer: 0,
		grainOverlay: 0,
	},
};

export const purplePreset: MeshGradientPreset = {
	name: 'Purple',
	params: {
		...defaultObjectSizing,
		speed: 0.6,
		frame: 0,
		colors: ['#aaa7d7', '#3c2b8e'],
		distortion: 1,
		swirl: 1,
		grainMixer: 0,
		grainOverlay: 0,
	},
};

export const beachPreset: MeshGradientPreset = {
	name: 'Beach',
	params: {
		...defaultObjectSizing,
		speed: 0.1,
		frame: 0,
		colors: ['#bcecf6', '#00aaff', '#00f7ff', '#ffd447'],
		distortion: 0.8,
		swirl: 0.35,
		grainMixer: 0,
		grainOverlay: 0,
	},
};

export const inkPreset: MeshGradientPreset = {
	name: 'Ink',
	params: {
		...defaultObjectSizing,
		speed: 1,
		frame: 0,
		colors: ['#ffffff', '#000000'],
		distortion: 1,
		swirl: 0.2,
		rotation: 90,
		grainMixer: 0,
		grainOverlay: 0,
	},
};

export const meshGradientPresets: MeshGradientPreset[] = [
	defaultPreset,
	inkPreset,
	purplePreset,
	beachPreset,
];

// WebGL utility functions
const createShader = (
	gl: WebGL2RenderingContext,
	type: number,
	source: string,
): WebGLShader | null => {
	const shader = gl.createShader(type);
	if (!shader) return null;

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
};

const createProgram = (
	gl: WebGL2RenderingContext,
	vertexSource: string,
	fragmentSource: string,
): WebGLProgram | null => {
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

	if (!vertexShader || !fragmentShader) return null;

	const program = gl.createProgram();
	if (!program) return null;

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Error linking program:', gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}

	// Clean up shaders
	gl.detachShader(program, vertexShader);
	gl.detachShader(program, fragmentShader);
	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);

	return program;
};

// Main component
export const MeshGradient: React.FC<MeshGradientProps> = ({
	// Own props
	speed = defaultPreset.params.speed,
	frame = defaultPreset.params.frame,
	colors = defaultPreset.params.colors,
	distortion = defaultPreset.params.distortion,
	swirl = defaultPreset.params.swirl,
	grainMixer = defaultPreset.params.grainMixer,
	grainOverlay = defaultPreset.params.grainOverlay,
	// Sizing props
	fit = defaultPreset.params.fit,
	rotation = defaultPreset.params.rotation,
	scale = defaultPreset.params.scale,
	originX = defaultPreset.params.originX,
	originY = defaultPreset.params.originY,
	offsetX = defaultPreset.params.offsetX,
	offsetY = defaultPreset.params.offsetY,
	worldWidth = defaultPreset.params.worldWidth,
	worldHeight = defaultPreset.params.worldHeight,
	// Canvas props
	width,
	height,
	style,
	animated = true,
}: MeshGradientProps) => {
	const glRef = useRef<WebGL2RenderingContext | null>(null);
	const programRef = useRef<WebGLProgram | null>(null);
	const uniformLocationsRef = useRef<
		Record<string, WebGLUniformLocation | null>
	>({});
	const animationFrameRef = useRef<number | null>(null);
	const startTimeRef = useRef<number>(0);

	// Create uniforms similar to your original approach
	const uniforms = useMemo(() => {
		const colorVec4s = colors.map(getShaderColorFromString);

		return {
			u_colors: colorVec4s,
			u_colorsCount: colors.length,
			u_distortion: distortion,
			u_swirl: swirl,
			u_grainMixer: grainMixer,
			u_grainOverlay: grainOverlay,
			u_fit: ShaderFitOptions[fit],
			u_rotation: rotation,
			u_scale: scale,
			u_offsetX: offsetX,
			u_offsetY: offsetY,
			u_originX: originX,
			u_originY: originY,
			u_worldWidth: worldWidth,
			u_worldHeight: worldHeight,
		} satisfies MeshGradientUniforms;
	}, [
		colors,
		distortion,
		swirl,
		grainMixer,
		grainOverlay,
		fit,
		rotation,
		scale,
		offsetX,
		offsetY,
		originX,
		originY,
		worldWidth,
		worldHeight,
	]);

	const setupWebGL = (gl: WebGL2RenderingContext) => {
		glRef.current = gl;

		// Create shader program
		const maxColorCount = Math.max(10, colors.length);
		const fragmentShader = createFragmentShader(maxColorCount);
		const program = createProgram(gl, vertexShaderSource, fragmentShader);

		if (!program) {
			console.error('Failed to create shader program');
			return;
		}

		programRef.current = program;

		// Set up position attribute
		const positionAttributeLocation = gl.getAttribLocation(
			program,
			'a_position',
		);
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(positions),
			gl.STATIC_DRAW,
		);
		gl.enableVertexAttribArray(positionAttributeLocation);
		gl.vertexAttribPointer(
			positionAttributeLocation,
			2,
			gl.FLOAT,
			false,
			0,
			0,
		);

		// Get uniform locations
		const uniformLocations: Record<string, WebGLUniformLocation | null> = {
			u_time: gl.getUniformLocation(program, 'u_time'),
			u_resolution: gl.getUniformLocation(program, 'u_resolution'),
			u_pixelRatio: gl.getUniformLocation(program, 'u_pixelRatio'),
			u_colors: gl.getUniformLocation(program, 'u_colors'),
			u_colorsCount: gl.getUniformLocation(program, 'u_colorsCount'),
			u_distortion: gl.getUniformLocation(program, 'u_distortion'),
			u_swirl: gl.getUniformLocation(program, 'u_swirl'),
			u_grainMixer: gl.getUniformLocation(program, 'u_grainMixer'),
			u_grainOverlay: gl.getUniformLocation(program, 'u_grainOverlay'),
			u_fit: gl.getUniformLocation(program, 'u_fit'),
			u_rotation: gl.getUniformLocation(program, 'u_rotation'),
			u_scale: gl.getUniformLocation(program, 'u_scale'),
			u_offsetX: gl.getUniformLocation(program, 'u_offsetX'),
			u_offsetY: gl.getUniformLocation(program, 'u_offsetY'),
			u_originX: gl.getUniformLocation(program, 'u_originX'),
			u_originY: gl.getUniformLocation(program, 'u_originY'),
			u_worldWidth: gl.getUniformLocation(program, 'u_worldWidth'),
			u_worldHeight: gl.getUniformLocation(program, 'u_worldHeight'),
		};

		uniformLocationsRef.current = uniformLocations;

		// Set viewport
		gl.viewport(0, 0, width, height);

		// Set initial uniforms
		gl.useProgram(program);

		// Set resolution and pixel ratio
		gl.uniform2f(uniformLocations.u_resolution!, width, height);
		gl.uniform1f(uniformLocations.u_pixelRatio!, 1);

		// Set colors
		const flatColors: number[] = [];
		uniforms.u_colors.forEach((color) => {
			flatColors.push(...color);
		});
		gl.uniform4fv(uniformLocations.u_colors!, flatColors);
		gl.uniform1f(uniformLocations.u_colorsCount!, uniforms.u_colorsCount);

		// Set other uniforms
		gl.uniform1f(uniformLocations.u_distortion!, uniforms.u_distortion);
		gl.uniform1f(uniformLocations.u_swirl!, uniforms.u_swirl);
		gl.uniform1f(uniformLocations.u_grainMixer!, uniforms.u_grainMixer);
		gl.uniform1f(uniformLocations.u_grainOverlay!, uniforms.u_grainOverlay);
		gl.uniform1f(uniformLocations.u_fit!, uniforms.u_fit);
		gl.uniform1f(uniformLocations.u_rotation!, uniforms.u_rotation);
		gl.uniform1f(uniformLocations.u_scale!, uniforms.u_scale);
		gl.uniform1f(uniformLocations.u_offsetX!, uniforms.u_offsetX);
		gl.uniform1f(uniformLocations.u_offsetY!, uniforms.u_offsetY);
		gl.uniform1f(uniformLocations.u_originX!, uniforms.u_originX);
		gl.uniform1f(uniformLocations.u_originY!, uniforms.u_originY);
		gl.uniform1f(uniformLocations.u_worldWidth!, uniforms.u_worldWidth);
		gl.uniform1f(uniformLocations.u_worldHeight!, uniforms.u_worldHeight);

		startTimeRef.current = Date.now();

		// Start render loop if animated
		if (animated && speed !== 0) {
			startRenderLoop();
		} else {
			// Render once for static
			render();
		}
	};

	const render = () => {
		const gl = glRef.current;
		const program = programRef.current;
		const uniformLocations = uniformLocationsRef.current;

		if (!gl || !program || !uniformLocations.u_time) return;

		const currentTime =
			animated && speed !== 0
				? (Date.now() - startTimeRef.current) * speed + frame
				: frame;

		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(program);
		gl.uniform1f(uniformLocations.u_time, currentTime * 0.001);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.flush();
	};

	const startRenderLoop = () => {
		const animate = () => {
			render();
			if (animated && speed !== 0) {
				animationFrameRef.current = requestAnimationFrame(animate);
			}
		};
		animate();
	};

	useEffect(() => {
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	// Update uniforms when they change
	useEffect(() => {
		const gl = glRef.current;
		const program = programRef.current;
		const uniformLocations = uniformLocationsRef.current;

		if (!gl || !program) return;

		gl.useProgram(program);

		// Update colors
		const flatColors: number[] = [];
		uniforms.u_colors.forEach((color) => {
			flatColors.push(...color);
		});
		gl.uniform4fv(uniformLocations.u_colors!, flatColors);
		gl.uniform1f(uniformLocations.u_colorsCount!, uniforms.u_colorsCount);

		// Update other uniforms
		gl.uniform1f(uniformLocations.u_distortion!, uniforms.u_distortion);
		gl.uniform1f(uniformLocations.u_swirl!, uniforms.u_swirl);
		gl.uniform1f(uniformLocations.u_grainMixer!, uniforms.u_grainMixer);
		gl.uniform1f(uniformLocations.u_grainOverlay!, uniforms.u_grainOverlay);
		gl.uniform1f(uniformLocations.u_fit!, uniforms.u_fit);
		gl.uniform1f(uniformLocations.u_rotation!, uniforms.u_rotation);
		gl.uniform1f(uniformLocations.u_scale!, uniforms.u_scale);
		gl.uniform1f(uniformLocations.u_offsetX!, uniforms.u_offsetX);
		gl.uniform1f(uniformLocations.u_offsetY!, uniforms.u_offsetY);
		gl.uniform1f(uniformLocations.u_originX!, uniforms.u_originX);
		gl.uniform1f(uniformLocations.u_originY!, uniforms.u_originY);
		gl.uniform1f(uniformLocations.u_worldWidth!, uniforms.u_worldWidth);
		gl.uniform1f(uniformLocations.u_worldHeight!, uniforms.u_worldHeight);

		render();
	}, [uniforms]);

	// Update animation state
	useEffect(() => {
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}

		if (animated && speed !== 0) {
			startTimeRef.current = Date.now();
			startRenderLoop();
		} else {
			render();
		}
	}, [animated, speed, frame]);

	return (
		<View style={[{ width, height }, style]}>
			<GLView style={{ width, height }} onContextCreate={setupWebGL} />
		</View>
	);
};

// Color comparison utility for memo optimization
const colorArraysEqual = (a: string[], b: string[]): boolean => {
	if (a.length !== b.length) return false;
	return a.every((color, index) => color === b[index]);
};

// Enhanced memo with deep comparison for colors (similar to your colorPropsAreEqual)
export const MeshGradientMemo: React.FC<MeshGradientProps> = memo(
	MeshGradient,
	(prevProps, nextProps) => {
		// Custom comparison for colors array
		const colorsSame = colorArraysEqual(
			prevProps.colors || defaultPreset.params.colors,
			nextProps.colors || defaultPreset.params.colors,
		);

		if (!colorsSame) return false;

		// Compare other props
		const propsToCompare: (keyof MeshGradientProps)[] = [
			'width',
			'height',
			'speed',
			'frame',
			'distortion',
			'swirl',
			'grainMixer',
			'grainOverlay',
			'fit',
			'rotation',
			'scale',
			'originX',
			'originY',
			'offsetX',
			'offsetY',
			'worldWidth',
			'worldHeight',
			'animated',
		];

		return propsToCompare.every(
			(prop) => prevProps[prop] === nextProps[prop],
		);
	},
);

/*
Usage Examples:

// Basic usage (same as original)
<MeshGradient 
  width={300} 
  height={200} 
  colors={['#e0eaff', '#241d9a', '#f75092']}
/>

// With preset
<MeshGradient 
  width={300} 
  height={200} 
  {...purplePreset.params}
/>

// Animated with custom parameters
<MeshGradient 
  width={300} 
  height={200} 
  colors={['#bcecf6', '#00aaff', '#00f7ff', '#ffd447']}
  distortion={0.8}
  swirl={0.35}
  speed={0.5}
  animated={true}
/>

// Static (non-animated)
<MeshGradient 
  width={300} 
  height={200} 
  colors={['#ffffff', '#000000']}
  frame={10}
  animated={false}
/>

// With custom sizing (matching your ShaderMount API)
<MeshGradient 
  width={400} 
  height={300}
  colors={['#e0eaff', '#241d9a', '#f75092', '#9f50d3']}
  fit="cover"
  rotation={45}
  scale={1.2}
  originX={0.3}
  originY={0.7}
  offsetX={10}
  offsetY={-5}
  distortion={0.8}
  swirl={0.1}
  animated={true}
  speed={0.8}
/>
*/
