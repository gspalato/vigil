import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer } from "expo-three";
import { THREE } from "expo-three";
import React from "react";
import { ViewProps } from "react-native";

type BlobProps = {
  style?: ViewProps["style"];
};

export const Blob: React.FC<BlobProps> = ({ style }) => {
  return (
    <GLView
      style={[{ width: 100, height: 100 }, style]}
      onContextCreate={onContextCreate}
    ></GLView>
  );
};

const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 0);
};
