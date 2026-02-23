import { DollarSign, Hash, Layers, Package, Plus, Tag, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { store as storeCategoryAction } from '@/actions/App/Http/Controllers/Admin/ProductCategoryController';
import { store as storeTagAction } from '@/actions/App/Http/Controllers/Admin/ProductTagController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Category = { id: string; name: string };
type ProductTag = { id: string; name: string };
type EnumOption = { value: string; name?: string; label?: string };

const STATUS_OPTIONS = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
] as const;

const UNITY_OPTIONS = [
    { value: 'piece', label: 'Pièce' },
    { value: 'kilogram', label: 'Kilogramme' },
    { value: 'liter', label: 'Litre' },
    { value: 'meter', label: 'Mètre' },
    { value: 'square_meter', label: 'Mètre²' },
    { value: 'cubic_meter', label: 'Mètre³' },
    { value: 'pack', label: 'Pack' },
    { value: 'box', label: 'Boîte' },
] as const;

type ProductDefaults = {
    name?: string;
    code?: string;
    description?: string;
    price?: string;
    cost_price?: string;
    stock?: number;
    stock_alert?: number;
    unity?: string;
    status?: string;
    image?: string | null;
    category_id?: string;
    tags?: ProductTag[];
};

type Props = {
    defaults?: ProductDefaults;
    categories: Category[];
    tags: ProductTag[];
    errors: Record<string, string>;
    onCategoriesChange?: (categories: Category[]) => void;
    onTagsChange?: (tags: ProductTag[]) => void;
};

