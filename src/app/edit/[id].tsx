import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { shadow } from '../../theme/shadow';
import { Category, fetchCategories, fetchRecipe, updateRecipe } from '../../api/recipes';
import PressableScale from '../../components/PressableScale';
import TextField from '../../components/TextField';

type Row = { id: number; text: string };
type Setter = Dispatch<SetStateAction<Row[]>>;
type Errors = { title?: string; category?: string; ingredients?: string; steps?: string };

function RowInput(props: {
  index?: number;
  value: string;
  placeholder: string;
  multiline?: boolean;
  canRemove: boolean;
  onChange: (t: string) => void;
  onRemove: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.rowWrap}>
      {props.index !== undefined && (
        <View style={styles.stepNum}>
          <Text style={styles.stepNumText}>{props.index + 1}</Text>
        </View>
      )}
      <View style={[styles.rowBox, focused && styles.focused, props.multiline && { minHeight: 64 }]}>
        <TextInput
          style={[styles.rowInput, props.multiline && { textAlignVertical: 'top' }]}
          placeholder={props.placeholder}
          placeholderTextColor="#A38B77"
          value={props.value}
          onChangeText={props.onChange}
          multiline={props.multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {props.canRemove && (
        <Pressable onPress={props.onRemove} hitSlop={8} accessibilityLabel="Remove">
          <Ionicons name="close-circle" size={22} color={colors.brownSoft} />
        </Pressable>
      )}
    </View>
  );
}

