import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://simdom-kqie.vercel.app"

// ── Email: Laporan Baru (ke Kabid) ──────────────────────────
export async function sendEmailLaporanBaru({
  kabidEmail,
  kabidName,
  jenisKegiatan,
  domainNama,
  skpdSingkatan,
  pembuatName,
  tanggal,
  laporanId,
}: {
  kabidEmail: string
  kabidName: string
  jenisKegiatan: string
  domainNama: string
  skpdSingkatan: string
  pembuatName: string
  tanggal: Date
  laporanId: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: kabidEmail,
      subject: `[SIMDOM] Laporan Baru Menunggu Konfirmasi — ${skpdSingkatan}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          
          <!-- Header -->
          <div style="background: #1d4ed8; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 18px;">SIMDOM</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 12px;">
              Diskominfo Kabupaten Soppeng
            </p>
          </div>

          <!-- Body -->
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; margin: 0 0 16px;">Yth. <strong>${kabidName}</strong>,</p>
            <p style="color: #334155; margin: 0 0 20px;">
              Ada laporan aktivitas baru yang menunggu konfirmasi Anda.
            </p>

            <!-- Detail Card -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 140px;">Jenis Kegiatan</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${jenisKegiatan}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Domain</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 13px;">${domainNama}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px;">SKPD</td>
                  <td style="padding: 6px 0;">
                    <span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
                      ${skpdSingkatan}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Dibuat oleh</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 13px;">${pembuatName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Tanggal</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 13px;">
                    ${new Date(tanggal).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${APP_URL}/dashboard/laporan" 
                style="background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                Lihat & Konfirmasi Laporan →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Email ini dikirim otomatis oleh sistem SIMDOM. Jangan balas email ini.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #64748b; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} Diskominfo Kabupaten Soppeng · SIMDOM v2
            </p>
          </div>

        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("[EMAIL] sendEmailLaporanBaru error:", error)
    return { success: false }
  }
}

// ── Email: Laporan Dikonfirmasi / Diberi Instruksi (ke Pembuat) ──
export async function sendEmailStatusLaporan({
  pembuatEmail,
  pembuatName,
  jenisKegiatan,
  domainNama,
  status,
  instruksi,
}: {
  pembuatEmail: string
  pembuatName: string
  jenisKegiatan: string
  domainNama: string
  status: "CONFIRMED" | "INSTRUCTED"
  instruksi?: string | null
}) {
  const isConfirmed = status === "CONFIRMED"

  try {
    await resend.emails.send({
      from: FROM,
      to: pembuatEmail,
      subject: `[SIMDOM] Laporan ${isConfirmed ? "Dikonfirmasi" : "Diberi Instruksi"} — ${jenisKegiatan}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          
          <!-- Header -->
          <div style="background: ${isConfirmed ? "#059669" : "#2563eb"}; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 18px;">SIMDOM</h1>
            <p style="color: ${isConfirmed ? "#a7f3d0" : "#bfdbfe"}; margin: 4px 0 0; font-size: 12px;">
              Diskominfo Kabupaten Soppeng
            </p>
          </div>

          <!-- Body -->
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; margin: 0 0 16px;">Yth. <strong>${pembuatName}</strong>,</p>
            
            <div style="background: ${isConfirmed ? "#d1fae5" : "#dbeafe"}; border-left: 4px solid ${isConfirmed ? "#059669" : "#2563eb"}; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
              <p style="margin: 0; color: ${isConfirmed ? "#065f46" : "#1e3a8a"}; font-weight: 600; font-size: 14px;">
                ${isConfirmed ? "✅ Laporan Anda telah dikonfirmasi" : "📋 Laporan Anda mendapat instruksi baru"}
              </p>
            </div>

            <!-- Detail -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 140px;">Jenis Kegiatan</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${jenisKegiatan}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Domain</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 13px;">${domainNama}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Status</td>
                  <td style="padding: 6px 0;">
                    <span style="background: ${isConfirmed ? "#d1fae5" : "#dbeafe"}; color: ${isConfirmed ? "#065f46" : "#1e3a8a"}; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
                      ${isConfirmed ? "Dikonfirmasi" : "Diberi Instruksi"}
                    </span>
                  </td>
                </tr>
                ${instruksi ? `
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; vertical-align: top;">Instruksi</td>
                  <td style="padding: 6px 0; color: #1e3a8a; font-size: 13px; font-style: italic;">"${instruksi}"</td>
                </tr>
                ` : ""}
              </table>
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${APP_URL}/dashboard/laporan"
                style="background: ${isConfirmed ? "#059669" : "#2563eb"}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                Lihat Laporan →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Email ini dikirim otomatis oleh sistem SIMDOM. Jangan balas email ini.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #64748b; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} Diskominfo Kabupaten Soppeng · SIMDOM v2
            </p>
          </div>

        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("[EMAIL] sendEmailStatusLaporan error:", error)
    return { success: false }
  }
}