import { Modal, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../theme/colors';

const LOGO_VIDEO = require('../../assets/logo-remove.mp4');

function Overlay({ label }: { label: string }) {
  const player = useVideoPlayer(LOGO_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <Modal transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.container}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Modal>
  );
}

// the video only starts when the overlay is shown, so it always plays from the beginning
export default function LoadingOverlay({ visible, label }: { visible: boolean; label: string }) {
  if (!visible) return null;
  return <Overlay label={label} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  video: { width: 240, height: 240 },
  label: { marginTop: 8, fontFamily: 'Fredoka_700Bold', fontSize: 20, color: colors.brown },
});