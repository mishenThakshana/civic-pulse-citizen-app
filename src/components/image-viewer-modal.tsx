import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { REMOTE_IMAGE_HEADERS } from '@/lib/api';

const DOUBLE_TAP_SCALE = 3;

type ImageViewerModalProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
};

export function ImageViewerModal({ visible, uri, onClose }: ImageViewerModalProps) {
  const { width, height } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  function reset() {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, savedScale.value * event.scale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) reset();
    });

  const pan = Gesture.Pan()
    .maxPointers(2)
    .onUpdate((event) => {
      if (savedScale.value <= 1) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1) {
        reset();
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const gesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.container}>
          <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>

          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.imageWrapper, { width, height }, animatedStyle]}>
              {uri ? (
                <Image
                  source={{ uri, headers: REMOTE_IMAGE_HEADERS }}
                  style={styles.image}
                  contentFit="contain"
                />
              ) : null}
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#000' },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 1,
    padding: 6,
  },
  imageWrapper: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
