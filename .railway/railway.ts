import { defineRailway, github, postgres, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "sfo" });
  Postgres.deploy = { multiRegionConfig: { sfo: { numReplicas: 1 } } };
  Postgres.networking = { privateNetworkEndpoint: "postgres", tcpProxies: { "5432": {} } };
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "sfo", sizeMB: 5000 });
  const netplannerCron = service("netplanner-cron", {
    source: github("jcedelosantos/cdnt-netcal", { branch: "main", checkSuites: false, rootDirectory: "cron" }),
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile", watchPatterns: ["/cron/**"] },
    start: "/bin/sh /run.sh",
    replicas: { "sfo": 1 },
    deploy: { cronSchedule: "17 9 * * *", restartPolicyType: "NEVER" },
  });
  const NetPlanner = service("NetPlanner", {
    source: github("jcedelosantos/cdnt-netcal", { branch: "main", checkSuites: false }),
    build: { buildEnvironment: "V3", builder: "RAILPACK" },
    start: "node scripts/migrate-deploy.js && npm start",
    healthcheck: "/login",
    healthcheckTimeout: 180,
    replicas: { "sfo": 1 },
    domains: [{ domain: "netplanner.cedanet.net", port: 3000 }],
    networking: { privateNetworkEndpoint: "cdnt-netcal" },
  });

  return project("NetPlanner", {
    variables: { managed: false },
    resources: [netplannerCron, Postgres, NetPlanner, postgresVolume],
  });
});
