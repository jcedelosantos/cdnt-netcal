# Cron de NetPlanner en Railway: un servicio aparte que Railway arranca a la hora del cron,
# llama a los endpoints /api/cron/* de NetPlanner y termina. Reemplaza el horario de GitHub
# Actions, que no estaba disparando. Variables del servicio: CRON_SECRET (la misma de NetPlanner)
# y APP_URL (https://netplanner.cedanet.net).
FROM alpine:3.20
RUN apk add --no-cache curl
COPY run.sh /run.sh
CMD ["/bin/sh", "/run.sh"]
