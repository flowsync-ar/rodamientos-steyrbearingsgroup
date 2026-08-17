interface VendedorInviteEmailProps {
  fullName: string
  setPasswordUrl: string
  logoUrl: string
}

export function renderVendedorInviteEmail(props: VendedorInviteEmailProps): string {
  const { fullName, setPasswordUrl, logoUrl } = props
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Activá tu cuenta de vendedor</title></head>
<body style="font-family:Arial,sans-serif;background-color:#f9fafb;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff">
  <tr><td style="padding:32px 32px 0 32px;text-align:center">
    <img src="${logoUrl}" alt="Steyr Bearing Group" width="180" style="display:block;margin:0 auto" />
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="color:#111827;font-size:22px;margin-top:0;text-align:center">Activá tu cuenta</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6">Hola ${fullName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6">Te dieron de alta como vendedor en Steyr Bearing Group. Creá tu contraseña para poder acceder al panel de administración.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px auto">
      <tr>
        <td><a href="${setPasswordUrl}" style="display:inline-block;background-color:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600">Crear mi contraseña</a></td>
      </tr>
    </table>
    <p style="color:#9ca3af;font-size:12px;line-height:1.5;text-align:center">Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>${setPasswordUrl}</p>
  </td></tr>
  <tr><td style="border-top:1px solid #e5e7eb;padding:24px 32px">
    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">Este correo fue enviado por Steyr Bearing Group. Si no esperabas esta invitación, podés ignorar este mensaje.</p>
  </td></tr>
</table>
</body></html>`
}
