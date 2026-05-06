"use client";

import { useState, useEffect, useCallback } from "react";

interface InvitationCode {
  id: string;
  code: string;
  usedByUserId: string | null;
  usedAt: string | null;
  createdAt: string;
}

export default function InvitationsPage() {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    const res = await fetch("/api/invitations");
    if (res.ok) {
      setCodes(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCodes();
  }, [fetchCodes]);

  async function generate() {
    const res = await fetch("/api/invitations", { method: "POST" });
    if (res.ok) {
      const code = await res.json();
      setCodes((prev) => [...prev, code]);
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    const res = await fetch("/api/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setCodes((prev) => prev.filter((c) => !selected.has(c.id)));
      setSelected(new Set());
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === codes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(codes.map((c) => c.id)));
    }
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-10 bg-gray-50 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Invitation Codes</h1>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Delete ({selected.size})
            </button>
          )}
          <button
            onClick={generate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Generate
          </button>
        </div>
      </div>

      {codes.length === 0 ? (
        <p className="text-gray-500 text-sm">No invitation codes yet.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === codes.length}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="p-3 text-left font-medium text-gray-600">
                  Code
                </th>
                <th className="p-3 text-left font-medium text-gray-600">
                  Status
                </th>
                <th className="p-3 text-left font-medium text-gray-600">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(code.id)}
                      onChange={() => toggleSelect(code.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(code.code);
                        setCopied(code.id);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                      className="hover:text-green-600 transition-colors cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copied === code.id ? "Copied!" : code.code}
                    </button>
                  </td>
                  <td className="p-3">
                    {code.usedByUserId ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Used
                      </span>
                    ) : (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-500">
                    {new Date(code.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
