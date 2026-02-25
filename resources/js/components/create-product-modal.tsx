import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Category = { id: string; name: string };

type Props = {
    categories: Category[];
    onProductCreated: (product: { id: string; name: string; code: string }) => void;
};

const unities = [
    { value: 'piece', label: 'Pièce' },
    { value: 'kilogram', label: 'Kilogramme' },
    { value: 'liter', label: 'Litre' },
    { value: 'meter', label: 'Mètre' },
    { value: 'square_meter', label: 'Mètre carré' },
    { value: 'cubic_meter', label: 'Mètre cube' },
    { value: 'pack', label: 'Pack' },
    { value: 'box', label: 'Carton' },
];

export default function CreateProductModal({ categories, onProductCreated }: Props) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [price, setPrice] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [unity, setUnity] = useState('piece');
    const [categoryId, setCategoryId] = useState('');

    function resetForm() {
        setName('');
        setCode('');
        setPrice('');
        setCostPrice('');
        setUnity('piece');
        setCategoryId('');
        setErrors({});
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await fetch('/admin/products/quick-store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({
                    name,
                    code,
                    price: parseFloat(price),
                    cost_price: costPrice ? parseFloat(costPrice) : null,
                    unity,
                    category_id: categoryId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.errors) {
                    const flatErrors: Record<string, string> = {};
                    for (const [key, messages] of Object.entries(data.errors)) {
                        flatErrors[key] = Array.isArray(messages) ? messages[0] : (messages as string);
                    }
                    setErrors(flatErrors);
                }
                return;
            }

            const data = await response.json();
            onProductCreated(data.product);
            resetForm();
            setOpen(false);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { resetForm(); } }}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-1 size-4" />
                    Créer un produit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer un produit rapidement</DialogTitle>
                    <DialogDescription>Ajoutez un nouveau produit qui sera immédiatement disponible dans la liste.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="modal-name">
                                Nom <span className="text-destructive">*</span>
                            </Label>
                            <Input id="modal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du produit" />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="modal-code">
                                Code <span className="text-destructive">*</span>
                            </Label>
                            <Input id="modal-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="PRD-XXX" />
                            {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="modal-price">
                                Prix <span className="text-destructive">*</span>
                            </Label>
                            <Input id="modal-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                            {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="modal-cost-price">Prix d'achat</Label>
                            <Input id="modal-cost-price" type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" />
                            {errors.cost_price && <p className="text-sm text-destructive">{errors.cost_price}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="modal-unity">
                                Unité <span className="text-destructive">*</span>
                            </Label>
                            <Select value={unity} onValueChange={setUnity}>
                                <SelectTrigger id="modal-unity">
                                    <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {unities.map((u) => (
                                        <SelectItem key={u.value} value={u.value}>
                                            {u.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.unity && <p className="text-sm text-destructive">{errors.unity}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="modal-category">
                                Catégorie <span className="text-destructive">*</span>
                            </Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger id="modal-category">
                                    <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Création…' : 'Créer le produit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
