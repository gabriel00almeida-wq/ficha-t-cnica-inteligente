import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Package } from "lucide-react";
import {
  type Ingredient,
  type Unit,
  formatBRL,
  uid,
} from "@/lib/store";

type Props = {
  ingredients: Ingredient[];
  onUpsert: (i: Ingredient) => void;
  onRemove: (id: string) => void;
};

const UNIT_LABEL: Record<Unit, string> = {
  g: "por grama",
  kg: "por quilo",
  ml: "por ml",
  L: "por litro",
  un: "por unidade",
};

export function IngredientsTab({ ingredients, onUpsert, onRemove }: Props) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<Unit>("g");
  const [price, setPrice] = useState("");

  function add() {
    const p = parseFloat(price.replace(",", "."));
    if (!name.trim() || !isFinite(p) || p <= 0) return;
    onUpsert({
      id: uid(),
      name: name.trim(),
      unit,
      pricePerUnit: p,
      lastUpdated: new Date().toISOString(),
    });
    setName("");
    setPrice("");
  }

  return (
    <div className="space-y-6">
      <Card className="card-paper p-5">
        <h3 className="font-display text-lg mb-4">Adicionar ingrediente</h3>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: salmão fresco"
            />
          </div>
          <div>
            <Label className="text-xs">Unidade base</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="g">grama (g)</SelectItem>
                <SelectItem value="kg">quilo (kg)</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="L">litro (L)</SelectItem>
                <SelectItem value="un">unidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Preço {UNIT_LABEL[unit]}</Label>
            <Input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={add} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          {ingredients.length} ingrediente{ingredients.length === 1 ? "" : "s"} cadastrado{ingredients.length === 1 ? "" : "s"}
        </div>
        {ingredients.length === 0 && (
          <Card className="card-paper p-8 text-center text-muted-foreground">
            Nenhum ingrediente ainda. Adicione manualmente acima ou use o Scanner de NF.
          </Card>
        )}
        {ingredients.map((ing) => (
          <Card key={ing.id} className="card-paper p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{ing.name}</div>
              <div className="text-xs text-muted-foreground">
                Atualizado {new Date(ing.lastUpdated).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-base">
                {formatBRL(ing.pricePerUnit)}
              </div>
              <div className="text-xs text-muted-foreground">
                {UNIT_LABEL[ing.unit]}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(ing.id)}
              aria-label="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
