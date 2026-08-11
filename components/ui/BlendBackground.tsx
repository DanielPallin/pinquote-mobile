// components/ui/BlendBackground.tsx
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { 
  Canvas, 
  Image, 
  useImage, 
  Rect, 
  BlendMode, 
  LinearGradient, 
  vec 
} from '@shopify/react-native-skia';

interface BlendBackgroundProps {
  imageUrl: string;
  baseColor?: string;
  width: number;
  height: number;
}

export const BlendBackground = ({ 
  imageUrl, 
  baseColor = '#958ce4', 
  width, 
  height 
}: BlendBackgroundProps) => {
  // Load the remote image into Skia's memory
  const skiaImage = useImage(imageUrl);

  // Fallback while the image is fetching over the network
  if (!skiaImage) {
    return (
      <View style={[styles.loadingContainer, { width, height, backgroundColor: baseColor }]}>
        <ActivityIndicator color="rgba(255,255,255,0.5)" />
      </View>
    );
  }

  const gradientHeight = 128; // Equivalent to tailwind h-32

  return (
    <Canvas style={{ width, height }}>
      {/* 1. Base color background (Solid or Gradient) */}
      <Rect x={0} y={0} width={width} height={height} color={baseColor} />

      {/* 2. The Avatar Image with the exact Blend Mode used on the web */}
      <Image
        image={skiaImage}
        x={0}
        y={0}
        width={width}
        height={height}
        fit="cover"
        blendMode="overlay" // This is the magic! You can also try "luminosity"
        opacity={0.8}
      />

      {/* 3. The fade-to-white gradient at the bottom to transition into the card body */}
      <Rect x={0} y={height - gradientHeight} width={width} height={gradientHeight}>
        <LinearGradient
          start={vec(0, height - gradientHeight)}
          end={vec(0, height)}
          colors={['transparent', 'rgba(255,255,255,0.8)', '#ffffff']}
        />
      </Rect>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});