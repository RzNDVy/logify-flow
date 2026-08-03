import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Printer, Download, Calendar as CalendarIcon, Filter } from "lucide-react";
import type { Activity, Project, User } from "@/types/domain";
import { toast } from "sonner";

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser?: User | null;
  users?: User[];
  projects?: Project[];
  activities?: Activity[];
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function ExportReportDialog({
  open,
  onOpenChange,
  currentUser,
  users = [],
  projects = [],
  activities = [],
}: ExportReportDialogProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const isAdmin = currentUser?.role === "admin";
  const effectiveUserId = isAdmin ? selectedUser : (currentUser?.id || "all");

  const pm = new Map(projects.map((p) => [p.id, p]));
  const um = new Map(users.map((u) => [u.id, u]));

  // Filter activities based on selected Month, Year, Effective User, and Project
  const filteredActivities = activities.filter((a) => {
    const actDate = new Date(a.date);
    if (isNaN(actDate.getTime())) return false;
    
    if (actDate.getMonth() !== selectedMonth) return false;
    if (actDate.getFullYear() !== selectedYear) return false;
    if (effectiveUserId !== "all" && a.userId !== effectiveUserId) return false;
    if (selectedProject !== "all" && a.projectId !== selectedProject) return false;
    return true;
  });

  const monthName = MONTHS[selectedMonth];
  const targetUserObj = selectedUser !== "all" ? um.get(selectedUser) : null;
  const targetProjectObj = selectedProject !== "all" ? pm.get(selectedProject) : null;

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (filteredActivities.length === 0) {
      return toast.error("Tidak ada data aktivitas pada periode yang dipilih.");
    }

    const headers = ["No", "Tanggal", "Jam", "Nama Pengguna", "Email", "Proyek", "Modul", "Deskripsi"];
    const rows = filteredActivities.map((a, idx) => {
      const u = um.get(a.userId) || a.user;
      const p = pm.get(a.projectId) || a.project;
      return [
        idx + 1,
        a.date,
        a.time || "-",
        `"${(u?.name || "Pengguna").replace(/"/g, '""')}"`,
        `"${(u?.email || "").replace(/"/g, '""')}"`,
        `"${(p?.name || "Proyek").replace(/"/g, '""')}"`,
        `"${(a.module || "").replace(/"/g, '""')}"`,
        `"${(a.description || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Aktivitas_${monthName}_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Laporan Excel/CSV ${monthName} ${selectedYear} berhasil diunduh!`);
  };

  // Export / Print PDF
  const handleExportPDF = () => {
    if (filteredActivities.length === 0) {
      return toast.error("Tidak ada data aktivitas pada periode yang dipilih.");
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return toast.error("Gagal membuka jendela cetak. Izinkan popup di browser Anda.");
    }

    const reportTitle = `LAPORAN AKTIVITAS KERJA (WAMS)`;
    const periodStr = `${monthName} ${selectedYear}`;
    const userStr = targetUserObj ? `${targetUserObj.name} (${targetUserObj.email})` : "Semua Pengguna";
    const projectStr = targetProjectObj ? targetProjectObj.name : "Semua Proyek";

    const tableRowsHtml = filteredActivities
      .map((a, idx) => {
        const u = um.get(a.userId) || a.user;
        const p = pm.get(a.projectId) || a.project;
        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>${a.date}</td>
            <td>${a.time || "-"}</td>
            <td><strong>${u?.name || "Pengguna"}</strong><br/><small style="color: #666;">${u?.email || ""}</small></td>
            <td><span class="badge">${p?.name || "Proyek"}</span></td>
            <td>${a.module}</td>
            <td>${a.description}</td>
          </tr>
        `;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle} - ${periodStr}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1e293b; font-size: 13px; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0284c7; padding-bottom: 15px; }
          .header h1 { margin: 0; font-size: 22px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0; color: #64748b; font-size: 13px; }
          
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .meta-item label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 3px; }
          .meta-item span { font-size: 14px; font-weight: 600; color: #0f172a; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; font-weight: 600; text-transform: uppercase; font-size: 11px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; }

          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 200px; }
          .signature-box .line { margin-top: 60px; border-bottom: 1px solid #000; }
          
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Sistem Pengelolaan Aktivitas Kerja (Logify Flow / WAMS)</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <label>Periode Laporan</label>
            <span>${periodStr}</span>
          </div>
          <div class="meta-item">
            <label>Pengguna</label>
            <span>${userStr}</span>
          </div>
          <div class="meta-item">
            <label>Proyek</label>
            <span>${projectStr}</span>
          </div>
        </div>

        <p style="font-size: 12px; color: #475569; margin-bottom: 10px;">
          Total Entri Aktivitas: <strong>${filteredActivities.length}</strong>
        </p>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">No</th>
              <th style="width: 90px;">Tanggal</th>
              <th style="width: 60px;">Jam</th>
              <th style="width: 150px;">Pengguna</th>
              <th style="width: 120px;">Proyek</th>
              <th style="width: 130px;">Modul</th>
              <th>Deskripsi Aktivitas</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div class="signature-box">
            <p>Dibuat Oleh,</p>
            <div class="line"></div>
            <p><small>${targetUserObj ? targetUserObj.name : "Karyawan / User"}</small></p>
          </div>
          <div class="signature-box">
            <p>Disetujui Oleh,</p>
            <div class="line"></div>
            <p><small>Manager / Admin WAMS</small></p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    toast.success(`Jendela cetak PDF untuk periode ${monthName} ${selectedYear} telah dibuka.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-primary" /> Ekspor Laporan Bulanan
          </DialogTitle>
          <DialogDescription>
            Pilih periode bulan & tahun serta filter data untuk mengunduh laporan ke PDF atau Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Month and Year Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bulan</Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v, 10))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tahun</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v, 10))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Filter (Dropdown for Admin, Read-only badge for regular User) */}
          {isAdmin ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pengguna</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Pengguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Pengguna</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pengguna</Label>
              <div className="rounded-md border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground flex items-center justify-between">
                <span>{currentUser?.name || "Akun Saya"}</span>
                <span className="text-muted-foreground font-normal">({currentUser?.email || ""})</span>
              </div>
            </div>
          )}

          {/* Project Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Proyek</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Proyek" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Proyek</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview count */}
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>Ditemukan: <strong className="text-foreground">{filteredActivities.length}</strong> entri aktivitas</span>
            <span className="font-medium text-primary">{monthName} {selectedYear}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" className="w-full gap-2" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
          </Button>
          <Button className="w-full gap-2" onClick={handleExportPDF}>
            <Printer className="h-4 w-4" /> Cetak / Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
