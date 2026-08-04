"use client";

import Image from "next/image";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  UserPlus,
  Check,
} from "lucide-react";
import type { Business } from "@/lib/types";
import { businessPhotoUrl } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Consistent leads table used by the search page and saved-lead views. */
export default function LeadResultsTable({
  businesses,
  className,
  onAddToCrm,
  addedPlaceIds,
  addingPlaceId,
}: {
  businesses: Business[];
  className?: string;
  /** When provided, an "Add to CRM" action column is shown per row. */
  onAddToCrm?: (business: Business) => void;
  addedPlaceIds?: Set<string>;
  addingPlaceId?: string | null;
}) {
  if (businesses.length === 0) return null;

  return (
    <div className={cn("overflow-x-auto rounded-xl border bg-card", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Business</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Rating</th>
            <th className="px-4 py-3 font-medium">Links</th>
            {onAddToCrm && <th className="px-4 py-3 font-medium">CRM</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {businesses.map((b) => {
            const photo = businessPhotoUrl(b.photo_reference, 80);
            return (
              <tr key={b.place_id} className="align-top hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {photo ? (
                      <Image
                        src={photo}
                        alt=""
                        width={44}
                        height={44}
                        className="h-11 w-11 shrink-0 rounded-md object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">{b.name}</div>
                      <div className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-2">{b.address}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {b.phone ? (
                    <a
                      href={`tel:${b.phone}`}
                      className="flex items-center gap-1.5 text-foreground hover:text-primary"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {b.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No phone</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {b.rating != null ? (
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {b.rating.toFixed(1)}
                      {b.total_reviews != null && (
                        <span className="text-xs text-muted-foreground">
                          ({b.total_reviews})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.website && (
                      <a
                        href={b.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Site
                      </a>
                    )}
                    {b.maps_url && (
                      <a
                        href={b.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Maps
                      </a>
                    )}
                  </div>
                </td>
                {onAddToCrm && (
                  <td className="px-4 py-3">
                    {addedPlaceIds?.has(b.place_id) ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <Check className="h-3.5 w-3.5" />
                        Added
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddToCrm(b)}
                        disabled={addingPlaceId === b.place_id}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {addingPlaceId === b.place_id ? "Adding..." : "Add"}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
