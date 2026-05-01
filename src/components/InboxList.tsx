"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InboxItem {
  id: string;
  senderName: string | null;
  senderEmail: string | null;
  title: string;
  servings: number | null;
  ingredientCount: number;
  imageUrl: string | null;
  sourceType: string;
  status: string;
  createdAt: string;
}

export default function InboxList({
  initialItems,
}: {
  initialItems: InboxItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAction(
    e: React.MouseEvent,
    id: string,
    action: "accept" | "discard",
  ) {
    e.preventDefault();
    setProcessing(id);
    try {
      const res = await fetch(`/api/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: action === "accept" ? "accepted" : "discarded",
                }
              : item,
          ),
        );
        if (action === "accept") {
          router.refresh();
        }
      }
    } finally {
      setProcessing(null);
    }
  }

  const pending = items.filter((i) => i.status === "pending");
  const processed = items.filter((i) => i.status !== "pending");

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No shared recipes yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>

      {pending.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pending.map((item) => (
            <Link
              key={item.id}
              href={`/inbox/${item.id}`}
              className="block overflow-hidden border border-gray-100 rounded-xl hover:border-green-600 transition-colors"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-4xl">
                  🍽️
                </div>
              )}
              <div className="p-3.5">
                <h2 className="font-semibold text-[0.9rem] mb-1 line-clamp-2">
                  {item.title}
                </h2>
                <div className="flex items-center gap-1.5 text-[0.7rem] text-gray-400">
                  <span>
                    From {item.senderName ?? item.senderEmail ?? "someone"}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={(e) => handleAction(e, item.id, "accept")}
                    disabled={processing === item.id}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {processing === item.id ? "…" : "Accept"}
                  </button>
                  <button
                    onClick={(e) => handleAction(e, item.id, "discard")}
                    disabled={processing === item.id}
                    className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            History
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {processed.map((item) => (
              <Link
                key={item.id}
                href={`/inbox/${item.id}`}
                className="block overflow-hidden border border-gray-100 rounded-xl opacity-60 hover:opacity-80 transition-opacity"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
                <div className="p-3.5">
                  <h2 className="font-semibold text-[0.9rem] mb-1 line-clamp-2">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[0.7rem] text-gray-400">
                    <span>
                      From {item.senderName ?? item.senderEmail ?? "someone"}
                    </span>
                    <span>·</span>
                    <span
                      className={
                        item.status === "accepted"
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
