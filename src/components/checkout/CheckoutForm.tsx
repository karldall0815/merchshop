"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAddressFavorite, deleteAddressFavorite } from "@/modules/orders/addresses";
import { submitCheckout } from "@/modules/orders/checkout";

type AddressFavorite = {
  id: string;
  label: string;
  recipient: string;
  street: string;
  zip: string;
  city: string;
  country: string;
};

const emptyAddress = { recipient: "", street: "", zip: "", city: "", country: "DE" };

export function CheckoutForm({ favorites }: { favorites: AddressFavorite[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [occasion, setOccasion] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [selectedFav, setSelectedFav] = useState<string>(favorites[0]?.id ?? "");
  const [addr, setAddr] = useState(() => {
    const first = favorites[0];
    return first
      ? {
          recipient: first.recipient,
          street: first.street,
          zip: first.zip,
          city: first.city,
          country: first.country,
        }
      : emptyAddress;
  });
  const [saveAsFav, setSaveAsFav] = useState(false);
  const [favLabel, setFavLabel] = useState("");

  function selectFav(id: string) {
    setSelectedFav(id);
    const f = favorites.find((x) => x.id === id);
    if (f) {
      setAddr({
        recipient: f.recipient,
        street: f.street,
        zip: f.zip,
        city: f.city,
        country: f.country,
      });
    } else {
      setAddr(emptyAddress);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (saveAsFav && favLabel.trim()) {
          await createAddressFavorite({ label: favLabel.trim(), ...addr });
        }
        await submitCheckout({
          occasion,
          costCenter,
          desiredDate,
          shippingAddress: addr,
        });
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setError(err instanceof Error ? err.message : "Submit fehlgeschlagen");
      }
    });
  }

  async function onDeleteFav(id: string) {
    startTransition(async () => {
      try {
        await deleteAddressFavorite(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-4">
      <fieldset className="space-y-4">
        <legend className="font-medium">Anlass &amp; Kostenstelle</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="occasion">Anlass *</Label>
            <Input
              id="occasion"
              required
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="z. B. Messe Berlin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costCenter">Kostenstelle *</Label>
            <Input
              id="costCenter"
              required
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              placeholder="z. B. KS-1234"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="desiredDate">Wunschtermin *</Label>
            <Input
              id="desiredDate"
              type="date"
              required
              value={desiredDate}
              onChange={(e) => setDesiredDate(e.target.value)}
              className="w-fit"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-medium">Lieferadresse</legend>
        {favorites.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="fav">Aus Favoriten wählen</Label>
            <div className="flex flex-wrap gap-2">
              <select
                id="fav"
                value={selectedFav}
                onChange={(e) => selectFav(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">— neu eingeben —</option>
                {favorites.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} · {f.city}
                  </option>
                ))}
              </select>
              {selectedFav && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteFav(selectedFav)}
                >
                  Favorit löschen
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="recipient">Empfänger *</Label>
            <Input
              id="recipient"
              required
              value={addr.recipient}
              onChange={(e) => setAddr({ ...addr, recipient: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="street">Straße & Hausnr. *</Label>
            <Input
              id="street"
              required
              value={addr.street}
              onChange={(e) => setAddr({ ...addr, street: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">PLZ *</Label>
            <Input
              id="zip"
              required
              value={addr.zip}
              onChange={(e) => setAddr({ ...addr, zip: e.target.value })}
              className="w-32"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Stadt *</Label>
            <Input
              id="city"
              required
              value={addr.city}
              onChange={(e) => setAddr({ ...addr, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Input
              id="country"
              value={addr.country}
              onChange={(e) => setAddr({ ...addr, country: e.target.value })}
              className="w-24"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveAsFav}
              onChange={(e) => setSaveAsFav(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Adresse als Favorit speichern
          </label>
          {saveAsFav && (
            <Input
              placeholder="Bezeichnung (z. B. Büro Berlin)"
              value={favLabel}
              onChange={(e) => setFavLabel(e.target.value)}
            />
          )}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sende…" : "Bestellung absenden"}
      </Button>
    </form>
  );
}
