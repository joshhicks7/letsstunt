import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { REPORT_REASONS, type ReportReasonValue } from '@/constants/safety';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  profileDisplayName: string;
  profileId: string;
  onReport: (profileId: string, reason: string, details?: string) => void;
  onBlock?: (profileId: string) => void;
  showBlockOption?: boolean;
}

export function ReportModal({
  visible,
  onClose,
  profileDisplayName,
  profileId,
  onReport,
  onBlock,
  showBlockOption = true,
}: ReportModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [reason, setReason] = useState<ReportReasonValue | ''>('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!reason) return;
    onReport(profileId, reason, details.trim() || undefined);
    setSubmitted(true);
    setTimeout(() => {
      setReason('');
      setDetails('');
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  const handleBlock = () => {
    if (onBlock) {
      Alert.alert(
        'Block this user?',
        `You won't see ${profileDisplayName} again and they won't see you. You can unblock later in Settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: () => {
              onBlock(profileId);
              onClose();
            },
          },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ThemedText style={styles.title}>Report or block</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.secondary }]}>
            Reporting {profileDisplayName} helps keep our community safe. We review all reports.
          </ThemedText>

          {!submitted ? (
            <>
              <ThemedText style={[styles.label, { color: colors.text }]}>Reason for report</ThemedText>
              <ScrollView style={styles.reasonsScroll} showsVerticalScrollIndicator={false}>
                {REPORT_REASONS.map((r) => (
                  <Pressable
                    key={r.value}
                    style={[styles.reasonChip, { borderColor: reason === r.value ? colors.tint : colors.border, backgroundColor: reason === r.value ? colors.tint + '22' : colors.card }]}
                    onPress={() => setReason(r.value)}
                  >
                    <ThemedText style={[styles.reasonText, reason === r.value && { color: colors.tint }]}>{r.label}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
              <ThemedText style={[styles.label, { color: colors.text }]}>Additional details (optional)</ThemedText>
              <TextInput
                style={[styles.detailsInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="What happened?"
                placeholderTextColor={colors.secondary}
                value={details}
                onChangeText={setDetails}
                multiline
              />
              <Pressable
                style={[styles.submitBtn, { backgroundColor: reason ? colors.tint : colors.border }]}
                onPress={handleSubmit}
                disabled={!reason}
              >
                <ThemedText style={styles.submitBtnText}>Submit report</ThemedText>
              </Pressable>
              {showBlockOption && onBlock ? (
                <Pressable style={[styles.blockBtn, { borderColor: colors.border }]} onPress={handleBlock}>
                  <FontAwesome name="ban" size={18} color={colors.text} />
                  <ThemedText style={[styles.blockBtnText, { color: colors.text }]}>Block this user</ThemedText>
                </Pressable>
              ) : null}
            </>
          ) : (
            <View style={styles.thankYou}>
              <FontAwesome name="check-circle" size={48} color={colors.tint} />
              <ThemedText style={[styles.thankYouText, { color: colors.text }]}>Thank you. We'll review this report.</ThemedText>
            </View>
          )}

          <Pressable style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
            <ThemedText style={[styles.cancelBtnText, { color: colors.secondary }]}>Cancel</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const View = ThemedView;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl + 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#999',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs },
  reasonsScroll: { maxHeight: 180, marginBottom: SPACING.md },
  reasonChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  reasonText: { fontSize: FONT_SIZE.md },
  detailsInput: {
    minHeight: 80,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
  },
  submitBtn: { paddingVertical: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center', marginBottom: SPACING.sm },
  submitBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  blockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  blockBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  thankYou: { alignItems: 'center', paddingVertical: SPACING.xl },
  thankYouText: { marginTop: SPACING.md, fontSize: FONT_SIZE.md },
  cancelBtn: { paddingVertical: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: FONT_SIZE.md },
});
