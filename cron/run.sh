#!/bin/sh
# Lo corre Railway una vez al día (cron "17 9 * * *", hora UTC = 5:17 a.m. en RD).
# Avisos diarios, reporte diario, el semanal los lunes y el mensual el día 1.
set -u
: "${CRON_SECRET:?falta CRON_SECRET}"
: "${APP_URL:?falta APP_URL}"
APP_URL="${APP_URL%/}"
fallos=0

llamar() {
	echo "== $1 $2"
	status=$(curl -sS -o /tmp/respuesta.json -w '%{http_code}' -X "$1" -H "x-cron-secret: $CRON_SECRET" "$APP_URL$2") || status=000
	echo "HTTP $status"
	cat /tmp/respuesta.json 2>/dev/null; echo
	[ "$status" = 200 ] || fallos=$((fallos + 1))
}

llamar GET /api/cron/alerts
llamar POST '/api/cron/reports?frequency=daily'
[ "$(date -u +%u)" = 1 ] && llamar POST '/api/cron/reports?frequency=weekly'
[ "$(date -u +%d)" = 01 ] && llamar POST '/api/cron/reports?frequency=monthly'

[ "$fallos" = 0 ] || { echo "Fallaron $fallos llamadas"; exit 1; }
echo "Listo"
