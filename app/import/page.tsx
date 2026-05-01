"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Database,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportItem {
  file: File;
  content: string;
  displayName: string;
  status: "pending" | "uploading" | "success" | "error" | "duplicate";
  error?: string;
  importedCount?: number;
  rowCount?: number;
}

interface SavedImport {
  _id: string;
  fileName: string;
  displayName: string;
  rowCount: number;
  importedCount: number;
  createdAt: string;
  importErrors?: string[];
}

export default function ImportPage() {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [savedImports, setSavedImports] = useState<SavedImport[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchImports = useCallback(async () => {
    try {
      const res = await fetch("/api/import");
      const json = await res.json();
      setSavedImports(json.imports || []);
    } catch (err) {
      console.error("Failed to fetch imports", err);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.name.toLowerCase().endsWith(".csv")
    );
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter((f) =>
      f.name.toLowerCase().endsWith(".csv")
    );
    handleFiles(selected);
    e.target.value = "";
  }, []);

  const handleFiles = async (files: File[]) => {
    const newItems: ImportItem[] = [];
    for (const file of files) {
      const content = await file.text();
      newItems.push({
        file,
        content,
        displayName: file.name.replace(/\.csv$/i, ""),
        status: "pending",
      });
    }
    setItems((prev) => [...prev, ...newItems]);
  };

  const updateItem = (index: number, updates: Partial<ImportItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    const pending = items.filter((i) => i.status === "pending");
    if (pending.length === 0) return;

    setGlobalLoading(true);

    const files = pending.map((item) => ({
      fileName: item.file.name,
      fileContent: item.content,
      displayName: item.displayName,
    }));

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      const json = await res.json();

      const results = json.results || [];
      let itemIndex = 0;
      setItems((prev) =>
        prev.map((item) => {
          if (item.status !== "pending") return item;
          const result = results[itemIndex];
          itemIndex++;
          if (!result) return item;
          if (result.warning) {
            return { ...item, status: "duplicate", error: result.warning, rowCount: result.rowCount };
          }
          if (result.error) {
            return { ...item, status: "error", error: result.error, rowCount: result.rowCount };
          }
          return {
            ...item,
            status: "success",
            importedCount: result.importedCount,
            rowCount: result.rowCount,
          };
        })
      );

      await fetchImports();
    } catch (err) {
      setItems((prev) =>
        prev.map((item) =>
          item.status === "pending"
            ? { ...item, status: "error", error: "Network error" }
            : item
        )
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/import/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedImports((prev) => prev.filter((imp) => imp._id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const successCount = items.filter((i) => i.status === "success").length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a
          href="/"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F4F4] text-[#707070] hover:text-[#F26522] hover:bg-[#FFE0CC] transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A0A0A] tracking-tight">
            Importar datos GPS
          </h1>
          <p className="text-sm text-[#707070] mt-0.5">
            Sube archivos CSV con datos de cámaras Catapult
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-[#F26522] bg-[#FFF7ED] scale-[1.01]"
            : "border-[#C4C4C4] bg-white hover:border-[#F26522] hover:bg-[#FFF7ED]"
        )}
      >
        <input
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200",
              isDragging ? "bg-[#F26522] text-white" : "bg-[#F4F4F4] text-[#707070]"
            )}
          >
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#0A0A0A]">
              Arrastra archivos CSV aquí
            </p>
            <p className="text-sm text-[#707070] mt-1">
              o haz click para seleccionar múltiples archivos
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-medium mt-1">
            Solo archivos .csv
          </Badge>
        </div>
      </Card>

      {/* Pending Items */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0A0A0A]">
              Archivos listos para importar
            </h2>
            <div className="flex items-center gap-2">
              {successCount > 0 && (
                <Badge className="bg-green-100 text-green-700 border-0 font-semibold text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {successCount} exitoso{successCount > 1 ? "s" : ""}
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <Card
                key={index}
                className={cn(
                  "rounded-xl p-4 border transition-all duration-200",
                  item.status === "success"
                    ? "bg-green-50 border-green-200"
                    : item.status === "error"
                    ? "bg-red-50 border-red-200"
                    : item.status === "duplicate"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-white border-[#F4F4F4]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      item.status === "success"
                        ? "bg-green-100 text-green-600"
                        : item.status === "error"
                        ? "bg-red-100 text-red-600"
                        : item.status === "duplicate"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-[#F4F4F4] text-[#707070]"
                    )}
                  >
                    {item.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : item.status === "error" ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : item.status === "duplicate" ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {item.status === "pending" ? (
                      <Input
                        value={item.displayName}
                        onChange={(e) =>
                          updateItem(index, { displayName: e.target.value })
                        }
                        className="h-8 text-sm font-semibold border-[#E5E5E5] focus:border-[#F26522] focus:ring-[#F26522]"
                        placeholder="Nombre del import..."
                      />
                    ) : (
                      <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                        {item.displayName}
                      </p>
                    )}
                    <p className="text-xs text-[#707070] mt-0.5">
                      {item.file.name} ·{" "}
                      {(item.file.size / 1024).toFixed(1)} KB
                      {item.rowCount !== undefined &&
                        ` · ${item.rowCount} filas`}
                      {item.importedCount !== undefined &&
                        item.importedCount > 0 &&
                        ` · ${item.importedCount} importadas`}
                    </p>
                    {item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>

                  {item.status === "pending" && (
                    <button
                      onClick={() => removeItem(index)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[#707070] hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {pendingCount > 0 && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleImport}
                disabled={globalLoading}
                className="bg-gradient-to-r from-[#F26522] to-[#D54E0E] text-white font-bold px-6 h-11 rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 transition-opacity"
              >
                {globalLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Importar {pendingCount} archivo{pendingCount > 1 ? "s" : ""}
                  </span>
                )}
              </Button>
            </div>
          )}

          {successCount > 0 && pendingCount === 0 && (
            <Alert className="rounded-xl bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-sm font-medium">
                Importación completada.{" "}
                <a href="/" className="underline hover:text-green-900">
                  Ver dashboard
                </a>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Separator className="bg-[#F4F4F4]" />

      {/* Saved Imports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0A0A0A]">
            Imports guardados
          </h2>
          <span className="text-xs text-[#707070] font-medium">
            {savedImports.length} total
          </span>
        </div>

        {fetchLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : savedImports.length === 0 ? (
          <Card className="rounded-xl p-8 text-center border-[#F4F4F4] bg-[#FAFAFA]">
            <Database className="w-8 h-8 text-[#C4C4C4] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#707070]">
              No hay imports guardados
            </p>
            <p className="text-xs text-[#C4C4C4] mt-1">
              Los archivos importados aparecerán aquí
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {savedImports.map((imp) => (
              <Card
                key={imp._id}
                className="rounded-xl p-4 bg-white border-[#F4F4F4] hover:border-[#E5E5E5] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F4F4] flex items-center justify-center text-[#707070] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                      {imp.displayName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[#707070] flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {imp.importedCount} / {imp.rowCount} filas
                      </span>
                      <span className="text-xs text-[#C4C4C4] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(imp.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {imp.importErrors && imp.importErrors.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-amber-100 text-amber-700 border-0"
                        >
                          {imp.importErrors.length} advertencias
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(imp._id)}
                    disabled={deleteLoading === imp._id}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#C4C4C4] hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    title="Eliminar import"
                  >
                    {deleteLoading === imp._id ? (
                      <span className="w-4 h-4 border-2 border-[#C4C4C4] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