export default function ProductForm({
    defaults = {},
    categories: initialCategories,
    tags: initialTags,
    errors,
    onCategoriesChange,
    onTagsChange,
}: Props) {
    const [categoryValue, setCategoryValue] = useState<string>(defaults.category_id ?? '');
    const [statusValue, setStatusValue] = useState<string>(defaults.status ?? 'active');
    const [unityValue, setUnityValue] = useState<string>(defaults.unity ?? 'piece');
    const [selectedTags, setSelectedTags] = useState<string[]>(defaults.tags?.map((t) => t.id) ?? []);
    const [imagePreview, setImagePreview] = useState<string | null>(defaults.image ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Category creation modal
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [categoryCreating, setCategoryCreating] = useState(false);
    const [categoryError, setCategoryError] = useState('');
    const [categories, setCategories] = useState<Category[]>(initialCategories);

    // Tag creation modal
    const [showTagModal, setShowTagModal] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [tagCreating, setTagCreating] = useState(false);
    const [tagError, setTagError] = useState('');
    const [tags, setTags] = useState<ProductTag[]>(initialTags);

    const handleFileChange = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileChange(file);
        },
        [handleFileChange],
    );

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
    };

    async function handleCreateCategory() {
        if (!newCategoryName.trim()) {
            setCategoryError('Le nom de la catégorie est obligatoire.');
            return;
        }
        setCategoryCreating(true);
        setCategoryError('');

        try {
            const action = storeCategoryAction();
            const response = await fetch(action.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((c) => c.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
                body: JSON.stringify({ name: newCategoryName.trim(), description: newCategoryDesc.trim() || null }),
            });

            if (!response.ok) {
                const data = await response.json();
                setCategoryError(data.message || 'Erreur lors de la création.');
                return;
            }

            const created = await response.json();
            const updatedCategories = [...categories, created].sort((a, b) => a.name.localeCompare(b.name));
            setCategories(updatedCategories);
            setCategoryValue(created.id);
            onCategoriesChange?.(updatedCategories);
            setShowCategoryModal(false);
            setNewCategoryName('');
            setNewCategoryDesc('');
        } catch {
            setCategoryError('Une erreur est survenue.');
        } finally {
            setCategoryCreating(false);
        }
    }

    async function handleCreateTag() {
        if (!newTagName.trim()) {
            setTagError('Le nom du tag est obligatoire.');
            return;
        }
        setTagCreating(true);
        setTagError('');

        try {
            const action = storeTagAction();
            const response = await fetch(action.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((c) => c.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
                body: JSON.stringify({ name: newTagName.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                setTagError(data.message || 'Erreur lors de la création.');
                return;
            }

            const created = await response.json();
            const updatedTags = [...tags, created].sort((a, b) => a.name.localeCompare(b.name));
            setTags(updatedTags);
            setSelectedTags((prev) => [...prev, created.id]);
            onTagsChange?.(updatedTags);
            setShowTagModal(false);
            setNewTagName('');
        } catch {
            setTagError('Une erreur est survenue.');
        } finally {
            setTagCreating(false);
        }
    }

    return (
        <>
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main info */}
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="size-4" />
                                Informations générales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">
                                        Nom <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="name" name="name" defaultValue={defaults.name ?? ''} placeholder="Nom du produit" autoFocus />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="code">
                                        Code <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Hash className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                        <Input id="code" name="code" defaultValue={defaults.code ?? ''} placeholder="PRD-00001" className="pl-8" />
                                    </div>
                                    <InputError message={errors.code} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    defaultValue={defaults.description ?? ''}
                                    rows={3}
                                    placeholder="Décrivez le produit…"
                                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>

                            {/* Category with create button */}
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">
                                    Catégorie <span className="text-destructive">*</span>
                                </Label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Select value={categoryValue} onValueChange={setCategoryValue}>
                                            <SelectTrigger id="category_id">
                                                <SelectValue placeholder="Choisir une catégorie" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <input type="hidden" name="category_id" value={categoryValue} />
                                    </div>
                                    <Button type="button" variant="outline" size="icon" onClick={() => setShowCategoryModal(true)} title="Créer une catégorie">
                                        <Plus className="size-4" />
                                    </Button>
                                </div>
                                <InputError message={errors.category_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & stock */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DollarSign className="size-4" />
                                Prix & Stock
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="price">
                                        Prix de vente <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={defaults.price ?? ''} placeholder="0.00" />
                                    <InputError message={errors.price} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cost_price">Prix d'achat</Label>
                                    <Input id="cost_price" name="cost_price" type="number" step="0.01" min="0" defaultValue={defaults.cost_price ?? ''} placeholder="0.00" />
                                    <InputError message={errors.cost_price} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="stock">
                                        Stock <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="stock" name="stock" type="number" min="0" defaultValue={defaults.stock ?? 0} />
                                    <InputError message={errors.stock} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="stock_alert">Seuil d'alerte</Label>
                                    <Input id="stock_alert" name="stock_alert" type="number" min="0" defaultValue={defaults.stock_alert ?? 0} />
                                    <InputError message={errors.stock_alert} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="unity">
                                        Unité <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={unityValue} onValueChange={setUnityValue}>
                                        <SelectTrigger id="unity">
                                            <SelectValue placeholder="Unité" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {UNITY_OPTIONS.map((u) => (
                                                <SelectItem key={u.value} value={u.value}>
                                                    {u.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="unity" value={unityValue} />
                                    <InputError message={errors.unity} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Layers className="size-4" />
                                Statut
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={statusValue} onValueChange={setStatusValue}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="status" value={statusValue} />
                            <InputError message={errors.status} />
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base">
                                <span className="flex items-center gap-2">
                                    <Tag className="size-4" />
                                    Tags
                                </span>
                                <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setShowTagModal(true)} title="Créer un tag">
                                    <Plus className="size-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tags.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucun tag disponible.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <Badge
                                            key={tag.id}
                                            variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                                            className="cursor-pointer select-none"
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {tag.name}
                                            {selectedTags.includes(tag.id) && <X className="ml-1 size-3" />}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {selectedTags.map((tagId) => (
                                <input key={tagId} type="hidden" name="tags[]" value={tagId} />
                            ))}
                            <InputError message={errors.tags} />
                        </CardContent>
                    </Card>

                    {/* Image */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Upload className="size-4" />
                                Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {imagePreview ? (
                                <div className="relative overflow-hidden rounded-md border">
                                    <img src={imagePreview} alt="Aperçu" className="h-36 w-full object-contain p-2" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 size-6" onClick={removeImage}>
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors ${
                                        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                                    }`}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                >
                                    <Upload className="mx-auto mb-2 size-6 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Glisser une image ou <span className="text-primary underline">parcourir</span>
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG — 2 Mo max</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="image"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                            />
                            <InputError message={errors.image} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Category creation modal */}
            <Dialog open={showCategoryModal} onOpenChange={(open) => !open && setShowCategoryModal(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouvelle catégorie</DialogTitle>
                        <DialogDescription>Créez une catégorie de produits. Elle sera automatiquement rattachée à votre entreprise.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="new-category-name">
                                Nom <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="new-category-name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nom de la catégorie"
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-category-desc">Description</Label>
                            <textarea
                                id="new-category-desc"
                                value={newCategoryDesc}
                                onChange={(e) => setNewCategoryDesc(e.target.value)}
                                rows={2}
                                placeholder="Description (optionnel)"
                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                            />
                        </div>
                        {categoryError && <p className="text-sm text-destructive">{categoryError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCategoryModal(false)} disabled={categoryCreating}>
                            Annuler
                        </Button>
                        <Button onClick={handleCreateCategory} disabled={categoryCreating}>
                            {categoryCreating ? 'Création…' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tag creation modal */}
            <Dialog open={showTagModal} onOpenChange={(open) => !open && setShowTagModal(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouveau tag</DialogTitle>
                        <DialogDescription>Créez un tag pour organiser vos produits.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="new-tag-name">
                                Nom <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="new-tag-name"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Nom du tag"
                                autoFocus
                            />
                        </div>
                        {tagError && <p className="text-sm text-destructive">{tagError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTagModal(false)} disabled={tagCreating}>
                            Annuler
                        </Button>
                        <Button onClick={handleCreateTag} disabled={tagCreating}>
                            {tagCreating ? 'Création…' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
