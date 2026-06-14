import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface ReportData {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  avgRoi: number;
  avgMargin: number;
  topProjects: Array<{
    nombre: string;
    revenue: number;
    roiPercent: number;
  }>;
  alertCount: {
    critical: number;
    warning: number;
    info: number;
  };
}

interface CompanyInfo {
  nombre?: string;
  email: string;
  logo?: string;
  rnc?: string;
}

// Nodemailer transporter config
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Generate HTML email template for ROI report
 */
function createEmailTemplate(data: ReportData, company: CompanyInfo): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value);
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1564AF 0%, #0d4a99 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .metric-card { background: #f5f5f5; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #1564AF; }
    .metric-card h3 { margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 28px; font-weight: bold; color: #1564AF; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #1564AF; }
    .table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
    .positive { color: #22c55e; font-weight: 600; }
    .negative { color: #ef4444; font-weight: 600; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
    .button { display: inline-block; background: #1564AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Reporte de ROI - ${new Date().toLocaleDateString('es-DO')}</h1>
    ${company.logo ? `<p style="margin: 10px 0 0 0;">${company.nombre || 'RedCalc'}</p>` : ''}
  </div>

  <div class="content">
    <p>Hola,</p>
    <p>Aquí está tu resumen de rentabilidad y KPIs de esta semana:</p>

    <div class="metric-card">
      <h3>Ingresos Totales</h3>
      <div class="metric-value">${formatCurrency(data.totalRevenue)}</div>
    </div>

    <div class="metric-card">
      <h3>Costos Estimados</h3>
      <div class="metric-value">${formatCurrency(data.totalCosts)}</div>
    </div>

    <div class="metric-card">
      <h3>Ganancia Neta</h3>
      <div class="metric-value ${data.totalProfit > 0 ? 'positive' : 'negative'}">
        ${formatCurrency(data.totalProfit)}
      </div>
    </div>

    <div class="metric-card">
      <h3>ROI Promedio</h3>
      <div class="metric-value">${data.avgRoi.toFixed(2)}%</div>
    </div>

    <h2>Top 5 Proyectos Rentables</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Proyecto</th>
          <th>Ingresos</th>
          <th>ROI %</th>
        </tr>
      </thead>
      <tbody>
        ${data.topProjects.slice(0, 5).map((p) => `
          <tr>
            <td>${p.nombre}</td>
            <td>${formatCurrency(p.revenue)}</td>
            <td class="positive">${p.roiPercent.toFixed(2)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Resumen de Alertas</h2>
    <p>
      Críticas: <strong>${data.alertCount.critical}</strong> |
      Advertencias: <strong>${data.alertCount.warning}</strong> |
      Información: <strong>${data.alertCount.info}</strong>
    </p>

    <a href="http://localhost:3000/dashboard" class="button">Ver Dashboard Completo →</a>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} ${company.nombre || 'RedCalc'}. Todos los derechos reservados.</p>
    <p><a href="#" style="color: #1564AF; text-decoration: none;">Cambiar preferencias de email</a></p>
  </div>
</body>
</html>
  `;
}

/**
 * Fetch report data from endpoints
 */
async function fetchReportData(userId: string): Promise<ReportData | null> {
  try {
    // Fetch ROI data
    const projects = await prisma.project.findMany({
      where: { userId },
      include: { pagos: true },
    });

    const roiProjects = projects.map((p) => {
      const revenue = p.pagos.reduce((sum, pago) => sum + pago.monto, 0);
      const costs = p.margenGanancia || 0;
      const profit = revenue - costs;
      const roiPercent = costs > 0 ? (profit / costs) * 100 : 0;
      return { nome: p.nombre, revenue, costs, profit, roiPercent };
    });

    const totalRevenue = roiProjects.reduce((s, p) => s + p.revenue, 0);
    const totalCosts = roiProjects.reduce((s, p) => s + p.costs, 0);
    const totalProfit = roiProjects.reduce((s, p) => s + p.profit, 0);
    const avgRoi =
      roiProjects.length > 0
        ? roiProjects.reduce((s, p) => s + p.roiPercent, 0) / roiProjects.length
        : 0;

    // Fetch alerts
    const alerts = await prisma.alert.findMany({
      where: { userId, leido: false },
    });

    const alertCount = {
      critical: alerts.filter((a) => a.severidad === 'critical').length,
      warning: alerts.filter((a) => a.severidad === 'warning').length,
      info: alerts.filter((a) => a.severidad === 'info').length,
    };

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      avgRoi,
      avgMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      topProjects: roiProjects
        .sort((a, b) => b.roiPercent - a.roiPercent)
        .slice(0, 5)
        .map((p) => ({ nombre: p.nome, revenue: p.revenue, roiPercent: p.roiPercent })),
      alertCount,
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    return null;
  }
}

/**
 * Send email via Nodemailer
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  userId: string
): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@redcalc.com',
      to,
      subject,
      html,
    });

    // Log successful send
    await prisma.alertLog.create({
      data: {
        userId,
        tipo: 'email_report',
        referenceId: userId,
        estado: 'enviado',
      },
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);

    // Log failed send
    await prisma.alertLog.create({
      data: {
        userId,
        tipo: 'email_report',
        referenceId: userId,
        estado: 'fallido',
      },
    });

    return false;
  }
}

/**
 * Main: Send reports to all enabled users
 */
export async function sendScheduledReports(): Promise<{ sent: number; failed: number }> {
  try {
    const users = await prisma.user.findMany({
      include: {
        automationSchedules: {
          where: {
            tipo: 'email_report',
          },
        },
      },
    });

    let sent = 0,
      failed = 0;

    for (const user of users) {
      if (!user.automationSchedules.length) continue;

      const reportData = await fetchReportData(user.id);
      if (!reportData) {
        failed++;
        continue;
      }

      const company: CompanyInfo = {
        nombre: user.empresaNombre,
        email: user.email,
        logo: user.empresaLogo,
        rnc: user.empresaRNC,
      };

      const html = createEmailTemplate(reportData, company);
      const subject = `📊 Reporte de ROI - ${new Date().toLocaleDateString('es-DO')}`;

      const success = await sendEmail(user.email, subject, html, user.id);
      success ? sent++ : failed++;
    }

    return { sent, failed };
  } catch (error) {
    console.error('Error in sendScheduledReports:', error);
    return { sent: 0, failed: 0 };
  }
}