export default function EditRecipe() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const nextId = useRef(1);

  const [status, setStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [descFocused, setDescFocused] = useState(false);
  const [ingredients, setIngredients] = useState<Row[]>([]);
  const [steps, setSteps] = useState<Row[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [newBase64, setNewBase64] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ data: { user } }, r, cats] = await Promise.all([
          supabase.auth.getUser(),
          fetchRecipe(id),
          fetchCategories(),
        ]);
        if (!active) return;
        if (!r || !user || r.authorId !== user.id) {
          setStatus('denied');
          return;
        }
        setCategories(cats);
        setTitle(r.title);
        setCategoryId(r.categoryId);
        setDescription(r.description ?? '');
        setIngredients(r.ingredients.map((text) => ({ id: nextId.current++, text })));
        setSteps(r.steps.map((text) => ({ id: nextId.current++, text })));
        setImage(r.imageUrl);
        setOriginalImage(r.imageUrl);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });
    if (!res.canceled) {
      setImage(res.assets[0].uri);
      setNewBase64(res.assets[0].base64 ?? null);
    }
  }

  function removePhoto() {
    setImage(null);
    setNewBase64(null);
  }

  const addRow = (set: Setter) => set((prev) => [...prev, { id: nextId.current++, text: '' }]);
  const editRow = (set: Setter, rid: number, text: string) =>
    set((prev) => prev.map((r) => (r.id === rid ? { ...r, text } : r)));
  const removeRow = (set: Setter, rid: number) =>
    set((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rid) : prev));

  async function onSave() {
    const e: Errors = {};
    if (!title.trim()) e.title = 'Give your recipe a name.';
    if (categoryId === null) e.category = 'Pick a category.';
    if (!ingredients.some((r) => r.text.trim())) e.ingredients = 'Add at least one ingredient.';
    if (!steps.some((r) => r.text.trim())) e.steps = 'Add at least one step.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      await updateRecipe(id, {
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId!,
        ingredients: ingredients.map((r) => r.text.trim()).filter(Boolean),
        steps: steps.map((r) => r.text.trim()).filter(Boolean),
        imageBase64: newBase64,
        removeImage: !image && !!originalImage,
      });
    } catch (err: any) {
      setSaving(false);
      Alert.alert('Could not save changes', err?.message ?? 'Please try again.');
      return;
    }
    setSaving(false);
    router.back();
  }

  if (status !== 'ready') {
    return (
      <View style={[styles.container, styles.center]}>
        {status === 'loading' ? (
          <ActivityIndicator color={colors.orange} size="large" />
        ) : (
          <>
            <Text style={styles.stateTitle}>
              {status === 'denied' ? 'You can only edit your own recipes' : "Couldn't load this recipe"}
            </Text>
            <Pressable style={{ marginTop: 14 }} onPress={() => router.back()}>
              <Text style={styles.link}>Go back</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 32 }}
      >
        <View style={styles.top}>
          <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={22} color={colors.brown} />
          </Pressable>
          <Text style={styles.heading}>Edit recipe</Text>
        </View>

        <Text style={styles.label}>Photo (optional)</Text>
        <Pressable style={styles.photo} onPress={pickImage} accessibilityRole="button" accessibilityLabel="Change photo">
          {image ? (
            <>
              <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <Pressable style={styles.photoRemove} onPress={removePhoto} hitSlop={8} accessibilityLabel="Remove photo">
                <Ionicons name="close" size={18} color={colors.white} />
              </Pressable>
            </>
          ) : (
            <View style={styles.photoEmpty}>
              <Ionicons name="camera-outline" size={32} color={colors.brownSoft} />
              <Text style={styles.photoText}>Tap to add a photo</Text>
            </View>
          )}
        </Pressable>

        <TextField
          label="Title"
          placeholder="e.g. Adobong Manok"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.wrap}>
          {categories.map((c) => {
            const active = categoryId === c.id;
            return (
              <Pressable key={c.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setCategoryId(c.id)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}

        <Text style={[styles.label, { marginTop: 16 }]}>Short description</Text>
        <View style={[styles.descBox, descFocused && styles.focused]}>
          <TextInput
            style={styles.descInput}
            placeholder="What makes this dish special?"
            placeholderTextColor="#A38B77"
            value={description}
            onChangeText={setDescription}
            multiline
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
          />
        </View>

        <Text style={[styles.label, { marginTop: 18 }]}>Ingredients</Text>
        {ingredients.map((r) => (
          <RowInput
            key={r.id}
            value={r.text}
            placeholder="e.g. 1 kg chicken thighs"
            canRemove={ingredients.length > 1}
            onChange={(t) => editRow(setIngredients, r.id, t)}
            onRemove={() => removeRow(setIngredients, r.id)}
          />
        ))}
        {errors.ingredients ? <Text style={styles.error}>{errors.ingredients}</Text> : null}
        <Pressable style={styles.addRow} onPress={() => addRow(setIngredients)}>
          <Ionicons name="add-circle" size={20} color={colors.orange} />
          <Text style={styles.addRowText}>Add ingredient</Text>
        </Pressable>

        <Text style={[styles.label, { marginTop: 18 }]}>Steps</Text>
        {steps.map((r, i) => (
          <RowInput
            key={r.id}
            index={i}
            multiline
            value={r.text}
            placeholder="Describe this step"
            canRemove={steps.length > 1}
            onChange={(t) => editRow(setSteps, r.id, t)}
            onRemove={() => removeRow(setSteps, r.id)}
          />
        ))}
        {errors.steps ? <Text style={styles.error}>{errors.steps}</Text> : null}
        <Pressable style={styles.addRow} onPress={() => addRow(setSteps)}>
          <Ionicons name="add-circle" size={20} color={colors.orange} />
          <Text style={styles.addRowText}>Add step</Text>
        </Pressable>

        <PressableScale style={styles.save} onPress={onSave} disabled={saving} accessibilityRole="button">
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save changes</Text>}
        </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontFamily: 'Fredoka_700Bold', fontSize: 20, color: colors.brown, textAlign: 'center' },
  link: { color: colors.orangeDark, fontWeight: '700', fontSize: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow },
  heading: { fontFamily: 'Fredoka_700Bold', fontSize: 27, color: colors.brown },
  label: { fontSize: 14, fontWeight: '700', color: colors.brown, marginBottom: 6 },
  photo: {
    height: 150, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.brownSoft,
    overflow: 'hidden', marginBottom: 16, alignItems: 'center', justifyContent: 'center',
  },
  photoEmpty: { alignItems: 'center', gap: 6 },
  photoText: { color: colors.brownSoft, fontSize: 14 },
  photoRemove: {
    position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(74,44,26,0.75)', alignItems: 'center', justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.chipBg, borderRadius: 999, borderWidth: 1.5, borderColor: colors.line, paddingVertical: 8, paddingHorizontal: 15 },
  chipActive: { backgroundColor: colors.brown, borderColor: colors.brown },
  chipText: { color: colors.brown, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: colors.white },
  descBox: {
    backgroundColor: colors.white, borderRadius: 16, borderWidth: 2, borderColor: 'transparent',
    paddingHorizontal: 15, paddingVertical: 10, minHeight: 88, ...shadow,
  },
  descInput: { fontSize: 16, color: colors.brown, textAlignVertical: 'top', minHeight: 64 },
  focused: { borderColor: colors.orange },
  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  rowBox: {
    flex: 1, backgroundColor: colors.white, borderRadius: 16, borderWidth: 2, borderColor: 'transparent',
    paddingHorizontal: 15, justifyContent: 'center', minHeight: 50,
  },
  rowInput: { fontSize: 16, color: colors.brown, paddingVertical: 10 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  error: { color: colors.error, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  addRowText: { color: colors.brown, fontWeight: '700', fontSize: 15 },
  save: { backgroundColor: colors.orange, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});