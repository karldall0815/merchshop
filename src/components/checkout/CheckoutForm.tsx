"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createAddressFavorite, deleteAddressFavorite } from "@/modules/orders/addresses";
import { submitCheckout } from "@/modules/orders/checkout";
import { FormErrorBanner } from "@/components/forms/FormErrorBanner";
import type { ActionResult } from "@/lib/action-result";

type ErrorState =
  | { kind: "result"; value: ActionResult<unknown> }
  | { kind: "message"; value: string }
  | null;

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

export function CheckoutForm({
  favorites,
  defaultCostCenter,
}: {
  favorites: AddressFavorite[];
  defaultCostCenter?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorState, setErrorState] = useState<ErrorState>(null);

  const [occasion, setOccasion] = useState("");
  const [costCenter, setCostCenter] = useState(defaultCostCenter ?? "");
  const [desiredDate, setDesiredDate] = useState("");
  const [desiredDateIsDeadline, setDesiredDateIsDeadline] = useState(false);
  const [contact, setContact] = useState("");
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

  useEffect(() => {
    // Reset the "is deadline" flag whenever the date itself is cleared.
    // The setState cannot loop: after it runs, the condition becomes false
    // because desiredDateIsDeadline is then false, so the effect no-ops.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!desiredDate && desiredDateIsDeadline) setDesiredDateIsDeadline(false);
  }, [desiredDate, desiredDateIsDeadline]);

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
    setErrorState(null);
    startTransition(async () => {
      if (saveAsFav && favLabel.trim()) {
        try {
          await createAddressFavorite({ label: favLabel.trim(), ...addr });
        } catch (err) {
          setErrorState({
            kind: "message",
            value: err instanceof Error ? err.message : "Favorit speichern fehlgeschlagen",
          });
          return;
        }
      }
      const res = await submitCheckout({
        occasion,
        costCenter: costCenter || undefined,
        desiredDate: desiredDate || undefined,
        desiredDateIsDeadline,
        shippingAddress: { ...addr, contact: contact || undefined },
      });
      if (!res.ok) {
        setErrorState({ kind: "result", value: res });
        return;
      }
      router.push("/orders");
    });
  }

  async function onDeleteFav(id: string) {
    startTransition(async () => {
      try {
        await deleteAddressFavorite(id);
      } catch (e) {
        setErrorState({
          kind: "message",
          value: e instanceof Error ? e.message : "Löschen fehlgeschlagen",
        });
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
            <Label htmlFor="costCenter">Kostenstelle</Label>
            <Input
              id="costCenter"
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              placeholder="z. B. KS-1234"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <TooltipProvider delay={150}>
              <div className="flex items-center gap-1">
                <Label htmlFor="desiredDate">Wunschtermin</Label>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    aria-label="Erläuterung Wunschtermin"
                    className="text-muted-foreground text-xs"
                  >
                    ℹ️
                  </TooltipTrigger>
                  <TooltipContent>Termin, an dem die Ware beim Empfänger ankommen soll</TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="desiredDate"
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                className="w-fit"
              />
              <div className="flex items-center gap-1 pt-1">
                <input
                  id="deadline"
                  type="checkbox"
                  checked={desiredDateIsDeadline}
                  disabled={!desiredDate}
                  onChange={(e) => setDesiredDateIsDeadline(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="deadline" className="text-sm font-normal">Als Deadline kennzeichnen</Label>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    aria-label="Erläuterung Deadline"
                    className="text-muted-foreground text-xs"
                  >
                    ℹ️
                  </TooltipTrigger>
                  <TooltipContent>Spätester Anliefertermin — die Ware muss bis dahin da sein</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
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
            <Label htmlFor="contact">Ansprechpartner / Abteilung / Betreff <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="z. Hd. Frau Müller, Marketing"
              maxLength={200}
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

      <FormErrorBanner
        result={errorState?.kind === "result" ? errorState.value : null}
        message={errorState?.kind === "message" ? errorState.value : null}
      />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sende…" : "Bestellung absenden"}
      </Button>
    </form>
  );
}
